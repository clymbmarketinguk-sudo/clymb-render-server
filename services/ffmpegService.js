const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { updateJob } = require('./jobQueue');

ffmpeg.setFfmpegPath(ffmpegPath);

const PLATFORM_SPECS = {
  instagram_reels: { width: 1080, height: 1920 },
  youtube_shorts: { width: 1080, height: 1920 },
  tiktok: { width: 1080, height: 1920 },
  youtube_long: { width: 1920, height: 1080 },
  linkedin: { width: 1080, height: 1080 },
  facebook: { width: 1080, height: 1080 },
};

function cutClip(input, output, inPoint, outPoint) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(input).setStartTime(inPoint || 0);

    if (outPoint !== undefined && outPoint !== null) {
      command.setDuration(outPoint - (inPoint || 0));
    }

    command
      .output(output)
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

function cropToPlatform(input, output, platform) {
  return new Promise((resolve, reject) => {
    const spec = PLATFORM_SPECS[platform];

    if (!spec) {
      reject(new Error(`Unknown platform: ${platform}`));
      return;
    }

    const { width, height } = spec;

    ffmpeg(input)
      .videoFilters([
        `scale=${width}:${height}:force_original_aspect_ratio=increase`,
        `crop=${width}:${height}`,
      ])
      .output(output)
      .on('end', () => resolve(output))
      .on('error', reject)
      .run();
  });
}

function concatClips(clipPaths, outputPath) {
  return new Promise((resolve, reject) => {
    const listPath = path.join(os.tmpdir(), `concat-${uuidv4()}.txt`);
    const listContent = clipPaths
      .map((clipPath) => `file '${clipPath.replace(/'/g, "'\\''")}'`)
      .join('\n');

    fs.writeFileSync(listPath, listContent);

    const cleanup = () => {
      fs.unlink(listPath, () => {});
    };

    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions('-c copy')
      .output(outputPath)
      .on('end', () => {
        cleanup();
        resolve(outputPath);
      })
      .on('error', (err) => {
        cleanup();
        reject(err);
      })
      .run();
  });
}

async function fullRender(uploadId, cutPlan, platform, dna, jobId, onProgress) {
  const uploadDir = path.join(__dirname, '..', 'uploads', uploadId);
  const workDir = path.join(uploadDir, `render-${jobId}`);
  const outputDir = path.join(__dirname, '..', 'outputs');

  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const reportProgress = (progress) => {
    updateJob(jobId, { progress });
    if (onProgress) onProgress(progress);
  };

  updateJob(jobId, { status: 'processing', progress: 0 });

  // 0 -> 20: cut each clip
  const cutClipPaths = [];

  for (let i = 0; i < cutPlan.length; i += 1) {
    const cut = cutPlan[i];
    const inputPath = path.join(uploadDir, cut.filename);
    const cutOutput = path.join(workDir, `cut-${i}.mp4`);

    await cutClip(inputPath, cutOutput, cut.inPoint, cut.outPoint);
    cutClipPaths.push(cutOutput);

    reportProgress(Math.round(((i + 1) / cutPlan.length) * 20));
  }

  // 20 -> 60: crop each clip to platform
  const croppedClipPaths = [];

  for (let i = 0; i < cutClipPaths.length; i += 1) {
    const cropOutput = path.join(workDir, `crop-${i}.mp4`);

    await cropToPlatform(cutClipPaths[i], cropOutput, platform);
    croppedClipPaths.push(cropOutput);

    reportProgress(20 + Math.round(((i + 1) / cutClipPaths.length) * 40));
  }

  // 60 -> 80: concat
  const finalOutput = path.join(outputDir, `${jobId}.mp4`);
  await concatClips(croppedClipPaths, finalOutput);
  reportProgress(80);

  // 80 -> 100: done
  fs.rmSync(workDir, { recursive: true, force: true });
  updateJob(jobId, { status: 'completed' });
  reportProgress(100);

  return finalOutput;
}

module.exports = {
  PLATFORM_SPECS,
  cutClip,
  cropToPlatform,
  concatClips,
  fullRender,
};

const fs = require('fs');
const path = require('path');
const { jobs, deleteJob } = require('./jobQueue');

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const OUTPUT_ROOT = path.join(__dirname, '..', 'outputs');

function removeIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function cleanupExpiredJobs() {
  const now = Date.now();

  for (const [jobId, job] of jobs.entries()) {
    if (job.expiresAt && job.expiresAt <= now) {
      removeIfExists(path.join(UPLOAD_ROOT, job.uploadId));
      removeIfExists(path.join(OUTPUT_ROOT, `${jobId}.mp4`));
      deleteJob(jobId);
    }
  }
}

function startCleanupService() {
  cleanupExpiredJobs();
  setInterval(cleanupExpiredJobs, CLEANUP_INTERVAL_MS);
}

module.exports = {
  startCleanupService,
  cleanupExpiredJobs,
};

const express = require('express');
const { createJob, updateJob } = require('../services/jobQueue');
const { fullRender } = require('../services/ffmpegService');

const router = express.Router();

router.post('/', (req, res) => {
  const { uploadId, cutPlan, platform, dna } = req.body;

  if (!uploadId || !cutPlan || !platform) {
    return res.status(400).json({ error: 'uploadId, cutPlan, and platform are required' });
  }

  const jobId = createJob(uploadId, cutPlan, platform, dna);

  fullRender(uploadId, cutPlan, platform, dna, jobId, (progress) => {
    updateJob(jobId, { progress });
  }).catch((err) => {
    updateJob(jobId, { status: 'failed', error: err.message });
  });

  res.json({ jobId, status: 'queued' });
});

module.exports = router;

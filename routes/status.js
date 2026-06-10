const express = require('express');
const { getJob } = require('../services/jobQueue');

const router = express.Router();

router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    downloadUrl: job.status === 'completed' ? `/download/${job.jobId}` : null,
    error: job.error,
  });
});

module.exports = router;

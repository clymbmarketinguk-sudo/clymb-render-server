const { v4: uuidv4 } = require('uuid');

const jobs = new Map();

const TTL_MINUTES = Number(process.env.JOB_TTL_MINUTES) || 30;
const TTL_MS = TTL_MINUTES * 60 * 1000;

function createJob(uploadId, cutPlan, platform, dna) {
  const jobId = uuidv4();

  jobs.set(jobId, {
    jobId,
    uploadId,
    cutPlan,
    platform,
    dna,
    status: 'queued',
    progress: 0,
    error: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + TTL_MS,
  });

  return jobId;
}

function getJob(jobId) {
  return jobs.get(jobId);
}

function updateJob(jobId, updates) {
  const job = jobs.get(jobId);

  if (!job) {
    return null;
  }

  Object.assign(job, updates);

  return job;
}

function deleteJob(jobId) {
  return jobs.delete(jobId);
}

module.exports = {
  jobs,
  createJob,
  getJob,
  updateJob,
  deleteJob,
  TTL_MS,
};

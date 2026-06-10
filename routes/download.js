const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const OUTPUT_ROOT = path.join(__dirname, '..', 'outputs');

router.get('/:jobId', (req, res) => {
  const filePath = path.join(OUTPUT_ROOT, `${req.params.jobId}.mp4`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.jobId}.mp4"`);

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.status(500).end();
  });
  stream.pipe(res);
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.uploadId) {
      req.uploadId = uuidv4();
    }

    const dir = path.join(UPLOAD_ROOT, req.uploadId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    const ext = path.extname(file.originalname);

    file.fileId = fileId;
    cb(null, `${fileId}${ext}`);
  },
});

const upload = multer({ storage });

router.post('/', upload.array('clips'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  const files = req.files.map((file) => ({
    fileId: file.fileId,
    filename: file.filename,
    size: file.size,
  }));

  res.json({
    success: true,
    uploadId: req.uploadId,
    files,
  });
});

module.exports = router;

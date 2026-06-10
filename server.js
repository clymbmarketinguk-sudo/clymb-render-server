const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const uploadRoutes = require('./routes/upload');
const renderRoutes = require('./routes/render');
const statusRoutes = require('./routes/status');
const downloadRoutes = require('./routes/download');
const { startCleanupService } = require('./services/cleanup');

const app = express();
const PORT = process.env.PORT || 3001;

['uploads', 'outputs'].forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'clymb-render-server' });
});

app.use('/upload', uploadRoutes);
app.use('/render', renderRoutes);
app.use('/status', statusRoutes);
app.use('/download', downloadRoutes);

startCleanupService();

app.listen(PORT, () => {
  console.log(`clymb-render-server listening on port ${PORT}`);
});

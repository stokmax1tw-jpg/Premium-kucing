const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = './data/videos.json';
const UPLOAD_DIR = './uploads/videos';

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|avi|mov|mkv/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only video files allowed!'));
    }
  }
});

function readData() {
  return fs.readJsonSync(DATA_FILE);
}

function writeData(data) {
  fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}

// GET all videos
router.get('/', (req, res) => {
  const data = readData();
  const category = req.query.category;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;

  let videos = data.videos;
  if (category && category !== 'semua') {
    videos = videos.filter(v => v.category === category);
  }

  // Sort by newest
  videos = videos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  const total = videos.length;
  const start = (page - 1) * limit;
  const paginated = videos.slice(start, start + limit);

  res.json({ videos: paginated, total, page, pages: Math.ceil(total / limit) });
});

// GET random videos for home
router.get('/random', (req, res) => {
  const data = readData();
  const limit = parseInt(req.query.limit) || 20;
  const shuffled = data.videos.sort(() => Math.random() - 0.5).slice(0, limit);
  res.json({ videos: shuffled });
});

// GET single video
router.get('/:id', (req, res) => {
  const data = readData();
  const video = data.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json(video);
});

// POST upload video (from bot API key auth)
router.post('/upload', upload.single('video'), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY && apiKey !== 'kucing-bot-secret') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!req.file) return res.status(400).json({ error: 'No video file' });

  const { title, category, description } = req.body;
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

  const video = {
    id: uuidv4(),
    title: title || 'Untitled',
    category: category || 'lokal',
    description: description || '',
    filename: req.file.filename,
    url: `${baseUrl}/uploads/videos/${req.file.filename}`,
    thumbnail: null,
    views: 0,
    likes: 0,
    uploadedAt: new Date().toISOString()
  };

  const data = readData();
  data.videos.unshift(video);
  writeData(data);

  // Notify telegram channel
  const bot = require('../bot/telegramBot');
  if (bot && bot.notifyChannel) {
    await bot.notifyChannel(video, baseUrl);
  }

  res.json({ success: true, video });
});

// DELETE video
router.delete('/:id', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY && apiKey !== 'kucing-bot-secret') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const data = readData();
  const idx = data.videos.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const video = data.videos[idx];
  // Delete file
  const filePath = `./uploads/videos/${video.filename}`;
  if (fs.existsSync(filePath)) fs.removeSync(filePath);

  data.videos.splice(idx, 1);
  writeData(data);

  res.json({ success: true });
});

// POST update views
router.post('/:id/view', (req, res) => {
  const data = readData();
  const video = data.videos.find(v => v.id === req.params.id);
  if (video) {
    video.views = (video.views || 0) + 1;
    writeData(data);
  }
  res.json({ success: true });
});

module.exports = router;

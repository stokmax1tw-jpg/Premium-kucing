require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads and data directories exist
fs.ensureDirSync('./uploads/videos');
fs.ensureDirSync('./data');

// Init data file
const DATA_FILE = './data/videos.json';
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, { videos: [] });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'kucing_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const videoRoutes = require('./routes/videos');
const pageRoutes = require('./routes/pages');
app.use('/api/videos', videoRoutes);
app.use('/', pageRoutes);

// Start bot
const bot = require('./bot/telegramBot');

app.listen(PORT, () => {
  console.log(`[KUCING PREMIUM] Server running on port ${PORT}`);
  console.log(`[KUCING PREMIUM] Base URL: ${process.env.BASE_URL || 'http://localhost:' + PORT}`);
  console.log(`[BOT] Telegram bot is active!`);
});

module.exports = app;

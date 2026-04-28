const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get('/terbaru', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/terbaru.html'));
});

router.get('/douyin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/category.html'));
});

router.get('/lokal', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/category.html'));
});

router.get('/barat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/category.html'));
});

router.get('/cosplayer', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/category.html'));
});

router.get('/bochil', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/category.html'));
});

router.get('/video/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/watch.html'));
});

module.exports = router;

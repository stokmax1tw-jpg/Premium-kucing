require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = 'kucing-bot-secret';

let bot = null;

// Pending uploads state per chat
const uploadState = {};

if (!TOKEN) {
  console.warn('[BOT] No TELEGRAM_BOT_TOKEN found. Bot will not start.');
} else {
  bot = new TelegramBot(TOKEN, { polling: true });

  console.log('[BOT] Telegram Bot started successfully!');

  const mainKeyboard = {
    reply_markup: {
      keyboard: [
        [{ text: 'Upload Video' }, { text: 'Daftar Video' }],
        [{ text: 'Hapus Video' }, { text: 'Link Website' }],
        [{ text: 'Statistik' }, { text: 'Bantuan' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  };

  const categoryKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Douyin', callback_data: 'cat_douyin' },
          { text: 'Lokal', callback_data: 'cat_lokal' }
        ],
        [
          { text: 'Barat', callback_data: 'cat_barat' },
          { text: 'Cosplayer', callback_data: 'cat_cosplayer' }
        ],
        [
          { text: 'Bochil', callback_data: 'cat_bochil' }
        ]
      ]
    }
  };

  function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  function readData() {
    const DATA_FILE = './data/videos.json';
    fs.ensureFileSync(DATA_FILE);
    try {
      return fs.readJsonSync(DATA_FILE);
    } catch {
      return { videos: [] };
    }
  }

  function writeData(data) {
    fs.writeJsonSync('./data/videos.json', data, { spaces: 2 });
  }

  // /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
      `Selamat datang di *KUCING PREMIUM BOT*\n\nBot admin untuk mengelola website video premium.\n\nGunakan menu di bawah untuk mulai.`,
      { parse_mode: 'Markdown', ...mainKeyboard }
    );
  });

  // /link command
  bot.onText(/\/link/, (msg) => {
    bot.sendMessage(msg.chat.id,
      `*Link Website KUCING PREMIUM*\n\n${BASE_URL}\n\nShare link ini kepada teman-teman kamu!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: 'Buka Website', url: BASE_URL }
          ]]
        }
      }
    );
  });

  // Handle text messages
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    // Upload flow - waiting for title
    if (uploadState[chatId] && uploadState[chatId].step === 'wait_title') {
      uploadState[chatId].title = text;
      uploadState[chatId].step = 'wait_category';
      return bot.sendMessage(chatId, `Judul: *${text}*\n\nPilih kategori video:`, {
        parse_mode: 'Markdown',
        ...categoryKeyboard
      });
    }

    // Upload flow - waiting for video file
    if (uploadState[chatId] && uploadState[chatId].step === 'wait_video' && msg.video) {
      const state = uploadState[chatId];
      const fileId = msg.video.file_id;

      await bot.sendMessage(chatId, 'Video diterima! Sedang mengupload ke server...');

      try {
        const fileLink = await bot.getFileLink(fileId);
        const https = require('https');
        const http = require('http');
        const { v4: uuidv4 } = require('uuid');

        const filename = uuidv4() + '.mp4';
        const filePath = `./uploads/videos/${filename}`;

        fs.ensureDirSync('./uploads/videos');

        const file = fs.createWriteStream(filePath);
        const protocol = fileLink.startsWith('https') ? https : http;

        protocol.get(fileLink, (response) => {
          response.pipe(file);
          file.on('finish', async () => {
            file.close();

            const videoData = {
              id: uuidv4(),
              title: state.title,
              category: state.category,
              description: state.description || '',
              filename,
              url: `${BASE_URL}/uploads/videos/${filename}`,
              thumbnail: null,
              views: 0,
              likes: 0,
              uploadedAt: new Date().toISOString()
            };

            const data = readData();
            data.videos.unshift(videoData);
            writeData(data);

            delete uploadState[chatId];

            // Notify channel
            await notifyChannel(videoData, BASE_URL);

            bot.sendMessage(chatId,
              `*Video berhasil diupload!*\n\nJudul: ${videoData.title}\nKategori: ${videoData.category}\nLink: ${BASE_URL}/video/${videoData.id}`,
              {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [[
                    { text: 'Lihat Video', url: `${BASE_URL}/video/${videoData.id}` }
                  ]]
                },
                ...mainKeyboard
              }
            );
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {});
          bot.sendMessage(chatId, `Gagal download video: ${err.message}`);
          delete uploadState[chatId];
        });
      } catch (err) {
        bot.sendMessage(chatId, `Error: ${err.message}`);
        delete uploadState[chatId];
      }
      return;
    }

    switch (text) {
      case 'Upload Video':
        uploadState[chatId] = { step: 'wait_title' };
        bot.sendMessage(chatId, 'Masukkan *judul video*:', { parse_mode: 'Markdown' });
        break;

      case 'Daftar Video': {
        const data = readData();
        if (data.videos.length === 0) {
          bot.sendMessage(chatId, 'Belum ada video yang diupload.');
          break;
        }
        const list = data.videos.slice(0, 10).map((v, i) =>
          `${i + 1}. [${v.title}](${BASE_URL}/video/${v.id}) - ${v.category}`
        ).join('\n');
        bot.sendMessage(chatId, `*Daftar Video Terbaru:*\n\n${list}`, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
        break;
      }

      case 'Hapus Video': {
        const data = readData();
        if (data.videos.length === 0) {
          bot.sendMessage(chatId, 'Tidak ada video untuk dihapus.');
          break;
        }
        const buttons = data.videos.slice(0, 10).map(v => ([{
          text: `Hapus: ${v.title.substring(0, 30)}`,
          callback_data: `delete_${v.id}`
        }]));
        bot.sendMessage(chatId, 'Pilih video yang ingin dihapus:', {
          reply_markup: { inline_keyboard: buttons }
        });
        break;
      }

      case 'Link Website':
        bot.sendMessage(chatId,
          `*Link Website:*\n\n${BASE_URL}`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: 'Buka Website', url: BASE_URL }]]
            }
          }
        );
        break;

      case 'Statistik': {
        const data = readData();
        const totalViews = data.videos.reduce((sum, v) => sum + (v.views || 0), 0);
        const cats = {};
        data.videos.forEach(v => { cats[v.category] = (cats[v.category] || 0) + 1; });
        const catStr = Object.entries(cats).map(([k, v]) => `${k}: ${v}`).join('\n');
        bot.sendMessage(chatId,
          `*Statistik Website*\n\nTotal Video: ${data.videos.length}\nTotal Views: ${totalViews}\n\nPer Kategori:\n${catStr || '-'}`,
          { parse_mode: 'Markdown' }
        );
        break;
      }

      case 'Bantuan':
        bot.sendMessage(chatId,
          `*Panduan Bot KUCING PREMIUM*\n\nUpload Video - Upload video baru ke website\nDaftar Video - Lihat daftar video\nHapus Video - Hapus video dari website\nLink Website - Dapatkan link website\nStatistik - Lihat statistik website\n\nPerintah:\n/start - Mulai bot\n/link - Dapatkan link website`,
          { parse_mode: 'Markdown' }
        );
        break;
    }
  });

  // Callback query handler
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('cat_')) {
      const category = data.replace('cat_', '');
      if (uploadState[chatId]) {
        uploadState[chatId].category = category;
        uploadState[chatId].step = 'wait_video';
        bot.answerCallbackQuery(query.id, { text: `Kategori: ${category}` });
        bot.sendMessage(chatId,
          `Kategori dipilih: *${category}*\n\nSekarang kirim file video kamu:`,
          { parse_mode: 'Markdown' }
        );
      }
    }

    if (data.startsWith('delete_')) {
      const videoId = data.replace('delete_', '');
      const videoData = readData();
      const idx = videoData.videos.findIndex(v => v.id === videoId);
      if (idx !== -1) {
        const video = videoData.videos[idx];
        const filePath = `./uploads/videos/${video.filename}`;
        if (fs.existsSync(filePath)) fs.removeSync(filePath);
        videoData.videos.splice(idx, 1);
        writeData(videoData);
        bot.answerCallbackQuery(query.id, { text: 'Video berhasil dihapus!' });
        bot.editMessageText(`Video "${video.title}" telah dihapus.`, {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      }
    }
  });
}

// Notify channel function
async function notifyChannel(video, baseUrl) {
  if (!bot || !CHANNEL_ID) return;
  try {
    const msg = `*VIDEO BARU - KUCING PREMIUM*\n\nJudul: ${video.title}\nKategori: ${video.category.toUpperCase()}\n\nTonton sekarang:\n${baseUrl}/video/${video.id}`;
    await bot.sendMessage(CHANNEL_ID, msg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: 'Tonton Sekarang', url: `${baseUrl}/video/${video.id}` },
          { text: 'Website', url: baseUrl }
        ]]
      }
    });
  } catch (err) {
    console.error('[BOT] Failed to notify channel:', err.message);
  }
}

module.exports = { bot, notifyChannel };

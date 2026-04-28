# KUCING PREMIUM - Video Platform

Platform video premium dengan bot Telegram untuk manajemen konten.

## Fitur

- Website multi-halaman (Beranda, Terbaru, Douyin, Lokal, Barat, Cosplayer, Bochil)
- Pop-up iklan otomatis
- Bot Telegram untuk upload dan kelola video
- Notifikasi otomatis ke channel Telegram saat upload video baru
- Tombol download video
- Tampilan anime sakura dark pink
- Video bisa diakses semua orang

---

## Cara Setup

### 1. Install Node.js
Pastikan Node.js sudah terinstall (versi 16+)

### 2. Install dependencies
```bash
npm install
```

### 3. Konfigurasi .env
Salin `.env.example` ke `.env` dan isi datanya:
```bash
cp .env.example .env
```

Edit `.env`:
```
TELEGRAM_BOT_TOKEN=token_bot_kamu
TELEGRAM_CHANNEL_ID=@nama_channel_kamu
PORT=3000
BASE_URL=https://domain-kamu.com
ADMIN_PASSWORD=password_admin
SESSION_SECRET=secret_key_unik
```

#### Cara dapat Bot Token:
1. Buka Telegram, cari @BotFather
2. Ketik /newbot
3. Ikuti instruksi, copy token yang diberikan

#### Cara dapat Channel ID:
- Gunakan @nama_channel (contoh: @kucingpremium)
- Atau ID numerik channel

### 4. Jalankan server
```bash
npm start
```

Server akan berjalan di port 3000 (atau sesuai .env)

Bot Telegram otomatis aktif saat server dijalankan.

---

## Penggunaan Bot Telegram

### Perintah:
- `/start` - Mulai bot, tampil menu utama
- `/link` - Dapatkan link website

### Menu Bot:
- **Upload Video** - Upload video baru ke website
  - Pilih judul
  - Pilih kategori (Douyin/Lokal/Barat/Cosplayer/Bochil)
  - Kirim file video
  - Bot otomatis upload ke website dan notif ke channel
- **Daftar Video** - Lihat daftar 10 video terbaru
- **Hapus Video** - Pilih dan hapus video
- **Link Website** - Dapatkan link website untuk dishare
- **Statistik** - Lihat jumlah video dan views
- **Bantuan** - Panduan penggunaan

---

## Struktur File

```
kucing-premium/
├── server.js           # Server utama
├── package.json        # Dependencies
├── .env.example        # Template konfigurasi
├── .gitignore
├── bot/
│   └── telegramBot.js  # Bot Telegram
├── routes/
│   ├── videos.js       # API video
│   └── pages.js        # Route halaman
├── public/
│   ├── index.html      # Halaman utama
│   ├── terbaru.html    # Halaman terbaru
│   ├── category.html   # Halaman kategori
│   ├── watch.html      # Halaman tonton video
│   ├── css/
│   │   └── style.css   # Stylesheet utama
│   ├── js/
│   │   └── main.js     # JavaScript utama
│   └── images/         # Gambar statis
├── uploads/
│   └── videos/         # Video yang diupload
└── data/
    └── videos.json     # Database video (JSON)
```

---

## Deploy ke GitHub & Hosting

### Push ke GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/kucing-premium.git
git push -u origin main
```

### Deploy ke Railway/Render/VPS:
1. Pastikan PORT dan BASE_URL sudah benar di .env
2. Set environment variables di platform hosting
3. Run command: `npm start`

---

## Catatan Penting

- File video disimpan di folder `uploads/videos/`
- Database video di `data/videos.json`
- Maksimum ukuran video: 500MB
- Format video yang didukung: mp4, webm, avi, mov, mkv

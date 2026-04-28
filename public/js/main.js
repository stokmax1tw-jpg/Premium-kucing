// Sakura petals
function createPetals() {
  const container = document.body;
  const colors = [
    'rgba(244,143,177,0.6)',
    'rgba(233,30,140,0.4)',
    'rgba(194,24,91,0.5)',
    'rgba(252,228,236,0.5)'
  ];
  for (let i = 0; i < 18; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.cssText = `
      left: ${Math.random() * 100}vw;
      width: ${Math.random() * 8 + 5}px;
      height: ${Math.random() * 10 + 6}px;
      background: radial-gradient(ellipse, ${colors[Math.floor(Math.random() * colors.length)]} 0%, transparent 100%);
      animation-duration: ${Math.random() * 8 + 6}s;
      animation-delay: ${Math.random() * 8}s;
    `;
    container.appendChild(petal);
  }
}
createPetals();

// Pop-up ad
function showPopup() {
  const shown = sessionStorage.getItem('popup_shown');
  if (shown) return;
  sessionStorage.setItem('popup_shown', '1');

  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.innerHTML = `
    <div class="popup-box">
      <button class="popup-close" onclick="closePopup()">X</button>
      <div class="popup-icon">
        <img src="/images/logo.png" alt="Logo" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none';this.nextSibling.style.display='block'"><span style="display:none;font-size:48px;">🐱</span>
      </div>
      <div class="popup-title">KUCING PREMIUM</div>
      <div class="popup-text">Selamat datang! Nikmati koleksi video premium pilihan terbaik. Gratis untuk ditonton dan didownload!</div>
      <button class="btn-bubble btn-primary" onclick="closePopup()" style="width:100%;justify-content:center;">Mulai Menonton</button>
      <div class="popup-countdown" id="popup-timer">Tutup dalam 5 detik</div>
    </div>
  `;
  document.body.appendChild(overlay);

  let t = 5;
  const timer = setInterval(() => {
    t--;
    const el = document.getElementById('popup-timer');
    if (el) el.textContent = `Tutup dalam ${t} detik`;
    if (t <= 0) {
      clearInterval(timer);
      closePopup();
    }
  }, 1000);

  window._popupTimer = timer;
}

function closePopup() {
  if (window._popupTimer) clearInterval(window._popupTimer);
  const overlay = document.querySelector('.popup-overlay');
  if (overlay) {
    overlay.style.animation = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(() => overlay.remove(), 300);
  }
}

// Format numbers
function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n || 0;
}

// Format date
function formatDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' mnt lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  if (diff < 2592000) return Math.floor(diff / 86400) + ' hari lalu';
  return d.toLocaleDateString('id-ID');
}

// Video card HTML
function videoCardHTML(v) {
  const videoUrl = v.url;
  const watchUrl = `/video/${v.id}`;
  return `
    <div class="video-card animate-up" onclick="window.location.href='${watchUrl}'">
      <div class="video-thumb">
        <div class="thumb-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z"/>
          </svg>
        </div>
        <div class="video-play-overlay">
          <div class="play-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <div class="cat-badge">${v.category || 'lokal'}</div>
      </div>
      <div class="video-info">
        <div class="video-title">${v.title || 'Untitled'}</div>
        <div class="video-meta">
          <span>${formatNum(v.views)} views</span>
          <span>${formatDate(v.uploadedAt)}</span>
        </div>
      </div>
      <a class="btn-download" href="${videoUrl}" download="${v.title}" onclick="event.stopPropagation()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
        Download
      </a>
    </div>
  `;
}

// Fetch and render videos
async function fetchVideos(container, options = {}) {
  const { category = '', page = 1, limit = 20, random = false } = options;
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><span>Memuat video...</span></div>`;

  try {
    let url = random
      ? `/api/videos/random?limit=${limit}`
      : `/api/videos?page=${page}&limit=${limit}${category ? '&category=' + category : ''}`;

    const res = await fetch(url);
    const data = await res.json();
    const videos = data.videos || [];

    if (videos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z"/>
          </svg>
          <p>Belum ada video di sini</p>
        </div>
      `;
      return;
    }

    container.innerHTML = videos.map((v, i) => {
      const card = videoCardHTML(v);
      return card.replace('animate-up', `animate-up stagger-${Math.min(i + 1, 5)}`);
    }).join('');

    return data;
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>Gagal memuat video</p></div>`;
  }
}

// Set active nav link
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === path || (path === '/' && href === '/')) {
      link.classList.add('active');
    } else if (href !== '/' && path.startsWith(href)) {
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  setTimeout(showPopup, 1500);
});

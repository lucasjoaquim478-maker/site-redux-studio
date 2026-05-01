const userId = "1109957738387230740";

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("status-indicator");
const spotifyBox = document.getElementById("spotify-box");
const discordBox = document.getElementById("discord-status");
const sessionTime = document.getElementById("session-time");
const dcTime = document.getElementById("dc-time");
const activityStatus = document.getElementById("activity-status");

// ========== COPY BUTTON ==========
const copyBtn = document.getElementById("copy");

if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(userId).then(() => {
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Copied!';
      setTimeout(() => { copyBtn.innerHTML = original; }, 2000);
    });
  });
}

// ========== UTILS ==========
function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function getImageUrl(assets, key, appId) {
  if (!assets || !key || !assets[key]) return null;
  const raw = assets[key];
  if (!raw || typeof raw !== "string") return null;
  if (!/^\d+$/.test(raw)) return null;
  return "https://cdn.discordapp.com/app-assets/" + appId + "/" + raw + ".png";
}

// ========== STATE ==========
let discordStart = null;
let currentGameStart = null;
let currentSpotify = null;
let hasActivity = false;

function updateProgress() {
  if (!currentSpotify) return;
  const elapsed = Date.now() - currentSpotify.timestamps.start;
  const total = currentSpotify.timestamps.end - currentSpotify.timestamps.start;
  if (total <= 0) return;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const bar = spotifyBox.querySelector(".progress-bar");
  const times = document.getElementById("spotify-times");
  if (bar) bar.style.width = pct + "%";
  if (times) times.textContent = formatDuration(elapsed) + " / " + formatDuration(total);
}

function updateTimers() {
  const now = new Date();
  const brt = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });
  if (sessionTime) sessionTime.textContent = brt;
  if (discordStart && hasActivity && dcTime) {
    dcTime.textContent = formatDuration(Date.now() - discordStart);
  }
  updateProgress();
}

// ========== DISCORD STATUS ==========
async function fetchStatus() {
  try {
    const res = await fetch("https://api.lanyard.rest/v1/users/" + userId);
    const data = await res.json();
    if (!data.success) return;

    const user = data.data.discord_user;
    const kv = data.data;

    if (user.avatar && user.avatar.startsWith("a_")) {
      avatar.src = "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".gif";
    } else if (user.avatar && user.avatar.match(/^\w+$/)) {
      avatar.src = "https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png";
    } else {
      const defaultIndex = Number((BigInt(user.id) >> 22n) % 6n);
      avatar.src = "https://cdn.discordapp.com/embed/avatars/" + defaultIndex + ".png";
    }

    if (username) username.textContent = user.username;

    const status = kv.discord_status;
    if (statusEl) statusEl.className = "status-" + status;

    const activities = kv.activities.filter(a => a.type !== 4 && a.type !== 2);
    const spotify = kv.spotify;
    hasActivity = activities.length > 0;

    if (spotify && spotify.album_art_url) {
      currentSpotify = spotify;
      const elapsed = Date.now() - spotify.timestamps.start;
      const total = spotify.timestamps.end - spotify.timestamps.start;
      const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
      const spotifyUrl = spotify.track_id ? 'https://open.spotify.com/track/' + spotify.track_id : '';

      spotifyBox.innerHTML =
        '<div class="spotify" onclick="confirmSpotify(\'' + spotifyUrl + '\')">' +
          '<img src="' + spotify.album_art_url + '" alt="Album" onerror="this.style.display=\'none\'">' +
          '<div class="spotify-info">' +
            '<div class="title">' + escapeHtml(spotify.song) + '</div>' +
            '<div class="artist">' + escapeHtml(spotify.artist) + '</div>' +
            '<div class="spotify-times" id="spotify-times">' + formatDuration(elapsed) + " / " + formatDuration(total) + '</div>' +
            '<div class="progress"><div class="progress-bar" style="width: ' + pct + '%"></div></div>' +
          '</div>' +
        '</div>';
    } else {
      currentSpotify = null;
      spotifyBox.innerHTML = "";
    }

    if (activities.length > 0) {
      const act = activities[0];
      if (activityStatus) activityStatus.textContent = act.name.slice(0, 12);
      const appId = act.application_id;
      const isRoblox = appId === "363445589247131668" || (act.name && act.name.toLowerCase().includes("roblox"));

      if (act.timestamps && act.timestamps.start) {
        if (discordStart === null || currentGameStart !== act.timestamps.start) {
          discordStart = act.timestamps.start;
          currentGameStart = act.timestamps.start;
        }
        dcTime.textContent = formatDuration(Date.now() - discordStart);
      }

      let imgHtml = '';
      if (isRoblox) {
        // Logo do Roblox
        imgHtml = '<img class="game-img" src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Roblox_Logo_2025.png" alt="Roblox" onerror="this.style.display=\'none\'">';
      } else {
        // Mostrar imagem do jogo do Discord
        let imgUrl = getImageUrl(act.assets, "large_image", appId);
        if (!imgUrl) imgUrl = getImageUrl(act.assets, "small_image", appId);
        if (imgUrl) {
          imgHtml = '<img class="game-img" src="' + imgUrl + '" alt="Game" onerror="this.style.display=\'none\'">';
        }
      }
      const timeHtml = discordStart ? formatDuration(Date.now() - discordStart) : "00:00";

      discordBox.innerHTML =
        '<div class="dc' + (isRoblox ? ' roblox-card' : '') + '">' +
          imgHtml +
          '<div class="dc-info">' +
            '<div class="game-name">' + escapeHtml(act.name) + '</div>' +
            '<div class="dc-time">' + timeHtml + '</div>' +
          '</div>' +
        '</div>';
    } else {
      if (activityStatus) activityStatus.textContent = "Idle";
      discordStart = null;
      currentGameStart = null;
      dcTime.textContent = "--:--";
      discordBox.innerHTML = "";
    }
  } catch (err) {
    console.error("Lanyard error:", err);
    if (activityStatus) activityStatus.textContent = "Error";
  }
}

let pendingSpotifyUrl = "";

function confirmSpotify(url) {
  if (!url) return;
  pendingSpotifyUrl = url;
  document.getElementById("popup-overlay").style.display = "flex";
}

function closePopup() {
  document.getElementById("popup-overlay").style.display = "none";
  pendingSpotifyUrl = "";
}

function confirmSpotifyAction() {
  if (pendingSpotifyUrl) {
    window.open(pendingSpotifyUrl, "_blank");
  }
  closePopup();
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ========== ENTER SCREEN ==========
const enterScreen = document.getElementById("enter-screen");
const mainContent = document.getElementById("main-content");
let hasEntered = false;
let timerInterval = null;
let fetchInterval = null;

function startApp() {
  updateTimers();
  if (timerInterval) clearInterval(timerInterval);
  if (fetchInterval) clearInterval(fetchInterval);
  timerInterval = setInterval(updateTimers, 1000);
  fetchStatus();
  fetchInterval = setInterval(fetchStatus, 3000);
}

if (enterScreen) {
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var enterTitle = document.getElementById("enter-title");
  var enterHintText = document.getElementById("enter-hint-text");
  if (isTouch) {
    if (enterTitle) enterTitle.textContent = "Toque para entrar";
    if (enterHintText) enterHintText.textContent = "Toque em qualquer lugar";
  }

  enterScreen.addEventListener(isTouch ? "touchstart" : "click", function handler(e) {
    if (hasEntered) return;
    hasEntered = true;
    enterScreen.classList.add("fade-out");
    mainContent.classList.add("show");
    document.body.style.overflow = "auto";
    setTimeout(() => { enterScreen.style.display = "none"; }, 600);
    // Tocar música de fundo
    const bgMusic = document.getElementById("bg-music");
    if (bgMusic) {
      bgMusic.volume = 0.15;
      bgMusic.play().catch(() => {});
    }
    startApp();
    enterScreen.removeEventListener(isTouch ? "touchstart" : "click", handler);
  });
}

// ========== PARTICLES ==========
const canvas = document.getElementById("particles");
const ctx = canvas ? canvas.getContext("2d") : null;
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const particles = [];
var particleCount = isTouchDevice ? 25 : 60;
for (let i = 0; i < particleCount; i++) {
  particles.push({
    x: Math.random() * (canvas ? canvas.width : 1920),
    y: Math.random() * (canvas ? canvas.height : 1080),
    size: Math.random() * 2 + 0.5,
    speedY: Math.random() * 0.5 + 0.2,
    speedX: (Math.random() - 0.5) * 0.3,
    opacity: Math.random() * 0.5 + 0.1
  });
}

function drawParticles() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.fillStyle = "rgba(0, 255, 204, " + p.opacity + ")";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    p.y += p.speedY;
    p.x += p.speedX;
    if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
    if (p.x > canvas.width + 10) p.x = -10;
    if (p.x < -10) p.x = canvas.width + 10;
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();
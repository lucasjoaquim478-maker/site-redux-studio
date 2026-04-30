const userId = "1109957738387230740";

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("status-indicator");
const spotifyBox = document.getElementById("spotify-box");
const discordBox = document.getElementById("discord-status");
const sessionTime = document.getElementById("session-time");
const dcTime = document.getElementById("dc-time");
const activityStatus = document.getElementById("activity-status");

// ========== MUSIC ==========
let audioCtx = null;
let musicNodes = { master: null };
let musicPlaying = false;
let currentMusicVolume = 0.15;
let currentTrack = 0;
let activeIntervals = [];

const volumeSlider = document.getElementById("volume-slider");
const trackName = document.getElementById("track-name");
const prevBtn = document.getElementById("prev-track");
const nextBtn = document.getElementById("next-track");

const ambientTracks = [
  { url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_01_-_Reunion_of_the_Spirits.mp3", name: "Ethereal Waves", style: "ambient" },
  { url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_copyright/Blue_Dot_Sessions/Blue_Dot_Sessions_-_01_-_Adieu.mp3", name: "Midnight Study", style: "lofi" },
  { url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Komiku/Captain_Glouglous_Accidental_Adventures_459/Komiku_-_01_-_The_Story_of_Captain_Glouglou.mp3", name: "Cloud Drift", style: "chill" },
  { url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_copyright/Blue_Dot_Sessions/Blue_Dot_Sessions_-_03_-_Rococo.mp3", name: "Rainy Window", style: "lofi" },
  { url: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/KieLoKaz/Free_Ganymed/KieLoKaz_-_05_-_The_Heavenly_Place.mp3", name: "Neon Pulse", style: "ambient" }
];

let bgMusic = document.createElement("audio");
bgMusic.loop = true;
bgMusic.preload = "auto";
bgMusic.volume = 0.15;

function setVolume(val) {
  currentMusicVolume = val / 100;
  if (volumeSlider) volumeSlider.value = val;
  if (bgMusic) bgMusic.volume = currentMusicVolume;
}

function stopMusic() {
  musicPlaying = false;
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

function playAmbient(trackIndex) {
  stopMusic();
  musicPlaying = true;

  currentTrack = ((trackIndex % ambientTracks.length) + ambientTracks.length) % ambientTracks.length;
  const track = ambientTracks[currentTrack];
  trackName.textContent = "Carregando...";

  bgMusic.src = track.url;
  bgMusic.load();

  bgMusic.oncanplaythrough = () => {
    trackName.textContent = track.name;
    bgMusic.play().catch(err => {
      console.log("Play error:", err);
      trackName.textContent = "Clique p/ tocar";
    });
  };

  bgMusic.onerror = () => {
    trackName.textContent = "Falhou...";
    setTimeout(() => loadTrack(currentTrack + 1), 2000);
  };
}

function loadTrack(index) {
  playAmbient(index);
}

if (volumeSlider) volumeSlider.addEventListener("input", (e) => { e.stopPropagation(); setVolume(volumeSlider.value); });
if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack - 1); });
if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack + 1); });
if (trackName) trackName.addEventListener("click", (e) => {
  e.stopPropagation();
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
  } else {
    bgMusic.pause();
    trackName.textContent = "Pausado";
  }
});

// ========== DRAG MUSIC CONTROL ==========
const musicControl = document.getElementById("music-control");
const musicHandle = musicControl ? musicControl.querySelector(".music-handle") : null;

if (musicControl && musicHandle) {
  let isDragging = false;
  let dragX = 0, dragY = 0;

  musicHandle.addEventListener("mousedown", startDrag);
  musicHandle.addEventListener("touchstart", startDrag, { passive: false });

  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    musicControl.classList.add("dragging");

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = musicControl.getBoundingClientRect();
    dragX = clientX - rect.left;
    dragY = clientY - rect.top;

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);
  }

  function onDrag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    musicControl.style.left = (clientX - dragX) + "px";
    musicControl.style.top = (clientY - dragY) + "px";
    musicControl.style.right = "auto";
    musicControl.style.bottom = "auto";
  }

  function stopDrag() {
    isDragging = false;
    musicControl.classList.remove("dragging");
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
  }
}

// ========== ENTER SCREEN ==========
const enterScreen = document.getElementById("enter-screen");
const mainContent = document.getElementById("main-content");
let hasEntered = false;

let timerInterval = null;
let fetchInterval = null;

function startApp() {
  timerInterval = setInterval(updateTimers, 1000);
  fetchStatus();
  fetchInterval = setInterval(fetchStatus, 10000);
}

if (enterScreen) {
enterScreen.addEventListener("click", () => {
  if (hasEntered) return;
  hasEntered = true;
  setVolume(15);
  loadTrack(0);
    enterScreen.classList.add("fade-out");
    mainContent.classList.add("show");
    document.body.style.overflow = "auto";
    setTimeout(() => {
      enterScreen.style.display = "none";
    }, 600);
    startApp();
  });
}

// ========== SPOTIFY CLICK ==========
const copyBtn = document.getElementById("copy");
const clickSound = document.getElementById("click-sound");

let currentSpotify = null;
let hasActivity = false;
let spotifyOffset = 0;

if (spotifyBox) spotifyBox.addEventListener("click", () => {
  if (currentSpotify?.track_id) {
    window.open(`https://open.spotify.com/track/${currentSpotify.track_id}`, "_blank");
  }
});

if (clickSound) {
  document.addEventListener("mousedown", () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(userId).then(() => {
      const original = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copied!
      `;
      setTimeout(() => (copyBtn.innerHTML = original), 2000);
    });
  });
}

// ========== UTILS ==========
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getImageUrl(assets, key, appId) {
  if (!assets || !assets[key]) return null;
  const raw = assets[key];
  if (raw.startsWith("mp:external/")) {
    return `https://media.discordapp.net/external/${raw.split("mp:external/")[1]}`;
  }
  if (raw.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${raw.split("spotify:")[1]}`;
  }
  return `https://cdn.discordapp.com/app-assets/${appId}/${raw}.png`;
}

// ========== STATE ==========
let sessionStart = Date.now();
let discordStart = null;
let currentGameStart = null;

function updateProgress() {
  if (!currentSpotify) return;

  const elapsed = Date.now() - currentSpotify.timestamps.start + spotifyOffset;
  const total = currentSpotify.timestamps.end - currentSpotify.timestamps.start;

  if (total <= 0) return;

  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const bar = spotifyBox.querySelector(".progress-bar");
  const times = document.getElementById("spotify-times");

  if (bar) bar.style.width = pct + "%";
  if (times) times.textContent = `${formatDuration(elapsed)} / ${formatDuration(total)}`;
}

function updateTimers() {
  const now = new Date();
  const brt = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });
  sessionTime.textContent = brt;

  if (discordStart && hasActivity) {
    dcTime.textContent = formatDuration(Date.now() - discordStart);
  }

  updateProgress();
}

// ========== DISCORD STATUS ==========
async function fetchStatus() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (!data.success) return;

    const user = data.data.discord_user;
    const kv = data.data;

    avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    username.textContent = user.username;

    const status = kv.discord_status;
    statusEl.className = `status-${status}`;

    const activities = kv.activities.filter(a => a.type !== 4 && a.type !== 2);
    const spotify = kv.spotify;

    hasActivity = activities.length > 0;

    if (spotify) {
      currentSpotify = spotify;

      const serverTime = Date.now();
      const localOffset = serverTime - spotify.timestamps.start;

      spotifyOffset = 0;

      const total = spotify.timestamps.end - spotify.timestamps.start;
      const pct = Math.min(100, Math.max(0, (localOffset / total) * 100));
      const timesInitial = formatDuration(localOffset);
      const totalInitial = formatDuration(total);

      spotifyBox.innerHTML = `
        <div class="spotify">
          <img src="${spotify.album_art_url}" alt="Album" onerror="this.style.display='none'">
          <div class="spotify-info">
            <div class="title">${spotify.song}</div>
            <div class="artist">${spotify.artist}</div>
            <div class="spotify-times" id="spotify-times">${timesInitial} / ${totalInitial}</div>
            <div class="progress">
              <div class="progress-bar" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>
      `;
    } else {
      currentSpotify = null;
      spotifyBox.innerHTML = "";
    }

    if (activities.length > 0) {
      const act = activities[0];
      activityStatus.textContent = act.name.slice(0, 12);

      const appId = act.application_id;
      const isRoblox = appId === "363445589247131668" || act.name.toLowerCase().includes("roblox");

      if (act.timestamps?.start) {
        if (discordStart === null || currentGameStart !== act.timestamps.start) {
          discordStart = act.timestamps.start;
          currentGameStart = act.timestamps.start;
        }
        dcTime.textContent = formatDuration(Date.now() - discordStart);
      }

      let imgUrl = getImageUrl(act.assets, "large_image", appId);

      if (!imgUrl) {
        imgUrl = getImageUrl(act.assets, "small_image", appId);
      }

      if (!imgUrl && kv.visuals?.activity_images?.[appId]) {
        imgUrl = kv.visuals.activity_images[appId];
      }

      const fallbackHtml = `<div class="game-img roblox-icon">
          <svg viewBox="0 0 24 24" fill="white"><polygon points="16,4 20,8 20,16 16,20 8,20 4,16 4,8 8,4 16,4 16,8 8,8 8,16 16,16"/></svg>
        </div>`;

      const imgHtml = imgUrl ? `<img class="game-img" src="${imgUrl}" alt="Game">` : fallbackHtml;

      const timeHtml = discordStart ? formatDuration(Date.now() - discordStart) : "00:00";

      discordBox.innerHTML = `
        <div class="dc ${isRoblox ? 'roblox-card' : ''}">
          ${imgHtml}
          <div class="dc-info">
            <div class="game-name">${act.name}</div>
            <div class="dc-time">${timeHtml}</div>
          </div>
        </div>
      `;
    } else {
      activityStatus.textContent = "Idle";
      discordStart = null;
      currentGameStart = null;
      dcTime.textContent = "--:--";
      discordBox.innerHTML = "";
    }
  } catch (err) {
    console.error(err);
    activityStatus.textContent = "Error";
  }
}

// ========== PARTICLES ==========
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const particles = [];
for (let i = 0; i < 60; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speedY: Math.random() * 0.5 + 0.2,
    speedX: (Math.random() - 0.5) * 0.3,
    opacity: Math.random() * 0.5 + 0.1
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    ctx.fillStyle = `rgba(0, 255, 204, ${p.opacity})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    p.y += p.speedY;
    p.x += p.speedX;

    if (p.y > canvas.height + 10) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
    if (p.x > canvas.width + 10) p.x = -10;
    if (p.x < -10) p.x = canvas.width + 10;
  });

  requestAnimationFrame(drawParticles);
}
drawParticles();

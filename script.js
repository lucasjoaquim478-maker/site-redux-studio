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
let musicMaster = null;
let musicPlaying = false;
let currentMusicVolume = 0.15;
let currentTrack = 0;
let activeTimers = [];
let allSounds = [];

const volumeSlider = document.getElementById("volume-slider");
const trackName = document.getElementById("track-name");
const prevBtn = document.getElementById("prev-track");
const nextBtn = document.getElementById("next-track");

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicMaster = audioCtx.createGain();
  musicMaster.gain.value = currentMusicVolume;
  musicMaster.connect(audioCtx.destination);
}

function setVolume(val) {
  currentMusicVolume = val / 100;
  if (volumeSlider) volumeSlider.value = val;
  if (musicMaster) musicMaster.gain.value = currentMusicVolume;
}

function killAll() {
  musicPlaying = false;
  activeTimers.forEach(id => clearInterval(id));
  activeTimers = [];
  allSounds.forEach(s => { try { s.stop(); } catch(e) {} });
  allSounds = [];
}

function tone(freq, dur, vol, type) {
  if (!musicPlaying || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = freq;
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.05);
  gain.gain.setValueAtTime(vol, now + dur - 0.1);
  gain.gain.linearRampToValueAtTime(0, now + dur);
  osc.connect(gain);
  gain.connect(musicMaster);
  osc.start(now);
  osc.stop(now + dur + 0.01);
  allSounds.push(osc);
}

function pad(freq, vol) {
  if (!musicPlaying || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(musicMaster);
  osc.start();
  allSounds.push(osc);
}

// TRACK 1 — pads lentos, acordes maiores, suave
function playTrack1() {
  const chords = [[261.63,329.63,392],[220,277.18,329.63],[196,246.94,293.66],[174.61,220,261.63]];
  let i = 0;
  pad(65.41, 0.08);
  activeTimers.push(setInterval(() => {
    if (!musicPlaying) return;
    chords[i].forEach(f => { tone(f, 5, 0.06, "sine"); tone(f * 0.5, 6, 0.04, "sine"); });
    i = (i + 1) % chords.length;
  }, 4000));
}

// TRACK 2 — lofi, triangle, notas soltas com swing
function playTrack2() {
  const notes = [293.66,329.63,349.23,392,440,392,349.23,329.63];
  const bass = [146.83,164.81,174.61,196,196,174.61,164.81,146.83];
  let s = 0;
  pad(73.42, 0.05);
  function hit() {
    if (!musicPlaying) return;
    if (s % 2 === 0) tone(notes[s % notes.length], 1.5, 0.12, "triangle");
    if (s % 4 === 0) tone(bass[s % bass.length], 2, 0.08, "sine");
    if (s % 3 === 0) tone(notes[s % notes.length] * 2, 0.4, 0.04, "sine");
    s++;
  }
  activeTimers.push(setInterval(hit, 420));
}

// TRACK 3 — arpejos altos, cintilante, rápido
function playTrack3() {
  const arp = [523.25,659.25,783.99,1046.50,783.99,659.25,523.25,392,493.88,587.33,783.99,987.77];
  const bass = [130.81,164.81,196,261.63];
  let n = 0;
  pad(65.41, 0.03);
  function arpeggio() {
    if (!musicPlaying) return;
    tone(arp[n % arp.length], 0.8, 0.08, "sine");
    if (n % 6 === 0) tone(bass[(n / 6 | 0) % bass.length], 3, 0.06, "sine");
    n++;
  }
  activeTimers.push(setInterval(arpeggio, 250));
}

// TRACK 4 — dark, tons menores, lento e espaçado
function playTrack4() {
  const minor = [220,233.08,261.63,293.66,311.13,349.23];
  let p = 0;
  const drone = audioCtx.createOscillator();
  const droneGain = audioCtx.createGain();
  drone.type = "sawtooth";
  drone.frequency.value = 55;
  droneGain.gain.value = 0.025;
  drone.connect(droneGain);
  droneGain.connect(musicMaster);
  drone.start();
  allSounds.push(drone);
  function drop() {
    if (!musicPlaying) return;
    if (p % 2 === 0) {
      const f = minor[Math.floor(Math.random() * minor.length)];
      tone(f, 4, 0.07, "sine");
    }
    if (p % 3 === 0) tone(110, 5, 0.05, "triangle");
    if (p % 5 === 0) {
      const f = minor[Math.floor(Math.random() * minor.length)];
      tone(f * 2, 0.5, 0.03, "sine");
    }
    p++;
  }
  activeTimers.push(setInterval(drop, 2500));
}

// TRACK 5 — synthwave, square, rápido e pulsante
function playTrack5() {
  const bassLine = [82.41,98,110,123.47,110,98,82.41,73.42];
  const melody = [329.63,415.30,493.88,554.37,493.88,415.30,329.63,246.94];
  let s = 0;
  function pulse() {
    if (!musicPlaying) return;
    tone(bassLine[s % bassLine.length], 0.2, 0.1, "square");
    if (s % 2 === 0) tone(melody[s % melody.length], 0.15, 0.06, "square");
    if (s % 4 === 0) tone(bassLine[s % bassLine.length] * 4, 0.1, 0.04, "sawtooth");
    s++;
  }
  activeTimers.push(setInterval(pulse, 200));
}

const tracks = [playTrack1, playTrack2, playTrack3, playTrack4, playTrack5];
const names = ["Ethereal Waves", "Midnight Study", "Cloud Drift", "Rainy Window", "Neon Pulse"];

function playAmbient(idx) {
  initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  killAll();
  musicPlaying = true;
  currentTrack = ((idx % tracks.length) + tracks.length) % tracks.length;
  trackName.textContent = names[currentTrack];
  tracks[currentTrack]();
}

function loadTrack(i) { playAmbient(i); }

if (volumeSlider) volumeSlider.addEventListener("input", (e) => { e.stopPropagation(); setVolume(volumeSlider.value); });
if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack - 1); });
if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack + 1); });
if (trackName) trackName.addEventListener("click", (e) => {
  e.stopPropagation();
  if (musicPlaying) { killAll(); trackName.textContent = "Pausado"; }
  else { playAmbient(currentTrack); }
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

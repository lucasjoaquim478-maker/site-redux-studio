const userId = "1109957738387230740";

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("status-indicator");
const spotifyBox = document.getElementById("spotify-box");
const discordBox = document.getElementById("discord-status");
const sessionTime = document.getElementById("session-time");
const dcTime = document.getElementById("dc-time");
const activityStatus = document.getElementById("activity-status");
const bgMusic = document.getElementById("bg-music");

let audioCtx = null;
let musicNodes = [];
let musicPlaying = false;
let currentMusicVolume = 0.15;
let currentTrack = 0;

const ambientTracks = [
  { name: "Ambient Dream", chords: [261.63, 329.63, 392.00, 493.88], tempo: 2000, wave: "sine" },
  { name: "Chill Wave", chords: [293.66, 349.23, 440.00, 523.25], tempo: 2500, wave: "triangle" },
  { name: "Night Sky", chords: [329.63, 415.30, 493.88, 659.25], tempo: 3000, wave: "sine" },
  { name: "Deep Calm", chords: [196.00, 246.94, 293.66, 392.00], tempo: 2200, wave: "sine" },
  { name: "Starlight", chords: [246.94, 293.66, 369.99, 493.88], tempo: 1800, wave: "triangle" }
];

const volumeSlider = document.getElementById("volume-slider");
const trackName = document.getElementById("track-name");
const prevBtn = document.getElementById("prev-track");
const nextBtn = document.getElementById("next-track");

function setVolume(val) {
  currentMusicVolume = val / 100;
  if (volumeSlider) volumeSlider.value = val;
  if (musicNodes.master) musicNodes.master.gain.setTargetAtTime(currentMusicVolume, audioCtx.currentTime, 0.1);
}

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicNodes.master = audioCtx.createGain();
  musicNodes.master.gain.value = currentMusicVolume;
  musicNodes.master.connect(audioCtx.destination);
}

function stopMusic() {
  musicPlaying = false;
  musicNodes.chords?.forEach(n => { try { n.stop(); } catch(e) {} });
  musicNodes.chords = [];
  musicNodes.fx?.forEach(n => { try { n.stop(); } catch(e) {} });
  musicNodes.fx = [];
}

function playAmbient(trackIndex) {
  initAudio();

  if (audioCtx.state === "suspended") audioCtx.resume();

  stopMusic();
  musicPlaying = true;
  currentTrack = ((trackIndex % ambientTracks.length) + ambientTracks.length) % ambientTracks.length;
  const track = ambientTracks[currentTrack];
  trackName.textContent = track.name;

  const chords = track.chords;
  const waveType = track.wave;
  const tempo = track.tempo;

  musicNodes.chords = [];

  function playChordLoop() {
    if (!musicPlaying) return;

    chords.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = waveType;
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 10;

      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 1;

      const now = audioCtx.currentTime;
      const noteLen = tempo / 1000;
      const startOffset = i * (tempo / 1000) * 0.3;

      gain.gain.setValueAtTime(0, now + startOffset);
      gain.gain.linearRampToValueAtTime(0.15, now + startOffset + noteLen * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + noteLen * 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicNodes.master);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + noteLen * 1.5);
      musicNodes.chords.push(osc);
    });

    if (musicPlaying) {
      setTimeout(playChordLoop, tempo * 2);
    }
  }

  if (!musicNodes.fx) musicNodes.fx = [];

  const pad = audioCtx.createOscillator();
  const padGain = audioCtx.createGain();
  const padFilter = audioCtx.createBiquadFilter();

  pad.type = "sine";
  pad.frequency.value = chords[0] / 2;

  padFilter.type = "lowpass";
  padFilter.frequency.value = 400;

  padGain.gain.value = 0.05;

  pad.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(musicNodes.master);
  pad.start();
  musicNodes.fx.push(pad);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 100;
  lfo.connect(lfoGain);
  lfoGain.connect(padFilter.frequency);
  lfo.start();
  musicNodes.fx.push(lfo);

  playChordLoop();
}

function playMusic() {
  playAmbient(currentTrack);
  trackName.textContent = ambientTracks[currentTrack].name;
}

function loadTrack(index) {
  playAmbient(index);
}

volumeSlider.addEventListener("input", (e) => { e.stopPropagation(); setVolume(volumeSlider.value); });
prevBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack - 1); });
nextBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack + 1); });

trackName.addEventListener("click", (e) => {
  e.stopPropagation();
  if (musicPlaying) {
    stopMusic();
    trackName.textContent = "Pausado";
  } else {
    playAmbient(currentTrack);
  }
});

// DRAG
const musicControl = document.getElementById("music-control");
const musicHandle = musicControl.querySelector(".music-handle");

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

enterScreen.addEventListener("click", () => {
  if (hasEntered) return;
  hasEntered = true;
  loadTrack(0);
  setVolume(15);
  enterScreen.classList.add("fade-out");
  mainContent.classList.add("show");
  document.body.style.overflow = "auto";
  setTimeout(() => {
    enterScreen.style.display = "none";
  }, 600);
  startApp();
});

const copyBtn = document.getElementById("copy");
const clickSound = document.getElementById("click-sound");

spotifyBox.addEventListener("click", () => {
  if (currentSpotify?.track_id) {
    window.open(`https://open.spotify.com/track/${currentSpotify.track_id}`, "_blank");
  }
});

document.addEventListener("mousedown", () => {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
});

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

let sessionStart = Date.now();
let discordStart = null;
let currentGameStart = null;
let currentSpotify = null;
let hasActivity = false;
let spotifyOffset = 0;

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
      const expectedDuration = spotify.timestamps.end - spotify.timestamps.start;

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

      console.log("Spotify:", spotify.song, "| Total:", total, "| Pct:", pct);
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

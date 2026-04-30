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
let musicNodes = { master: null, allOsc: [] };
let musicPlaying = false;
let currentMusicVolume = 0.15;
let currentTrack = 0;
let activeIntervals = [];
let trackAnimFrame = null;

const volumeSlider = document.getElementById("volume-slider");
const trackName = document.getElementById("track-name");
const prevBtn = document.getElementById("prev-track");
const nextBtn = document.getElementById("next-track");

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicNodes.master = audioCtx.createGain();
  musicNodes.master.gain.value = currentMusicVolume;
  musicNodes.master.connect(audioCtx.destination);
}

function setVolume(val) {
  currentMusicVolume = val / 100;
  if (volumeSlider) volumeSlider.value = val;
  if (musicNodes.master) musicNodes.master.gain.value = currentMusicVolume;
}

function stopMusic() {
  musicPlaying = false;
  activeIntervals.forEach(id => clearInterval(id));
  activeIntervals = [];
  if (trackAnimFrame) cancelAnimationFrame(trackAnimFrame);
  trackAnimFrame = null;
  musicNodes.allOsc.forEach(osc => { try { osc.stop(); } catch(e) {} });
  musicNodes.allOsc = [];
}

function makeOsc(freq, type, vol) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = type;
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 2000;
  gain.gain.value = vol;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(musicNodes.master);
  osc.start();
  musicNodes.allOsc.push(osc);
  return { osc, gain, filter };
}

function note(freq, duration, vol, type, attack, release) {
  if (!musicPlaying || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const a = attack || 0.05;
  const r = release || duration;
  osc.type = type || "sine";
  osc.frequency.value = freq;
  osc2.type = type === "square" ? "sawtooth" : "triangle";
  osc2.frequency.value = freq;
  osc2.detune.value = 5;
  filter.type = "lowpass";
  filter.frequency.value = type === "square" ? 1500 : 1200;
  filter.Q.value = 0.5;
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + a);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(musicNodes.master);
  osc.start(now);
  osc.stop(now + duration + 0.2);
  osc2.start(now);
  osc2.stop(now + duration + 0.2);
  musicNodes.allOsc.push(osc, osc2);
}

// ===== TRACK 1: Ethereal Waves — slow pads, sine, dreamy =====
function track1() {
  const chords = [
    [523.25, 659.25, 783.99],
    [440, 554.37, 659.25],
    [392, 493.88, 587.33],
    [349.23, 440, 523.25]
  ];
  const bass = [261.63, 220, 196, 174.61];
  let idx = 0;

  const pad = audioCtx.createOscillator();
  const padG = audioCtx.createGain();
  const padF = audioCtx.createBiquadFilter();
  pad.type = "sine";
  pad.frequency.value = bass[0] / 2;
  padF.type = "lowpass";
  padF.frequency.value = 400;
  padG.gain.value = 0.06;
  pad.connect(padF); padF.connect(padG); padG.connect(musicNodes.master); pad.start();
  musicNodes.allOsc.push(pad);

  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
  lfo.frequency.value = 0.08;
  lfoG.gain.value = 150;
  lfo.connect(lfoG); lfoG.connect(padF.frequency); lfo.start();
  musicNodes.allOsc.push(lfo);

  activeIntervals.push(setInterval(() => {
    if (!musicPlaying) return;
    const ch = chords[idx];
    ch.forEach(f => note(f * 0.5, 8, 0.04, "sine", 1, 3));
    note(bass[idx], 6, 0.05, "sine", 0.5, 2);
    pad.frequency.setTargetAtTime(bass[idx] / 2, audioCtx.currentTime, 1);
    idx = (idx + 1) % chords.length;
  }, 6000));
}

// ===== TRACK 2: Midnight Study — lofi triangle, syncopated =====
function track2() {
  const scale = [293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33];
  let step = 0;
  const bpm = 72;
  const bt = 60000 / bpm;

  const pad = makeOsc(146.83, "triangle", 0.04);
  const lfo = audioCtx.createOscillator();
  const lfoG = audioCtx.createGain();
  lfo.frequency.value = 0.3;
  lfoG.gain.value = 200;
  lfo.connect(lfoG); lfoG.connect(pad.filter.frequency); lfo.start();
  musicNodes.allOsc.push(lfo);

  function beat() {
    if (!musicPlaying) return;
    const f = scale[step % scale.length];
    if (step % 4 === 0) note(f, bt * 0.015, 0.1, "triangle", 0.01, 0.01);
    if (step % 4 === 2) note(f * 1.5, bt * 0.012, 0.07, "triangle", 0.01, 0.01);
    if (step % 8 === 0) {
      note(f * 0.25, bt * 0.035, 0.08, "sine", 0.02, 0.02);
      pad.osc.frequency.setTargetAtTime(f * 0.25, audioCtx.currentTime, 0.3);
    }
    if (step % 3 === 0) note(f * 2, bt * 0.006, 0.03, "sine", 0.005, 0.005);
    step++;
  }
  activeIntervals.push(setInterval(beat, bt / 2));
}

// ===== TRACK 3: Cloud Drift — high arpeggios, shimmering =====
function track3() {
  const arps = [
    [783.99, 987.77, 1174.66, 1318.51],
    [659.25, 783.99, 987.77, 1174.66],
    [587.33, 739.99, 880, 987.77],
    [523.25, 659.25, 783.99, 880]
  ];
  const bass = [392, 329.63, 293.66, 261.63];
  let chordI = 0, noteI = 0;

  const pad = makeOsc(196, "sine", 0.03);
  pad.filter.frequency.value = 600;

  function arp() {
    if (!musicPlaying) return;
    const chord = arps[chordI];
    const f = chord[noteI % chord.length];
    note(f, 1.5, 0.06, "sine", 0.3, 1);
    note(f * 1.002, 1.8, 0.03, "sine", 0.5, 1.2);
    if (noteI % 4 === 0) {
      note(bass[chordI] * 0.5, 4, 0.05, "sine", 0.5, 2);
      pad.osc.frequency.setTargetAtTime(bass[chordI], audioCtx.currentTime, 1);
    }
    if (noteI % 8 === 4) {
      note(chord[Math.floor(Math.random() * chord.length)] * 2, 0.6, 0.04, "sine", 0.1, 0.3);
    }
    noteI++;
    if (noteI % 8 === 0) { chordI = (chordI + 1) % arps.length; }
  }
  activeIntervals.push(setInterval(arp, 500));
}

// ===== TRACK 4: Rainy Window — dark, minor key, sparse, moody =====
function track4() {
  const minor = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392];
  let phrase = 0;

  const drone = audioCtx.createOscillator();
  const droneG = audioCtx.createGain();
  const droneF = audioCtx.createBiquadFilter();
  drone.type = "sawtooth";
  drone.frequency.value = 110;
  droneF.type = "lowpass";
  droneF.frequency.value = 200;
  droneF.Q.value = 5;
  droneG.gain.value = 0.03;
  drone.connect(droneF); droneF.connect(droneG); droneG.connect(musicNodes.master); drone.start();
  musicNodes.allOsc.push(drone);

  const droneLfo = audioCtx.createOscillator();
  const droneLfoG = audioCtx.createGain();
  droneLfo.frequency.value = 0.05;
  droneLfoG.gain.value = 100;
  droneLfo.connect(droneLfoG); droneLfoG.connect(droneF.frequency); droneLfo.start();
  musicNodes.allOsc.push(droneLfo);

  function rain() {
    if (!musicPlaying) return;
    const f = minor[Math.floor(Math.random() * minor.length)];
    if (phrase % 3 === 0) {
      note(f, 4, 0.05, "sine", 2, 2);
      note(f * 1.2, 5, 0.03, "sine", 2.5, 2);
    }
    if (phrase % 5 === 0) {
      note(f * 0.25, 6, 0.06, "triangle", 1, 3);
      drone.frequency.setTargetAtTime(f * 0.5, audioCtx.currentTime, 2);
    }
    if (phrase % 7 === 0) {
      note(f * 3, 0.3, 0.02, "sine", 0.1, 0.1);
    }
    phrase++;
  }
  activeIntervals.push(setInterval(rain, 3000));
}

// ===== TRACK 5: Neon Pulse — synthwave, square, driving =====
function track5() {
  const riff = [164.81, 196, 220, 246.94, 220, 196, 164.81, 146.83];
  const arpUp = [329.63, 415.30, 493.88, 659.25];
  let step = 0;
  const bpm = 110;
  const bt = 60000 / bpm;

  const bass = makeOsc(82.41, "square", 0.06);
  bass.filter.frequency.value = 500;

  function pulse() {
    if (!musicPlaying) return;
    const sf = step % 8;
    if (sf < 4) {
      note(riff[sf] * 0.5, bt * 0.022, 0.1, "square", 0.005, 0.005);
      bass.osc.frequency.setTargetAtTime(riff[sf] * 0.5, audioCtx.currentTime, 0.05);
    }
    if (sf % 2 === 0) {
      note(arpUp[(step >> 1) % arpUp.length], bt * 0.01, 0.06, "square", 0.003, 0.003);
      note(arpUp[(step >> 1) % arpUp.length] * 2, bt * 0.006, 0.03, "square", 0.002, 0.002);
    }
    if (sf === 0 || sf === 4) {
      note(riff[sf] * 2, bt * 0.018, 0.07, "sawtooth", 0.01, 0.01);
    }
    if (sf === 6) {
      note(arpUp[(step >> 1) % arpUp.length] * 1.5, bt * 0.012, 0.04, "sawtooth", 0.005, 0.005);
    }
    step++;
  }
  activeIntervals.push(setInterval(pulse, bt / 2));
}

const trackFunctions = [track1, track2, track3, track4, track5];
const trackNames = ["Ethereal Waves", "Midnight Study", "Cloud Drift", "Rainy Window", "Neon Pulse"];

function playAmbient(trackIndex) {
  initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  stopMusic();
  musicPlaying = true;
  currentTrack = ((trackIndex % trackFunctions.length) + trackFunctions.length) % trackFunctions.length;
  trackName.textContent = trackNames[currentTrack];
  trackFunctions[currentTrack]();
}

function loadTrack(index) { playAmbient(index); }

if (volumeSlider) volumeSlider.addEventListener("input", (e) => { e.stopPropagation(); setVolume(volumeSlider.value); });
if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack - 1); });
if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); loadTrack(currentTrack + 1); });
if (trackName) trackName.addEventListener("click", (e) => {
  e.stopPropagation();
  if (musicPlaying) { stopMusic(); trackName.textContent = "Pausado"; }
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

const userId = "1109957738387230740";

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("status-indicator");
const spotifyBox = document.getElementById("spotify-box");
const discordBox = document.getElementById("discord-status");
const sessionTime = document.getElementById("session-time");
const dcTime = document.getElementById("dc-time");
const activityStatus = document.getElementById("activity-status");

let audioCtx = null;
let musicNodes = [];
let musicPlaying = false;
let currentMusicVolume = 0.15;
let currentTrack = 0;

const ambientTracks = [
  {
    name: "Lofi Dream",
    bpm: 70,
    melody: [
      [523.25, 659.25, 783.99],
      [493.88, 587.33, 739.99],
      [440.00, 523.25, 659.25],
      [392.00, 493.88, 587.33]
    ],
    bass: [261.63, 246.94, 220.00, 196.00]
  },
  {
    name: "Night Chill",
    bpm: 65,
    melody: [
      [440.00, 523.25, 659.25],
      [392.00, 493.88, 587.33],
      [349.23, 440.00, 523.25],
      [293.66, 349.23, 440.00]
    ],
    bass: [220.00, 196.00, 174.61, 146.83]
  },
  {
    name: "Starlight",
    bpm: 75,
    melody: [
      [587.33, 739.99, 880.00],
      [523.25, 659.25, 783.99],
      [493.88, 587.33, 739.99],
      [440.00, 523.25, 659.25]
    ],
    bass: [293.66, 261.63, 246.94, 220.00]
  },
  {
    name: "Deep Calm",
    bpm: 60,
    melody: [
      [349.23, 440.00, 523.25],
      [293.66, 392.00, 440.00],
      [261.63, 349.23, 392.00],
      [220.00, 293.66, 349.23]
    ],
    bass: [174.61, 146.83, 130.81, 110.00]
  },
  {
    name: "Aurora",
    bpm: 68,
    melody: [
      [493.88, 587.33, 739.99],
      [440.00, 554.37, 659.25],
      [392.00, 493.88, 587.33],
      [329.63, 415.30, 493.88]
    ],
    bass: [246.94, 220.00, 196.00, 164.81]
  }
];

let activeIntervals = [];

function stopMusic() {
  musicPlaying = false;
  activeIntervals.forEach(id => clearInterval(id));
  activeIntervals = [];
  if (musicNodes.allOsc) {
    musicNodes.allOsc.forEach(osc => { try { osc.stop(); } catch(e) {} });
  }
  musicNodes.allOsc = [];
}

function playAmbient(trackIndex) {
  initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();

  stopMusic();
  musicPlaying = true;
  if (!musicNodes.allOsc) musicNodes.allOsc = [];

  currentTrack = ((trackIndex % ambientTracks.length) + ambientTracks.length) % ambientTracks.length;
  const track = ambientTracks[currentTrack];
  trackName.textContent = track.name;

  const bpm = track.bpm;
  const beatTime = 60 / bpm;

  const master = musicNodes.master;
  const pad = audioCtx.createOscillator();
  const padGain = audioCtx.createGain();
  const padFilter = audioCtx.createBiquadFilter();

  pad.type = "sine";
  pad.frequency.value = track.bass[0] / 2;
  padFilter.type = "lowpass";
  padFilter.frequency.value = 300;
  padGain.gain.value = 0.06;

  pad.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(master);
  pad.start();
  musicNodes.allOsc.push(pad);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 80;
  lfo.connect(lfoGain);
  lfoGain.connect(padFilter.frequency);
  lfo.start();
  musicNodes.allOsc.push(lfo);

  let chordIdx = 0;
  let beatInChord = 0;

  function playBeat() {
    if (!musicPlaying) return;

    const chord = track.melody[chordIdx];
    const noteFreq = chord[beatInChord % chord.length];

    playNote(noteFreq, beatTime * 0.9, 0.1);
    playNote(noteFreq * 0.5, beatTime * 1.2, 0.05);

    if (beatInChord === 0) {
      playNote(track.bass[chordIdx], beatTime * 3, 0.08);
      pad.frequency.setTargetAtTime(track.bass[chordIdx] / 2, audioCtx.currentTime, 0.5);
    }

    beatInChord++;
    if (beatInChord >= 4) {
      beatInChord = 0;
      chordIdx = (chordIdx + 1) % track.melody.length;
    }
  }

  const interval = setInterval(playBeat, beatTime * 1000);
  activeIntervals.push(interval);
  playBeat();
}

function playNote(freq, duration, vol) {
  if (!musicPlaying || !audioCtx) return;

  const osc = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.value = freq;

  osc2.type = "triangle";
  osc2.frequency.value = freq;
  osc2.detune.value = 3;

  filter.type = "lowpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.7;

  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(musicNodes.master);

  osc.start(now);
  osc.stop(now + duration + 0.1);
  osc2.start(now);
  osc2.stop(now + duration + 0.1);

  musicNodes.allOsc.push(osc, osc2);
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
  const detuneVal = track.detune || 5;
  const filterFreq = track.filter || 800;

  musicNodes.chords = [];

  function playChordLoop() {
    if (!musicPlaying) return;

    chords.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = waveType;
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * detuneVal;

      filter.type = "lowpass";
      filter.frequency.value = filterFreq;
      filter.Q.value = 0.5;

      const now = audioCtx.currentTime;
      const noteLen = tempo / 1000;
      const startOffset = i * (tempo / 1000) * 0.25;

      gain.gain.setValueAtTime(0, now + startOffset);
      gain.gain.linearRampToValueAtTime(0.12, now + startOffset + noteLen * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + noteLen * 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicNodes.master);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + noteLen * 1.8);
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
  padFilter.frequency.value = filterFreq * 0.5;

  padGain.gain.value = 0.04;

  pad.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(musicNodes.master);
  pad.start();
  musicNodes.fx.push(pad);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.2;
  lfoGain.gain.value = filterFreq * 0.3;
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

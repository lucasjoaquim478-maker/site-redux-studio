const userId = "1109957738387230740";

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("status-indicator");
const spotifyBox = document.getElementById("spotify-box");
const discordBox = document.getElementById("discord-status");
const sessionTime = document.getElementById("session-time");
const dcTime = document.getElementById("dc-time");
const activityStatus = document.getElementById("activity-status");
const copyBtn = document.getElementById("copy");
const clickSound = document.getElementById("click-sound");

const cursor = document.getElementById("cursor");
const cursorTrail = document.getElementById("cursor-trail");

let mouseX = 0, mouseY = 0;
let trailX = 0, trailY = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + "px";
  cursor.style.top = mouseY + "px";
});

function animateTrail() {
  trailX += (mouseX - trailX) * 0.15;
  trailY += (mouseY - trailY) * 0.15;
  cursorTrail.style.left = trailX + "px";
  cursorTrail.style.top = trailY + "px";
  requestAnimationFrame(animateTrail);
}
animateTrail();

document.addEventListener("mousedown", () => {
  cursor.classList.add("click-effect");
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
});

document.addEventListener("mouseup", () => cursor.classList.remove("click-effect"));

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

let sessionStart = Date.now();
let discordStart = null;

setInterval(() => {
  sessionTime.textContent = formatDuration(Date.now() - sessionStart);
}, 1000);

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

    const activities = kv.activities.filter(a => a.type !== 4);
    const spotify = kv.spotify;

    spotifyBox.innerHTML = "";
    discordBox.innerHTML = "";

    if (spotify) {
      spotifyBox.innerHTML = `
        <div class="spotify">
          <img src="${spotify.album_image_url}" alt="Album">
          <div class="spotify-info">
            <div class="title">${spotify.song}</div>
            <div class="artist">${spotify.artist}</div>
            <div class="progress">
              <div class="progress-bar" style="width: ${((spotify.timestamps.current - spotify.timestamps.start) / (spotify.timestamps.end - spotify.timestamps.start)) * 100}%"></div>
            </div>
          </div>
        </div>
      `;
    }

    if (activities.length > 0) {
      const act = activities[0];
      activityStatus.textContent = act.name.slice(0, 12);

      if (act.assets?.large_image) {
        const img = act.assets.large_image.startsWith("mp:external/")
          ? `https://media.discordapp.net/external/${act.assets.large_image.split("mp:external/")[1]}`
          : `https://cdn.discordapp.com/app-assets/${act.application_id}/${act.assets.large_image}.png`;

        if (act.timestamps?.start) {
          discordStart = act.timestamps.start;
          dcTime.textContent = formatDuration(Date.now() - discordStart);
        }

        discordBox.innerHTML = `
          <div class="dc">
            <img class="game-img" src="${img}" alt="Game">
            <div class="dc-info">
              <div class="game-name">${act.name}</div>
              <div class="dc-time">${formatDuration(Date.now() - (discordStart || Date.now()))}</div>
            </div>
          </div>
        `;
      }
    } else {
      activityStatus.textContent = "Idle";
      discordStart = null;
      dcTime.textContent = "--:--";
    }
  } catch {
    activityStatus.textContent = "Error";
  }
}

fetchStatus();
setInterval(fetchStatus, 10000);

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

(function() {
  "use strict";

  const userId = "1109957738387230740";
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const dom = {
    avatar: document.getElementById("avatar"),
    username: document.getElementById("username"),
    statusEl: document.getElementById("status-indicator"),
    spotifyBox: document.getElementById("spotify-box"),
    discordBox: document.getElementById("discord-status"),
    sessionTime: document.getElementById("session-time"),
    dcTime: document.getElementById("dc-time"),
    activityStatus: document.getElementById("activity-status"),
    copyBtn: document.getElementById("copy"),
    enterScreen: document.getElementById("enter-screen"),
    mainContent: document.getElementById("main-content"),
    enterTitle: document.getElementById("enter-title"),
    enterHintText: document.getElementById("enter-hint-text"),
    bgMusic: document.getElementById("bg-music"),
    particlesCanvas: document.getElementById("particles")
  };

  let discordStart = null, currentGameStart = null, currentSpotify = null, hasActivity = false;
  let spotifyData = null;
  let spotifyTimerInterval = null;
  let pendingSpotifyUrl = "";
  let timerInterval = null, fetchInterval = null;
  let hasEntered = false;

  const utils = {
    formatDuration(ms) {
      ms = Math.max(0, ms);
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    },
    getImageUrl(assets, key, appId) {
      if (!assets?.[key]) return null;
      const raw = assets[key];
      return raw && /^\d+$/.test(raw) ? `https://cdn.discordapp.com/app-assets/${appId}/${raw}.png` : null;
    },
    escapeHtml(str) {
      if (!str) return "";
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    },
    brt() {
      return new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });
    }
  };

  function updateProgress() {
    if (!spotifyData) return;
  }

  function updateTimers() {
    if (dom.sessionTime) dom.sessionTime.textContent = utils.brt();
    if (discordStart && hasActivity && dom.dcTime) {
      dom.dcTime.textContent = utils.formatDuration(Date.now() - discordStart);
    }
    updateProgress();
  }

  async function fetchStatus() {
    try {
      const res = await fetch("https://api.lanyard.rest/v1/users/" + userId);
      const data = await res.json();
      if (!data?.success) return;

      const { discord_user: user, discord_status: status, activities, spotify } = data.data;

      if (dom.avatar) {
        if (user.avatar?.startsWith("a_")) {
          dom.avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.gif`;
        } else if (user.avatar && /^\w+$/.test(user.avatar)) {
          dom.avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        } else {
          const idx = Number((BigInt(user.id) >> 22n) % 6n);
          dom.avatar.src = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
        }
      }
      if (dom.username) dom.username.textContent = user.username;
      if (dom.statusEl) dom.statusEl.className = "status-" + status;

      const filteredActs = activities?.filter(a => a.type !== 4 && a.type !== 2) || [];
      hasActivity = filteredActs.length > 0;

      if (spotify?.album_art_url) {
        currentSpotify = spotify;
        spotifyData = spotify;
        const end = spotify.timestamps.end;
        const start = spotify.timestamps.start;
        const total = end - start;
        const spotifyUrl = spotify.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : "";
        const song = utils.escapeHtml(spotify.song);
        const artist = utils.escapeHtml(spotify.artist);
        clearInterval(spotifyTimerInterval);
        const trackId = "spotify-track-" + Date.now();
        dom.spotifyBox.innerHTML =
          `<div class="spotify" data-url="${spotifyUrl}">
            <img src="${spotify.album_art_url}" alt="Album" onerror="this.style.display='none'">
            <div class="spotify-info">
              <div class="title">${song}</div>
              <div class="artist">${artist}</div>
              <div class="spotify-times" id="spotify-times">--:-- / ${utils.formatDuration(total)}</div>
              <div class="progress"><div class="progress-bar" id="spotify-progress" style="width:0%"></div></div>
            </div>
          </div>`;
        spotifyTimerInterval = setInterval(() => {
          const elapsed = Date.now() - start;
          const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
          const progressBar = document.getElementById("spotify-progress");
          const timesEl = document.getElementById("spotify-times");
          if (progressBar) progressBar.style.width = pct + "%";
          if (timesEl) timesEl.textContent = utils.formatDuration(elapsed) + " / " + utils.formatDuration(total);
        }, 1000);
      } else {
        currentSpotify = null;
        spotifyData = null;
        clearInterval(spotifyTimerInterval);
        dom.spotifyBox.innerHTML = "";
      }

      if (filteredActs.length > 0) {
        const act = filteredActs[0];
        if (dom.activityStatus) dom.activityStatus.textContent = act.name.slice(0, 12);
        const appId = act.application_id;
        const isRoblox = appId === "363445589247131668" || act.name?.toLowerCase().includes("roblox");

        if (act.timestamps?.start) {
          if (discordStart === null || currentGameStart !== act.timestamps.start) {
            discordStart = act.timestamps.start;
            currentGameStart = act.timestamps.start;
          }
          dom.dcTime.textContent = utils.formatDuration(Date.now() - discordStart);
        }

        let imgHtml = isRoblox
          ? '<img class="game-img" src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Roblox_Logo_2025.png" alt="Roblox" onerror="this.style.display=\'none\'">'
          : (() => {
              let url = utils.getImageUrl(act.assets, "large_image", appId) || utils.getImageUrl(act.assets, "small_image", appId);
              return url ? `<img class="game-img" src="${url}" alt="Game" onerror="this.style.display='none'">` : "";
            })();

        dom.discordBox.innerHTML = `
          <div class="dc${isRoblox ? " roblox-card" : ""}">
            ${imgHtml}
            <div class="dc-info">
              <div class="game-name">${utils.escapeHtml(act.name)}</div>
              <div class="dc-time">${discordStart ? utils.formatDuration(Date.now() - discordStart) : "00:00"}</div>
            </div>
          </div>`;
      } else {
        if (dom.activityStatus) dom.activityStatus.textContent = "Idle";
        discordStart = null;
        currentGameStart = null;
        dom.dcTime.textContent = "--:--";
        dom.discordBox.innerHTML = "";
      }
    } catch (err) {
      console.error("Lanyard error:", err);
      if (dom.activityStatus) dom.activityStatus.textContent = "Error";
    }
  }

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
    if (pendingSpotifyUrl) window.open(pendingSpotifyUrl, "_blank");
    closePopup();
  }

  window.confirmSpotify = confirmSpotify;
  window.closePopup = closePopup;
  window.confirmSpotifyAction = confirmSpotifyAction;

  document.addEventListener("click", e => {
    const popup = document.getElementById("popup-overlay");
    if (popup && e.target === popup) closePopup();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePopup(); });

  dom.spotifyBox.addEventListener("click", e => {
    const spotifyEl = e.target.closest(".spotify");
    if (spotifyEl) confirmSpotify(spotifyEl.getAttribute("data-url"));
  });

  if (dom.copyBtn) {
    dom.copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(userId).then(() => {
        const original = dom.copyBtn.innerHTML;
        dom.copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Copied!';
        setTimeout(() => { dom.copyBtn.innerHTML = original; }, 2000);
      });
    });
  }

  function startApp() {
    updateTimers();
    clearInterval(timerInterval);
    clearInterval(fetchInterval);
    timerInterval = setInterval(updateTimers, 1000);
    fetchStatus();
    fetchInterval = setInterval(fetchStatus, 3000);
  }

  if (dom.enterScreen) {
    if (dom.enterTitle) dom.enterTitle.textContent = isTouch ? "Toque para entrar" : "Clique para entrar";
    if (dom.enterHintText) dom.enterHintText.textContent = isTouch ? "Toque em qualquer lugar" : "Clique em qualquer lugar";

    const enterEvent = isTouch ? "touchstart" : "click";
    dom.enterScreen.addEventListener(enterEvent, function handler() {
      if (hasEntered) return;
      hasEntered = true;
      dom.enterScreen.classList.add("fade-out");
      dom.mainContent.classList.add("show");
      document.body.style.overflow = "auto";
      setTimeout(() => { dom.enterScreen.style.display = "none"; }, 600);
      if (dom.bgMusic) {
        dom.bgMusic.volume = 0.15;
        dom.bgMusic.play().catch(() => {});
      }
      startApp();
      dom.enterScreen.removeEventListener(enterEvent, handler);
    });
  }

  const canvas = dom.particlesCanvas;
  const ctx = canvas?.getContext("2d");
  if (canvas && ctx) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    const particleCount = isTouch ? 25 : 60;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedY: Math.random() * 0.5 + 0.2,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1
    }));

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.fillStyle = `rgba(0, 255, 204, ${p.opacity})`;
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
  }
})();
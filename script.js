(function() {
  "use strict";
  const userId = "1109957738387230740";
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const FETCH_INTERVAL = 5000;
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
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
    particlesCanvas: document.getElementById("particles"),
    musicControl: document.getElementById("music-control")
  };
  
  let discordStart = null, currentGameStart = null, currentSpotify = null, hasActivity = false;
  let spotifyData = null;
  let spotifyTimerInterval = null;
  let spotifyElapsed = 0;
  let spotifyTotalMs = 0;
  let perfFetch = 0;
  let pendingSpotifyUrl = "";
  let timerInterval = null, fetchInterval = null;
  let hasEntered = false;
  let isPlaying = false;
  
  const utils = {
    formatDuration(ms) {
      ms = Math.max(0, ms);
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return h > 0 ? h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") : String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    },
    getAvatarUrl(userId, avatar) {
      if (!avatar) {
        const idx = Number((BigInt(userId) >> 22n) % 6n);
        return "https://cdn.discordapp.com/embed/avatars/" + idx + ".png";
      }
      if (avatar.startsWith("a_")) {
        return "https://cdn.discordapp.com/avatars/" + userId + "/" + avatar + ".gif?size=256";
      }
      if (/^\w+$/.test(avatar)) {
        return "https://cdn.discordapp.com/avatars/" + userId + "/" + avatar + ".png?size=256";
      }
      const idx = Number((BigInt(userId) >> 22n) % 6n);
      return "https://cdn.discordapp.com/embed/avatars/" + idx + ".png";
    },
    getImageUrl(assets, key, appId) {
      if (!assets || !assets[key]) return null;
      const raw = assets[key];
      return raw && /^\d+$/.test(raw) ? "https://cdn.discordapp.com/app-assets/" + appId + "/" + raw + ".png" : null;
    },
    escapeHtml(str) {
      if (!str) return "";
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    },
    brt() {
      return new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });
    },
    showNotification(message, isError = false) {
      const existing = document.querySelector(".notification");
      if (existing) existing.remove();
      const notif = document.createElement("div");
      notif.className = "notification" + (isError ? " notification-error" : "");
      notif.textContent = message;
      document.body.appendChild(notif);
      setTimeout(() => notif.classList.add("notification-show"), 10);
      setTimeout(() => {
        notif.classList.remove("notification-show");
        setTimeout(() => notif.remove(), 300);
      }, 3000);
    }
  };
  
  function updateTimers() {
    if (dom.sessionTime) dom.sessionTime.textContent = utils.brt();
    if (discordStart && hasActivity && dom.dcTime) {
      dom.dcTime.textContent = utils.formatDuration(Date.now() - discordStart);
    }
  }
  
  async function fetchStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch("https://api.lanyard.rest/v1/users/" + userId, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      
      const data = await res.json();
      
      if (!data || !data.success) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          if (dom.activityStatus) dom.activityStatus.textContent = "Offline";
        }
        return;
      }
      
      retryCount = 0;
      const d = data.data;
      const user = d.discord_user;
      const status = d.discord_status;
      const activities = d.activities;
      const spotify = d.spotify;
      
      if (dom.avatar) {
        dom.avatar.src = utils.getAvatarUrl(user.id, user.avatar);
        dom.avatar.onerror = function() {
          this.src = "https://cdn.discordapp.com/embed/avatars/0.png";
        };
      }
      
      if (dom.username) {
        dom.username.textContent = user.username;
        dom.username.classList.add("text-glow");
      }
      
      if (dom.statusEl) {
        dom.statusEl.className = "status-" + status;
      }
      
      const filteredActs = (activities || []).filter(function(a) {
        return a.type !== 4 && a.type !== 2;
      });
      
      hasActivity = filteredActs.length > 0;
      
      if (spotify && spotify.album_art_url) {
        currentSpotify = spotify;
        spotifyData = spotify;
        const start = spotify.timestamps.start;
        const end = spotify.timestamps.end;
        spotifyTotalMs = end - start;
        const spotifyUrl = spotify.track_id ? "https://open.spotify.com/track/" + spotify.track_id : "";
        const song = utils.escapeHtml(spotify.song);
        const artist = utils.escapeHtml(spotify.artist);
        
        clearInterval(spotifyTimerInterval);
        spotifyElapsed = Date.now() - start;
        if (spotifyElapsed < 0) spotifyElapsed = 0;
        if (spotifyElapsed > spotifyTotalMs) spotifyElapsed = spotifyTotalMs;
        
        perfFetch = performance.now();
        
        if (dom.spotifyBox) {
          dom.spotifyBox.innerHTML = "<div class=\"spotify\" data-url=\"" + spotifyUrl + "\"><img src=\"" + spotify.album_art_url + "\" alt=\"Album\" onerror=\"this.style.display='none'\"><div class=\"spotify-info\"><div class=\"title\">" + song + "</div><div class=\"artist\">" + artist + "</div><div class=\"spotify-times\" id=\"spotify-times\">" + utils.formatDuration(spotifyElapsed) + " / " + utils.formatDuration(spotifyTotalMs) + "</div><div class=\"progress\"><div class=\"progress-bar\" id=\"spotify-progress\" style=\"width:" + (spotifyElapsed / spotifyTotalMs * 100).toFixed(2) + "%\"></div></div></div></div>";
        }
        
        spotifyTimerInterval = setInterval(function() {
          var passed = performance.now() - perfFetch;
          var elapsed = spotifyElapsed + passed;
          if (elapsed > spotifyTotalMs) elapsed = spotifyTotalMs;
          var pct = spotifyTotalMs > 0 ? (elapsed / spotifyTotalMs * 100) : 0;
          var pb = dom.spotifyBox ? dom.spotifyBox.querySelector("#spotify-progress") : null;
          var te = dom.spotifyBox ? dom.spotifyBox.querySelector("#spotify-times") : null;
          if (pb) pb.style.width = pct.toFixed(2) + "%";
          if (te) te.textContent = utils.formatDuration(elapsed) + " / " + utils.formatDuration(spotifyTotalMs);
        }, 1000);
      } else {
        currentSpotify = null;
        spotifyData = null;
        clearInterval(spotifyTimerInterval);
        if (dom.spotifyBox) dom.spotifyBox.innerHTML = "";
      }
      
      if (filteredActs.length > 0) {
        var act = filteredActs[0];
        if (dom.activityStatus) dom.activityStatus.textContent = act.name.slice(0, 12);
        var appId = act.application_id;
        var isRoblox = appId === "3634458924713168" || (act.name && act.name.toLowerCase().includes("roblox"));
        
        if (act.timestamps && act.timestamps.start) {
          if (discordStart === null || currentGameStart !== act.timestamps.start) {
            discordStart = act.timestamps.start;
            currentGameStart = act.timestamps.start;
          }
          if (dom.dcTime) dom.dcTime.textContent = utils.formatDuration(Date.now() - discordStart);
        }
        
        var imgHtml = "";
        if (isRoblox) {
          imgHtml = "<img class=\"game-img\" src=\"https://upload.wikimedia.org/wikipedia/commons/1/1e/Roblox_Logo_2025.png\" alt=\"Roblox\" onerror=\"this.style.display='none'\">";
        } else if (act.assets) {
          var url = utils.getImageUrl(act.assets, "large_image", appId) || utils.getImageUrl(act.assets, "small_image", appId);
          if (url) {
            imgHtml = "<img class=\"game-img\" src=\"" + url + "\" alt=\"Game\" onerror=\"this.style.display='none'\">";
          } else if (act.application_id) {
            imgHtml = "<div class=\"game-icon-placeholder\">" + (act.name ? act.name.charAt(0).toUpperCase() : "?") + "</div>";
          }
        }
        
        if (dom.discordBox) {
          dom.discordBox.innerHTML = "<div class=\"dc" + (isRoblox ? " roblox-card" : "") + "\">" + imgHtml + "<div class=\"dc-info\"><div class=\"game-name\">" + utils.escapeHtml(act.name) + "</div><div class=\"dc-time\">" + (discordStart ? utils.formatDuration(Date.now() - discordStart) : "00:00") + "</div></div></div>";
        }
      } else {
        if (dom.activityStatus) dom.activityStatus.textContent = "Idle";
        discordStart = null;
        currentGameStart = null;
        if (dom.dcTime) dom.dcTime.textContent = "--:--";
        if (dom.discordBox) dom.discordBox.innerHTML = "";
      }
      
    } catch (err) {
      console.error("Lanyard error:", err);
      retryCount++;
      if (dom.activityStatus) {
        dom.activityStatus.textContent = retryCount >= MAX_RETRIES ? "Offline" : "Error";
      }
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
  
  document.addEventListener("click", function(e) {
    var popup = document.getElementById("popup-overlay");
    if (popup && e.target === popup) closePopup();
  });
  
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closePopup();
  });
  
  if (dom.spotifyBox) {
    dom.spotifyBox.addEventListener("click", function(e) {
      var spotifyEl = e.target.closest(".spotify");
      if (spotifyEl) confirmSpotify(spotifyEl.getAttribute("data-url"));
    });
  }
  
  if (dom.copyBtn) {
    dom.copyBtn.addEventListener("click", function() {
      navigator.clipboard.writeText(userId).then(function() {
        var original = dom.copyBtn.innerHTML;
        dom.copyBtn.innerHTML = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><polyline points=\"20 6 9 17 4 12\"/></svg>Copied!";
        setTimeout(function() {
          dom.copyBtn.innerHTML = original;
        }, 2000);
      }).catch(function() {
        utils.showNotification("Failed to copy", true);
      });
    });
  }
  
  function toggleMusic() {
    if (!dom.bgMusic) return;
    
    if (isPlaying) {
      dom.bgMusic.pause();
      isPlaying = false;
    } else {
      dom.bgMusic.play().then(function() {
        isPlaying = true;
      }).catch(function(err) {
        console.log("Autoplay blocked:", err);
        utils.showNotification("Click to enable music", true);
      });
    }
  }
  
  function startApp() {
    updateTimers();
    clearInterval(timerInterval);
    clearInterval(fetchInterval);
    timerInterval = setInterval(updateTimers, 1000);
    fetchStatus();
    fetchInterval = setInterval(fetchStatus, FETCH_INTERVAL);
  }
  
  function initParticles() {
    var canvas = dom.particlesCanvas;
    var ctx = canvas && canvas.getContext("2d");
    if (!canvas || !ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    window.addEventListener("resize", function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    
    var particleCount = isTouch ? 25 : 60;
    var particles = Array.from({ length: particleCount }, function() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * 0.5 + 0.2,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1
      };
    });
    
    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function(p) {
        ctx.fillStyle = "rgba(0, 255, 204, " + p.opacity + ")";
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
  }
  
  if (dom.enterScreen) {
    if (dom.enterTitle) dom.enterTitle.textContent = isTouch ? "Toque para entrar" : "Clique para entrar";
    if (dom.enterHintText) dom.enterHintText.textContent = isTouch ? "Toque em qualquer lugar" : "Clique em qualquer lugar";
    
    var enterEvent = isTouch ? "touchstart" : "click";
    
    dom.enterScreen.addEventListener(enterEvent, function handler(e) {
      if (hasEntered) return;
      hasEntered = true;
      
      dom.enterScreen.classList.add("fade-out");
      dom.mainContent.classList.add("show");
      document.body.style.overflow = "auto";
      
      setTimeout(function() {
        dom.enterScreen.style.display = "none";
      }, 600);
      
      if (dom.bgMusic) {
        dom.bgMusic.volume = 0.15;
        dom.bgMusic.play().then(function() {
          isPlaying = true;
        }).catch(function() {
          console.log("Music autoplay blocked - user needs to interact first");
        });
      }
      
      startApp();
      initParticles();
      dom.enterScreen.removeEventListener(enterEvent, handler);
    });
  }
  
  window.addEventListener("beforeunload", function() {
    clearInterval(timerInterval);
    clearInterval(fetchInterval);
    clearInterval(spotifyTimerInterval);
  });
  
})();
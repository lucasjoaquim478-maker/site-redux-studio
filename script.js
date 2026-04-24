const enterScreen = document.getElementById("enter-screen");
const musica = document.getElementById("musica");
const clickSound = document.getElementById("clickSound");
const main = document.getElementById("main-content");

enterScreen.addEventListener("click", () => {
  clickSound.play();
  musica.play();
  enterScreen.style.display = "none";

  setTimeout(() => {
    main.classList.add("show");
  }, 100);
});

// texto animado
const text = "Player | Dev | Futuro Pro 🔥";
let i = 0;

function escrever() {
  if (i < text.length) {
    document.getElementById("desc").innerHTML += text.charAt(i);
    i++;
    setTimeout(escrever, 40);
  }
}
escrever();

// canvas
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let rain = [];
let trails = [];

// chuva
for (let i = 0; i < 120; i++) {
  rain.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 3 + 2,
    size: Math.random() * 2 + 1
  });
}

// rastro mouse
window.addEventListener("mousemove", (e) => {
  trails.push({ x: e.clientX, y: e.clientY, life: 30 });
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ffcc";

  rain.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  trails.forEach((t, i) => {
    ctx.fillStyle = `rgba(0,255,204, ${t.life / 30})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
    ctx.fill();
    t.life--;
    if (t.life <= 0) trails.splice(i, 1);
  });

  rain.forEach(p => {
    p.y += p.speed;
    if (p.y > canvas.height) {
      p.y = 0;
      p.x = Math.random() * canvas.width;
    }
  });
}

setInterval(draw, 30);

// discord
const userId = "SEU_ID_AQUI";

async function pegarStatus() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (data.success) {
      const status = data.data;

      if (status.listening_to_spotify) {
        document.getElementById("discord-status").innerText = `🎵 ${status.spotify.song}`;
      } else if (status.activities.length > 0) {
        document.getElementById("discord-status").innerText = `🎮 ${status.activities[0].name}`;
      } else {
        document.getElementById("discord-status").innerText = "💤 Offline";
      }
    }
  } catch {
    document.getElementById("discord-status").innerText = "Erro Discord";
  }
}

setInterval(pegarStatus, 5000);
pegarStatus();
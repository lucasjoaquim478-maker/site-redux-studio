const userId = "1109957738387230740";

const enterScreen = document.getElementById("enter-screen");
const musica = document.getElementById("musica");
const main = document.getElementById("main-content");

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("discord-status");

const cursor = document.getElementById("cursor");

// entrar
enterScreen.addEventListener("click", () => {
  musica.play();
  enterScreen.style.display = "none";

  main.classList.add("show");

  escrever();
  pegarStatus();
});

// CURSOR INSANO (movimento suave)
let mouseX = 0;
let mouseY = 0;
let posX = 0;
let posY = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  posX += (mouseX - posX) * 0.2;
  posY += (mouseY - posY) * 0.2;

  cursor.style.left = posX + "px";
  cursor.style.top = posY + "px";

  requestAnimationFrame(animateCursor);
}
animateCursor();

// TEXTO
const text = "Player | Dev | Futuro Pro 🔥";
let i = 0;

function escrever() {
  const desc = document.getElementById("desc");
  desc.innerHTML = "";

  function loop() {
    if (i < text.length) {
      desc.innerHTML += text[i];
      i++;
      setTimeout(loop, 40);
    }
  }

  loop();
}

// DISCORD
async function pegarStatus() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (data.success) {
      const user = data.data.discord_user;

      avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
      username.innerText = user.username;

      if (data.data.activities.length > 0) {
        statusEl.innerText = "🎮 " + data.data.activities[0].name;
      } else {
        statusEl.innerText = "💤 Offline";
      }
    }
  } catch {
    statusEl.innerText = "Erro Discord";
  }
}

// PARTÍCULAS
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let particles = [];

for (let i = 0; i < 100; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 3 + 2
  });
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#00ffcc";

  particles.forEach(p => {
    ctx.fillRect(p.x, p.y, 2, 10);
    p.y += p.speed;
    if (p.y > canvas.height) p.y = 0;
  });
}

setInterval(draw, 30);

const userId = "SEU_ID_AQUI";

// ELEMENTOS
const enterScreen = document.getElementById("enter-screen");
const musica = document.getElementById("musica");
const main = document.getElementById("main-content");

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("discord-status");

// ENTRAR NO SITE
enterScreen.addEventListener("click", () => {
  musica.play();
  enterScreen.style.display = "none";

  setTimeout(() => {
    main.classList.add("show");
    pegarStatus(); // só carrega depois de entrar
  }, 200);
});

// TEXTO ANIMADO
const text = "Player | Dev | Futuro Pro 🔥";
let i = 0;

function escrever() {
  if (i < text.length) {
    document.getElementById("desc").innerHTML += text[i];
    i++;
    setTimeout(escrever, 40);
  }
}

// DISCORD API
async function pegarStatus() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (data.success) {
      const user = data.data.discord_user;

      // FOTO
      avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

      // NOME
      username.innerText = user.username;

      // STATUS
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

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
escrever();
const userId = "SEU_ID_AQUI";

const enterScreen = document.getElementById("enter-screen");
const musica = document.getElementById("musica");
const main = document.getElementById("main-content");

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusEl = document.getElementById("discord-status");

// entrar
enterScreen.addEventListener("click", () => {
  musica.play();
  enterScreen.style.display = "none";

  setTimeout(() => {
    main.classList.add("show");
    pegarStatus();
  }, 150);
});

// texto animado
const text = "Player | Dev | Futuro Pro 🔥";
let i = 0;

function escrever() {
  if (i < text.length) {
    document.getElementById("desc").innerHTML += text[i];
    i++;
    setTimeout(escrever, 40);
  }
}
escrever();

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

// CANVAS
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// partículas + mouse
let particles = [];
let trails = [];

for (let i = 0; i < 100; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 3 + 2
  });
}

// rastro só em PC
if (window.matchMedia("(pointer:fine)").matches) {
  window.addEventListener("mousemove", (e) => {
    trails.push({ x: e.clientX, y: e.clientY, life: 25 });
  });
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // chuva
  ctx.fillStyle = "#00ffcc";
  particles.forEach(p => {
    ctx.fillRect(p.x, p.y, 2, 10);
    p.y += p.speed;
    if (p.y > canvas.height) p.y = 0;
  });

  // rastro neon
  trails.forEach((t,i)=>{
    ctx.fillStyle = `rgba(0,255,204,${t.life/25})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 4, 0, Math.PI*2);
    ctx.fill();
    t.life--;
    if(t.life<=0) trails.splice(i,1);
  });
}

setInterval(draw, 30);
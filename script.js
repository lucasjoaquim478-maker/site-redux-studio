const userId = "SEU_ID_AQUI";

const enter = document.getElementById("enter");
const main = document.getElementById("main");
const musica = document.getElementById("musica");

// entrar
enter.onclick = () => {
  enter.style.display = "none";
  main.classList.remove("hidden");
  musica.play();

  pegarDiscord();
};

// DISCORD
async function pegarDiscord() {
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const data = await res.json();

    if (!data.success) return;

    const user = data.data.discord_user;

    document.getElementById("avatar").src =
      `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

    document.getElementById("name").innerText = user.username;

    if (data.data.listening_to_spotify) {
      document.getElementById("status").innerText =
        "🎵 " + data.data.spotify.song;
    } else if (data.data.activities.length > 0) {
      document.getElementById("status").innerText =
        "🎮 " + data.data.activities[0].name;
    } else {
      document.getElementById("status").innerText = "💤 Offline";
    }

  } catch {
    document.getElementById("status").innerText = "Erro Discord";
  }
}

// PARTICULAS
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resize() {
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
    speed: Math.random() * 3 + 1
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ffcc";

  particles.forEach(p => {
    ctx.fillRect(p.x, p.y, 2, 10);
    p.y += p.speed;

    if (p.y > canvas.height) {
      p.y = 0;
      p.x = Math.random() * canvas.width;
    }
  });
}

setInterval(draw, 30);
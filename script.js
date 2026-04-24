const userId = "SEU_ID_AQUI";

const enter = document.getElementById("enter");
const site = document.getElementById("site");

// CLIQUE PRA ENTRAR
enter.addEventListener("click", () => {
  enter.style.display = "none";
  site.classList.remove("hidden");

  pegarDiscord();
});

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
    document.getElementById("user").innerText = "#" + user.discriminator;

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
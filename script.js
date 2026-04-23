// efeito de digitação igual guns.lol
const text = "Programador iniciante 🚀";
let i = 0;

function escrever() {
  if (i < text.length) {
    document.getElementById("desc").innerHTML += text.charAt(i);
    i++;
    setTimeout(escrever, 50);
  }
}

document.getElementById("desc").innerHTML = "";
escrever();
import { Game, parseLevels } from "./game.js";

const $ = selector => document.querySelector(selector);
const canvas = $("#board");
const ctx = canvas.getContext("2d");
const game = new Game(parseLevels(await fetch("lib/levels").then(response => response.text())));
const colors = {
  Empty: "#10162a", Block: "#344267", Gate: "#ffd65a", Disc: "#5dd8f5",
  Killer: "#ff5277", Freeze: "#78f1df", Player: "#68efcc",
  Spiky: "#a988ff", Fluffy: "#ffd65a", Heart: "#ff6687", Dead: "#ff6687",
};
let unit = 48;

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function tile(x, y, kind) {
  const px = x * unit;
  const py = y * unit;
  const pad = unit * .13;
  ctx.save();
  ctx.translate(px, py);

  if (kind === "Block") {
    ctx.fillStyle = colors.Block;
    roundedRect(2, 2, unit - 4, unit - 4, unit * .12);
    ctx.fill();
    ctx.fillStyle = "#45547d";
    roundedRect(unit * .13, unit * .13, unit * .74, unit * .22, unit * .08);
    ctx.fill();
  } else if (kind === "Gate") {
    ctx.strokeStyle = colors.Gate;
    ctx.lineWidth = unit * .08;
    for (const n of [.28, .5, .72]) {
      ctx.beginPath();
      ctx.moveTo(unit * n, pad);
      ctx.lineTo(unit * n, unit - pad);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(pad, unit * .5);
    ctx.lineTo(unit - pad, unit * .5);
    ctx.stroke();
  } else if (kind === "Disc") {
    ctx.fillStyle = "#16283d";
    ctx.strokeStyle = colors.Disc;
    ctx.lineWidth = unit * .1;
    ctx.beginPath();
    ctx.arc(unit / 2, unit / 2, unit * .3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(unit / 2, unit / 2, unit * .08, 0, Math.PI * 2);
    ctx.fillStyle = colors.Disc;
    ctx.fill();
  } else if (kind === "Killer") {
    ctx.translate(unit / 2, unit / 2);
    ctx.fillStyle = colors.Killer;
    for (let n = 0; n < 4; n++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(unit * .32, -unit * .18, unit * .32, 0);
      ctx.quadraticCurveTo(unit * .23, unit * .08, 0, 0);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, unit * .1, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd8e0";
    ctx.fill();
  } else if (kind === "Freeze") {
    ctx.translate(unit / 2, unit / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#183b4b";
    ctx.strokeStyle = colors.Freeze;
    ctx.lineWidth = unit * .07;
    roundedRect(-unit * .23, -unit * .23, unit * .46, unit * .46, unit * .07);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d9fff8";
    ctx.fillRect(-unit * .035, -unit * .16, unit * .07, unit * .32);
    ctx.fillRect(-unit * .16, -unit * .035, unit * .32, unit * .07);
  }
  ctx.restore();
}

function creature(x, y, kind) {
  const cx = (x + .5) * unit;
  const cy = (y + .5) * unit;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = colors[kind];
  ctx.shadowColor = colors[kind];
  ctx.shadowBlur = unit * .35;

  if (kind === "Spiky") {
    ctx.beginPath();
    for (let n = 0; n < 16; n++) {
      const radius = unit * (n % 2 ? .28 : .43);
      const angle = n * Math.PI / 8 - Math.PI / 2;
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === "Fluffy") {
    for (let n = 0; n < 8; n++) {
      const angle = n * Math.PI / 4;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * unit * .2, Math.sin(angle) * unit * .2, unit * .2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, unit * .25, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "Heart") {
    ctx.beginPath();
    ctx.moveTo(0, unit * .34);
    ctx.bezierCurveTo(-unit * .5, unit * .03, -unit * .34, -unit * .35, 0, -unit * .16);
    ctx.bezierCurveTo(unit * .34, -unit * .35, unit * .5, unit * .03, 0, unit * .34);
    ctx.fill();
    ctx.restore();
    return;
  } else {
    roundedRect(-unit * .32, -unit * .34, unit * .64, unit * .68, unit * .22);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  if (kind === "Dead") {
    ctx.strokeStyle = "#11162a";
    ctx.lineWidth = unit * .045;
    for (const x of [-unit * .11, unit * .11]) {
      ctx.beginPath();
      ctx.moveTo(x - unit * .05, -unit * .1);
      ctx.lineTo(x + unit * .05, 0);
      ctx.moveTo(x + unit * .05, -unit * .1);
      ctx.lineTo(x - unit * .05, 0);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#11162a";
    ctx.beginPath();
    ctx.arc(-unit * .11, -unit * .05, unit * .055, 0, Math.PI * 2);
    ctx.arc(unit * .11, -unit * .05, unit * .055, 0, Math.PI * 2);
    ctx.fill();
  }
  if (kind === "Player") {
    ctx.strokeStyle = "#11162a";
    ctx.lineWidth = unit * .04;
    ctx.beginPath();
    ctx.arc(0, unit * .08, unit * .12, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  const dpr = Math.min(devicePixelRatio, 2);
  const width = canvas.clientWidth;
  const height = width * .75;
  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  unit = width / 20;
  ctx.fillStyle = colors.Empty;
  ctx.fillRect(0, 0, width, height);

  if (!game.cells) return;
  ctx.strokeStyle = "#171e35";
  ctx.lineWidth = 1;
  for (let x = 1; x < 20; x++) {
    ctx.beginPath(); ctx.moveTo(x * unit, 0); ctx.lineTo(x * unit, height); ctx.stroke();
  }
  for (let y = 1; y < 15; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * unit); ctx.lineTo(width, y * unit); ctx.stroke();
  }
  for (let y = 0; y < 15; y++) {
    for (let x = 0; x < 20; x++) tile(x, y, game.cells[y][x]);
  }
  if (game.transition === "heart") {
    creature(game.spiky.x, game.spiky.y, "Heart");
  } else {
    if (game.spiky.x < 20) creature(game.spiky.x, game.spiky.y, "Spiky");
    if (game.fluffy.x < 20) creature(game.fluffy.x, game.fluffy.y, "Fluffy");
  }
  creature(game.player.x, game.player.y, game.transition === "dead" ? "Dead" : "Player");
}

function sync() {
  $("#level").textContent = game.levelNumber ?? "—";
  $("#lives").textContent = game.lives ? "♥ ".repeat(game.lives).trim() : "—";
  $("#level-title").textContent = game.title ?? "Get the monsters together";
  $("#pause").textContent = game.paused ? "▶" : "Ⅱ";
  $("#pause").ariaLabel = game.paused ? "Resume game" : "Pause game";
  $("#message").textContent = game.transition === "heart" ? "Together!" :
    game.transition === "dead" ? "AAAAaaaarrrrgggghhh..." :
    game.gameOver ? "Game over" : game.paused ? "Game paused" :
    game.freeze ? `Monsters frozen · ${Math.ceil(game.freeze / 4) / 10}s` : "";
  $("#pause-screen").classList.toggle("hidden",
    !game.paused || !!game.transition || game.gameOver);
  draw();
}

let transitionTimer;

function scheduleTransition() {
  if (!game.transition || transitionTimer) return;
  transitionTimer = setTimeout(() => {
    transitionTimer = null;
    game.finishTransition();
    if (game.gameOver) $("#welcome").classList.remove("hidden");
    sync();
  }, game.transition === "heart" ? 900 : 1000);
}

function start() {
  clearTimeout(transitionTimer);
  transitionTimer = null;
  game.start();
  $("#welcome").classList.add("hidden");
  canvas.focus();
  sync();
}

function move(dx, dy) {
  game.move(dx, dy);
  sync();
  scheduleTransition();
}

$("#play").addEventListener("click", start);
$("#pause").addEventListener("click", () => {
  if (!game.gameOver && !game.transition) game.paused = !game.paused;
  sync();
});
$("#resume").addEventListener("click", () => $("#pause").click());
$("#restart-level").addEventListener("click", () => $("#lose").click());
$("#lose").addEventListener("click", () => {
  game.loseLife();
  sync();
  scheduleTransition();
});
$("#end").addEventListener("click", () => {
  clearTimeout(transitionTimer);
  transitionTimer = null;
  game.gameOver = true;
  $("#welcome").classList.remove("hidden");
  sync();
});
document.querySelectorAll("[data-move]").forEach(button =>
  button.addEventListener("click", () => move(...button.dataset.move.split(",").map(Number))));

addEventListener("keydown", event => {
  const directions = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  };
  if (directions[event.key]) {
    event.preventDefault();
    move(...directions[event.key]);
  } else if (event.key === "F1") {
    event.preventDefault(); start();
  } else if (event.key === "F2") {
    event.preventDefault(); $("#pause").click();
  } else if (event.key === "F3") {
    event.preventDefault(); $("#lose").click();
  } else if (event.key === "F8") {
    event.preventDefault(); $("#end").click();
  }
});

let touch;
canvas.addEventListener("pointerdown", event => { touch = [event.clientX, event.clientY]; });
canvas.addEventListener("pointerup", event => {
  if (!touch) return;
  const dx = event.clientX - touch[0];
  const dy = event.clientY - touch[1];
  touch = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  move(...(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]));
});

setInterval(() => {
  game.tick();
  sync();
  scheduleTransition();
}, 250);
addEventListener("resize", draw);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimeout(transitionTimer);
    transitionTimer = null;
    if (!game.gameOver) game.paused = true;
  } else {
    scheduleTransition();
  }
  sync();
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
sync();

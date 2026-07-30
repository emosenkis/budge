const ELEMENT = {
  " ": "Empty", "#": "Block", "-": "Invisible", "+": "Gate",
  o: "Disc", x: "Killer", f: "Freeze", P: "Player",
  "*": "Spiky", "@": "Fluffy", "!": "Dead",
};

export function parseLevels(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const levels = [];
  for (let i = 0; i < lines.length && lines[i] !== ""; i += 16) {
    const cells = Array.from({ length: 15 }, () => Array(21).fill("Empty"));
    const parsed = { title: lines[i].match(/^"(.*)"$/)?.[1] ?? lines[i], cells };
    for (let y = 0; y < 15; y++) {
      const row = lines[i + y + 1] ?? "";
      for (let x = 0; x <= 20; x++) {
        const piece = ELEMENT[row[x] ?? " "];
        if (!piece) throw new Error(`Unknown level character ${row[x]} at ${x},${y}`);
        if (piece === "Player") {
          parsed.player = { x, y };
        } else if (piece === "Spiky") {
          parsed.spiky = { x, y };
          cells[y][x] = "Monster";
        } else if (piece === "Fluffy") {
          parsed.fluffy = { x, y, dx: 1, dy: 0 };
          cells[y][x] = "Monster";
        } else {
          cells[y][x] = piece;
        }
      }
    }
    if (!parsed.player || !parsed.spiky || !parsed.fluffy) {
      throw new Error(`Level "${parsed.title}" needs P, * and @`);
    }
    levels.push(parsed);
  }
  return levels;
}

export class Game {
  constructor(levels, lives = 3) {
    if (!levels.length) throw new Error("No levels");
    this.levels = levels;
    this.initialLives = lives;
    this.gameOver = true;
    this.paused = false;
  }

  start() {
    this.lives = this.initialLives;
    this.levelNumber = 1;
    this.levelIndex = 0;
    this.gameOver = false;
    this.paused = false;
    this.#load();
    this.lastEvent = "started";
    return this;
  }

  #load() {
    const level = this.levels[this.levelIndex];
    this.title = level.title;
    this.cells = level.cells.map(row => [...row]);
    this.player = { ...level.player };
    this.spiky = { ...level.spiky };
    this.fluffy = { ...level.fluffy };
    this.freeze = 0;
  }

  at(x, y) {
    return x >= 0 && x < 20 && y >= 0 && y < 15 ? this.cells[y][x] : "";
  }

  move(dx, dy) {
    if (this.paused || this.gameOver) return false;
    const x = this.player.x + dx;
    const y = this.player.y + dy;
    if (x < 0 || x >= 20 || y < 0 || y >= 15) return false;
    const target = this.cells[y][x];
    if (target === "Monster") {
      this.#loseLife();
      return false;
    }
    if (target === "Disc") {
      const discX = x + dx;
      const discY = y + dy;
      if (this.at(discX, discY) !== "Empty") return false;
      this.cells[discY][discX] = "Disc";
      this.cells[y][x] = "Empty";
    } else if (target === "Gate") {
      this.cells[y][x] = "Empty";
    } else if (target === "Freeze") {
      this.cells[y][x] = "Empty";
      this.freeze = 40;
    } else if (target !== "Empty") {
      return false;
    }
    this.player = { x, y };
    this.lastEvent = "moved";
    return true;
  }

  loseLife() {
    if (!this.gameOver) this.#loseLife();
  }

  #loseLife() {
    this.lives--;
    this.freeze = 0;
    if (this.lives) {
      this.#load();
      this.paused = false;
      this.lastEvent = "life-lost";
    } else {
      this.gameOver = true;
      this.lastEvent = "game-over";
    }
  }

  tick() {
    if (this.paused || this.gameOver) return;
    if (this.freeze > 0) {
      this.freeze--;
      return;
    }

    const sx = this.spiky.x + Math.sign(this.player.x - this.spiky.x);
    const sy = this.spiky.y + Math.sign(this.player.y - this.spiky.y);
    if (["Empty", "Monster"].includes(this.cells[sy][sx])) {
      this.cells[this.spiky.y][this.spiky.x] = "Empty";
      this.cells[sy][sx] = "Monster";
      this.spiky = { x: sx, y: sy };
    }

    const fx = this.fluffy.x + this.fluffy.dx;
    const fy = this.fluffy.y + this.fluffy.dy;
    if (["Empty", "Monster"].includes(this.at(fx, fy))) {
      this.cells[this.fluffy.y][this.fluffy.x] = "Empty";
      this.cells[fy][fx] = "Monster";
      this.fluffy = { ...this.fluffy, x: fx, y: fy };
    } else {
      [this.fluffy.dx, this.fluffy.dy] = [this.fluffy.dy, -this.fluffy.dx];
    }

    if (this.cells[this.player.y][this.player.x] === "Monster") {
      this.#loseLife();
    } else if (this.fluffy.x === this.spiky.x && this.fluffy.y === this.spiky.y) {
      this.levelNumber++;
      this.levelIndex = this.levelNumber > this.levels.length ? 0 : this.levelIndex + 1;
      this.#load();
      this.lastEvent = "level-complete";
    } else {
      this.lastEvent = "tick";
    }
  }
}

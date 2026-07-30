import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Game, parseLevels } from "../src/game.js";

const level = (title, pieces = {}) => {
  const rows = Array.from({ length: 15 }, () => Array(21).fill(" "));
  for (const [xy, piece] of Object.entries(pieces)) {
    const [x, y] = xy.split(",").map(Number);
    rows[y][x] = piece;
  }
  return [`"${title}"`, ...rows.map(row => row.join("").trimEnd())].join("\n");
};

test("loads all 20 original levels unchanged", () => {
  const levels = parseLevels(readFileSync("lib/levels", "utf8"));

  assert.equal(levels.length, 20);
  assert.equal(levels[0].title, "Aclimatizer");
  assert.equal(levels.at(-1).title, "Hidden Charms");
});

test("parses the original 20×15 board plus its hidden right-hand column", () => {
  const [parsed] = parseLevels(level("Nasty trick", {
    "0,0": "P", "19,14": "@", "20,7": "*",
  }));

  assert.equal(parsed.title, "Nasty trick");
  assert.deepEqual(parsed.player, { x: 0, y: 0 });
  assert.deepEqual(parsed.fluffy, { x: 19, y: 14, dx: 1, dy: 0 });
  assert.deepEqual(parsed.spiky, { x: 20, y: 7 });
  assert.equal(parsed.cells[7][20], "Monster");
  assert.equal(parsed.cells[0][19], "Empty");
});

test("player opens gates, pushes one disc, and freeze pills stop 40 ticks", () => {
  const game = new Game(parseLevels(level("Movement", {
    "1,1": "P", "2,1": "+", "3,1": "o", "4,1": " ",
    "3,2": "f", "18,14": "@", "19,14": "*",
  }))).start();

  assert.equal(game.move(1, 0), true);
  assert.equal(game.at(2, 1), "Empty");
  assert.equal(game.move(1, 0), true);
  assert.equal(game.at(4, 1), "Disc");
  assert.equal(game.move(0, 1), true);
  assert.equal(game.freeze, 40);
  assert.equal(game.at(3, 2), "Empty");
});

test("player and discs obey the original blocking and screen-edge rules", () => {
  const game = new Game(parseLevels(level("Blocked", {
    "0,0": "P", "1,0": "o", "2,0": "#", "0,1": "x",
    "18,14": "@", "19,14": "*",
  }))).start();

  assert.equal(game.move(-1, 0), false);
  assert.equal(game.move(0, 1), false);
  assert.equal(game.move(1, 0), false);
  assert.deepEqual(game.player, { x: 0, y: 0 });
});

test("Spiky chases diagonally while Fluffy walks and turns anticlockwise", () => {
  const game = new Game(parseLevels(level("Monsters", {
    "2,2": "P", "8,8": "*", "12,12": "@", "13,12": "#",
  }))).start();

  game.tick();
  assert.deepEqual(game.spiky, { x: 7, y: 7 });
  assert.deepEqual(game.fluffy, { x: 12, y: 12, dx: 0, dy: -1 });
  game.tick();
  assert.deepEqual(game.fluffy, { x: 12, y: 11, dx: 0, dy: -1 });
});

test("freeze ticks do nothing, including on the final frozen tick", () => {
  const game = new Game(parseLevels(level("Frozen", {
    "1,1": "P", "5,5": "*", "10,10": "@",
  }))).start();
  game.freeze = 2;

  game.tick();
  game.tick();
  assert.deepEqual(game.spiky, { x: 5, y: 5 });
  assert.equal(game.freeze, 0);
  game.tick();
  assert.deepEqual(game.spiky, { x: 4, y: 4 });
});

test("touching a monster pauses on dead Budge before reloading the level", () => {
  const game = new Game(parseLevels(level("Danger", {
    "1,1": "P", "2,1": "*", "10,10": "@",
  }))).start();

  assert.equal(game.move(1, 0), false);
  assert.equal(game.lives, 2);
  assert.deepEqual(game.player, { x: 1, y: 1 });
  assert.equal(game.lastEvent, "life-lost");
  assert.equal(game.transition, "dead");
  assert.equal(game.paused, true);
  game.finishTransition();
  assert.equal(game.transition, null);
  assert.equal(game.paused, false);
});

test("monster collision pauses on hearts, then advances with the original wrap bug", () => {
  const levels = parseLevels([
    level("One", { "10,5": "P", "5,5": "*", "6,5": "@", "7,5": "#" }),
    level("Two", { "10,5": "P", "5,5": "*", "6,5": "@", "7,5": "#" }),
  ].join("\n"));
  const game = new Game(levels).start();

  game.tick();
  assert.equal(game.transition, "heart");
  assert.equal(game.title, "One");
  game.finishTransition();
  assert.equal(game.title, "Two");
  assert.equal(game.levelNumber, 2);
  game.tick();
  game.finishTransition();
  assert.equal(game.title, "One");
  assert.equal(game.levelNumber, 3);
  game.tick();
  game.finishTransition();
  assert.equal(game.title, "One");
  assert.equal(game.levelNumber, 4);
});

test("pause blocks player and monster movement", () => {
  const game = new Game(parseLevels(level("Pause", {
    "1,1": "P", "5,5": "*", "10,10": "@",
  }))).start();
  game.paused = true;

  assert.equal(game.move(1, 0), false);
  game.tick();
  assert.deepEqual(game.spiky, { x: 5, y: 5 });
});

test("the explicit lose-a-life control still works while paused", () => {
  const game = new Game(parseLevels(level("Manual loss", {
    "1,1": "P", "5,5": "*", "10,10": "@",
  }))).start();
  game.paused = true;

  game.loseLife();
  assert.equal(game.lives, 2);
  assert.equal(game.transition, "dead");
  game.finishTransition();
  assert.equal(game.paused, false);
});

test("the final death remains visible until its transition ends", () => {
  const game = new Game(parseLevels(level("Last life", {
    "1,1": "P", "5,5": "*", "10,10": "@",
  })), 1).start();

  game.loseLife();
  assert.equal(game.transition, "dead");
  assert.equal(game.gameOver, false);
  game.finishTransition();
  assert.equal(game.gameOver, true);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("intro explains the goal and every game symbol", () => {
  const html = readFileSync("index.html", "utf8");

  assert.match(html, /get Spiky and Fluffy onto the same square/i);
  for (const symbol of [
    "budge", "spiky", "fluffy", "wall", "gate",
    "disc", "freeze pill", "killer", "invisible wall",
  ]) {
    assert.match(html, new RegExp(`data-symbol="${symbol}"`, "i"));
  }
});

test("pause screen can resume or trade one life to restart", () => {
  const html = readFileSync("index.html", "utf8");

  assert.match(html, /id="pause-screen"/);
  assert.match(html, /id="resume"/);
  assert.match(html, /id="restart-level"/);
  assert.match(html, /restart current level/i);
  assert.match(html, /costs one life/i);
});

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

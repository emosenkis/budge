import test from "node:test";
import assert from "node:assert/strict";
import { parseLevels } from "../src/game.js";
import { blankLevel, serializeLevel } from "../src/editor.js";

test("editor exports a level accepted by the original-format parser", () => {
  const rows = blankLevel();
  rows[1][1] = "P";
  rows[7][10] = "*";
  rows[13][18] = "@";
  rows[5][5] = "#";

  const text = serializeLevel("My Level", rows);
  const [parsed] = parseLevels(text);
  assert.equal(parsed.title, "My Level");
  assert.deepEqual(parsed.player, { x: 1, y: 1 });
  assert.equal(parsed.cells[5][5], "Block");
  assert.equal(text.split("\n").length, 16);
});

test("editor requires a safe title and exactly one of each character", () => {
  const rows = blankLevel();

  assert.throws(() => serializeLevel("", rows), /title/i);
  assert.throws(() => serializeLevel('Bad "title"', rows), /title/i);
  assert.throws(() => serializeLevel("Missing cast", rows), /one Budge/i);
  rows[0][0] = "P";
  rows[0][1] = "P";
  rows[0][2] = "*";
  rows[0][3] = "@";
  assert.throws(() => serializeLevel("Double Budge", rows), /one Budge/i);
});

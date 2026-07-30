import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("service worker activates immediately and refreshes before using offline cache", () => {
  const worker = readFileSync("service-worker.js", "utf8");

  assert.match(worker, /skipWaiting/);
  assert.match(worker, /clients\.claim/);
  assert.ok(worker.indexOf("fetch(event.request)") < worker.indexOf("caches.match(event.request)"));
});

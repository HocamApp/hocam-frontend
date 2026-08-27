import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/components/lessons/LessonJoinButton.tsx", "utf8");

test("active lesson action is pink with a readable white label", () => {
  assert.match(source, /bg-pink text-white hover:bg-pink-deep/);
});

test("waiting and disabled lesson actions stay readable", () => {
  assert.match(source, /border-line bg-paper text-ink-mid/);
  assert.match(source, /hover:bg-paper hover:text-ink-mid/);
});

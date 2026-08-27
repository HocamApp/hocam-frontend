import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globals = readFileSync("src/app/globals.css", "utf8");

function cssBlock(selector: string): string {
  const start = globals.indexOf(selector);
  assert.notEqual(start, -1, `${selector} must exist`);
  const bodyStart = globals.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < globals.length; index += 1) {
    if (globals[index] === "{") depth += 1;
    if (globals[index] === "}") depth -= 1;
    if (depth === 0) return globals.slice(bodyStart + 1, index);
  }
  throw new Error(`${selector} block is not closed`);
}

test("light semantic colors map to DESIGN.md paper, ink, pink, and surface", () => {
  const root = cssBlock(":root");

  assert.match(root, /--background:\s*0 38% 97%/);
  assert.match(root, /--foreground:\s*186 86% 5%/);
  assert.match(root, /--card:\s*0 0% 100%/);
  assert.match(root, /--primary:\s*341 100% 49%/);
});

test("dark semantic colors use the derived neutral ramp without navy or brown", () => {
  const dark = cssBlock(".dark");

  assert.match(dark, /--background:\s*192 25% 8%/);
  assert.match(dark, /--card:\s*193 21% 12%/);
  assert.match(dark, /--primary:\s*341 100% 49%/);
  assert.match(dark, /--secondary:\s*193 21% 12%/);
  assert.doesNotMatch(dark, /--(?:background|card|primary):\s*22[0-9]/);
  assert.doesNotMatch(dark, /--(?:secondary|muted|accent):\s*350/);
});

test("body renders on the design-system paper canvas", () => {
  assert.match(globals, /body\s*{[\s\S]*?background-color:\s*var\(--paper\)/);
  assert.match(globals, /body\s*{[\s\S]*?color:\s*var\(--ink\)/);
});

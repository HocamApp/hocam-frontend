import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/components/payments/PackagePurchaseCard.tsx", "utf8");

test("package purchase uses DESIGN.md card geometry and tabular figures", () => {
  assert.match(source, /rounded-\[var\(--radius-card\)\]/);
  assert.match(source, /border-\[var\(--line\)\]/);
  assert.match(source, /bg-\[var\(--surface\)\]/);
  assert.match(source, /tabular-nums/);
});

test("expanded package details stay on a neutral surface", () => {
  assert.match(source, /border-t border-\[var\(--line\)\] bg-\[var\(--paper\)\]/);
});

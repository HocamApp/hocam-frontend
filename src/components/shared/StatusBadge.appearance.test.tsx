import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/components/shared/StatusBadge.tsx", "utf8");

test("confirmed lessons use the brand confirmation colors instead of blue", () => {
  assert.match(source, /confirmed: "border-gold bg-gold text-gold-ink/);
  assert.doesNotMatch(source, /confirmed: "[^"]*blue/);
});

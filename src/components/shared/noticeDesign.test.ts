import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/*
 * DESIGN.md §1 and §11: no tinted notice, no coloured stripe, no warning hue
 * ("warnings use ink"), no boxed shadcn Alert for a hint. These three files
 * were rebuilt to follow that; this keeps them from drifting back.
 */
const FILES = [
  "../tutors/TutorDiscountControl.tsx",
  "./AttentionNotice.tsx",
];

const BANNED: Array<[RegExp, string]> = [
  [/\b(amber|yellow|orange)-\d{2,3}\b/, "palette warning hue"],
  [/\bborder-l-\d?/, "left stripe"],
  [/\bborder-l-gold\b|\bbg-gold\b|\btext-gold-ink\b/, "gold as a warning colour"],
  [/<Alert\b/, "boxed Alert"],
  [/lucide-react/, "lucide (Phosphor is the icon set)"],
];

for (const file of FILES) {
  test(`${file.replace(/^.*\//, "")} follows the notice rules`, () => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    for (const [pattern, reason] of BANNED) {
      assert.doesNotMatch(source, pattern, reason);
    }
  });
}

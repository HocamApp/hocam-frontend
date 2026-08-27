import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePage = readFileSync("src/app/(main)/profile/page.tsx", "utf8");
const learningProfile = readFileSync(
  "src/components/profile/StudentLearningProfile.tsx",
  "utf8",
);

test("profile hierarchy uses DESIGN.md typography and semantic cards", () => {
  assert.match(profilePage, /HESAP VE ÖĞRENME/);
  assert.match(profilePage, /text-4xl/);
  assert.match(profilePage, /rounded-card border border-line bg-surface/);
});

test("learning profile avoids legacy tinted surfaces and uses gold deliberately", () => {
  assert.doesNotMatch(learningProfile, /bg-muted\/35|bg-primary\/10/);
  assert.match(learningProfile, /bg-gold text-gold-ink/);
  assert.match(learningProfile, /rounded-input/);
});

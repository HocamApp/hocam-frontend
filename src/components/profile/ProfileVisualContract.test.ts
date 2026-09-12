import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePage = readFileSync("src/app/(main)/profile/page.tsx", "utf8");
const learningProfile = readFileSync(
  "src/components/profile/StudentLearningProfile.tsx",
  "utf8",
);

test("profile hierarchy uses DESIGN.md typography and semantic cards", () => {
  assert.match(profilePage, /text-4xl/);
  assert.match(profilePage, /rounded-card border border-line bg-surface/);
  // The page had an eyebrow above its own title that only restated the
  // subtitle below it. A heading does not need a label announcing it.
  assert.doesNotMatch(profilePage, /HESAP VE ÖĞRENME/);
});

test("the learning summary emphasises with brand pink, not the rank gold", () => {
  assert.doesNotMatch(learningProfile, /bg-muted\/35|bg-primary\/10/);
  assert.match(learningProfile, /rounded-input/);
  // Gold is the achievement surface — the YKS rank wears it on the tutor card
  // and the profile header. A completed-lesson counter in gold read as a rank
  // chip, so the featured tile takes the brand's quiet emphasis instead.
  assert.match(learningProfile, /featured \? "bg-pink-pale" : "bg-paper"/);
});

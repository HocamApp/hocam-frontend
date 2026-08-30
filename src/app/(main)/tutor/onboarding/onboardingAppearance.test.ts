import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  "src/app/(main)/tutor/onboarding/page.tsx",
  "utf8",
);

test("onboarding keeps progress only in the journey card and removes the repeated left intro", () => {
  assert.doesNotMatch(source, /Sıradaki:/);
  assert.doesNotMatch(source, /Hoca hesabını tamamla/);
  assert.doesNotMatch(source, /Her adım kısa ve nettir/);
  assert.doesNotMatch(source, /<CardHeader/);
  assert.doesNotMatch(source, /style=\{\{ width: `\$\{progress\}%` \}\}/);
  assert.match(source, /<CardContent[^>]*>[\s\S]*?<ol className="space-y-3">/);
});

test("onboarding removes the journey slogan and YÖK copy from the right card", () => {
  assert.doesNotMatch(source, /Hocam hoca yolculuğu/);
  assert.doesNotMatch(source, /YÖK Atlas/);
});

test("each onboarding checklist title is rendered once", () => {
  assert.equal(source.match(/\{index \+ 1\}\. \{step\.title\}/g)?.length, 1);
});

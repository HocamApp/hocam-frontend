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

test("onboarding photo uses the shared crop pipeline, never the raw file", () => {
  // The raw-file path was the one failing intermittently (2026-09-15).
  assert.match(source, /useProfilePhotoPicker\(/);
  assert.doesNotMatch(source, /validateProfilePhotoFile/);
  assert.doesNotMatch(source, /type="file"/);
});

test("onboarding photo errors come from the backend code, not one generic line", () => {
  assert.match(source, /getPhotoUploadErrorMessage\(error\)/);
  assert.doesNotMatch(source, /Fotoğraf yüklenemedi\. Lütfen tekrar deneyin\./);
});

test("onboarding initials avatar is solid pink with white text (DESIGN.md)", () => {
  assert.doesNotMatch(source, /bg-primary\/10[^"]*text-primary/);
  assert.match(source, /AvatarFallback className="bg-pink[^"]*text-white/);
});

test("each onboarding checklist title is rendered once", () => {
  assert.equal(source.match(/\{index \+ 1\}\. \{step\.title\}/g)?.length, 1);
});

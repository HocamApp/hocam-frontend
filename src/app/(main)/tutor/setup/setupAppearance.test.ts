import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  "src/app/(main)/tutor/setup/page.tsx",
  "utf8",
);

test("setup CTA stays pink with white text in both themes and neutral when disabled", () => {
  assert.match(
    source,
    /bg-pink text-white hover:bg-pink-deep dark:bg-pink dark:text-white dark:hover:bg-pink-deep/,
  );
  assert.match(source, /disabled:bg-line disabled:text-ink-mid/);
  assert.match(source, /dark:disabled:bg-line dark:disabled:text-ink-mid/);
});

test("setup form starts directly with fields instead of repeating the profile intro", () => {
  assert.doesNotMatch(source, /<CardHeader/);
  assert.doesNotMatch(source, /<CardTitle/);
  assert.doesNotMatch(source, /Öğrenciler seni tanısın/);
  assert.match(source, /<CardContent[^>]*>[\s\S]*?<Form \{\.\.\.form\}>/);
});

test("YÖK Atlas guidance lives below the education fields with a neutral ink icon", () => {
  const noteStart = source.indexOf('data-testid="education-support-note"');
  assert.ok(noteStart > source.indexOf('name="department"'));

  const note = source.slice(noteStart, noteStart + 900);
  assert.match(note, /YÖK Atlas/);
  assert.match(note, /text-ink/);
  assert.doesNotMatch(note, /bg-gold|text-gold/);
});

test("setup preserves the concise journey explanation on the right", () => {
  assert.match(
    source,
    /Temel bilgilerini, verdiğin dersleri ve anlatım tarzını tek seferde ekle\./,
  );
});

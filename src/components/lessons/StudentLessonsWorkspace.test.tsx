import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/components/lessons/StudentLessonsWorkspace.tsx", "utf8");

test("lesson summary is one asymmetric surface instead of three equal cards", () => {
  assert.doesNotMatch(source, /function SummaryCard/);
  assert.match(source, /aria-label="Ders özeti"[\s\S]*?lg:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(0,\.65fr\)\]/);
});

test("next lesson uses a light editorial surface without decorative gold", () => {
  assert.doesNotMatch(source, /bg-gradient-to-br|from-slate|to-slate/);
  assert.match(source, /aria-label="Sıradaki ders"[\s\S]*?bg-\[var\(--surface\)\]/);
  assert.doesNotMatch(source, /bg-ink[^\"]*text-paper/);
  assert.doesNotMatch(source, /bg-gold text-gold-ink/);
});

test("primary lesson planning action has a white label on pink", () => {
  assert.match(source, /<Button asChild size="lg" className="bg-pink text-white hover:bg-pink-deep"/);
});

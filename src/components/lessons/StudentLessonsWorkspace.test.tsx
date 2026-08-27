import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/components/lessons/StudentLessonsWorkspace.tsx", "utf8");

test("lesson summary is one asymmetric surface instead of three equal cards", () => {
  assert.doesNotMatch(source, /function SummaryCard/);
  assert.match(source, /aria-label="Ders özeti"[\s\S]*?lg:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(0,\.65fr\)\]/);
});

test("next lesson uses neutral ink and a gold timing surface", () => {
  assert.doesNotMatch(source, /bg-gradient-to-br|from-slate|to-slate/);
  assert.match(source, /bg-ink[^\"]*text-paper/);
  assert.match(source, /bg-gold text-gold-ink/);
});

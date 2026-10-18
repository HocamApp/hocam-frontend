import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./TutorProfileFormSections.tsx", import.meta.url), "utf8");
const list = source.slice(source.indexOf("Tahmini ders gelirin"), source.indexOf("Bu yalnızca 40 dakikalık"));

test("price, commission and net are three tiles with one shell and one type scale", () => {
  const tiles = list.match(/<div className="rounded-lg [^"]*px-3 py-2[^"]*">/g) ?? [];
  assert.equal(tiles.length, 3);
  assert.equal((list.match(/<dd className="mt-1 text-lg font-semibold/g) ?? []).length, 3);
  assert.equal((list.match(/<dt className="text-/g) ?? []).length, 3);
});

test("only the net tile has the green ground", () => {
  assert.equal((list.match(/bg-emerald-50/g) ?? []).length, 1);
  assert.equal((list.match(/bg-muted\/50/g) ?? []).length, 2);
});

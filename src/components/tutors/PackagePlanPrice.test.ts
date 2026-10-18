import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../../app/(main)/dashboard/tutor/packages/page.tsx", import.meta.url), "utf8");
const row = readFileSync(new URL("../profile/ProfileMenuRow.tsx", import.meta.url), "utf8");

test("each plan shows only its price, big and bold, to the left of the switch", () => {
  assert.match(page, /trailing=\{draft\.is_offered \? \(\s*<span className="text-lg font-bold tabular-nums text-ink">\{formatPrice\(pricing\.total\)\}<\/span>/);
  assert.equal(page.includes("Öğrenci fiyatı"), false);
  const label = row.indexOf("{label}</span>");
  const trailing = row.indexOf("{trailing}");
  const toggle = row.indexOf('role="switch"');
  assert.ok(label > -1 && trailing > label && toggle > trailing, "label, then trailing, then the switch");
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("src/app/(main)/support/page.tsx", "utf8");
const form = readFileSync("src/components/support/SupportTicketForm.tsx", "utf8");
const faq = readFileSync("src/components/support/SupportFAQ.tsx", "utf8");

test("support page uses a direct header and asymmetric desktop layout", () => {
  assert.match(page, /Sorununu anlat, birlikte çözelim/);
  assert.match(page, /lg:grid-cols-\[minmax\(0,7fr\)_minmax\(0,5fr\)\]/);
  assert.match(page, /rounded-\[var\(--radius-card\)\][\s\S]*?border-\[var\(--line\)\][\s\S]*?bg-\[var\(--surface\)\]/);
});

test("support fields follow the shared input geometry", () => {
  assert.match(form, /rounded-\[var\(--radius-input\)\]/);
  assert.match(form, /border-\[var\(--line\)\]/);
  assert.match(form, /bg-\[var\(--surface\)\]/);
});

test("FAQ heading is not preceded by a redundant answer eyebrow", () => {
  assert.doesNotMatch(faq, /Sorularının cevapları/);
  assert.match(faq, /Sıkça Sorulan Sorular/);
});

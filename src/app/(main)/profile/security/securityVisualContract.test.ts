import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/(main)/profile/security/page.tsx", "utf8");
const tutorFlow = readFileSync("src/components/profile/TutorDeletionFlow.tsx", "utf8");

test("security uses gold for pending verification and success for verified state", () => {
  assert.match(source, /bg-\[var\(--gold\)\]/);
  assert.match(source, /text-\[var\(--gold-ink\)\]/);
  assert.match(source, /text-\[var\(--success\)\]/);
});

test("permanent deletion actions use the error token with restrained sizing", () => {
  assert.match(source, /bg-\[var\(--error\)\]/);
  assert.match(tutorFlow, /bg-\[var\(--error\)\]/);
  assert.match(tutorFlow, /rounded-\[var\(--radius-pill\)\]/);
});

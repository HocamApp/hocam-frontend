import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  NO_SHOW_CONSUMED_COPY,
  NO_SHOW_PARTY_LABEL,
  NO_SHOW_RIGHT_PRESERVED_COPY,
} from "./coachingSessionCopy";

const FORBIDDEN_PATTERNS = [/iade edildi/i, /ödendi/i, /para (iadesi|geri)/i];

describe("coaching session copy — money honesty (Faz 5)", () => {
  test("no string claims a refund or payment happened", () => {
    const all = [NO_SHOW_CONSUMED_COPY, NO_SHOW_RIGHT_PRESERVED_COPY, ...Object.values(NO_SHOW_PARTY_LABEL)];
    for (const text of all) {
      for (const pattern of FORBIDDEN_PATTERNS) {
        assert.equal(pattern.test(text), false, `"${text}" matched forbidden pattern ${pattern}`);
      }
    }
  });

  test("tutor no-show copy states the right is preserved, not consumed", () => {
    assert.match(NO_SHOW_RIGHT_PRESERVED_COPY, /korunur/i);
  });

  test("student no-show copy states the session counts as used", () => {
    assert.match(NO_SHOW_CONSUMED_COPY, /kullanılmış sayılır/i);
  });

  test("party labels cover both roles", () => {
    assert.equal(NO_SHOW_PARTY_LABEL.student, "Öğrenci gelmedi");
    assert.equal(NO_SHOW_PARTY_LABEL.tutor, "Öğretmen gelmedi");
  });
});

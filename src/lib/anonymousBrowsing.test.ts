import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  ANONYMOUS_PAGE_LIMIT,
  isGatedPage,
  signupUrlForGatedPage,
} from "./anonymousBrowsing";

describe("anonymous browsing meter", () => {
  it("lets a signed-out visitor through the first two pages", () => {
    assert.equal(ANONYMOUS_PAGE_LIMIT, 2);
    assert.equal(isGatedPage(1, false), false);
    assert.equal(isGatedPage(2, false), false);
  });

  it("asks for an account on the third page turn", () => {
    assert.equal(isGatedPage(3, false), true);
    assert.equal(isGatedPage(9, false), true);
  });

  it("never gates a signed-in reader", () => {
    for (const page of [1, 2, 3, 40]) {
      assert.equal(isGatedPage(page, true), false);
    }
  });

  it("carries the reader's filters back through registration", () => {
    // A visitor gated while filtering by Matematik must land back on that
    // list, not on an unfiltered homepage.
    assert.equal(
      signupUrlForGatedPage("/?subject=matematik&search=ali"),
      "/register?returnUrl=%2F%3Fsubject%3Dmatematik%26search%3Dali",
    );
  });

  it("is wired into the directory's page turn and announced before it bites", () => {
    // The rule is unit-testable, the wiring is not: this pins the two call
    // sites so a refactor cannot quietly drop the gate or the warning that
    // precedes it.
    const directory = readFileSync(
      "src/components/yemeksepeti/YsTutorDirectory.tsx",
      "utf8",
    );

    assert.match(directory, /isGatedPage\(nextPage, isAuthenticated\)/);
    assert.match(directory, /router\.push\(signupUrlForGatedPage\(returnUrl\)\)/);
    assert.match(directory, /currentPage === ANONYMOUS_PAGE_LIMIT/);
    assert.match(directory, /Ücretsiz hesap aç/);
  });
});

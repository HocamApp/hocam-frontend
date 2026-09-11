import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { normalizeReferralCode } from "./referralCode";

test("codes match however they were pasted", () => {
  assert.equal(normalizeReferralCode("  7sw-am tps "), "7SWAMTPS");
  assert.equal(normalizeReferralCode(null), "");
  assert.equal(normalizeReferralCode(undefined), "");
  assert.equal(normalizeReferralCode("a".repeat(40)).length, 12);
});

/* The invite link has carried ?ref= since the code existed, and nothing read
   it: the shared link dropped the referral silently. */
test("the register page reads the invite code out of the shared link", () => {
  const page = readFileSync("src/app/(auth)/register/page.tsx", "utf8");

  assert.match(page, /searchParams\.get\("ref"\)/);
  assert.match(page, /initialReferralCode=/);
});

test("the register form sends the code and surfaces the server's rejection", () => {
  const form = readFileSync("src/components/auth/RegisterForm.tsx", "utf8");

  assert.match(form, /referral_code: normalizeReferralCode/);
  assert.match(form, /body\.referral_code/);
  assert.match(form, /Davet kodu/);
});

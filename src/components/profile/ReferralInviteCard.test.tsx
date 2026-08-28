import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("referral invite is a gold profile surface with a copy action", () => {
  const source = readFileSync("src/components/profile/ReferralInviteCard.tsx", "utf8");

  assert.match(source, /bg-\[var\(--gold\)\]/);
  assert.match(source, /text-\[var\(--gold-ink\)\]/);
  assert.match(source, /data\.referral_code/);
  assert.match(source, /Linki kopyala/);
});

test("payments no longer owns or renders the referral section", () => {
  const source = readFileSync("src/app/(main)/profile/payments/page.tsx", "utf8");

  assert.doesNotMatch(source, /Referans kodu/);
  assert.doesNotMatch(source, /fetchReferralInfo/);
});

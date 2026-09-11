import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  "src/components/tutors/MessageRequestModal.tsx",
  "utf8",
);

/* The portrait used next/image while next.config.js declares no image host, so
   /_next/image answered 400 and every tutor photo rendered as a broken icon.
   The shared Avatar is a plain <img> that also routes through
   resolveProfileImageUrl and degrades to initials. */
test("the message modal portrait uses the shared Avatar, never next/image", () => {
  assert.doesNotMatch(source, /from "next\/image"/);
  assert.match(source, /from "@\/components\/ui\/avatar"/);
  assert.match(source, /<AvatarImage/);
  assert.match(source, /<AvatarFallback/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const serverComponents = [
  "src/components/coaching/CoachingPageShell.tsx",
  "src/components/coaching/CoachingSubnav.tsx",
  "src/components/coaching/CoachingEmptyState.tsx",
];

test("server-rendered coaching components use Phosphor's SSR entry", () => {
  for (const file of serverComponents) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /from "@phosphor-icons\/react\/ssr"/);
    assert.doesNotMatch(source, /from "@phosphor-icons\/react"/);
  }
});

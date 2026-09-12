import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const serverComponents = [
  "src/components/coaching/CoachingPageShell.tsx",
  "src/components/coaching/CoachingSubnav.tsx",
  "src/components/coaching/CoachingEmptyState.tsx",
];

/* Phosphor's default entry is client-only; a server component importing an
   icon from it breaks the render. These files are checked rather than the
   whole tree because they are the coaching surfaces that render on the
   server.

   The SSR entry is required only of files that actually use an icon —
   CoachingPageShell composes other components and imports none, and demanding
   an unused import of it would be a rule about nothing. A type-only import
   from the default entry is erased at build time, so only value imports are
   rejected. */
test("server-rendered coaching components use Phosphor's SSR entry", () => {
  for (const file of serverComponents) {
    const source = readFileSync(file, "utf8");
    const valueImportFromDefaultEntry =
      /import\s+\{[^}]*\}\s+from "@phosphor-icons\/react"/;

    assert.doesNotMatch(source, valueImportFromDefaultEntry, file);

    if (source.includes("@phosphor-icons")) {
      assert.match(source, /from "@phosphor-icons\/react\/ssr"/, file);
    }
  }
});

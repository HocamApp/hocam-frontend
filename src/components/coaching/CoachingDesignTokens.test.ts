import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

/* DESIGN.md rules for every coaching screen, not only the shared shell:
   Phosphor not Lucide, Poppins weights 400/500/700 only, gold is a surface
   with --gold-ink on it, no pale-tint-plus-same-hue pattern, and the shadcn
   grey/primary text tokens replaced by ink/line. */

const ROOTS = [
  "src/components/coaching",
  "src/app/(main)/dashboard/student/coaching",
  "src/app/(main)/dashboard/tutor/coaching",
  "src/app/session/coaching",
  "src/app/(main)/tutors/[id]/checkout/coaching",
];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return name.endsWith(".tsx") && !name.includes(".test.") ? [path] : [];
  });
}

const RULES: [RegExp, string][] = [
  [/from "lucide-react"/, "Lucide icon (use Phosphor)"],
  [/\bfont-semibold\b/, "font weight 600 (use 500 or 700)"],
  [/\bbg-gold text-white\b/, "white text on gold (use text-gold-ink)"],
  [/\btext-muted-foreground\b/, "shadcn grey text (use text-ink-mid)"],
  [/(?<![\w-])text-primary(?![\w/-])/, "pink text (pink is a fill)"],
  [/\bbg-primary\/\d+\b/, "pale primary tint"],
  [/\b(amber|emerald|red|green|blue|sky)-\d{3}\b/, "raw Tailwind palette colour"],
];

describe("coaching design tokens", () => {
  const files = ROOTS.flatMap(sources);

  it("finds the coaching screens", () => {
    assert.ok(files.length > 40, `only ${files.length} files found`);
  });

  for (const [pattern, rule] of RULES) {
    it(`has no ${rule}`, () => {
      const offenders = files.filter((file) => pattern.test(readFileSync(file, "utf8")));
      assert.deepEqual(offenders, [], `${rule}: ${offenders.join(", ")}`);
    });
  }
});

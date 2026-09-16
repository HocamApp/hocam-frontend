import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * DESIGN.md v0.8: text on a pink fill is always white, never dark.
 *
 * "Ders başladı" shipped as dark ink on --pink, and two more spots followed
 * it. The rule only holds if breaking it fails a test rather than waiting for
 * someone to notice on screen.
 *
 * Scope is a solid pink fill. --pink-pale is a surface, not a fill, and dark
 * text on it is a separate rule.
 */
// Whole classes only: "bg-primary/10" is a tint, "text-ink-mid" is a muted
// grey, and "disabled:text-ink" belongs to a disabled (line-grey) state.
const PINK_FILL = /(?:^|\s)bg-(?:pink|primary)(?=\s|$)/;
const DARK_TEXT = /(?:^|\s)(?:text-(?:ink|foreground|black)(?=\s|$)|text-\[var\(--ink)/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

/** Class strings written in one place — a className="…" or cn("…") argument. */
function classStrings(source: string): string[] {
  return Array.from(source.matchAll(/"([^"\n]*\b(?:bg-pink|bg-primary)\b[^"\n]*)"/g)).map(
    (match) => match[1]
  );
}

test("no dark text sits on a pink fill (DESIGN.md v0.8)", () => {
  const offenders: string[] = [];
  for (const file of sourceFiles("src")) {
    for (const classes of classStrings(readFileSync(file, "utf8"))) {
      if (PINK_FILL.test(classes) && DARK_TEXT.test(classes)) {
        offenders.push(`${file}: ${classes}`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `dark text on a pink fill — use text-primary-foreground:\n${offenders.join("\n")}`
  );
});

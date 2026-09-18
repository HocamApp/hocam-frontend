import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function findUnitTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findUnitTests(path);
    return /\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/* Node treats every positional --test argument as a glob pattern, so a real
   path through an App Router dynamic segment — src/app/.../[purchaseId]/... —
   is read as a character class, matches nothing, and the file is skipped in
   silence rather than reported as missing. Each magic character becomes a
   one-character class that matches itself. */
function escapeGlob(path) {
  return path.replace(/[[\]*?{}]/g, (character) => `[${character}]`);
}

const testFiles = findUnitTests("src").sort().map(escapeGlob);
if (testFiles.length === 0) {
  console.error("No unit tests found under src.");
  process.exit(1);
}

console.log(`Running ${testFiles.length} unit test files.`);
const result = spawnSync(
  process.execPath,
  [
    "--experimental-test-module-mocks",
    "--test-force-exit",
    "--import",
    "./scripts/register-test-aliases.mjs",
    "--import",
    "tsx",
    "--test",
    ...testFiles,
  ],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);

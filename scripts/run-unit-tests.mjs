import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

import { incompleteTestFiles } from "./testRunCompleteness.mjs";

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
/* Second reporter requires successful child summaries, closed file processes
   and completion of every declared test, not just an event from each file. */
const seenFile = join(mkdtempSync(join(tmpdir(), "hocam-unit-")), "completion.json");
const result = spawnSync(
  process.execPath,
  [
    "--experimental-test-module-mocks",
    "--test-force-exit",
    "--test-reporter=spec",
    "--test-reporter-destination=stdout",
    "--test-reporter=./scripts/test-files-reporter.mjs",
    `--test-reporter-destination=${seenFile}`,
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
if (result.status !== 0) process.exit(result.status ?? 1);

let report;
try {
  report = JSON.parse(readFileSync(seenFile, "utf8"));
} catch {
  console.error("Could not read the per-file report; treating the run as incomplete.");
  process.exit(1);
}

const missing = incompleteTestFiles(
  findUnitTests("src").sort().map((file) => resolve(file)),
  report,
);
if (missing.length > 0) {
  console.error(
    `\n${missing.length} test file(s) lack successful completion proof. This run is not green:`,
  );
  for (const file of missing) console.error(`  - ${file}`);
  process.exit(1);
}

process.exit(0);

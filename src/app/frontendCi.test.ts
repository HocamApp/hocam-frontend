import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the full unit suite is discovered automatically", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const runner = readFileSync("scripts/run-unit-tests.mjs", "utf8");

  assert.equal(packageJson.scripts["test:unit"], "node scripts/run-unit-tests.mjs");
  assert.equal(packageJson.scripts["pretest:unit"], undefined);
  assert.match(runner, /src/);
  assert.ok(runner.includes(String.raw`/\.test\.tsx?$/`));
});

test("GitHub Actions runs the complete frontend gate on production's Node", () => {
  const workflow = readFileSync(".github/workflows/frontend-ci.yml", "utf8");

  // Vercel builds and serves this app on Node 24.x. CI on another major tests a
  // runtime production never uses — and on Node 20 --test-force-exit truncated
  // the report, so a red run could not name the test that failed.
  assert.match(workflow, /node-version:\s*24/);
  for (const command of [
    "npm ci",
    "npm run test:unit",
    "npm run typecheck",
    "npm run lint",
    "npm run build",
  ]) {
    assert.match(workflow, new RegExp(`run: ${command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
});

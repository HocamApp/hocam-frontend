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

test("GitHub Actions runs the complete Node 20 frontend gate", () => {
  const workflow = readFileSync(".github/workflows/frontend-ci.yml", "utf8");

  assert.match(workflow, /node-version:\s*20/);
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

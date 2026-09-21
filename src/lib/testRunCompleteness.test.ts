import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// A plain ESM helper, shared with the unit-test runner script.
import { missingTestFiles, createTestCompletionTracker, incompleteTestFiles } from "../../scripts/testRunCompleteness.mjs";

describe("missingTestFiles", () => {
  it("passes a run where every discovered file reported", () => {
    assert.deepEqual(missingTestFiles(["a.test.ts", "b.test.ts"], ["b.test.ts", "a.test.ts"]), []);
  });

  it("names the files a forced exit cut short", () => {
    assert.deepEqual(
      missingTestFiles(["a.test.ts", "b.test.ts", "c.test.ts"], ["a.test.ts"]),
      ["b.test.ts", "c.test.ts"]
    );
  });

  it("ignores extra files the reporter saw but nobody asked for", () => {
    assert.deepEqual(missingTestFiles(["a.test.ts"], ["a.test.ts", "d.test.ts"]), []);
  });
});

describe("test completion proof", () => {
  const file = "/fixture.test.mjs";
  const summary = { success: true, counts: { tests: 1, failed: 0, cancelled: 0 } };

  it("rejects enqueue-only and unreadable reports", () => {
    const tracker = createTestCompletionTracker();
    tracker.observe({ type: "test:enqueue", data: { file } });
    assert.deepEqual(incompleteTestFiles([file], tracker.report()), [file]);
    assert.deepEqual(incompleteTestFiles([file], null), [file]);
    assert.deepEqual(incompleteTestFiles([file], {}), [file]);
  });

  it("rejects an unfinished suite even with a successful summary", () => {
    const tracker = createTestCompletionTracker();
    const data = { file, entryFile: file, testId: 1, name: "unfinished" };
    tracker.observe({ type: "test:enqueue", data });
    tracker.observe({ type: "test:summary", data: { ...summary, file, entryFile: file } });
    tracker.observe({ type: "test:complete", data: { file, details: { passed: true } } });
    tracker.observe({ type: "test:summary", data: summary });
    assert.deepEqual(incompleteTestFiles([file], tracker.report()), [file]);
    tracker.observe({ type: "test:complete", data: { ...data, details: { passed: true } } });
    assert.deepEqual(incompleteTestFiles([file], tracker.report()), []);
  });

  for (const scenario of [
    { name: "completed and explicitly skipped tests", code: "test('ok',()=>{}); test.skip('skip',()=>{});", complete: true },
    { name: "late subtest with a retained timer", code: "setInterval(()=>{},1000); test('parent',async t=>{await t.test('first',()=>{}); await new Promise(r=>setTimeout(r,20)); await t.test('last',()=>{});});", complete: true },
    { name: "late failing teardown is not hidden", code: "after(async()=>{await new Promise(r=>setTimeout(r,50)); throw new Error('teardown');}); test('ok',()=>{});", complete: false },
    { name: "early zero-exit after a passing test", code: "test('ok',()=>{}); test('cut short',()=>process.exit(0));", complete: false },
    { name: "crashed child", code: "test('crash',()=>process.exit(2));", complete: false },
    { name: "cancelled pending test", code: "const ac=new AbortController(); test('pending',{signal:ac.signal},()=>new Promise(()=>{})); setTimeout(()=>ac.abort(),20);", complete: false },
  ]) {
    it(`checks real subprocess events: ${scenario.name}`, () => {
      const directory = mkdtempSync(join(tmpdir(), "paytr-runner-proof-"));
      const fixture = join(directory, "fixture.test.mjs");
      try {
        writeFileSync(fixture, "import {test,after} from 'node:test';\n" + scenario.code);
        const env = { ...process.env };
        delete env.NODE_TEST_CONTEXT;
        const result = spawnSync(process.execPath, [
          "--import", resolve("scripts/test-child-cleanup.mjs"),
          `--test-reporter=${resolve("scripts/test-files-reporter.mjs")}`,
          "--test", fixture,
        ], { encoding: "utf8", timeout: 10_000, env });
        assert.ifError(result.error);
        assert.ok(result.stdout, result.stderr);
        const report = JSON.parse(result.stdout);
        assert.equal(incompleteTestFiles([fixture], report).length === 0, scenario.complete, JSON.stringify(report));
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });
  }
});

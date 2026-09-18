/**
 * Which discovered test files never reported a result.
 *
 * The unit runner needs --test-force-exit (without it the run does not end:
 * jsdom timers and open handles keep the loop alive past ten minutes). The
 * cost is a race — the process can be torn down while a file is still running,
 * and node then reports success for a run that skipped tests. One such skip
 * was observed here: hocaBulFlow.test.ts lost its last suite while the run
 * still exited 0.
 *
 * So the runner records which files actually emitted events and compares that
 * with what it asked for. A test that never ran cannot fail, and a run that
 * silently drops tests must not be green.
 */
export function missingTestFiles(expected, seen) {
  const reported = new Set(seen);
  return expected.filter((file) => !reported.has(file));
}

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

export function createTestCompletionTracker() {
  const files = new Map();
  let summary = null;
  const fileState = (file) => {
    if (!files.has(file)) files.set(file, {
      file, summary: null, closed: false, failed: false,
      declared: new Set(), completed: new Set(),
    });
    return files.get(file);
  };
  return {
    observe({ type, data = {} }) {
      if (type === "test:summary" && !data.file) summary = data;
      const file = data.entryFile ?? data.file;
      if (!file) return;
      const state = fileState(file);
      if (type === "test:summary") state.summary = data;
      // entryFile marks events forwarded from the isolated test child.
      // Events without it belong to the parent runner's file wrapper.
      if (data.entryFile) {
        const key = JSON.stringify([data.testId, data.file, data.line, data.column, data.nesting, data.name]);
        if (type === "test:enqueue") state.declared.add(key);
        if (type === "test:complete") {
          state.completed.add(key);
          if (data.details?.passed !== true) state.failed = true;
        }
        if (type === "test:fail") state.failed = true;
      } else if (type === "test:complete") {
        state.closed = data.details?.passed === true;
        if (!state.closed) state.failed = true;
      }
    },
    report() {
      return {
        version: 1, summary,
        files: [...files.values()].map(({ declared, completed, ...state }) => ({
          ...state,
          unfinished: [...declared].filter((key) => !completed.has(key)),
        })),
      };
    },
  };
}

function successfulSummary(summary) {
  return summary?.success === true && summary.counts?.failed === 0 &&
    summary.counts?.cancelled === 0 && Number.isInteger(summary.counts?.tests) &&
    summary.counts.tests >= 0;
}

export function incompleteTestFiles(expected, report) {
  if (report?.version !== 1 || !Array.isArray(report.files) || !successfulSummary(report.summary)) {
    return [...expected];
  }
  return expected.filter((file) => {
    const entry = report.files.find((item) => item.file === file);
    return !entry || entry.closed !== true || entry.failed !== false ||
      !successfulSummary(entry.summary) || !Array.isArray(entry.unfinished) ||
      entry.unfinished.length > 0;
  });
}

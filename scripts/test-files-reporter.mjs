import { createTestCompletionTracker } from "./testRunCompleteness.mjs";

// A started file is not a completed file: require the child summary, its
// process result and every declared test's completion.
export default async function* filesReporter(source) {
  const tracker = createTestCompletionTracker();
  for await (const event of source) tracker.observe(event);
  yield JSON.stringify(tracker.report()) + "\n";
}

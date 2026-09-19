import { createTestCompletionTracker } from "./testRunCompleteness.mjs";

// Require root completion (native summary), successful
// process exit, and completion of every declared test. No one signal suffices.
export default async function* filesReporter(source) {
  const tracker = createTestCompletionTracker();
  for await (const event of source) tracker.observe(event);
  yield JSON.stringify(tracker.report()) + "\n";
}

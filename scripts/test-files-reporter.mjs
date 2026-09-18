/**
 * Records every test file the runner actually produced events for. Paired with
 * missingTestFiles(), this turns a silently skipped file into a failed run.
 */
export default async function* filesReporter(source) {
  const seen = new Set();
  for await (const event of source) {
    const file = event.data?.file;
    if (file) seen.add(file);
  }
  yield `${[...seen].join("\n")}\n`;
}

import assert from "node:assert/strict";
import { test } from "node:test";

import * as adminConsole from "./AdminOperationsConsole";

test("admin booking rows display the legacy timestamp as an Istanbul wall clock", () => {
  const formatter = (
    adminConsole as typeof adminConsole & {
      adminBookingDateTimeLabel?: (value: string) => string;
    }
  ).adminBookingDateTimeLabel;

  assert.equal(typeof formatter, "function");
  const label = formatter!("2026-09-09T18:00:00Z");
  assert.match(label, /9 Eylül/);
  assert.match(label, /18:00/);
  assert.doesNotMatch(label, /21:00/);
});

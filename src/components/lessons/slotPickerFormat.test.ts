import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  dayOfMonth,
  endTimeLabel,
  longDateLabel,
  monthLabel,
  shortWeekdayLabel,
  weekdayLabel,
  weekdayOfIsoDate,
} from "./slotPickerFormat";

test("reads a weekday from the calendar digits, not the viewer's timezone", () => {
  // 11 September 2026 is a Friday. `new Date("2026-09-11").getDay()` resolves
  // the string as UTC midnight, so any viewer west of Greenwich would read
  // Thursday. The whole point of this helper is that it cannot.
  assert.equal(weekdayOfIsoDate("2026-09-11"), 4);
  assert.equal(shortWeekdayLabel("2026-09-11"), "Cum");
  assert.equal(weekdayOfIsoDate("2026-09-14"), 0);
  assert.equal(weekdayOfIsoDate("2026-09-13"), 6);
});

test("handles January and February, where the year rolls back", () => {
  assert.equal(weekdayOfIsoDate("2026-01-01"), 3); // Thursday
  assert.equal(weekdayOfIsoDate("2024-02-29"), 3); // leap day, Thursday
});

test("agrees with the platform date for a year of dates", () => {
  for (let offset = 0; offset < 365; offset += 1) {
    const iso = addDays("2026-01-01", offset);
    const [year, month, day] = iso.split("-").map(Number);
    const native = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    assert.equal(weekdayOfIsoDate(iso), (native + 6) % 7, iso);
  }
});

test("labels dates and months in Turkish", () => {
  assert.equal(monthLabel("2026-09-11"), "Eylül 2026");
  assert.equal(longDateLabel("2026-09-11"), "11 Eylül 2026");
  assert.equal(dayOfMonth("2026-09-11"), 11);
  assert.equal(weekdayLabel(0), "Pazartesi");
  assert.equal(weekdayLabel(6), "Pazar");
});

test("adds a lesson's length to its start time", () => {
  assert.equal(endTimeLabel("13:00", 20), "13:20");
  assert.equal(endTimeLabel("11:30", 40), "12:10");
  assert.equal(endTimeLabel("09:05", 90), "10:35");
});

test("crosses a month and a year boundary when adding days", () => {
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

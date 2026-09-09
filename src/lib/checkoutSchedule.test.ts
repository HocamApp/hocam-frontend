import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeCheckoutSchedule,
  encodeCheckoutSchedule,
  toSchedulePayload,
} from "./checkoutSchedule";

const subjectId = "3f2b1c4d-0000-4000-8000-000000000001";

test("survives a round trip through the URL", () => {
  const schedule = {
    subjectId,
    slots: [
      { day_of_week: 3, start_time: "12:00" },
      { day_of_week: 0, start_time: "11:00" },
    ],
  };
  const encoded = encodeCheckoutSchedule(schedule);
  assert.equal(encoded, `${subjectId}~0:11:00,3:12:00`);
  assert.deepEqual(decodeCheckoutSchedule(encoded), {
    subjectId,
    slots: [
      { day_of_week: 0, start_time: "11:00" },
      { day_of_week: 3, start_time: "12:00" },
    ],
  });
});

test("encoding is order independent, so the same choice is the same link", () => {
  const a = encodeCheckoutSchedule({
    subjectId,
    slots: [
      { day_of_week: 0, start_time: "11:00" },
      { day_of_week: 3, start_time: "12:00" },
    ],
  });
  const b = encodeCheckoutSchedule({
    subjectId,
    slots: [
      { day_of_week: 3, start_time: "12:00" },
      { day_of_week: 0, start_time: "11:00" },
    ],
  });
  assert.equal(a, b);
});

test("a hand-edited or truncated value decodes to nothing at all", () => {
  for (const raw of [
    null,
    "",
    subjectId,
    `${subjectId}~`,
    `~0:11:00`,
    `${subjectId}~7:11:00`, // no eighth weekday
    `${subjectId}~0:24:00`, // no 24th hour
    `${subjectId}~0:11:60`, // no 60th minute
    `${subjectId}~0:11:00,0:11:00`, // the same hour twice
    `${subjectId}~monday-eleven`,
  ]) {
    assert.equal(decodeCheckoutSchedule(raw), null, String(raw));
  }
});

test("slot indexes come from the sorted order, not the click order", () => {
  const payload = toSchedulePayload({
    subjectId,
    slots: [
      { day_of_week: 3, start_time: "12:00" },
      { day_of_week: 0, start_time: "11:00" },
    ],
  });
  assert.deepEqual(payload, {
    subject: subjectId,
    slots: [
      { slot_index: 0, day_of_week: 0, start_time: "11:00" },
      { slot_index: 1, day_of_week: 3, start_time: "12:00" },
    ],
  });
});

/**
 * Regression coverage for the booking wall-clock convention.
 *
 * The bug these pin down: a lesson the student picked as 18:00 Istanbul is
 * stored and served as "2026-09-09T18:00:00Z". Reading that with `new Date(iso)`
 * and formatting in the viewer's timezone rendered 21:00 on
 * /profile/reservations/pending while other screens rendered 18:00.
 *
 * Every assertion here must hold no matter what TZ the test process runs in —
 * see the TZ sweep at the bottom.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookingDateLabel,
  bookingDateTimeLabel,
  bookingInstant,
  bookingShortDateLabel,
  bookingTimeLabel,
  bookingTimeRangeLabel,
} from "./bookingTime";

/** The PayTR review booking: 9 September 2026, 18:00 Istanbul. */
const PAYTR_BOOKING = "2026-09-09T18:00:00Z";

test("the stored wall clock decodes to the instant the student actually picked", () => {
  assert.equal(bookingInstant(PAYTR_BOOKING), Date.parse("2026-09-09T18:00:00+03:00"));
  // ...which is NOT the instant the trailing Z claims.
  assert.notEqual(bookingInstant(PAYTR_BOOKING), Date.parse(PAYTR_BOOKING));
  // The two readings differ by exactly Istanbul's offset.
  assert.equal(Date.parse(PAYTR_BOOKING) - bookingInstant(PAYTR_BOOKING), 3 * 60 * 60 * 1000);
});

test("the reservation renders at 18:00, not 21:00", () => {
  assert.equal(bookingTimeLabel(PAYTR_BOOKING), "18:00");
  assert.notEqual(bookingTimeLabel(PAYTR_BOOKING), "21:00");
});

test("a duration produces the lesson's end on the same wall clock", () => {
  assert.equal(bookingTimeLabel(PAYTR_BOOKING, 20), "18:00 – 18:20");
  assert.equal(bookingTimeLabel(PAYTR_BOOKING, 40), "18:00 – 18:40");
});

test("an explicit end_time renders as a range, and is optional", () => {
  assert.equal(bookingTimeRangeLabel(PAYTR_BOOKING, "2026-09-09T18:20:00Z"), "18:00 – 18:20");
  assert.equal(bookingTimeRangeLabel(PAYTR_BOOKING), "18:00");
  assert.equal(bookingTimeRangeLabel(PAYTR_BOOKING, "nonsense"), "18:00");
});

test("the calendar day is the Istanbul day, not the UTC day", () => {
  assert.equal(bookingDateLabel(PAYTR_BOOKING), "9 Eylül 2026");
  assert.equal(bookingShortDateLabel(PAYTR_BOOKING), "9 Eylül");
  assert.match(bookingDateTimeLabel(PAYTR_BOOKING), /9 Eylül/);
  assert.match(bookingDateTimeLabel(PAYTR_BOOKING), /18:00/);
});

test("a late-evening lesson does not roll onto the next day", () => {
  // 23:30 Istanbul. Read as UTC it would render 02:30 on 10 September.
  const lateLesson = "2026-09-09T23:30:00Z";
  assert.equal(bookingTimeLabel(lateLesson), "23:30");
  assert.equal(bookingDateLabel(lateLesson), "9 Eylül 2026");
});

test("a just-after-midnight lesson stays on its own local day", () => {
  const earlyLesson = "2026-09-09T00:30:00Z";
  assert.equal(bookingTimeLabel(earlyLesson), "00:30");
  assert.equal(bookingDateLabel(earlyLesson), "9 Eylül 2026");
});

test("student and tutor screens derive the same label from the same booking", () => {
  // LessonItemCard (student /profile/reservations/pending) and BookingCard
  // (tutor Rezervasyonlar) both go through these helpers, so equal input must
  // give equal output — that identity is the whole point of the shared module.
  const studentLabel = bookingTimeRangeLabel(PAYTR_BOOKING, "2026-09-09T18:20:00Z");
  const tutorLabel = bookingTimeLabel(PAYTR_BOOKING, 20);
  assert.equal(studentLabel, tutorLabel);
  assert.equal(bookingDateLabel(PAYTR_BOOKING), bookingDateLabel(PAYTR_BOOKING));
});

test("a value that is not a booking timestamp degrades to a readable message", () => {
  assert.ok(Number.isNaN(bookingInstant("")));
  assert.equal(bookingTimeLabel(""), "Saat bilgisi alınamadı");
  assert.equal(bookingDateLabel("not-a-date"), "Tarih bilgisi alınamadı");
});

test("offset-bearing and second-less forms decode to the same wall clock", () => {
  // The API has emitted "…Z", "…+00:00" and second-less variants over time;
  // all of them carry the same Istanbul wall clock.
  assert.equal(bookingTimeLabel("2026-09-09T18:00:00+00:00"), "18:00");
  assert.equal(bookingTimeLabel("2026-09-09T18:00"), "18:00");
  assert.equal(bookingTimeLabel("2026-09-09T18:00:00"), "18:00");
});

test("labels do not depend on the machine's timezone", () => {
  // A developer in UTC, a CI box in America/New_York and a student in Istanbul
  // must all render 18:00. Intl is pinned to Europe/Istanbul and parsing uses a
  // literal offset, so nothing here reads process.env.TZ — but assert it, since
  // reintroducing `new Date(iso).toLocaleTimeString()` anywhere would break it.
  const original = process.env.TZ;
  try {
    for (const tz of ["UTC", "America/New_York", "Asia/Tokyo", "Europe/Istanbul"]) {
      process.env.TZ = tz;
      assert.equal(bookingTimeLabel(PAYTR_BOOKING), "18:00", `wrong time under TZ=${tz}`);
      assert.equal(bookingDateLabel(PAYTR_BOOKING), "9 Eylül 2026", `wrong date under TZ=${tz}`);
      assert.equal(
        bookingInstant(PAYTR_BOOKING),
        Date.parse("2026-09-09T18:00:00+03:00"),
        `wrong instant under TZ=${tz}`
      );
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

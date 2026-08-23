import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HOME_TUTOR_TAB_ALL,
  buildHomeTutorsQueryKey,
  examTabsFromSubjects,
  firstActivePackage,
  firstActiveGoal,
  firstUpcomingBooking,
  homeTutorFilterFor,
  prioritizedTemplates,
  selectHomeTutors,
  selectResumeEntries,
} from "./homeContent";

const NOW = new Date("2026-07-23T12:00:00Z").getTime();

function booking(overrides: Record<string, unknown>) {
  return {
    id: "b1",
    status: "confirmed",
    start_time: "2026-07-23T14:00:00",
    ...overrides,
  } as never;
}

function goal(overrides: Record<string, unknown>) {
  return { id: "g1", status: "active", ...overrides } as never;
}

function purchase(overrides: Record<string, unknown>) {
  return {
    id: "p1",
    status: "paid",
    remaining_credits: 3,
    ...overrides,
  } as never;
}

function template(overrides: Record<string, unknown>) {
  return {
    id: "t1",
    exam_type: "TYT",
    is_featured: false,
    milestone_templates: [],
    ...overrides,
  } as never;
}

describe("firstUpcomingBooking", () => {
  it("returns the earliest confirmed booking in the future", () => {
    const result = firstUpcomingBooking(
      [
        booking({ id: "late", start_time: "2026-07-25T09:00:00" }),
        booking({ id: "soon", start_time: "2026-07-23T18:00:00" }),
      ],
      NOW
    );
    assert.equal((result as { id: string }).id, "soon");
  });

  it("prefers an in_progress lesson even when its start time has passed", () => {
    const result = firstUpcomingBooking(
      [
        booking({ id: "future", start_time: "2026-07-24T09:00:00" }),
        booking({
          id: "running",
          status: "in_progress",
          start_time: "2026-07-23T11:30:00",
        }),
      ],
      NOW
    );
    assert.equal((result as { id: string }).id, "running");
  });

  it("ignores past, pending, cancelled and completed bookings", () => {
    assert.equal(
      firstUpcomingBooking(
        [
          booking({ id: "past", start_time: "2026-07-22T09:00:00" }),
          booking({ id: "pending", status: "pending" }),
          booking({ id: "cancelled", status: "cancelled" }),
          booking({ id: "completed", status: "completed" }),
        ],
        NOW
      ),
      undefined
    );
  });

  it("does not mutate the input array", () => {
    const input = [
      booking({ id: "late", start_time: "2026-07-25T09:00:00" }),
      booking({ id: "soon", start_time: "2026-07-23T18:00:00" }),
    ];
    firstUpcomingBooking(input, NOW);
    assert.equal((input[0] as { id: string }).id, "late");
  });
});

describe("firstActiveGoal", () => {
  it("skips non-active goals", () => {
    const result = firstActiveGoal([
      goal({ id: "done", status: "completed" }),
      goal({ id: "live" }),
    ]);
    assert.equal((result as { id: string }).id, "live");
  });
});

describe("firstActivePackage", () => {
  const notPast = () => false;

  it("requires paid status, remaining credits and a live term", () => {
    assert.equal(
      firstActivePackage([purchase({ status: "pending" })], notPast),
      undefined
    );
    assert.equal(
      firstActivePackage([purchase({ remaining_credits: 0 })], notPast),
      undefined
    );
    assert.equal(firstActivePackage([purchase({})], () => true), undefined);
    assert.ok(firstActivePackage([purchase({})], notPast));
  });
});

describe("selectResumeEntries", () => {
  it("returns nothing when the student has no state, so the section unmounts", () => {
    assert.deepEqual(selectResumeEntries({}), []);
    assert.deepEqual(
      selectResumeEntries({ bookings: [], goals: [], purchases: [] }),
      []
    );
  });

  it("orders lesson before goal before package and caps at the limit", () => {
    const entries = selectResumeEntries({
      bookings: [booking({ start_time: "2026-07-30T09:00:00" })],
      goals: [goal({})],
      purchases: [purchase({})],
      isPastPackage: () => false,
    });
    assert.deepEqual(
      entries.map((entry) => entry.kind),
      ["lesson", "goal"]
    );
  });

  it("falls through to the package when there is no lesson or goal", () => {
    const entries = selectResumeEntries({
      goals: [goal({ status: "completed" })],
      purchases: [purchase({})],
      isPastPackage: () => false,
    });
    assert.deepEqual(
      entries.map((entry) => entry.kind),
      ["package"]
    );
  });

  it("omits packages when no expiry predicate is supplied", () => {
    const entries = selectResumeEntries({ purchases: [purchase({})] });
    assert.deepEqual(entries, []);
  });
});

describe("prioritizedTemplates", () => {
  it("puts the student's target exam first, then featured, then server order", () => {
    const result = prioritizedTemplates(
      [
        template({ id: "a", exam_type: "AYT" }),
        template({ id: "b", exam_type: "AYT", is_featured: true }),
        template({ id: "c", exam_type: "TYT" }),
      ],
      "tyt"
    );
    assert.deepEqual(
      result.map((item) => (item as { id: string }).id),
      ["c", "b", "a"]
    );
  });

  it("respects the limit", () => {
    const result = prioritizedTemplates(
      [template({ id: "a" }), template({ id: "b" }), template({ id: "c" })],
      undefined,
      2
    );
    assert.equal(result.length, 2);
  });
});

describe("selectHomeTutors", () => {
  it("deduplicates by id and caps the row", () => {
    const tutors = [
      { id: "1" },
      { id: "1" },
      { id: "2" },
      { id: "3" },
    ] as never[];
    const result = selectHomeTutors(tutors, 2);
    assert.deepEqual(
      result.map((tutor) => (tutor as { id: string }).id),
      ["1", "2"]
    );
  });

  it("handles undefined input", () => {
    assert.deepEqual(selectHomeTutors(undefined), []);
  });
});

describe("examTabsFromSubjects", () => {
  it("builds tabs only from exam types that really have subjects", () => {
    const tabs = examTabsFromSubjects([
      { id: "1", name: "Matematik", exam_type: "TYT" },
      { id: "2", name: "Fizik", exam_type: "AYT" },
      { id: "3", name: "Geometri", exam_type: "TYT" },
    ] as never[]);
    assert.deepEqual(
      tabs.map((tab) => tab.id),
      [HOME_TUTOR_TAB_ALL, "TYT", "AYT"]
    );
  });

  it("returns no tabs when fewer than two exam types exist", () => {
    assert.deepEqual(
      examTabsFromSubjects([
        { id: "1", name: "Matematik", exam_type: "TYT" },
      ] as never[]),
      []
    );
    assert.deepEqual(examTabsFromSubjects(undefined), []);
  });
});

describe("buildHomeTutorsQueryKey", () => {
  it("includes every result-affecting parameter", () => {
    assert.deepEqual(
      buildHomeTutorsQueryKey({
        ordering: "rating",
        examType: "AYT",
        pageSize: 8,
      }),
      ["home-tutors", { ordering: "rating", examType: "AYT", pageSize: 8 }]
    );
  });

  it("produces different keys for different tabs", () => {
    const all = JSON.stringify(
      buildHomeTutorsQueryKey({
        ordering: "rating",
        examType: HOME_TUTOR_TAB_ALL,
        pageSize: 8,
      })
    );
    const ayt = JSON.stringify(
      buildHomeTutorsQueryKey({
        ordering: "rating",
        examType: "AYT",
        pageSize: 8,
      })
    );
    assert.notEqual(all, ayt);
  });
});

describe("homeTutorFilterFor", () => {
  it("never sends the synthetic 'all' tab to the API", () => {
    assert.equal(homeTutorFilterFor(HOME_TUTOR_TAB_ALL), undefined);
    assert.equal(homeTutorFilterFor("TYT"), "TYT");
  });
});

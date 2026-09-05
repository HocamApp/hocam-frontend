import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTutorMetrics,
  tutorProfileScore,
  weeklyAvailabilityHours,
} from "./tutorPerformance";
import type { AvailabilityRule, TutorPerformance, TutorProfile } from "@/types";
import type { TutorPriceInsight } from "@/lib/tutorsApi";

const NOW = new Date("2026-07-08T12:00:00Z");

function rule(overrides: Partial<AvailabilityRule> = {}): AvailabilityRule {
  return {
    id: Math.random().toString(36),
    tutor: "t1",
    day_of_week: 1,
    specific_date: null,
    is_unavailable: false,
    start_time: "18:00:00",
    end_time: "20:00:00",
    created_at: NOW.toISOString(),
    ...overrides,
  };
}

function profile(overrides: Partial<TutorProfile> = {}): TutorProfile {
  return {
    id: "t1",
    user: "u1",
    name: "Ayşe",
    surname: "Hoca",
    profile_picture: "",
    bio: "",
    university: "ITU",
    department: "Matematik",
    yks_rank: 100,
    hourly_price: 900,
    rating: 0,
    total_reviews: 0,
    is_verified: true,
    is_public: true,
    teaching_styles: [],
    is_online: false,
    subjects: [],
    created_at: NOW.toISOString(),
    ...overrides,
  } as TutorProfile;
}

function performance(overrides: Partial<TutorPerformance> = {}): TutorPerformance {
  return {
    window_days: 90,
    missed_lessons: 0,
    reply_rate_24h: { answered: 0, total: 0, rate: null },
    ...overrides,
  };
}

describe("weeklyAvailabilityHours", () => {
  it("adds up the recurring windows", () => {
    assert.equal(weeklyAvailabilityHours([rule(), rule({ day_of_week: 3 })]), 4);
  });

  it("ignores a closure, which has no bookable duration", () => {
    assert.equal(
      weeklyAvailabilityHours([rule(), rule({ is_unavailable: true })]),
      2
    );
  });

  it("ignores a single-date override, which says nothing about a normal week", () => {
    assert.equal(
      weeklyAvailabilityHours([rule(), rule({ specific_date: "2026-07-09" })]),
      2
    );
  });

  it("is zero, not NaN, with no rules at all", () => {
    assert.equal(weeklyAvailabilityHours([]), 0);
  });
});

describe("tutorProfileScore", () => {
  it("is zero for an empty profile", () => {
    assert.equal(tutorProfileScore(profile(), [], NOW), 0);
  });

  it("reaches 100 when everything a student reads is there", () => {
    const complete = profile({
      profile_picture: "https://example.com/a.jpg",
      bio: "x".repeat(200),
      subjects: [{ id: "s1", name: "Matematik", exam_type: "TYT" }],
      teaching_attributes: ["a", "b", "c"].map((code) => ({
        code,
        name: code.toUpperCase(),
        description: "",
        evidence_status: "self_declared" as const,
      })),
      intro_video_status: "approved",
      availability_confirmed_at: "2026-07-01T00:00:00Z",
    } as Partial<TutorProfile>);
    assert.equal(tutorProfileScore(complete, [rule()], NOW), 100);
  });

  it("does not credit an availability confirmed months ago", () => {
    // A stale calendar produces a booking the tutor then has to cancel, so
    // "confirmed once, in March" is not the same as keeping it current.
    const stale = profile({ availability_confirmed_at: "2026-01-01T00:00:00Z" });
    assert.equal(tutorProfileScore(stale, [rule()], NOW), 15);
  });

  it("does not credit an intro video still awaiting review", () => {
    const pending = profile({ intro_video_status: "pending" });
    assert.equal(tutorProfileScore(pending, [], NOW), 0);
  });
});

describe("buildTutorMetrics", () => {
  const base = {
    profile: profile(),
    availability: [] as AvailabilityRule[],
    performance: performance(),
    priceInsight: null as TutorPriceInsight | null,
    now: NOW,
  };

  function metric(key: string, input = base) {
    const found = buildTutorMetrics(input).find((m) => m.key === key);
    assert.ok(found, `no metric ${key}`);
    return found;
  }

  it("gives six cards", () => {
    assert.equal(buildTutorMetrics(base).length, 6);
  });

  it("treats an unmeasured reply rate as unknown, not as zero", () => {
    // The difference matters: %0 accuses a tutor of never replying.
    const card = metric("replyRate");
    assert.equal(card.status, "unknown");
    assert.equal(card.displayValue, "Henüz veri yok");
  });

  it("meets the reply target at exactly 90 percent", () => {
    const card = metric("replyRate", {
      ...base,
      performance: performance({
        reply_rate_24h: { answered: 9, total: 10, rate: 0.9 },
      }),
    });
    assert.equal(card.status, "met");
    assert.equal(card.displayValue, "%90");
  });

  it("counts a single missed lesson as below target", () => {
    const card = metric("missedLessons", {
      ...base,
      performance: performance({ missed_lessons: 1 }),
    });
    assert.equal(card.status, "below");
    assert.equal(card.displayValue, "1");
  });

  it("says nothing about a rating nobody has given yet", () => {
    const card = metric("rating");
    assert.equal(card.status, "unknown");
    assert.equal(card.displayValue, "Henüz yorum yok");
  });

  it("withholds a price verdict when there are too few comparable tutors", () => {
    const card = metric("price", {
      ...base,
      priceInsight: {
        recommended_price: null,
        market_range: { low: null, high: null },
        sample_size: 1,
        basis: "insufficient_data",
        commission_rate_bps: 1500,
      },
    });
    assert.equal(card.status, "unknown");
    // The nulls behind that verdict must not reach the tutor as text.
    assert.equal(card.targetLabel, "Karşılaştırılacak yeterli hoca yok");
  });

  it("marks a price inside the comparable band as met", () => {
    const card = metric("price", {
      ...base,
      priceInsight: {
        recommended_price: 900,
        market_range: { low: 800, high: 1200 },
        sample_size: 20,
        basis: "same_subjects_similar_rank",
        commission_rate_bps: 1500,
      },
    });
    assert.equal(card.status, "met");
  });

  it("marks the four profile-state cards as live, not period-bound", () => {
    const live = buildTutorMetrics(base)
      .filter((m) => m.isLive)
      .map((m) => m.key);
    assert.deepEqual(live, [
      "weeklyAvailability",
      "rating",
      "profileScore",
      "price",
    ]);
  });

  it("writes hours with a Turkish decimal separator", () => {
    const card = metric("weeklyAvailability", {
      ...base,
      availability: [rule({ start_time: "18:00:00", end_time: "19:30:00" })],
    });
    assert.equal(card.displayValue, "1,5 sa");
  });
});

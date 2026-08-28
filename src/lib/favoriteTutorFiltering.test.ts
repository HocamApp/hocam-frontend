import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TutorProfile } from "@/types";
import {
  filterFavoriteTutors,
  sortFavoriteTutors,
} from "./favoriteTutorFiltering";

function tutor(overrides: Partial<TutorProfile> & { id: string }): TutorProfile {
  return {
    user: "user-1",
    name: "Ada",
    surname: "Yılmaz",
    profile_picture: "",
    intro_video_url: "",
    bio: "",
    university: "Boğaziçi Üniversitesi",
    department: "Fizik",
    yks_rank: 1200,
    hourly_price: 900,
    rating: 4.5,
    total_reviews: 10,
    is_verified: true,
    is_public: true,
    teaching_styles: [],
    is_online: false,
    subjects: [{ id: "s1", name: "Fizik", exam_type: "AYT" }],
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as TutorProfile;
}

const ids = (list: TutorProfile[]) => list.map((item) => item.id);

describe("filtering the favourites list in the browser", () => {
  it("keeps everything when no filter is set", () => {
    const list = [tutor({ id: "a" }), tutor({ id: "b" })];

    assert.deepEqual(ids(filterFavoriteTutors(list, {})), ["a", "b"]);
  });

  it("matches the search across name, school and subject", () => {
    const list = [
      tutor({ id: "a", name: "Mehmet", subjects: [{ id: "s", name: "Kimya", exam_type: "AYT" }] }),
      tutor({ id: "b", name: "Elif", university: "ODTÜ" }),
    ];

    assert.deepEqual(ids(filterFavoriteTutors(list, { search: "kimya" })), ["a"]);
    assert.deepEqual(ids(filterFavoriteTutors(list, { search: "odtü" })), ["b"]);
  });

  // "İSTANBUL".toLowerCase() gives an i with a combining dot, which never
  // equals the "i" a student types.
  it("folds Turkish casing rather than trusting toLowerCase", () => {
    const list = [tutor({ id: "a", university: "İstanbul Teknik Üniversitesi" })];

    assert.deepEqual(ids(filterFavoriteTutors(list, { search: "istanbul" })), ["a"]);
  });

  it("requires every word of a multi-word search", () => {
    const list = [
      tutor({ id: "a", university: "Boğaziçi Üniversitesi", department: "Fizik" }),
      tutor({ id: "b", university: "ODTÜ", department: "Fizik" }),
    ];

    assert.deepEqual(ids(filterFavoriteTutors(list, { search: "boğaziçi fizik" })), ["a"]);
  });

  it("narrows by subject, price and rating", () => {
    const list = [
      tutor({ id: "cheap", hourly_price: 500, rating: 3.9 }),
      tutor({ id: "dear", hourly_price: 1500, rating: 4.9 }),
    ];

    assert.deepEqual(ids(filterFavoriteTutors(list, { max_price: "1000" })), ["cheap"]);
    assert.deepEqual(ids(filterFavoriteTutors(list, { min_rating: "4.5" })), ["dear"]);
    assert.deepEqual(
      ids(filterFavoriteTutors(list, { subject: "Matematik" })),
      [],
    );
  });

  // A rank filter reads as "top N". A tutor with no rank on file is not in the
  // top anything, and a plain `<=` would have put them first.
  it("drops an unranked tutor from a rank filter instead of ranking them zeroth", () => {
    const list = [tutor({ id: "ranked", yks_rank: 800 }), tutor({ id: "none", yks_rank: 0 })];

    assert.deepEqual(ids(filterFavoriteTutors(list, { yks_rank_max: "1000" })), ["ranked"]);
  });

  it("treats the online and verified toggles as filters, not sorts", () => {
    const list = [
      tutor({ id: "on", is_online: true }),
      tutor({ id: "off", is_online: false, is_verified: false }),
    ];

    assert.deepEqual(ids(filterFavoriteTutors(list, { online: "true" })), ["on"]);
    assert.deepEqual(ids(filterFavoriteTutors(list, { is_verified: "true" })), ["on"]);
  });

  it("requires every selected teaching attribute", () => {
    const attribute = (code: string) => ({
      code,
      name: code,
      description: "",
      evidence_status: "self_declared" as const,
    });
    const list = [
      tutor({ id: "both", teaching_attributes: [attribute("x"), attribute("y")] }),
      tutor({ id: "one", teaching_attributes: [attribute("x")] }),
    ];

    assert.deepEqual(ids(filterFavoriteTutors(list, { teaching_attributes: "x,y" })), [
      "both",
    ]);
  });
});

describe("ordering the favourites list", () => {
  const list = [
    tutor({ id: "mid", rating: 4.5, hourly_price: 900, yks_rank: 5000 }),
    tutor({ id: "top", rating: 4.9, hourly_price: 1500, yks_rank: 300 }),
    tutor({ id: "unranked", rating: 4.1, hourly_price: 400, yks_rank: 0 }),
  ];

  it("sorts by rating by default", () => {
    assert.deepEqual(ids(sortFavoriteTutors(list, undefined)), ["top", "mid", "unranked"]);
  });

  it("sorts by price ascending", () => {
    assert.deepEqual(ids(sortFavoriteTutors(list, "price")), ["unranked", "mid", "top"]);
  });

  it("puts an unranked tutor last on a rank sort, not first", () => {
    assert.deepEqual(ids(sortFavoriteTutors(list, "yks_rank")), ["top", "mid", "unranked"]);
  });

  // Relevance is the server's ranking. Inventing a local one would reorder the
  // list for a chip that promises the server's answer.
  it("leaves the saved order alone for relevance", () => {
    assert.deepEqual(ids(sortFavoriteTutors(list, "relevance")), ["mid", "top", "unranked"]);
  });

  it("does not mutate the list it was given", () => {
    const original = [...list];
    sortFavoriteTutors(list, "price");
    assert.deepEqual(ids(list), ids(original));
  });
});

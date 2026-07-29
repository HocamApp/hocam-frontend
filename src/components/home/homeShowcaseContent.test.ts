import assert from "node:assert/strict";
import { test } from "node:test";

import {
  HOME_DISCOVERY_TABS,
  HOME_EXPLORE_CARDS,
  HOME_GOAL_CARDS,
  HOME_HERO_SLIDES,
  HOME_MOCK_TEACHERS,
  HOME_PROMO_STRIP,
  HOME_TOPIC_COLUMNS,
  HOME_TOPIC_FEATURED,
} from "./homeShowcaseContent";

const KNOWN_ROUTE_PREFIXES = [
  "/tutors",
  "/cikmis-sorular",
  "/dashboard/student",
  "/profile",
];

function assertUniqueIds(items: { id: string }[], label: string) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label} ids must be unique`);
}

function assertKnownRoute(href: string, label: string) {
  assert.ok(href.startsWith("/"), `${label} must be an internal route, got ${href}`);
  assert.ok(
    KNOWN_ROUTE_PREFIXES.some((prefix) => href.startsWith(prefix)),
    `${label} points at an unknown route: ${href}`
  );
}

test("hero slides are unique and route somewhere real", () => {
  assert.ok(HOME_HERO_SLIDES.length >= 3, "hero needs at least 3 slides");
  assertUniqueIds(HOME_HERO_SLIDES, "hero slide");
  for (const slide of HOME_HERO_SLIDES) {
    assert.ok(slide.title.length > 0);
    assert.ok(slide.ctaLabel.length > 0);
    assertKnownRoute(slide.ctaHref, `hero slide ${slide.id}`);
  }
});

test("explore cards are unique and route somewhere real", () => {
  assert.ok(HOME_EXPLORE_CARDS.length >= 4, "explore rail needs at least 4 cards");
  assertUniqueIds(HOME_EXPLORE_CARDS, "explore card");
  for (const card of HOME_EXPLORE_CARDS) {
    assertKnownRoute(card.href, `explore card ${card.id}`);
  }
});

test("discovery tabs have unique values and at least one filter each", () => {
  const values = HOME_DISCOVERY_TABS.map((tab) => tab.value);
  assert.equal(new Set(values).size, values.length, "tab values must be unique");
  for (const tab of HOME_DISCOVERY_TABS) {
    assert.ok(
      Boolean(tab.examType) || Boolean(tab.subject),
      `tab ${tab.value} must filter by exam type or subject`
    );
  }
});

test("placeholder teachers can fill a four-card rail", () => {
  assert.ok(
    HOME_MOCK_TEACHERS.length >= 4,
    "need enough placeholder teachers to fill an empty rail"
  );
  assertUniqueIds(HOME_MOCK_TEACHERS, "mock teacher");
  for (const teacher of HOME_MOCK_TEACHERS) {
    assert.ok(teacher.rating > 0 && teacher.rating <= 5);
    assert.ok(teacher.price > 0);
    assert.ok(teacher.subjects.length > 0);
  }
});

test("goal cards are unique and route somewhere real", () => {
  assertUniqueIds(HOME_GOAL_CARDS, "goal card");
  for (const goal of HOME_GOAL_CARDS) {
    assert.ok(goal.chips.length > 0, `goal ${goal.id} needs at least one chip`);
    assertKnownRoute(goal.href, `goal card ${goal.id}`);
  }
});

test("topic columns and closing content route somewhere real", () => {
  assertUniqueIds(HOME_TOPIC_COLUMNS, "topic column");
  for (const column of HOME_TOPIC_COLUMNS) {
    assert.ok(column.links.length > 0);
    for (const link of column.links) {
      assertKnownRoute(link.href, `topic link ${link.label}`);
    }
  }
  assertKnownRoute(HOME_TOPIC_FEATURED.ctaHref, "featured topic");
  assertKnownRoute(HOME_PROMO_STRIP.ctaHref, "promo strip");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStatisticsQuery,
  resolveStatisticsSelection,
  statisticsPeriod,
} from "./tutorStatistics";

test("statistics selection defaults to 90 days and preserves a valid income URL", () => {
  assert.deepEqual(resolveStatisticsSelection(new URLSearchParams(), "2026-09-06"), {
    tab: "overview",
    period: "90",
    from: "2026-06-09",
    to: "2026-09-06",
  });
  assert.deepEqual(
    resolveStatisticsSelection(
      new URLSearchParams("tab=income&period=30&from=2000-01-01&to=2000-01-02"),
      "2026-09-06",
    ),
    { tab: "income", period: "30", from: "2026-08-08", to: "2026-09-06" },
  );
});

test("statistics selection preserves the reviews tab and its period", () => {
  assert.deepEqual(
    resolveStatisticsSelection(
      new URLSearchParams("tab=reviews&period=30"),
      "2026-09-06",
    ),
    { tab: "reviews", period: "30", from: "2026-08-08", to: "2026-09-06" },
  );
  assert.equal(
    buildStatisticsQuery({
      tab: "reviews",
      period: "90",
      from: "2026-06-09",
      to: "2026-09-06",
    }),
    "tab=reviews&period=90",
  );
});

test("custom dates allow 365 inclusive days and reject future, inverted and longer ranges", () => {
  assert.deepEqual(
    resolveStatisticsSelection(
      new URLSearchParams("period=custom&from=2025-09-07&to=2026-09-06"),
      "2026-09-06",
    ),
    { tab: "overview", period: "custom", from: "2025-09-07", to: "2026-09-06" },
  );
  for (const query of [
    "period=custom&from=2025-09-06&to=2026-09-06",
    "period=custom&from=2026-09-07&to=2026-09-06",
    "period=custom&from=2026-09-01&to=2026-09-07",
  ]) {
    assert.equal(resolveStatisticsSelection(new URLSearchParams(query), "2026-09-06").period, "90");
  }
});

test("period math is calendar based and query omits stale custom dates for presets", () => {
  assert.deepEqual(statisticsPeriod("30", "2026-03-01"), { from: "2026-01-31", to: "2026-03-01" });
  assert.equal(
    buildStatisticsQuery({ tab: "income", period: "365", from: "2025-03-02", to: "2026-03-01" }),
    "tab=income&period=365",
  );
});

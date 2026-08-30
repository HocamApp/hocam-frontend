import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMemoryStorage } from "@/lib/safeStorage";
import {
  HOME_ENTRY_PROMO_KEY,
  HOME_ENTRY_PROMO_TTL_DAYS,
  markEntryPromoSeen,
  shouldShowEntryPromo,
} from "@/lib/homeEntryPromo";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 24);

describe("homeEntryPromo", () => {
  // The key is versioned so a redraw can retire the old dismissals. A visitor
  // who closed the previous dialog decided about a different one.
  it("reads a versioned key", () => {
    assert.match(HOME_ENTRY_PROMO_KEY, /:v\d+$/);
  });

  it("ignores a dismissal stored under an older version", () => {
    const storage = createMemoryStorage();
    storage.setItem("hocam:home-entry-promo:v1", JSON.stringify({ dismissedAt: NOW }));
    assert.equal(shouldShowEntryPromo(storage, NOW), true);
  });

  it("shows on a first visit", () => {
    assert.equal(shouldShowEntryPromo(createMemoryStorage(), NOW), true);
  });

  it("stays hidden right after a dismissal", () => {
    const storage = createMemoryStorage();
    markEntryPromoSeen(storage, NOW);
    assert.equal(shouldShowEntryPromo(storage, NOW), false);
    assert.equal(shouldShowEntryPromo(storage, NOW + 29 * DAY_MS), false);
  });

  it("comes back once the window has passed", () => {
    const storage = createMemoryStorage();
    markEntryPromoSeen(storage, NOW);
    assert.equal(shouldShowEntryPromo(storage, NOW + HOME_ENTRY_PROMO_TTL_DAYS * DAY_MS), true);
  });

  it("shows when the stored value is unusable", () => {
    for (const value of ['"nope"', "null", "{}", '{"dismissedAt":"dün"}', "not json at all"]) {
      const storage = createMemoryStorage();
      storage.setItem(HOME_ENTRY_PROMO_KEY, value);
      assert.equal(shouldShowEntryPromo(storage, NOW), true, `should show for ${value}`);
    }
  });

  it("treats a future timestamp as a fresh dismissal", () => {
    // A clock correction must not turn into a promo on every page load.
    const storage = createMemoryStorage();
    markEntryPromoSeen(storage, NOW + 5 * DAY_MS);
    assert.equal(shouldShowEntryPromo(storage, NOW), false);
  });

  it("survives storage being unavailable", () => {
    assert.equal(shouldShowEntryPromo(null, NOW), true);
    assert.doesNotThrow(() => markEntryPromoSeen(null, NOW));
  });
});

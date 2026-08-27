import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTH_TOKEN_MAX_AGE_DAYS,
  BROWSER_STORAGE_INVENTORY,
} from "./browserStorageInventory";

describe("browser storage inventory", () => {
  it("keeps every public inventory entry uniquely addressable and complete", () => {
    const names = BROWSER_STORAGE_INVENTORY.map((entry) => entry.name);

    assert.equal(new Set(names).size, names.length);
    for (const entry of BROWSER_STORAGE_INVENTORY) {
      assert.ok(entry.name.trim());
      assert.ok(entry.kind.trim());
      assert.ok(entry.purpose.trim());
      assert.ok(entry.provider.trim());
      assert.ok(entry.duration.trim());
      assert.ok(entry.category.trim());
    }
  });

  it("matches the authentication and discovery cookie lifetimes", () => {
    const auth = BROWSER_STORAGE_INVENTORY.find(
      (entry) => entry.name === "auth_token"
    );
    const discovery = BROWSER_STORAGE_INVENTORY.find(
      (entry) => entry.name === "hocam_discovery_consent"
    );

    assert.equal(auth?.duration, `${AUTH_TOKEN_MAX_AGE_DAYS} gün`);
    assert.equal(AUTH_TOKEN_MAX_AGE_DAYS, 7);
    assert.equal(discovery?.duration, "12 ay");
    assert.equal(discovery?.category, "Analitik — onaya bağlı");
    assert.equal(discovery?.required, false);
  });

  it("covers cookies, local storage, session storage, and embedded providers", () => {
    const kinds = new Set(BROWSER_STORAGE_INVENTORY.map((entry) => entry.kind));

    assert.deepEqual(kinds, new Set([
      "Çerez",
      "Yerel depolama",
      "Oturum depolaması",
      "Üçüncü taraf hizmet",
    ]));
  });
});

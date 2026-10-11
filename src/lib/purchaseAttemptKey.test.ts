import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clearPurchaseAttemptKey,
  purchaseAttemptKey,
  purchaseAttemptScope,
} from "./purchaseAttemptKey";
import type { StorageLike } from "./safeStorage";

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("the key of a purchase attempt", () => {
  it("is the same key for the same choice, so a retry is the same purchase", () => {
    const storage = memory();
    const scope = purchaseAttemptScope({ tutorId: "t1", planId: "p1", schedule: "s~0:10:00" });
    let made = 0;
    const make = () => `key-${++made}`;

    const first = purchaseAttemptKey(storage, scope, make);
    const again = purchaseAttemptKey(storage, scope, make);

    assert.equal(first, "key-1");
    assert.equal(again, "key-1");
    assert.equal(made, 1);
  });

  it("is a different key for a different choice", () => {
    const storage = memory();
    let made = 0;
    const make = () => `key-${++made}`;

    const a = purchaseAttemptKey(storage, purchaseAttemptScope({ tutorId: "t1", planId: "p1", schedule: "a" }), make);
    const b = purchaseAttemptKey(storage, purchaseAttemptScope({ tutorId: "t1", planId: "p2", schedule: "a" }), make);
    const c = purchaseAttemptKey(storage, purchaseAttemptScope({ tutorId: "t1", planId: "p1", schedule: "b" }), make);

    assert.deepEqual([a, b, c], ["key-1", "key-2", "key-3"]);
  });

  it("is forgotten when the server has answered, so buying again is a new purchase", () => {
    const storage = memory();
    const scope = "t1:p1:s";
    let made = 0;
    const make = () => `key-${++made}`;

    const first = purchaseAttemptKey(storage, scope, make);
    clearPurchaseAttemptKey(storage, scope);
    const second = purchaseAttemptKey(storage, scope, make);

    assert.equal(first, "key-1");
    assert.equal(second, "key-2");
  });

  it("still gives a key when storage cannot be used", () => {
    const broken: StorageLike = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("denied");
      },
      removeItem() {
        throw new Error("denied");
      },
    };

    assert.equal(purchaseAttemptKey(broken, "scope", () => "fresh"), "fresh");
    assert.equal(purchaseAttemptKey(null, "scope", () => "fresh"), "fresh");
    assert.doesNotThrow(() => clearPurchaseAttemptKey(broken, "scope"));
    assert.doesNotThrow(() => clearPurchaseAttemptKey(null, "scope"));
  });

  it("makes keys the server accepts: 1-128 letters, digits and . _ : -", () => {
    const key = purchaseAttemptKey(memory(), "scope");
    assert.match(key, /^[A-Za-z0-9._:-]{1,128}$/);
  });
});

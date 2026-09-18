import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMemoryStorage, type StorageLike } from "@/lib/safeStorage";

import {
  attachMerchantOid,
  beginPayTRRecovery,
  clearPayTRRecovery,
  payTRRecoveryKey,
  readPayTRRecovery,
} from "./paytrRecovery";

const STUDENT = "student-1";
const ATTEMPT = {
  purchaseId: "purchase-1",
  tutorId: "tutor-1",
  startedAt: 1_758_000_000_000,
};

describe("payTRRecoveryKey", () => {
  it("scopes the record to one account so a second login cannot read it", () => {
    assert.notEqual(payTRRecoveryKey("student-1"), payTRRecoveryKey("student-2"));
    assert.match(payTRRecoveryKey("student-1"), /student-1/);
  });
});

describe("beginPayTRRecovery", () => {
  it("opens the record before the token request, with no merchant OID yet", () => {
    const storage = createMemoryStorage();

    beginPayTRRecovery(storage, STUDENT, ATTEMPT);

    assert.deepEqual(readPayTRRecovery(storage, STUDENT), {
      schemaVersion: 1,
      purchaseId: "purchase-1",
      merchantOid: null,
      tutorId: "tutor-1",
      startedAt: 1_758_000_000_000,
    });
  });

  it("persists those four fields and nothing else", () => {
    const storage = createMemoryStorage();

    beginPayTRRecovery(storage, STUDENT, {
      ...ATTEMPT,
      // A caller that hands over customer data must not get it stored.
      ...({
        user_name: "Ada Yılmaz",
        user_phone: "+905551112233",
        iframeUrl: "https://www.paytr.com/odeme/guvenli/tok",
      } as object),
    });

    const raw = storage.snapshot()[payTRRecoveryKey(STUDENT)];
    assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), [
      "merchantOid",
      "purchaseId",
      "schemaVersion",
      "startedAt",
      "tutorId",
    ]);
    assert.doesNotMatch(raw, /Ada|905551112233|paytr\.com/);
  });

  it("survives a storage that refuses to write", () => {
    const blocked: StorageLike = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    assert.doesNotThrow(() => beginPayTRRecovery(blocked, STUDENT, ATTEMPT));
    assert.equal(readPayTRRecovery(blocked, STUDENT), null);
    assert.equal(readPayTRRecovery(null, STUDENT), null);
  });
});

describe("attachMerchantOid", () => {
  it("fills the OID in once the token response names it", () => {
    const storage = createMemoryStorage();
    beginPayTRRecovery(storage, STUDENT, ATTEMPT);

    attachMerchantOid(storage, STUDENT, "purchase-1", "HOCAM-OID-1");

    assert.equal(readPayTRRecovery(storage, STUDENT)?.merchantOid, "HOCAM-OID-1");
  });

  it("refuses to relabel a record that belongs to another purchase", () => {
    const storage = createMemoryStorage();
    beginPayTRRecovery(storage, STUDENT, ATTEMPT);

    attachMerchantOid(storage, STUDENT, "purchase-2", "HOCAM-OID-2");

    assert.equal(readPayTRRecovery(storage, STUDENT)?.merchantOid, null);
  });
});

describe("readPayTRRecovery", () => {
  it("does not hand one student's attempt to the next account in the tab", () => {
    const storage = createMemoryStorage();
    beginPayTRRecovery(storage, STUDENT, ATTEMPT);

    assert.equal(readPayTRRecovery(storage, "student-2"), null);
    assert.equal(readPayTRRecovery(storage, undefined), null);
  });

  it("drops a corrupt or foreign-shaped record instead of trusting it", () => {
    const corrupt = createMemoryStorage({
      [payTRRecoveryKey(STUDENT)]: "{not json",
    });
    const wrongShape = createMemoryStorage({
      [payTRRecoveryKey(STUDENT)]: JSON.stringify({
        schemaVersion: 99,
        purchaseId: "purchase-1",
      }),
    });

    assert.equal(readPayTRRecovery(corrupt, STUDENT), null);
    assert.equal(readPayTRRecovery(wrongShape, STUDENT), null);
    assert.equal(wrongShape.snapshot()[payTRRecoveryKey(STUDENT)], undefined);
  });

  it("returns an old record unchanged — age is not evidence of failure", () => {
    const storage = createMemoryStorage();
    beginPayTRRecovery(storage, STUDENT, { ...ATTEMPT, startedAt: 1 });

    assert.equal(readPayTRRecovery(storage, STUDENT)?.purchaseId, "purchase-1");
  });
});

describe("clearPayTRRecovery", () => {
  it("rejects invalid recovery timestamps", () => {
    const storage = createMemoryStorage();
    for (const startedAt of [-1, null, "123", 1e400]) {
      storage.setItem(payTRRecoveryKey(STUDENT), JSON.stringify({ schemaVersion: 1, ...ATTEMPT, merchantOid: null, startedAt }));
      assert.equal(readPayTRRecovery(storage, STUDENT), null);
    }
  });
  it("cannot clear a different purchase's recovery", () => {
    const storage = createMemoryStorage();
    beginPayTRRecovery(storage, STUDENT, ATTEMPT);
    clearPayTRRecovery(storage, STUDENT, "different-purchase");
    assert.ok(readPayTRRecovery(storage, STUDENT));
    clearPayTRRecovery(storage, STUDENT, ATTEMPT.purchaseId);
    assert.equal(readPayTRRecovery(storage, STUDENT), null);
  });
  it("removes the record once a final result is known", () => {
    const storage = createMemoryStorage();
    beginPayTRRecovery(storage, STUDENT, ATTEMPT);

    clearPayTRRecovery(storage, STUDENT);

    assert.equal(readPayTRRecovery(storage, STUDENT), null);
  });
});

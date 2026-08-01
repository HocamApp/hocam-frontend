import assert from "node:assert/strict";
import test from "node:test";

import { PACKAGE_HISTORY_EMPTY_DESCRIPTION } from "./paymentHistoryCopy";

test("package history empty state does not promise a retired fixed lesson count", () => {
  assert.equal(
    PACKAGE_HISTORY_EMPTY_DESCRIPTION,
    "Satın aldığın ders paketleri burada görünecek."
  );
  assert.doesNotMatch(PACKAGE_HISTORY_EMPTY_DESCRIPTION, /10 ders/i);
});

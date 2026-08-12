import assert from "node:assert/strict";
import test from "node:test";
import { filterEducationOptions } from "./SearchableEducationSelect";

test("education search is case-insensitive with Turkish characters", () => {
  const options = ["İstanbul Üniversitesi", "Atatürk Üniversitesi", "İzmir Ekonomi Üniversitesi"];

  assert.deepEqual(filterEducationOptions(options, "istanbul"), ["İstanbul Üniversitesi"]);
  assert.deepEqual(filterEducationOptions(options, "ATATÜRK"), ["Atatürk Üniversitesi"]);
  assert.deepEqual(filterEducationOptions(options, "izmir"), ["İzmir Ekonomi Üniversitesi"]);
});

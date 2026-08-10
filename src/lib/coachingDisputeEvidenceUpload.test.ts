import assert from "node:assert/strict";
import { mock, test } from "node:test";

// Mocks the shared axios instance before importing coachingApi, so this file
// must not statically import coachingApi (that would bind the real client).
//
// Regression for: the shared axios instance defaults to
// `Content-Type: application/json`. A FormData upload that inherits that
// header stops the browser from generating the multipart boundary, so
// Django receives no file. See uploadCoachingDisputeEvidence.

type PostCall = { url: string; body: unknown; config: unknown };

test("uploadCoachingDisputeEvidence clears the JSON content-type so the browser can set the multipart boundary", async () => {
  const calls: PostCall[] = [];
  mock.module("./api", {
    defaultExport: {
      post: async (url: string, body: unknown, config: unknown) => {
        calls.push({ url, body, config });
        return { data: { id: "evidence-1" } };
      },
    },
  });

  const { uploadCoachingDisputeEvidence } = await import("./coachingApi");
  const file = new File(["contents"], "evidence.pdf", { type: "application/pdf" });
  await uploadCoachingDisputeEvidence("dispute-1", file);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/coaching/disputes/dispute-1/evidence/");
  assert.ok(calls[0].body instanceof FormData);
  assert.equal((calls[0].body as FormData).get("file"), file);
  assert.deepEqual(calls[0].config, { headers: { "Content-Type": undefined } });
  mock.reset();
});

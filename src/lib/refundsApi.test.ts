import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

import type { RefundPreview } from "@/types";

type Call = { method: string; url: string; body?: unknown };
const calls: Call[] = [];
let getResponse: () => unknown = () => ({ data: [] });
let postResponse: () => unknown = () => ({ data: {} });

let api: typeof import("./refundsApi");

before(async () => {
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        calls.push({ method: "get", url });
        return getResponse();
      },
      post: async (url: string, body: unknown) => {
        calls.push({ method: "post", url, body });
        return postResponse();
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  api = await import("./refundsApi");
});

beforeEach(() => {
  calls.length = 0;
  getResponse = () => ({ data: [] });
  postResponse = () => ({ data: {} });
});

const failure = (status: number, data: unknown) => ({ response: { status, data } });

describe("refund calls", () => {
  it("asks for a preview with the package and the reason, nothing else", async () => {
    postResponse = () => ({ data: { purchase_id: "p1", eligible: true } });
    await api.previewRefund({ purchase: "p1", reason: "voluntary" });
    assert.deepEqual(calls, [
      {
        method: "post",
        url: "/payments/refund-preview/",
        body: { purchase: "p1", reason: "voluntary" },
      },
    ]);
  });

  it("confirms with the token the preview carried and the student's note", async () => {
    postResponse = () => ({ data: { id: "r1" } });
    const refund = await api.requestRefund({
      purchase: "p1",
      reason: "tutor_issue",
      preview_token: "signed",
      note: "Ders yapılmadı.",
    });
    assert.equal(refund.id, "r1");
    assert.deepEqual(calls[0].body, {
      purchase: "p1",
      reason: "tutor_issue",
      preview_token: "signed",
      note: "Ders yapılmadı.",
    });
  });

  it("reads the list whether or not the server paginates it", async () => {
    getResponse = () => ({ data: [{ id: "r1" }] });
    assert.deepEqual((await api.fetchRefundRequests()).map((r) => r.id), ["r1"]);
    getResponse = () => ({ data: { results: [{ id: "r2" }] } });
    assert.deepEqual((await api.fetchRefundRequests()).map((r) => r.id), ["r2"]);
    getResponse = () => ({ data: null });
    assert.deepEqual(await api.fetchRefundRequests(), []);
  });

  it("reads one request from its own address", async () => {
    getResponse = () => ({ data: { id: "r9" } });
    assert.equal((await api.fetchRefundRequest("r9")).id, "r9");
    assert.equal(calls[0].url, "/payments/refund-requests/r9/");
  });
});

describe("refund errors", () => {
  it("hands back the new preview when the numbers moved", () => {
    const preview = { purchase_id: "p1", eligible: true } as RefundPreview;
    const error = api.describeRefundError(
      failure(409, { code: "refund_preview_changed", detail: "x", preview })
    );
    assert.equal(error.kind, "changed");
    assert.equal(error.preview, preview);
  });

  it("does not trust a preview that is not an object", () => {
    const error = api.describeRefundError(
      failure(409, { code: "refund_preview_changed", preview: "nope" })
    );
    assert.equal(error.kind, "changed");
    assert.equal(error.preview, null);
  });

  it("tells an open request from a package that cannot be refunded", () => {
    assert.equal(api.describeRefundError(failure(409, { code: "refund_in_progress" })).kind, "in_progress");
    for (const code of ["already_refunded", "not_paid", "reason_not_applicable", "nothing_to_refund"]) {
      const error = api.describeRefundError(failure(409, { code }));
      assert.equal(error.kind, "blocked", code);
      assert.equal(error.code, code);
    }
  });

  it("separates a missing token, a bad reason, a missing package and a throttle", () => {
    assert.equal(api.describeRefundError(failure(400, { code: "preview_token_required" })).kind, "token");
    assert.equal(api.describeRefundError(failure(400, { code: "invalid_reason" })).kind, "invalid");
    assert.equal(api.describeRefundError(failure(404, { code: "not_found" })).kind, "unavailable");
    assert.equal(api.describeRefundError(failure(404, undefined)).kind, "unavailable");
    assert.equal(api.describeRefundError(failure(429, { detail: "Throttled" })).kind, "throttled");
  });

  it("calls a lost answer unknown, and never invents a cause", () => {
    assert.equal(api.describeRefundError(new Error("Network Error")).kind, "unknown");
    assert.equal(api.describeRefundError(failure(500, "<html>")).kind, "unknown");
    assert.equal(api.describeRefundError(failure(400, { code: "something_new" })).kind, "unknown");
    assert.equal(api.describeRefundError(undefined).kind, "unknown");
  });
});

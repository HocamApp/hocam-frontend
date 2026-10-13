import assert from "node:assert/strict";
import { before, beforeEach, describe, it, mock } from "node:test";

type Call = { url: string; body: unknown };
const calls: Call[] = [];
let postResponse: () => unknown = () => ({ data: {} });

let api: typeof import("./placeLessonsApi");

before(async () => {
  mock.module("@/lib/api", {
    defaultExport: {
      post: async (url: string, body: unknown) => {
        calls.push({ url, body });
        return postResponse();
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  api = await import("./placeLessonsApi");
});

beforeEach(() => {
  calls.length = 0;
  postResponse = () => ({ data: {} });
});

const failure = (status: number, data: unknown) => ({ response: { status, data } });
const BODY = { subject: "7", slots: [{ day_of_week: 1, start_time: "10:00" }] };

describe("placing the credits of a package", () => {
  it("posts the subject and the weekly hours to the package, and returns the answer", async () => {
    postResponse = () => ({
      data: { placed: 4, lessons: [], remaining_credits: 0, skipped_after_term: 0, not_stored: 0 },
    });

    const result = await api.placeLessons("purchase-1", BODY);

    assert.deepEqual(calls, [
      { url: "/payments/package-purchases/purchase-1/place-lessons/", body: BODY },
    ]);
    assert.equal(result.placed, 4);
  });

  it("turns a refusal with a code into a failure that carries the code, the text and the day", async () => {
    postResponse = () =>
      Promise.reject(
        failure(409, {
          code: "schedule_unavailable",
          detail: "Seçtiğin saatlerden biri 2026-11-02 tarihinde müsait değil.",
          unavailable_date: "2026-11-02",
        })
      );

    await assert.rejects(api.placeLessons("purchase-1", BODY), (err: unknown) => {
      assert.ok(err instanceof api.PlaceLessonsFailure);
      assert.equal(err.code, "schedule_unavailable");
      assert.equal(err.date, "2026-11-02");
      assert.equal(err.status, 409);
      return true;
    });
  });

  it("reads the day of a held hour too", async () => {
    postResponse = () =>
      Promise.reject(failure(409, { code: "schedule_taken", detail: "x", taken_date: "2026-11-09" }));

    await assert.rejects(api.placeLessons("purchase-1", BODY), (err: unknown) => {
      assert.ok(err instanceof api.PlaceLessonsFailure);
      assert.equal(err.date, "2026-11-09");
      return true;
    });
  });

  it("lets a failure without a code (a network error) through unchanged", async () => {
    const boom = new Error("Network Error");
    postResponse = () => Promise.reject(boom);

    await assert.rejects(api.placeLessons("purchase-1", BODY), (err: unknown) => err === boom);
  });
});

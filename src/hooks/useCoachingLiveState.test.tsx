import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";

import type { CoachingLiveState } from "@/lib/coachingApi";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const START = Date.parse("2026-10-21T16:00:00Z");
const iso = (minutes: number, seconds = 0) => new Date(START + minutes * 60_000 + seconds * 1000).toISOString();

function live(overrides: Partial<CoachingLiveState> = {}): CoachingLiveState {
  return {
    server_time: iso(7),
    status: "in_progress",
    scheduled_start: iso(0),
    session_end: iso(30),
    viewer_role: "student",
    early_end_enabled: true,
    early_end_retry_available_at: null,
    early_end: null,
    ...overrides,
  };
}

function pending(version = 1, byMe = true) {
  return {
    id: `r-${version}`,
    status: "pending" as const,
    version,
    requested_by_role: "tutor" as const,
    requested_by_me: byMe,
    created_at: iso(6, 20),
    expires_at: iso(9, 20),
    responded_at: null,
    retry_available_at: null,
  };
}

function httpError(status: number, data: Record<string, unknown>) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data } });
}

let getAnswer: () => Promise<{ data: unknown }>;
let postAnswer: (url: string, body: unknown) => Promise<{ data: unknown }>;
let getCalls: string[] = [];
let postCalls: { url: string; body: unknown }[] = [];
let useCoachingLiveState: typeof import("./useCoachingLiveState").useCoachingLiveState;

before(async () => {
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        getCalls.push(url);
        return getAnswer();
      },
      post: async (url: string, body: unknown) => {
        postCalls.push({ url, body });
        return postAnswer(url, body);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ useCoachingLiveState } = await import("./useCoachingLiveState"));
});

beforeEach(() => {
  getCalls = [];
  postCalls = [];
  getAnswer = async () => ({ data: live() });
  postAnswer = async () => ({ data: live() });
});
afterEach(cleanup);

let latest: ReturnType<typeof useCoachingLiveState>;

function Probe({ enabled = true }: { enabled?: boolean }) {
  latest = useCoachingLiveState({ sessionId: "s1", enabled });
  return <output data-testid="state">{latest.live ? `${latest.live.status}|${latest.live.early_end?.version ?? "-"}` : "none"}</output>;
}

function renderProbe(enabled = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <Probe enabled={enabled} />
    </QueryClientProvider>,
  );
  return { client, ...view };
}

const shown = () => screen.getByTestId("state").textContent;

describe("useCoachingLiveState", () => {
  it("asks nothing until the room is open", async () => {
    renderProbe(false);

    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.deepEqual(getCalls, []);
    assert.equal(latest.live, undefined);
    assert.equal(latest.disabled, false);
  });

  it("reads the session's live state from the light endpoint", async () => {
    getAnswer = async () => ({ data: live({ early_end: pending(2, false) }) });
    renderProbe();

    await waitFor(() => assert.equal(shown(), "in_progress|2"));
    assert.deepEqual(getCalls, ["/coaching/sessions/s1/live-state/"]);
    assert.equal(latest.disabled, false);
  });

  it("is disabled, and quiet, when the server answers 403 early_end_disabled", async () => {
    getAnswer = async () => {
      throw httpError(403, { code: "early_end_disabled", detail: "Ending a meeting together is not available." });
    };
    renderProbe();

    await waitFor(() => assert.equal(latest.disabled, true));
    assert.equal(latest.live, undefined);
    assert.equal(latest.actionError, null, "a switched-off feature is not an error to show");
    assert.equal(getCalls.length, 1);
  });

  it("is disabled when the route is not there at all", async () => {
    getAnswer = async () => {
      throw httpError(404, {});
    };
    renderProbe();

    await waitFor(() => assert.equal(latest.disabled, true));
  });

  it("is not disabled by a flaky connection", async () => {
    getAnswer = async () => {
      throw new Error("Network Error");
    };
    renderProbe();

    await waitFor(() => assert.equal(getCalls.length, 1));
    assert.equal(latest.disabled, false);
  });

  it("asks to end together, and the answer replaces the state without another read", async () => {
    postAnswer = async () => ({ data: live({ early_end: pending(1, true) }) });
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|-"));

    await act(async () => {
      latest.ask();
    });

    await waitFor(() => assert.equal(shown(), "in_progress|1"));
    assert.deepEqual(postCalls, [{ url: "/coaching/sessions/s1/early-end/", body: {} }]);
    assert.equal(getCalls.length, 1, "the answer already is the state");
  });

  it("answers with the decision and the version it was shown", async () => {
    getAnswer = async () => ({ data: live({ early_end: pending(3, false) }) });
    postAnswer = async () => ({
      data: live({ status: "awaiting_report", early_end: { ...pending(3, false), status: "accepted" as const } }),
    });
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|3"));

    await act(async () => {
      latest.answer("accept", 3);
    });

    await waitFor(() => assert.equal(shown(), "awaiting_report|3"));
    assert.deepEqual(postCalls, [
      { url: "/coaching/sessions/s1/early-end/respond/", body: { decision: "accept", version: 3 } },
    ]);
  });

  it("can answer 'continue'", async () => {
    getAnswer = async () => ({ data: live({ early_end: pending(1, false) }) });
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|1"));

    await act(async () => {
      latest.answer("continue", 1);
    });

    assert.deepEqual(postCalls[0], {
      url: "/coaching/sessions/s1/early-end/respond/",
      body: { decision: "continue", version: 1 },
    });
  });

  it("takes a request back", async () => {
    getAnswer = async () => ({ data: live({ early_end: pending(5, true) }) });
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|5"));

    await act(async () => {
      latest.withdraw(5);
    });

    assert.deepEqual(postCalls, [{ url: "/coaching/sessions/s1/early-end/cancel/", body: { version: 5 } }]);
  });

  it("takes the state out of a 409 and says what happened in Turkish", async () => {
    getAnswer = async () => ({ data: live() });
    postAnswer = async () => {
      throw httpError(409, {
        ...live({ early_end: pending(2, false) }),
        code: "early_end_pending",
        detail: "The other side has already asked to end this meeting.",
      });
    };
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|-"));

    await act(async () => {
      latest.ask();
    });

    await waitFor(() => assert.equal(shown(), "in_progress|2"));
    assert.equal(latest.actionError, "Karşı taraf görüşmeyi bitirmek istiyor. İsteğini yanıtlayabilirsin.");
    assert.equal(
      (latest.live as unknown as Record<string, unknown>).code,
      undefined,
      "the error's own fields do not leak into the state",
    );
  });

  it("shows the Turkish line for each refusal, never the server's English", async () => {
    const cases: [number, string, string][] = [
      [409, "early_end_cooldown", "Yeni bir istek göndermek için biraz beklemelisin."],
      [409, "early_end_stale", "İstek değişmiş. Güncel durum yüklendi."],
      [409, "early_end_expired", "İsteğin süresi doldu."],
      [409, "session_not_in_progress", "Görüşme şu anda sürmüyor."],
      [403, "early_end_own_request", "Kendi isteğini yanıtlayamazsın."],
      [403, "early_end_not_requester", "Bu isteği yalnız gönderen geri çekebilir."],
    ];
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|-"));

    for (const [status, code, line] of cases) {
      postAnswer = async () => {
        throw httpError(status, { ...live(), code, detail: "English developer text." });
      };
      await act(async () => {
        latest.ask();
      });
      await waitFor(() => assert.equal(latest.actionError, line));
    }
  });

  it("forgets an old error when the next action starts", async () => {
    postAnswer = async () => {
      throw httpError(409, { ...live(), code: "early_end_expired", detail: "x" });
    };
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|-"));
    await act(async () => {
      latest.ask();
    });
    await waitFor(() => assert.equal(latest.actionError, "İsteğin süresi doldu."));

    postAnswer = async () => ({ data: live({ early_end: pending(1, true) }) });
    await act(async () => {
      latest.ask();
    });

    await waitFor(() => assert.equal(latest.actionError, null));
  });

  it("marks what the rest of the app knows of the meeting as old once the meeting has moved on, whoever moved it", async () => {
    // The other side's yes ended it: this side only sees it in the poll.
    getAnswer = async () => ({ data: live({ early_end: pending(1, true) }) });
    const { client } = renderProbe();
    client.setQueryData(["coaching-session-detail", "s1"], { id: "s1", status: "in_progress" });
    client.setQueryData(["coaching-sessions"], []);
    client.setQueryData(["coaching-tutor-sessions"], []);
    await waitFor(() => assert.equal(shown(), "in_progress|1"));
    assert.equal(client.getQueryState(["coaching-session-detail", "s1"])?.isInvalidated, false, "while it runs, nothing is old");

    getAnswer = async () => ({
      data: live({ status: "awaiting_report", early_end: { ...pending(1, true), status: "accepted" as const } }),
    });
    await act(async () => {
      await client.refetchQueries({ queryKey: ["coaching-session-live-state", "s1"] });
    });

    await waitFor(() => assert.equal(shown(), "awaiting_report|1"));
    await waitFor(() => assert.equal(client.getQueryState(["coaching-session-detail", "s1"])?.isInvalidated, true));
    assert.equal(client.getQueryState(["coaching-sessions"])?.isInvalidated, true);
    assert.equal(client.getQueryState(["coaching-tutor-sessions"])?.isInvalidated, true);
  });

  it("reports an action in flight", async () => {
    let release: () => void = () => {};
    postAnswer = () =>
      new Promise((resolve) => {
        release = () => resolve({ data: live({ early_end: pending(1, true) }) });
      });
    renderProbe();
    await waitFor(() => assert.equal(shown(), "in_progress|-"));
    assert.equal(latest.isActing, false);

    await act(async () => {
      latest.ask();
    });
    await waitFor(() => assert.equal(latest.isActing, true));

    await act(async () => {
      release();
    });
    await waitFor(() => assert.equal(latest.isActing, false));
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

function timeRequest(slotIndex: number, extra: Record<string, unknown> = {}) {
  return {
    id: `tr-${slotIndex}`,
    slot_index: slotIndex,
    status: "pending",
    note: "",
    requested_at: "2026-10-20T10:00:00Z",
    expires_at: "2026-10-22T10:00:00Z",
    resolved_at: null,
    proposals: [],
    ...extra,
  };
}

const proposal = {
  id: "p-1",
  day_of_week: 3,
  start_time: "21:00:00",
  status: "pending",
  proposed_at: "2026-10-20T11:00:00Z",
  responded_at: null,
};

let requests: unknown[] = [];
let listFails = false;
let postFails = false;
const posted: { url: string; body: unknown }[] = [];
const toasts: string[] = [];

let ScheduleTimeRequests: React.ComponentType<{
  requiredCount: number;
  lockedIndexes: number[];
  selectedIndexes: number[];
}>;

before(async () => {
  mock.module("sonner", {
    namedExports: { toast: { success: (message: string) => toasts.push(message), error() {} } },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url !== "/coaching/scheduling/time-request/") throw new Error(`unexpected GET ${url}`);
        if (listFails) throw Object.assign(new Error("boom"), { response: { status: 500 } });
        return { data: requests };
      },
      post: async (url: string, body: unknown) => {
        posted.push({ url, body });
        if (postFails) throw Object.assign(new Error("boom"), { response: { status: 400, data: { detail: "Bu talep artık geçerli değil." } } });
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ ScheduleTimeRequests } = await import("./ScheduleTimeRequests"));
});

beforeEach(() => {
  requests = [];
  listFails = false;
  postFails = false;
  posted.length = 0;
  toasts.length = 0;
});
afterEach(cleanup);

function renderCard(props: Partial<React.ComponentProps<typeof ScheduleTimeRequests>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ScheduleTimeRequests requiredCount={2} lockedIndexes={[]} selectedIndexes={[]} {...props} />
    </QueryClientProvider>,
  );
}

const rowOf = async (label: string) => {
  const list = await screen.findByRole("list", { name: "Saat talepleri" });
  return within(list).getAllByRole("listitem").find((item) => within(item).queryByText(label, { exact: false }))!;
};

describe("ScheduleTimeRequests: the card", () => {
  it("is one short card with a row per slot, and promises nothing about money", async () => {
    renderCard();

    assert.ok(await screen.findByRole("heading", { name: "Uygun saat bulamadın mı?" }));
    assert.ok(screen.getByText(/48 saat içinde yanıt verir/));
    assert.ok(screen.getByText(/ders paketin etkilenmez/));
    const rows = within(screen.getByRole("list", { name: "Saat talepleri" })).getAllByRole("listitem");
    assert.deepEqual(rows.map((row) => within(row).getByText(/\. saat$/).textContent), ["1. saat", "2. saat"]);
    assert.equal(screen.queryByText(/iade|ödeme|Şikâyet/i), null);
  });

  it("is not there when every slot is chosen or fixed and nothing is open", async () => {
    renderCard({ selectedIndexes: [0], lockedIndexes: [1] });

    await waitFor(() => assert.equal(screen.queryByRole("heading", { name: "Uygun saat bulamadın mı?" }), null));
  });

  it("says the requests could not be read instead of offering to ask again, and retries", async () => {
    listFails = true;
    renderCard();

    assert.ok(await screen.findByText("Saat talepleri yüklenemedi."));
    assert.equal(screen.queryByRole("button", { name: /saat iste/ }), null);

    listFails = false;
    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));
    assert.ok(await screen.findByRole("button", { name: "1. saat için saat iste" }));
  });
});

describe("ScheduleTimeRequests: asking", () => {
  it("opens a note for that slot in a solid gold button and sends the request with it", async () => {
    renderCard();

    const ask = await screen.findByRole("button", { name: "2. saat için saat iste" });
    assert.match(ask.className, /bg-gold/);
    assert.doesNotMatch(ask.className, /border-ink|bg-transparent/);
    fireEvent.click(ask);
    fireEvent.change(screen.getByLabelText("Hocana not (isteğe bağlı)"), { target: { value: "Hafta içi akşamları uygunum" } });
    fireEvent.click(screen.getByRole("button", { name: "Talebi gönder" }));

    await waitFor(() =>
      assert.deepEqual(posted, [
        { url: "/coaching/scheduling/time-request/", body: { slot_index: 1, note: "Hafta içi akşamları uygunum" } },
      ]),
    );
  });

  it("shows the server's reason when a request is refused, and keeps the note", async () => {
    postFails = true;
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: "1. saat için saat iste" }));
    fireEvent.change(screen.getByLabelText("Hocana not (isteğe bağlı)"), { target: { value: "Akşam" } });
    fireEvent.click(screen.getByRole("button", { name: "Talebi gönder" }));

    assert.ok(await screen.findByText("Bu talep artık geçerli değil."));
    assert.equal((screen.getByLabelText("Hocana not (isteğe bağlı)") as HTMLTextAreaElement).value, "Akşam");
  });
});

describe("ScheduleTimeRequests: waiting and answering", () => {
  it("says a request is waiting, until when, and withdraws it from a plain text button", async () => {
    requests = [timeRequest(0)];
    renderCard();

    const row = await rowOf("1. saat");
    assert.ok(within(row).getByText("Öneri bekleniyor"));
    assert.ok(within(row).getByText("Son yanıt: 22 Ekim Perşembe 13:00"));
    const withdraw = within(row).getByRole("button", { name: "Talebi geri çek" });
    assert.doesNotMatch(withdraw.className, /border-ink|bg-gold|bg-pink/);
    fireEvent.click(withdraw);

    await waitFor(() =>
      assert.deepEqual(posted, [{ url: "/coaching/scheduling/time-request/withdraw/", body: { time_request_id: "tr-0" } }]),
    );
  });

  it("shows the tutor's proposal and accepts it with the pink button", async () => {
    requests = [timeRequest(1, { proposals: [proposal] })];
    renderCard();

    const row = await rowOf("2. saat");
    assert.ok(within(row).getByText("Hocan Perşembe 21:00 önerdi"));
    const accept = within(row).getByRole("button", { name: "Kabul et" });
    assert.match(accept.className, /bg-pink/);
    fireEvent.click(accept);

    await waitFor(() =>
      assert.deepEqual(posted, [{ url: "/coaching/scheduling/time-request/accept/", body: { proposal_id: "p-1" } }]),
    );
    await waitFor(() => assert.equal(toasts.length, 1));
  });

  it("declines a proposal from the plain black-outlined button", async () => {
    requests = [timeRequest(1, { proposals: [proposal] })];
    renderCard();

    const row = await rowOf("2. saat");
    const decline = within(row).getByRole("button", { name: "Reddet" });
    assert.match(decline.className, /border-ink/);
    fireEvent.click(decline);

    await waitFor(() =>
      assert.deepEqual(posted, [{ url: "/coaching/scheduling/time-request/decline/", body: { proposal_id: "p-1" } }]),
    );
  });

  it("does not offer to withdraw while the tutor's proposal waits for an answer", async () => {
    requests = [timeRequest(1, { proposals: [proposal] })];
    renderCard();

    const row = await rowOf("2. saat");
    assert.equal(within(row).queryByRole("button", { name: "Talebi geri çek" }), null);
  });
});

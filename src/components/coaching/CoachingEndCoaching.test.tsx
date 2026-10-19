import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const posts: { url: string; body: unknown }[] = [];
let failNext = false;
let CoachingEndCoaching: typeof import("./CoachingEndCoaching").CoachingEndCoaching;

before(async () => {
  mock.module("@/lib/api", {
    defaultExport: {
      post: async (url: string, body: unknown) => {
        posts.push({ url, body });
        if (failNext) throw new Error("conflict");
        return { data: { service_status: "cancelled", refund_liability_minor: 0 } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ CoachingEndCoaching } = await import("./CoachingEndCoaching"));
});

beforeEach(() => {
  posts.length = 0;
  failNext = false;
});
afterEach(cleanup);

function renderControl(props: Partial<React.ComponentProps<typeof CoachingEndCoaching>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidated: unknown[] = [];
  const original = client.invalidateQueries.bind(client);
  client.invalidateQueries = ((filters: { queryKey?: unknown }) => {
    invalidated.push(filters?.queryKey);
    return original(filters as never);
  }) as typeof client.invalidateQueries;
  const view = render(
    <QueryClientProvider client={client}>
      <CoachingEndCoaching purchaseId="pu-1" studentName="Zeynep K." variant="link" {...props} />
    </QueryClientProvider>
  );
  return { ...view, invalidated };
}

async function openAndType(reason: string) {
  fireEvent.click(screen.getByRole("button", { name: "Koçluğu sonlandır" }));
  const dialog = await screen.findByRole("dialog", { name: "Zeynep K. ile koçluğu sonlandır" });
  if (reason) fireEvent.change(screen.getByLabelText("Sonlandırma gerekçesi"), { target: { value: reason } });
  return dialog;
}

describe("CoachingEndCoaching", () => {
  it("is a quiet underlined link in a list, never a solid button asking to be pressed", () => {
    renderControl();

    const trigger = screen.getByRole("button", { name: "Koçluğu sonlandır" });
    assert.match(trigger.className, /underline/);
    assert.doesNotMatch(trigger.className, /bg-error|bg-pink|bg-gold/);
    assert.match(trigger.className, /min-h-11/);
  });

  it("is a solid destructive button on its own page", () => {
    renderControl({ variant: "button" });

    const trigger = screen.getByRole("button", { name: "Koçluğu sonlandır" });
    assert.match(trigger.className, /bg-error/);
    assert.match(trigger.className, /text-white/);
  });

  it("opens a confirmation that says what happens, and sends nothing yet", async () => {
    renderControl();
    const dialog = await openAndType("");

    assert.ok(dialog.textContent?.includes("geri alınamaz"));
    assert.ok(dialog.textContent?.includes("Zeynep K."));
    assert.equal(posts.length, 0);
  });

  it("needs a reason, and a blank one does not count", async () => {
    renderControl();
    await openAndType("   ");

    const confirm = within(screen.getByRole("dialog")).getByRole("button", { name: "Koçluğu sonlandır" }) as HTMLButtonElement;
    assert.equal(confirm.disabled, true);

    fireEvent.change(screen.getByLabelText("Sonlandırma gerekçesi"), { target: { value: "Müsaitliğim değişti" } });
    assert.equal(confirm.disabled, false);
  });

  it("sends the trimmed reason for this student's purchase, then closes and refreshes", async () => {
    const ended = mock.fn();
    const { invalidated } = renderControl({ onEnded: ended });
    await openAndType("  Müsaitliğim değişti  ");
    const confirm = within(screen.getByRole("dialog")).getByRole("button", { name: "Koçluğu sonlandır" }) as HTMLButtonElement;

    fireEvent.click(confirm);

    await waitFor(() => assert.equal(posts.length, 1));
    assert.deepEqual(posts[0], {
      url: "/coaching/tutor/purchases/pu-1/terminate/",
      body: { reason: "Müsaitliğim değişti" },
    });
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
    assert.equal(ended.mock.callCount(), 1);
    assert.deepEqual(invalidated, [
      ["coaching-tutor-students"],
      ["coaching-tutor-sessions"],
      ["coaching-disputes", "tutor"],
    ]);
  });

  it("keeps the dialog open and says so when the state has moved on", async () => {
    failNext = true;
    const ended = mock.fn();
    renderControl({ onEnded: ended });
    await openAndType("Müsaitliğim değişti");
    const confirm = within(screen.getByRole("dialog")).getByRole("button", { name: "Koçluğu sonlandır" }) as HTMLButtonElement;

    fireEvent.click(confirm);

    assert.ok(await screen.findByText(/güncel koçluk durumuyla çakıştı/));
    assert.ok(screen.getByRole("dialog"));
    assert.equal(ended.mock.callCount(), 0);
  });

  it("closes without sending anything on Vazgeç", async () => {
    renderControl();
    await openAndType("Müsaitliğim değişti");

    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));

    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));
    assert.equal(posts.length, 0);
  });

  it("forgets a typed reason once it is dismissed", async () => {
    renderControl();
    await openAndType("Müsaitliğim değişti");
    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    await waitFor(() => assert.equal(screen.queryByRole("dialog"), null));

    await openAndType("");

    assert.equal((screen.getByLabelText("Sonlandırma gerekçesi") as HTMLTextAreaElement).value, "");
  });
});

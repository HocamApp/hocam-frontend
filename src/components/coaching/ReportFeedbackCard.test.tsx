import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const posted: { url: string; body: unknown }[] = [];
const toasts: string[] = [];

let ReportFeedbackCard: React.ComponentType<{
  reportId: string;
  currentChoice?: "goals_understood" | "want_to_change_goal" | "want_to_leave_note" | null;
  messagesHref?: string | null;
}>;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("sonner", {
    namedExports: { toast: { success: (message: string) => toasts.push(message), error: (message: string) => toasts.push(message) } },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      post: async (url: string, body: { choice: string }) => {
        posted.push({ url, body });
        return { data: { choice: body.choice } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ ReportFeedbackCard } = await import("./ReportFeedbackCard"));
});

beforeEach(() => {
  posted.length = 0;
  toasts.length = 0;
});
afterEach(cleanup);

function renderCard(props: Partial<React.ComponentProps<typeof ReportFeedbackCard>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReportFeedbackCard reportId="r-1" messagesHref="/messages/c-1" {...props} />
    </QueryClientProvider>,
  );
}

describe("ReportFeedbackCard", () => {
  it("says who sees the answer, and shows the three choices as pressed or not", () => {
    renderCard({ currentChoice: "goals_understood" });

    assert.ok(screen.getByText("Hocan bunu bir sonraki görüşmeye hazırlanırken görür."));
    assert.equal(screen.getByRole("button", { name: "Hedefleri anladım" }).getAttribute("aria-pressed"), "true");
    assert.equal(screen.getByRole("button", { name: "Bu hedefi değiştirmek istiyorum" }).getAttribute("aria-pressed"), "false");
    assert.equal(screen.getByRole("button", { name: "Öğretmenime not bırakmak istiyorum" }).getAttribute("aria-pressed"), "false");
  });

  it("saves a choice, and offers the way to write to the tutor only for the two that need words", async () => {
    renderCard();
    assert.equal(screen.queryByRole("link", { name: "Hocana yaz" }), null);

    fireEvent.click(screen.getByRole("button", { name: "Öğretmenime not bırakmak istiyorum" }));
    await waitFor(() =>
      assert.deepEqual(posted, [{ url: "/coaching/reports/r-1/feedback/", body: { choice: "want_to_leave_note" } }]),
    );
    const link = await screen.findByRole("link", { name: "Hocana yaz" });
    assert.equal(link.getAttribute("href"), "/messages/c-1");
    assert.ok(screen.getByText("Notunu ya da değişiklik isteğini hocana mesajla iletebilirsin."));

    fireEvent.click(screen.getByRole("button", { name: "Hedefleri anladım" }));
    await waitFor(() => assert.equal(posted.length, 2));
    await waitFor(() => assert.equal(screen.queryByRole("link", { name: "Hocana yaz" }), null));
  });

  it("offers it at once when the saved choice already asks for a change", () => {
    renderCard({ currentChoice: "want_to_change_goal" });

    assert.equal(screen.getByRole("link", { name: "Hocana yaz" }).getAttribute("href"), "/messages/c-1");
  });

  it("shows no link at all when there is no thread to write in", () => {
    renderCard({ currentChoice: "want_to_change_goal", messagesHref: null });

    assert.equal(screen.queryByRole("link", { name: "Hocana yaz" }), null);
    assert.equal(screen.queryByText(/mesajla iletebilirsin/), null);
  });
});

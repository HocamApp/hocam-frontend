import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { paidPurchase, refundRequest } from "@/test/refundFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let listResponse: () => unknown = () => ({ data: [] });

let RefundEntry: typeof import("./RefundEntry").RefundEntry;
let RefundRequestsSection: typeof import("./RefundRequestsSection").RefundRequestsSection;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/payments/refund-requests/") return listResponse();
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ RefundEntry } = await import("./RefundEntry"));
  ({ RefundRequestsSection } = await import("./RefundRequestsSection"));
});

afterEach(() => {
  cleanup();
  listResponse = () => ({ data: [] });
});

describe("the way into a refund", () => {
  it("offers a refund on a paid package, for that package", () => {
    render(<RefundEntry purchase={paidPurchase()} refunds={[]} />);

    const link = screen.getByRole("link", { name: "İade talep et" });
    assert.equal(link.getAttribute("href"), "/profile/payments/refunds/new?purchase=purchase-1");
  });

  it("offers nothing on a package that is not paid", () => {
    for (const status of ["pending", "cancelled", "refunded"] as const) {
      const { container } = render(
        <RefundEntry purchase={paidPurchase({ status })} refunds={[]} />
      );
      assert.equal(container.textContent, "", status);
      cleanup();
    }
  });

  it("points to the request that is already open instead of offering another", () => {
    render(
      <RefundEntry
        purchase={paidPurchase()}
        refunds={[refundRequest({ id: "open-1", status: "approved" })]}
      />
    );

    assert.equal(screen.queryByRole("link", { name: "İade talep et" }), null);
    assert.match(document.body.textContent ?? "", /Bu paket için bir iade talebin var: Onaylandı\./);
    assert.equal(
      screen.getByRole("link", { name: "Talebini gör" }).getAttribute("href"),
      "/profile/payments/refunds/open-1"
    );
  });

  it("offers a new request after the last one was refused", () => {
    render(
      <RefundEntry
        purchase={paidPurchase()}
        refunds={[refundRequest({ status: "rejected" })]}
      />
    );
    assert.ok(screen.getByRole("link", { name: "İade talep et" }));
  });

  it("still offers it while the list of requests has not arrived", () => {
    render(<RefundEntry purchase={paidPurchase()} refunds={undefined} />);
    assert.ok(screen.getByRole("link", { name: "İade talep et" }));
  });
});

/** Lets the list's request finish, inside act. */
async function settled() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RefundRequestsSection />
    </QueryClientProvider>
  );
}

describe("the list of requests", () => {
  it("shows nothing when there is no request", async () => {
    const { container } = renderSection();
    await settled();
    assert.equal(container.textContent, "");
  });

  it("shows nothing when the list cannot be read", async () => {
    listResponse = () => Promise.reject(new Error("Network Error"));
    const { container } = renderSection();
    await settled();
    assert.equal(container.textContent, "");
  });

  it("lists each request newest first, with its status and a link to it", async () => {
    listResponse = () => ({
      data: [
        refundRequest({
          id: "older",
          status: "processed",
          created_at: "2026-09-01T09:00:00+00:00",
          reason: "voluntary",
        }),
        refundRequest({
          id: "newer",
          status: "requested",
          created_at: "2026-10-01T09:00:00+00:00",
          reason: "tutor_issue",
        }),
      ],
    });
    renderSection();

    await screen.findByText("İade taleplerin");
    const links = screen.getAllByRole("link");
    assert.deepEqual(
      links.map((link) => link.getAttribute("href")),
      ["/profile/payments/refunds/newer", "/profile/payments/refunds/older"]
    );
    assert.match(links[0].textContent ?? "", /Ada Lovelace/);
    assert.match(links[0].textContent ?? "", /Hocayla ilgili bir sorun var/);
    assert.match(links[0].textContent ?? "", /6\.800 ₺/);
    assert.match(links[0].textContent ?? "", /İnceleniyor/);
    assert.match(links[1].textContent ?? "", /İade edildi/);
  });

  it("shows no amount on a request that was refused", async () => {
    listResponse = () => ({
      data: [refundRequest({ id: "no", status: "rejected", rejection_reason: "Hayır" })],
    });
    renderSection();

    await screen.findByText("İade taleplerin");
    const link = screen.getByRole("link");
    assert.doesNotMatch(link.textContent ?? "", /₺/);
    assert.match(link.textContent ?? "", /Reddedildi/);
  });
});

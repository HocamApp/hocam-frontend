import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { paidPurchase } from "@/test/refundFixtures";
let UnplacedCreditsEntry: typeof import("./UnplacedCreditsEntry").UnplacedCreditsEntry;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ UnplacedCreditsEntry } = await import("./UnplacedCreditsEntry"));
});

afterEach(cleanup);

describe("the way into placing credits", () => {
  it("says how many credits are unplaced and links to placing them for that package", () => {
    render(<UnplacedCreditsEntry purchase={paidPurchase({ remaining_credits: 4 })} />);

    assert.ok(screen.getByText(/4 ders hakkın var/));
    const link = screen.getByRole("link", { name: "Hakları yerleştir" });
    assert.equal(link.getAttribute("href"), "/profile/payments/place?purchase=purchase-1");
  });

  it("shows nothing when every credit is on the calendar", () => {
    const { container } = render(
      <UnplacedCreditsEntry purchase={paidPurchase({ remaining_credits: 0 })} />
    );
    assert.equal(container.textContent, "");
  });

  it("shows nothing on a package that is not paid", () => {
    for (const status of ["pending", "cancelled", "refunded"] as const) {
      const { container } = render(
        <UnplacedCreditsEntry purchase={paidPurchase({ status, remaining_credits: 4 })} />
      );
      assert.equal(container.textContent, "", status);
      cleanup();
    }
  });
});

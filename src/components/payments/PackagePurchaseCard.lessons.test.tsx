import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { packageLessons } from "@/lib/packageLessons";
import { bookingsFixture, purchaseFixture } from "@/test/packageFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let PackagePurchaseCard: typeof import("./PackagePurchaseCard").PackagePurchaseCard;
let PackageLearningDetailsSheet: typeof import("./PackagePurchaseCard").PackageLearningDetailsSheet;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "ayse@example.com" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
      }),
    },
  });
  // The card's payment area asks the server about the purchase; nothing in
  // these tests depends on the answer.
  mock.module("@/lib/api", {
    defaultExport: {
      get: async () => ({ data: { requires_tutor_acceptance: false, acceptance: null } }),
      post: async () => ({ data: {} }),
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ PackagePurchaseCard, PackageLearningDetailsSheet } = await import("./PackagePurchaseCard"));
});

afterEach(cleanup);

const IN_MINUTES = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

function renderCard(props: React.ComponentProps<typeof PackagePurchaseCard>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PackagePurchaseCard {...props} />
    </QueryClientProvider>
  );
}

describe("the lessons on a package card", () => {
  it("counts the lessons ahead, not just the credits left unplaced", () => {
    const purchase = purchaseFixture({ remaining_credits: 0 });

    renderCard({ purchase, lessons: packageLessons(purchase, bookingsFixture("confirmed", 8)) });

    assert.ok(screen.getByText("8 / 8"));
    assert.equal(screen.queryByText(/ders planlanmadı/), null);
  });

  it("says how many lessons have no day yet", () => {
    const purchase = purchaseFixture({ remaining_credits: 2 });

    renderCard({ purchase, lessons: packageLessons(purchase, bookingsFixture("confirmed", 6)) });

    assert.ok(screen.getByText("8 / 8"));
    assert.ok(screen.getByText("2 ders planlanmadı"));
  });

  it("falls back to the credits when the student's lessons are not known", () => {
    renderCard({ purchase: purchaseFixture({ remaining_credits: 3 }) });

    assert.ok(screen.getByText("3 / 8"));
  });

  it("says what an unpaid package holds, not that none of it is left", () => {
    renderCard({
      purchase: purchaseFixture({ status: "pending", paid_at: null, remaining_credits: 0 }),
    });

    assert.ok(screen.getByText("8 ders"));
    assert.equal(screen.queryByText("0 / 8"), null);
  });

  it("shows when the payment is due while the hours are held", () => {
    renderCard({
      purchase: purchaseFixture({ status: "pending", paid_at: null, payment_deadline: IN_MINUTES(15) }),
    });

    assert.ok(screen.getByText("Son ödeme saati"));
    assert.equal(screen.queryByText("Onay tarihi"), null);
  });
});

describe("the badge on a package card", () => {
  it("says the payment is awaited while the hours are held", () => {
    renderCard({
      purchase: purchaseFixture({ status: "pending", paid_at: null, payment_deadline: IN_MINUTES(15) }),
    });

    assert.ok(screen.getByText("Ödeme bekleniyor"));
    assert.equal(screen.queryByText("İnceleme bekliyor"), null);
  });

  it("says the payment time is over once it is", () => {
    renderCard({
      purchase: purchaseFixture({ status: "pending", paid_at: null, payment_deadline: IN_MINUTES(-5) }),
    });

    assert.ok(screen.getByText("Ödeme süresi doldu"));
  });

  it("keeps \"under review\" for a purchase that waits for a tutor", () => {
    renderCard({ purchase: purchaseFixture({ status: "pending", paid_at: null }) });

    assert.ok(screen.getByText("İnceleme bekliyor"));
  });
});

describe("the package details", () => {
  it("count the lessons left from the calendar and the unplaced credits together", () => {
    const purchase = purchaseFixture({ remaining_credits: 2 });

    render(
      <PackageLearningDetailsSheet
        purchase={purchase}
        bookings={bookingsFixture("confirmed", 6)}
        open
        onOpenChange={() => {}}
      />
    );

    assert.ok(screen.getByText("8 / 8"));
    assert.ok(screen.getByText(/2 dersin henüz bir saate yerleşmedi/));
  });

  it("say when the payment will put the lessons on the calendar", () => {
    const purchase = purchaseFixture({
      status: "pending",
      paid_at: null,
      remaining_credits: 0,
      payment_deadline: IN_MINUTES(15),
    });

    render(
      <PackageLearningDetailsSheet purchase={purchase} bookings={[]} open onOpenChange={() => {}} />
    );

    assert.ok(screen.getByText("Ödemen tamamlandığında derslerin takvimine eklenir."));
    // Nothing has been paid for yet: the tile says what the package holds.
    assert.ok(screen.getByText("Paketteki ders"));
    assert.equal(screen.queryByText("Kalan ders hakkı"), null);
  });
});

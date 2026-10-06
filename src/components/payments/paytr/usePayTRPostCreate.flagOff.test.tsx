import "@/test/setupDom";

// No NEXT_PUBLIC_PAYTR_ENABLED: the production build.
import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PackagePurchase } from "@/types";

/**
 * With the flag off a created package shows the same request confirmation
 * main shows: no reads, no redirect, no extra markup.
 */

const getCalls: string[] = [];
const postCalls: string[] = [];
const pushes: string[] = [];

const purchase: PackagePurchase = {
  id: "purchase-1",
  student: { id: "student-1", name: "Ada", surname: "Yılmaz" },
  tutor: { id: "tutor-1", name: "Deniz", surname: "Kaya" },
  plan: {
    id: "plan-1",
    name: "Haftada 3 ders · 30 gün",
    code: "w3-d30",
    lesson_count: 12,
    lesson_duration_minutes: 40,
    lessons_per_week: 3,
    duration_days: 30,
    discount_percent: 10,
  },
  status: "pending",
  total_credits: 12,
  remaining_credits: 0,
  unit_price: 400,
  subtotal_price: 4800,
  discount_amount: 480,
  promo_discount_amount: 0,
  total_price: 4320,
  created_at: "2026-10-06T09:00:00Z",
  paid_at: null,
  promotion_code: null,
};

let usePayTRPostCreate: typeof import("./usePayTRPostCreate").usePayTRPostCreate;
let CheckoutPurchaseSuccess: typeof import("@/components/checkout/CheckoutSuccess").CheckoutPurchaseSuccess;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => pushes.push(href),
        replace: () => {},
        back: () => {},
      }),
      usePathname: () => "/tutors/tutor-1/checkout",
      useSearchParams: () => new URLSearchParams(),
    },
  });
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
        getCalls.push(url);
        return { data: {} };
      },
      post: async (url: string) => {
        postCalls.push(url);
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ usePayTRPostCreate } = await import("./usePayTRPostCreate"));
  ({ CheckoutPurchaseSuccess } = await import("@/components/checkout/CheckoutSuccess"));
});

afterEach(() => cleanup());

function CreatedPurchaseScreen() {
  const postCreate = usePayTRPostCreate(purchase);
  return (
    <CheckoutPurchaseSuccess
      purchase={purchase}
      tutorId="tutor-1"
      paymentCheck={postCreate.check}
      paymentBlockedReason={postCreate.blockedReason}
      onRetryPaymentCheck={postCreate.retry}
    />
  );
}

describe("usePayTRPostCreate with PayTR off (production build)", () => {
  it("reads nothing, redirects nowhere and adds nothing to the screen", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const withHook = render(
      <QueryClientProvider client={client}>
        <CreatedPurchaseScreen />
      </QueryClientProvider>
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    const hookMarkup = withHook.container.innerHTML;
    cleanup();

    const plain = render(<CheckoutPurchaseSuccess purchase={purchase} tutorId="tutor-1" />);

    assert.equal(hookMarkup, plain.container.innerHTML);
    assert.deepEqual(getCalls, []);
    assert.deepEqual(postCalls, []);
    assert.deepEqual(pushes, []);
    client.clear();
  });
});

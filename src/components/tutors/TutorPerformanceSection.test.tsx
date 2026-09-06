import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

mock.module("@/lib/tutorsApi", { namedExports: {
  fetchTutorPerformance: async () => ({
    window_days: 90,
    missed_lessons: 0,
    reply_rate_24h: { answered: 1, total: 1, rate: 1 },
  }),
} });
mock.module("next/link", { defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a> });

let TutorPerformanceSection: typeof import("./TutorPerformanceSection")["TutorPerformanceSection"];
before(async () => { TutorPerformanceSection = (await import("./TutorPerformanceSection")).TutorPerformanceSection; });
afterEach(cleanup);

test("performance detail link follows the selected period", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><TutorPerformanceSection
    profile={{ id: "tutor", hourly_price: 500, rating: 5, total_reviews: 3, profile_score: 90 } as never}
    availability={[]}
    priceInsight={null}
  /></QueryClientProvider>);
  const periodGroup = screen.getByRole("group", { name: "Dönem" });
  assert.match(periodGroup.className, /lg:w-auto/);
  assert.doesNotMatch(periodGroup.className, /sm:w-auto/);
  const link = await screen.findByRole("link", { name: "Ayrıntıları gör" });
  assert.equal(link.getAttribute("href"), "/dashboard/tutor/statistics?tab=overview&period=90");
  fireEvent.click(screen.getByRole("button", { name: "Son 30 gün" }));
  assert.equal(link.getAttribute("href"), "/dashboard/tutor/statistics?tab=overview&period=30");
  client.clear();
});

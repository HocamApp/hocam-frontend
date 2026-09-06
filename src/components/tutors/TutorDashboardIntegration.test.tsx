import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let query = "";
let bookingsFail = false;
const navigation: string[] = [];
const router = {
  push: (href: string) => navigation.push(href),
  replace: (href: string) => navigation.push(href),
};

mock.module("next/navigation", { namedExports: {
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(query),
} });
mock.module("next/link", { defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a> });
mock.module("@/hooks/useAuth", { namedExports: { useAuth: () => ({
  user: { id: "tutor-user", role: "tutor" }, isAuthenticated: true,
  isLoading: false, isTutor: true, isStudent: false, isAdmin: false,
}) } });
mock.module("@/hooks/useHighlightTarget", { namedExports: {
  useHighlightTarget: () => null,
  HIGHLIGHT_CLASSNAME: "highlight",
  HIGHLIGHT_PARAM: "highlightBooking",
} });
mock.module("@/components/tutors/TutorPerformanceSection", { namedExports: {
  TutorPerformanceSection: () => <section><h2>Başarının anahtarları</h2><a href="/dashboard/tutor/statistics?tab=overview&period=90">Ayrıntıları gör</a></section>,
} });
mock.module("@/components/ai/AISupportChatWidget", { namedExports: { AISupportChatWidget: () => null } });
mock.module("@/components/lessons/BookingCard", { namedExports: {
  BookingCard: ({ booking }: { booking: { id: string } }) => <article>Ders kaydı {booking.id}</article>,
  paymentLabel: () => "Ödendi",
} });

const profile = {
  id: "tutor", name: "İpek", surname: "Hoca", profile_picture: null,
  is_verified: true, is_public: false, hourly_price: 900, rating: 4.8,
  total_reviews: 8, profile_score: 90,
  subjects: [{ id: "math", name: "Matematik", exam_type: "TYT" }],
};
const bookings = [
  {
    id: "next", status: "confirmed", start_time: "2099-09-06T10:00:00Z",
    duration_minutes: 40, room_url: null, price: 500,
    student: { id: "student", email: "ada@example.com", display_name: "Ada" },
    tutor: { id: "tutor", email: "tutor@example.com", display_name: "İpek" },
    subject: { id: "math", name: "Matematik", exam_type: "TYT" },
  },
  {
    id: "action", status: "awaiting_confirmation", start_time: "2099-09-05T10:00:00Z",
    duration_minutes: 40, room_url: null, price: 500,
    student: { id: "student", email: "ada@example.com", display_name: "Ada" },
    tutor: { id: "tutor", email: "tutor@example.com", display_name: "İpek" },
    subject: { id: "math", name: "Matematik", exam_type: "TYT" },
  },
];

mock.module("@/lib/tutorsApi", { namedExports: {
  fetchMyTutorProfile: async () => profile,
  fetchTutorPriceInsight: async () => ({ commission_rate_bps: 0 }),
  fetchTutorPerformance: async () => ({}),
  fetchTutorReviewSummary: async () => null,
  fetchTutorReviews: async () => [],
  updateMyTutorProfile: async () => profile,
} });
mock.module("@/lib/lessonsApi", { namedExports: {
  fetchBookings: async () => {
    if (bookingsFail) throw new Error("offline");
    return bookings;
  },
  getBookingErrorMessage: (_error: unknown, fallback: string) => fallback,
  updateBookingStatus: async () => undefined,
} });
mock.module("@/lib/dashboardApi", { namedExports: { fetchAvailability: async () => [] } });
mock.module("@/lib/messagingApi", { namedExports: { fetchConversations: async () => [] } });
mock.module("@/lib/paymentsApi", { namedExports: {
  fetchTutorEarnings: async () => ({ last_30_days: { lesson_count: 0 } }),
  fetchTutorPackageOffers: async () => [],
  fetchTutorPackagePurchases: async () => [],
} });
mock.module("@/lib/learningApi", { namedExports: { confirmLearningActivity: async () => undefined } });

let Page: React.ComponentType;
let client: QueryClient;
before(async () => { Page = (await import("@/app/(main)/dashboard/tutor/page")).default; });
beforeEach(() => {
  query = "";
  bookingsFail = false;
  navigation.length = 0;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});
afterEach(() => { cleanup(); client.clear(); });
const mount = () => render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);

test("Panom keeps daily focus and links to canonical workspaces", async () => {
  const { container } = mount();
  await screen.findByText("Matematik");
  assert.equal(container.querySelectorAll("h1").length, 1);
  assert.ok(screen.getByText("Başarının anahtarları"));
  assert.equal(screen.getByRole("link", { name: /Sınıfım/ }).getAttribute("href"), "/dashboard/tutor/classroom");
  assert.equal(screen.getByRole("link", { name: /Takvim/ }).getAttribute("href"), "/dashboard/tutor/calendar");
  assert.equal(screen.getByRole("link", { name: /İstatistiklerim/ }).getAttribute("href"), "/dashboard/tutor/statistics");
  assert.equal(screen.queryByText("Bugünkü programın"), null);
  assert.equal(screen.queryByText("Öğrencilerin"), null);
  assert.equal(screen.queryByText("Hoca yönetim merkezi"), null);
});

test("legacy tabs redirect to their canonical workspace", async () => {
  query = "tab=students";
  mount();
  await waitFor(() => assert.equal(navigation.at(-1), "/dashboard/tutor/classroom"));
});

test("bookings mode is a focused page with one heading and no legacy tab strip", async () => {
  query = "tab=bookings&highlightBooking=next";
  const { container } = mount();
  await screen.findByText("Ders kaydı next");
  assert.equal(container.querySelectorAll("h1").length, 1);
  assert.equal(screen.getByRole("heading", { level: 1 }).textContent, "Rezervasyonlar");
  assert.ok(screen.getByRole("link", { name: "Panoma dön" }));
  assert.equal(screen.queryByRole("tablist"), null);
});

test("Panom does not describe a failed booking request as a quiet calendar", async () => {
  bookingsFail = true;
  mount();
  assert.ok(await screen.findByRole("alert"));
  assert.ok(screen.getByText("Ders programın yüklenemedi."));
  assert.equal(screen.queryByText("Takvimin şu anda sakin"), null);
});

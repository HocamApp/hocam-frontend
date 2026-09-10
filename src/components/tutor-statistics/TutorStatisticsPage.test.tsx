import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from "@/lib/api";
import { StatisticsDonutChart } from "./StatisticsCharts";

let role = "tutor";
let authenticated = true;
let query = "tab=overview&period=30";
const navigation: string[] = [];
const router = { push: (url: string) => navigation.push(url), replace: (url: string) => navigation.push(url) };
mock.module("next/navigation", { namedExports: {
  useRouter: () => router,
  usePathname: () => "/dashboard/tutor/statistics",
  useSearchParams: () => new URLSearchParams(query),
} });
mock.module("next/link", { defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a> });
mock.module("@/hooks/useAuth", { namedExports: { useAuth: () => ({
  user: { id: "tutor-user", role }, isAuthenticated: authenticated, isLoading: false,
  isTutor: role === "tutor", isStudent: role === "student", isAdmin: false, isImpersonating: false,
}) } });

const overview = {
  from: "2026-08-08", to: "2026-09-06", timezone: "Europe/Istanbul", generated_at: "2026-09-06T10:00:00Z", granularity: "day",
  summary: {
    completed_lessons: { current: 12, previous: 8, change_percent: 50 },
    completed_minutes: { current: 520, previous: 320, change_percent: 62.5 },
    students: { current: 7, previous: 5, change_percent: 40 },
    reviews: { average: 4.75, count: 4, previous_average: null, previous_count: 0 },
  },
  lesson_activity: [{ period_start: "2026-08-08", completed_count: 2, completed_minutes: 80 }, { period_start: "2026-08-09", completed_count: 3, completed_minutes: 120 }],
  lesson_statuses: [{ status: "completed", count: 12 }, { status: "cancelled", count: 2 }],
  subjects: [{ id: "math", name: "Matematik", exam_type: "TYT", completed_count: 8, completed_minutes: 320 }],
  students: { relationships: 7, new: 2, activity: [{ period_start: "2026-08-08", new_students: 1 }] },
  reviews: { trend: [{ period_start: "2026-08-08", average: 4.75, count: 4 }], criteria: { clarity_rating: 5, preparation_rating: 4.5, progress_rating: 4.5, confidence_rating: 5 } },
  reliability: { missed_lessons: 1, reply_rate_24h: { answered: 9, total: 10, rate: .9 }, cancellations: [{ reason: "student_cancelled", count: 2 }, { reason: "unknown", count: 75 }] },
  coaching: { summary: { total_sessions: 4, completed_sessions: 3, students: 2 }, activity: [{ period_start: "2026-08-08", completed_count: 1, completed_minutes: 30 }], statuses: [{ status: "completed", count: 3 }] },
};
const income = {
  from: overview.from, to: overview.to, timezone: "Europe/Istanbul", generated_at: overview.generated_at, granularity: "day", currency: "TRY",
  lesson_earnings: { available: false, amount_minor: null, reason: "lesson_payment_source_unavailable" },
  packages: { count: 3, recorded_amount_minor: 850000, statuses: [{ status: "paid", count: 2, recorded_amount_minor: 600000 }, { status: "pending", count: 1, recorded_amount_minor: 250000 }], activity: [{ period_start: "2026-08-08", count: 1, recorded_amount_minor: 300000 }] },
  coaching: { entitlement_amount_minor: 125000, status_amounts_minor: { pending: 100000, on_hold: 25000 }, batched_ready_amount_minor: 100000, paid_amount_minor: 0, activity: [{ period_start: "2026-08-08", count: 1, entitlement_amount_minor: 125000 }], payout_batches: [{ id: "batch", local_month: "2026-08-01", status: "ready", total_amount_minor: 100000, paid_at: null }] },
};
const reviews = {
  count: 26, next: 2, previous: null,
  results: [{
    id: "review-1", tutor: { id: "tutor", name: "İpek", surname: "Hoca" },
    subject: { id: "math", name: "Matematik", exam_type: "TYT" },
    clarity_rating: 5, preparation_rating: 4, progress_rating: 5,
    confidence_rating: 4, rating: 4.5,
    comment: "Konuyu çok anlaşılır anlattı.", created_at: "2026-08-20T12:00:00Z",
  }],
};

let Page: React.ComponentType;
let client: QueryClient;
let fail = false;
before(async () => { Page = (await import("@/app/(main)/dashboard/tutor/statistics/page")).default; });
beforeEach(() => {
  role = "tutor"; authenticated = true; query = "tab=overview&period=30"; navigation.length = 0; fail = false;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  api.defaults.adapter = async config => {
    if (fail) throw new Error("offline");
    const data = config.url?.includes("/statistics/reviews/") ? reviews : config.url?.endsWith("/records/") ? { count: 0, next: null, previous: null, results: [] } : config.url?.includes("/income/") ? income : overview;
    return { config, data, status: 200, statusText: "OK", headers: {} };
  };
});
afterEach(() => { cleanup(); client.clear(); });
const mount = () => render(<QueryClientProvider client={client}><Page /></QueryClientProvider>);

test("overview renders one H1, four honest metrics and accessible graph tables", async () => {
  const { container } = mount();
  await screen.findAllByText("12");
  assert.equal(container.querySelectorAll("h1").length, 1);
  assert.equal(screen.getByText("4,75").textContent, "4,75");
  assert.ok(screen.getByRole("img", { name: /Tamamlanan dersler grafiği/ }));
  assert.ok(screen.getByRole("table", { name: /Tamamlanan dersler verileri/ }));
  assert.ok(screen.getAllByText("Tarih").length >= 1);
  assert.ok(screen.getByText("Tamamlanan ders sayısı"));
  assert.ok(screen.getByText("Ortalama puan"));
  assert.equal(screen.queryByText("Ortalama puan (5 üzerinden)"), null);
  assert.ok(screen.getByText("Koçluk görünümü"));
  assert.equal(screen.queryByText("Ayrı hizmet alanı"), null);
  assert.equal(screen.queryByText("Koçluk görüşmeleri ders istatistiklerine eklenmeden ayrı hesaplanır."), null);
  assert.equal(screen.queryByText("Nedeni bilinmiyor"), null);
  assert.equal(screen.queryByText(/Ders ve koçluk etkinliğini zaman içinde incele/), null);
  assert.equal(screen.queryByText(/· İstanbul$/), null);
  assert.equal(screen.queryByText(/toplam gelir/i), null);
  assert.equal(screen.queryByText("Tamamlanan kayıtların planlanan süresi gösterilir; canlı bağlantı süresi değildir."), null);
  assert.equal(screen.queryByText("Tamamlanan derslerin konu dağılımı."), null);
  assert.equal(screen.queryByText("Seçili dönemde başlayan tüm ders kayıtları."), null);
  assert.equal(screen.queryByText("7 öğrenciyle ders ilişkisi · 2 yeni öğrenci"), null);
  assert.equal(screen.queryByText("4 değerlendirme üzerinden."), null);
  assert.equal(screen.queryByText("Anlatım netliği"), null);
  assert.equal(screen.queryByText("İptal nedenleri ve ders dışı mesajlara ilk 24 saatte verilen yanıtlar."), null);
  assert.equal(screen.queryByText("9/10 ölçülen konuşma dönüşü"), null);
  assert.equal(screen.queryByText("8 Ağustos 2026 – 6 Eylül 2026"), null);
});

test("income keeps the financial records while removing explanatory copy and hakediş wording", async () => {
  query = "tab=income&period=30";
  mount();
  await screen.findAllByText("Ders paketi tutarları");
  assert.ok(screen.getByText("8.500,00 ₺"));
  assert.ok(screen.getByText("Henüz hesaplanamıyor"));
  assert.ok(screen.getByText("Koçluk geliri"));
  assert.ok(screen.getByText("Gelir ve ödeme durumu"));
  assert.ok(screen.getByRole("img", { name: "Koçluk gelirleri grafiği" }));
  assert.ok(screen.getByText("Ödemeye hazır"));
  assert.equal(screen.queryByText(/genel toplam/i), null);
  assert.equal(screen.queryByText("Koçluk finans akışı"), null);
  assert.equal(screen.queryByText("Paket kayıtları oluşturulma tarihine ve güncel durumuna göre gösterilir."), null);
  assert.equal(screen.queryByText("Hakediş, ödeme partisi ve ödenen tutar birbirinden ayrı gösterilir. Aynı hakediş bu başlıklar toplanarak yeniden sayılmaz."), null);
  assert.equal(screen.queryByText(/hakediş/i), null);
  assert.equal(screen.queryByText("3 paket kaydındaki tutar; tahsilat veya hoca ödemesi kanıtı değildir."), null);
  assert.equal(screen.queryByText("Ders ödeme kaynağı gerçek hoca ödemesini ayırmadığı için tutar gösterilmiyor."), null);
  assert.equal(screen.queryByText("Teslim edilen koçluk hizmetlerinden doğan hak; ödeme toplamı değildir."), null);
});

test("lesson statuses render as a donut with a legend and a data table", async () => {
  mount();
  await screen.findAllByText("12");

  const chart = screen.getByRole("img", { name: "Ders durumları grafiği" });
  const table = screen.getByRole("table", { name: "Ders durumları verileri" });
  assert.match(table.textContent ?? "", /Tamamlandı/);
  assert.match(table.textContent ?? "", /İptal/);
  // The legend doubles as the hover control, so each slice is a real button.
  // Scoped to this chart: "Tamamlandı" is also a coaching status further down.
  assert.ok(within(chart).getByRole("button", { name: /Tamamlandı/ }));
  assert.ok(within(chart).getByRole("button", { name: /İptal/ }));
  // Toplam, in the middle of the ring, is the sum and not one of the slices.
  assert.ok(within(chart).getByText("Toplam"));
});

test("a distribution with nothing in it says so instead of drawing an empty ring", () => {
  render(
    <StatisticsDonutChart
      title="Koçluk durumları"
      rows={[{ label: "Tamamlandı", value: 0 }, { label: "İptal", value: 0 }]}
    />,
  );

  assert.ok(screen.getByText("Bu dönem için veri bulunmuyor."));
  assert.equal(screen.queryByRole("img", { name: "Koçluk durumları grafiği" }), null);
});

test("reviews tab keeps private period feedback, criteria and pagination", async () => {
  query = "tab=reviews&period=30";
  mount();
  await screen.findByText("Konuyu çok anlaşılır anlattı.");
  assert.ok(screen.getByText("Matematik · TYT"));
  assert.ok(screen.getByText("Anlatım netliği"));
  assert.ok(screen.getAllByText("5 / 5").length >= 1);
  assert.equal(screen.queryByText("26 değerlendirme · yalnızca sana ait geri bildirimler"), null);
  fireEvent.click(screen.getByRole("button", { name: "Sonraki" }));
  assert.equal((await screen.findByText("Sayfa 2")).textContent, "Sayfa 2");
});

test("tab and period controls write canonical URLs", async () => {
  mount();
  await screen.findAllByText("12");
  fireEvent.click(screen.getByRole("tab", { name: "Gelir" }));
  assert.ok(navigation.at(-1)?.includes("tab=income"));
  fireEvent.click(screen.getByRole("button", { name: "Son 365 gün" }));
  assert.ok(navigation.at(-1)?.includes("period=365"));
});

test("custom period applies edited dates and rejects a range longer than 365 days", async () => {
  query = "tab=income&period=custom&from=2026-06-09&to=2026-09-06";
  mount();
  await screen.findAllByText("Ders paketi tutarları");
  fireEvent.change(screen.getByLabelText("Başlangıç"), { target: { value: "2026-08-01" } });
  fireEvent.change(screen.getByLabelText("Bitiş"), { target: { value: "2026-08-31" } });
  fireEvent.click(screen.getByRole("button", { name: "Uygula" }));
  assert.ok(navigation.at(-1)?.includes("from=2026-08-01&to=2026-08-31"));

  fireEvent.change(screen.getByLabelText("Başlangıç"), { target: { value: "2025-08-01" } });
  fireEvent.click(screen.getByRole("button", { name: "Uygula" }));
  assert.ok(screen.getByRole("alert").textContent?.includes("en fazla 365 günlük"));
});

test("load failures are not rendered as zero data", async () => {
  fail = true; mount();
  await screen.findByRole("alert");
  assert.equal(screen.queryByText("0"), null);
});

for (const audience of ["student", "anonymous"]) test(`statistics rejects ${audience}`, async () => {
  role = audience; authenticated = audience !== "anonymous"; mount();
  await waitFor(() => assert.equal(navigation.at(-1), audience === "student" ? "/dashboard/student" : "/login"));
});

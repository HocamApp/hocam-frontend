"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookBookmark, BookOpen, CalendarDots, ChalkboardTeacher, ChartLineUp, ChatCircle, Clock, CurrencyCircleDollar, Timer, UserFocus, Users } from "@phosphor-icons/react";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildStatisticsQuery, CANCELLATION_LABELS, fetchTutorIncome, fetchTutorIncomeRecords,
  fetchTutorReviewRecords, fetchTutorStatistics, formatMinor, IncomeRecordKind, istanbulToday,
  resolveStatisticsSelection, StatisticsPeriod, StatisticsSelection, StatisticsTab,
  STATUS_LABELS, type ComparisonMetric, type TutorIncomeResponse, type TutorStatisticsResponse,
} from "@/lib/tutorStatistics";
import { ChartCard, HorizontalBars, LineChart } from "./StatisticsCharts";

const periods: Array<{ value: StatisticsPeriod; label: string }> = [
  { value: "30", label: "Son 30 gün" }, { value: "90", label: "Son 90 gün" },
  { value: "365", label: "Son 365 gün" }, { value: "custom", label: "Özel aralık" },
];
const reviewCriteria = [
  { key: "clarity_rating", label: "Anlatım netliği" },
  { key: "preparation_rating", label: "Derse hazırlık" },
  { key: "progress_rating", label: "Hedefe ilerleme" },
  { key: "confidence_rating", label: "Güven ve motivasyon" },
] as const;
function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}
function statusLabel(value: string) { return STATUS_LABELS[value] ?? value.replaceAll("_", " "); }
function percent(rate: number | null) { return rate === null ? "Ölçülemedi" : `%${Math.round(rate * 100)}`; }
function comparisonText(metric: ComparisonMetric) {
  if (metric.change_percent === null) return metric.previous === 0 ? "Önceki dönemde karşılaştırılabilir veri yok" : "Değişim hesaplanamadı";
  const sign = metric.change_percent > 0 ? "+" : "";
  return `Önceki döneme göre ${sign}%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(metric.change_percent)}`;
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail?: string; icon: React.ReactNode }) {
  return <article className="rounded-card border border-line bg-surface p-5">
    <div className="flex items-center justify-between gap-3"><p className="text-small font-medium text-ink-mid">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-input border border-line text-pink">{icon}</span></div>
    <p className="mt-4 break-words text-[1.625rem] font-bold leading-none tracking-tight tabular-nums sm:text-[2rem]">{value}</p>
    {detail ? <p className="mt-3 text-caption text-ink-mid">{detail}</p> : null}
  </article>;
}

function Overview({ data }: { data: TutorStatisticsResponse }) {
  const [activityMode, setActivityMode] = useState<"count" | "minutes">("count");
  const activityKey = activityMode === "count" ? "completed_count" : "completed_minutes";
  const reviewAverage = data.summary.reviews.average;
  return <div className="space-y-6">
    <section aria-label="Genel göstergeler" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Tamamlanan ders" value={String(data.summary.completed_lessons.current)} detail={comparisonText(data.summary.completed_lessons)} icon={<BookBookmark size={26} aria-hidden="true" weight="regular" />} />
      <MetricCard label="Planlanan ders süresi" value={`${data.summary.completed_minutes.current} dk`} detail={comparisonText(data.summary.completed_minutes)} icon={<Timer size={26} aria-hidden="true" weight="regular" />} />
      <MetricCard label="Ders ilişkisi olan öğrenci" value={String(data.summary.students.current)} detail={comparisonText(data.summary.students)} icon={<UserFocus size={26} aria-hidden="true" weight="regular" />} />
      <MetricCard label="Dönem değerlendirmesi" value={reviewAverage === null ? "Veri yok" : new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(reviewAverage)} detail={reviewAverage === null ? "Bu dönemde değerlendirme gelmedi" : `${data.summary.reviews.count} değerlendirme`} icon={<ChartLineUp size={26} aria-hidden="true" weight="regular" />} />
    </section>

    <ChartCard title="Tamamlanan dersler" action={<div role="group" aria-label="Ders grafiği ölçüsü" className="flex gap-1">{(["count", "minutes"] as const).map(mode => <Button key={mode} size="sm" variant="outline" aria-pressed={activityMode === mode} onClick={() => setActivityMode(mode)} className={activityMode === mode ? "border-ink bg-ink text-paper hover:bg-ink hover:text-paper" : "border-line"}>{mode === "count" ? "Ders" : "Dakika"}</Button>)}</div>}>
      <LineChart title="Tamamlanan dersler" points={data.lesson_activity.map(row => ({ label: row.period_start, value: row[activityKey] }))} valueLabel={value => activityMode === "count" ? `${value} ders` : `${value} dakika`} xAxisLabel="Tarih" yAxisLabel={activityMode === "count" ? "Tamamlanan ders sayısı" : "Planlanan süre (dakika)"} />
    </ChartCard>

    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Ders durumları"><HorizontalBars title="Ders durumları" rows={data.lesson_statuses.map(row => ({ label: statusLabel(row.status), value: row.count }))} /></ChartCard>
      <ChartCard title="Ders alanları"><HorizontalBars title="Ders alanları" rows={data.subjects.map(row => ({ label: `${row.name} · ${row.exam_type}`, value: row.completed_count }))} valueLabel={value => `${value} ders`} /></ChartCard>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Öğrenci gelişimi"><LineChart title="Yeni öğrenciler" points={data.students.activity.map(row => ({ label: row.period_start, value: row.new_students }))} valueLabel={value => `${value} öğrenci`} xAxisLabel="Tarih" yAxisLabel="Yeni öğrenci sayısı" /></ChartCard>
      <ChartCard title="Değerlendirme eğilimi"><LineChart title="Değerlendirme eğilimi" points={data.reviews.trend.map(row => ({ label: row.period_start, value: row.average }))} valueLabel={value => `${value.toFixed(2)} / 5`} xAxisLabel="Tarih" yAxisLabel="Ortalama puan" maxValue={5} /></ChartCard>
    </div>

    <ChartCard title="Güvenilirlik">
      <div className="grid gap-5 sm:grid-cols-3"><div><p className="text-caption text-ink-mid">Hoca kaynaklı kaçırılan ders</p><strong className="mt-1 block text-h2-m">{data.reliability.missed_lessons}</strong></div><div><p className="text-caption text-ink-mid">24 saatte yanıt</p><strong className="mt-1 block text-h2-m">{percent(data.reliability.reply_rate_24h.rate)}</strong></div><div><p className="text-caption text-ink-mid">Toplam iptal</p><strong className="mt-1 block text-h2-m">{data.reliability.cancellations.reduce((total, row) => total + row.count, 0)}</strong></div></div>
      <div className="mt-5 border-t border-line pt-5"><HorizontalBars title="İptal nedenleri" rows={data.reliability.cancellations.filter(row => row.reason !== "unknown").map(row => ({ label: CANCELLATION_LABELS[row.reason] ?? row.reason, value: row.count }))} /></div>
    </ChartCard>

    {data.coaching && <section className="space-y-5 border-t-2 border-ink pt-7"><h2 className="text-h2-m font-bold sm:text-h2">Koçluk görünümü</h2><div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Toplam görüşme" value={String(data.coaching.summary.total_sessions)} detail="Seçili dönemde planlanan" icon={<CalendarDots size={22} />} /><MetricCard label="Tamamlanan görüşme" value={String(data.coaching.summary.completed_sessions)} detail="Yayınlanmış raporla tamamlanan" icon={<ChalkboardTeacher size={22} />} /><MetricCard label="Koçluk öğrencisi" value={String(data.coaching.summary.students)} detail="Bu dönemde görüşmesi olan" icon={<Users size={22} />} /></div><div className="grid gap-6 lg:grid-cols-2"><ChartCard title="Koçluk görüşmeleri"><LineChart title="Tamamlanan koçluk görüşmeleri" points={data.coaching.activity.map(row => ({ label: row.period_start, value: row.completed_count }))} valueLabel={value => `${value} görüşme`} xAxisLabel="Tarih" yAxisLabel="Tamamlanan görüşme sayısı" /></ChartCard><ChartCard title="Koçluk durumları"><HorizontalBars title="Koçluk durumları" rows={data.coaching.statuses.map(row => ({ label: statusLabel(row.status), value: row.count }))} /></ChartCard></div></section>}
  </div>;
}

const recordKinds: Array<{ value: IncomeRecordKind; label: string }> = [{ value: "packages", label: "Paket kayıtları" }, { value: "earnings", label: "Koçluk gelirleri" }, { value: "payouts", label: "Ödeme partileri" }];
function Income({ data, selection }: { data: TutorIncomeResponse; selection: StatisticsSelection }) {
  const [kind, setKind] = useState<IncomeRecordKind>("packages");
  const [page, setPage] = useState(1);
  const records = useQuery({ queryKey: ["tutor-statistics-income-records", selection.from, selection.to, kind, page], queryFn: () => fetchTutorIncomeRecords(selection.from, selection.to, kind, page) });
  const chooseKind = (value: IncomeRecordKind) => { setKind(value); setPage(1); };
  return <div className="space-y-6">
    <section className="grid gap-3 lg:grid-cols-3">
      <MetricCard label="Ders paketi tutarları" value={formatMinor(data.packages.recorded_amount_minor)} icon={<CurrencyCircleDollar size={22} />} />
      <MetricCard label="Ders kazancı" value={data.lesson_earnings.available && data.lesson_earnings.amount_minor !== null ? formatMinor(data.lesson_earnings.amount_minor) : "Henüz hesaplanamıyor"} icon={<BookOpen size={22} />} />
      <MetricCard label="Koçluk geliri" value={data.coaching ? formatMinor(data.coaching.entitlement_amount_minor) : "Kapalı"} icon={<ChalkboardTeacher size={22} />} />
    </section>
    <ChartCard title="Ders paketi tutarları"><LineChart title="Ders paketi tutarları" points={data.packages.activity.map(row => ({ label: row.period_start, value: row.recorded_amount_minor }))} valueLabel={value => formatMinor(value)} axisValueLabel={value => formatMinor(value)} xAxisLabel="Tarih" yAxisLabel="Kayıtlı paket tutarı" /><div className="mt-5 border-t border-line pt-5"><HorizontalBars title="Paket durumları" rows={data.packages.statuses.map(row => ({ label: `${statusLabel(row.status)} · ${formatMinor(row.recorded_amount_minor)}`, value: row.count }))} valueLabel={value => `${value} kayıt`} /></div></ChartCard>
    {data.coaching && <section className="space-y-5 border-t-2 border-ink pt-7"><h2 className="text-h2-m font-bold sm:text-h2">Gelir ve ödeme durumu</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><MetricCard label="Fon bekleyen" value={formatMinor(data.coaching.status_amounts_minor.eligible_unfunded ?? 0)} icon={<Clock size={22} />} /><MetricCard label="Gelir bekliyor" value={formatMinor(data.coaching.status_amounts_minor.pending ?? 0)} icon={<CalendarDots size={22} />} /><MetricCard label="İncelemede" value={formatMinor(data.coaching.status_amounts_minor.on_hold ?? 0)} icon={<ChatCircle size={22} />} /><MetricCard label="Ters kayıt" value={formatMinor(data.coaching.status_amounts_minor.reversed ?? 0)} icon={<CurrencyCircleDollar size={22} />} /><MetricCard label="Ödemeye hazır" value={formatMinor(data.coaching.batched_ready_amount_minor)} icon={<CurrencyCircleDollar size={22} />} /><MetricCard label="Ödenen" value={formatMinor(data.coaching.paid_amount_minor)} icon={<CurrencyCircleDollar size={22} />} /></div><ChartCard title="Koçluk gelir eğilimi"><LineChart title="Koçluk gelirleri" points={data.coaching.activity.map(row => ({ label: row.period_start, value: row.entitlement_amount_minor }))} valueLabel={value => formatMinor(value)} axisValueLabel={value => formatMinor(value)} xAxisLabel="Tarih" yAxisLabel="Tutar" /></ChartCard>{data.coaching.payout_batches.length > 0 && <ChartCard title="Aylık ödeme partileri"><ul className="divide-y divide-line">{data.coaching.payout_batches.map(batch => <li key={batch.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><span>{formatDate(batch.local_month)} · {statusLabel(batch.status)}</span><strong>{formatMinor(batch.total_amount_minor)}</strong></li>)}</ul></ChartCard>}</section>}
    <ChartCard title="Gelir kayıtları" description="Seçili dönemdeki kaynak kayıtlar; para hareketlerinin anlamı durum etiketiyle birlikte okunur." action={<div role="group" aria-label="Gelir kayıt türü" className="flex flex-wrap gap-1">{recordKinds.filter(item => data.coaching || item.value === "packages").map(item => <Button key={item.value} variant="outline" size="sm" aria-pressed={kind === item.value} onClick={() => chooseKind(item.value)} className={kind === item.value ? "border-ink bg-ink text-paper hover:bg-ink hover:text-paper" : "border-line"}>{item.label}</Button>)}</div>}>
      {records.isPending ? <p role="status" className="py-6 text-small text-ink-mid">Kayıtlar yükleniyor…</p> : records.isError ? <div role="alert" className="py-4"><p>Kayıt ayrıntıları yüklenemedi.</p><Button className="mt-3" variant="outline" size="sm" onClick={() => void records.refetch()}>Yeniden dene</Button></div> : records.data?.results.length ? <><ul className="divide-y divide-line">{records.data.results.map(record => <li key={record.id} className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-medium">{record.label}</p><p className="text-caption text-ink-mid">{record.student?.display_name ? `${record.student.display_name} · ` : ""}{statusLabel(record.status)} · {formatDate(record.occurred_at.slice(0,10))}</p>{record.service_period_id && <Link className="text-small font-medium text-pink underline-offset-4 hover:underline" href={`/dashboard/tutor/coaching/service-periods/${record.service_period_id}/program`}>Koçluk programını aç</Link>}</div><strong>{formatMinor(record.amount_minor)}</strong></li>)}</ul><div className="mt-4 flex items-center justify-between border-t border-line pt-4"><Button variant="outline" size="sm" disabled={!records.data.previous} onClick={() => setPage(current => current - 1)}>Önceki</Button><span className="text-caption text-ink-mid">{records.data.count} kayıt · Sayfa {page}</span><Button variant="outline" size="sm" disabled={!records.data.next} onClick={() => setPage(current => current + 1)}>Sonraki</Button></div></> : <p className="py-6 text-small text-ink-mid">Bu dönemde seçilen türde kayıt yok.</p>}
    </ChartCard>
  </div>;
}

function Reviews({ selection }: { selection: StatisticsSelection }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [selection.from, selection.to]);
  const records = useQuery({
    queryKey: ["tutor-statistics-reviews", selection.from, selection.to, page],
    queryFn: () => fetchTutorReviewRecords(selection.from, selection.to, page),
  });
  if (records.isPending) return <div role="status" className="rounded-card border border-line bg-surface p-8 text-center text-ink-mid">Değerlendirmeler yükleniyor…</div>;
  if (records.isError) return <div role="alert" className="rounded-card border border-line bg-surface p-6"><p>Değerlendirmeler yüklenemedi. Dönemde yorum olmadığı varsayılmadı.</p><Button variant="outline" className="mt-4" onClick={() => void records.refetch()}>Yeniden dene</Button></div>;
  if (!records.data.results.length) return <div className="rounded-card border border-line bg-surface p-6"><h2 className="text-h3 font-medium">Bu dönemde değerlendirme yok</h2><p className="mt-2 text-small text-ink-mid">Öğrencilerinden bu tarih aralığında gelen bir değerlendirme bulunmuyor.</p></div>;
  return <section aria-labelledby="tutor-review-records-title" className="space-y-4">
    <h2 id="tutor-review-records-title" className="text-h2-m font-bold sm:text-h2">Öğrenci değerlendirmeleri</h2>
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
      {records.data.results.map(review => <li key={review.id} className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-h3 font-medium tabular-nums">{review.rating.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} / 5</p>{review.subject && <p className="mt-1 text-small text-ink-mid">{review.subject.name} · {review.subject.exam_type}</p>}</div><time className="text-caption text-ink-mid" dateTime={review.created_at}>{formatDate(review.created_at.slice(0, 10))}</time></div>
        <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">{reviewCriteria.map(({ key, label }) => <div key={key}><dt className="text-caption text-ink-mid">{label}</dt><dd className="mt-1 text-small font-medium tabular-nums">{review[key]} / 5</dd></div>)}</dl>
        {review.comment ? <p className="mt-4 whitespace-pre-wrap text-body">{review.comment}</p> : <p className="mt-4 text-small text-ink-mid">Yazılı yorum bırakılmadı.</p>}
      </li>)}
    </ul>
    <div className="flex items-center justify-between gap-4"><Button variant="outline" disabled={!records.data.previous} onClick={() => setPage(current => current - 1)}>Önceki</Button><span className="text-caption text-ink-mid">Sayfa {page}</span><Button variant="outline" disabled={!records.data.next} onClick={() => setPage(current => current + 1)}>Sonraki</Button></div>
  </section>;
}

export function TutorStatisticsPage() {
  const params = useSearchParams(), router = useRouter(), pathname = usePathname();
  const today = istanbulToday();
  const selection = useMemo(() => resolveStatisticsSelection(new URLSearchParams(params.toString()), today), [params, today]);
  const [customFrom, setCustomFrom] = useState(selection.from), [customTo, setCustomTo] = useState(selection.to), [customError, setCustomError] = useState("");
  const navigate = (next: StatisticsSelection) => router.push(`${pathname}?${buildStatisticsQuery(next)}`, { scroll: false });
  useEffect(() => {
    const canonical = buildStatisticsQuery(selection);
    if (params.toString() !== canonical) router.replace(`${pathname}?${canonical}`, { scroll: false });
  }, [params, pathname, router, selection]);
  useEffect(() => { setCustomFrom(selection.from); setCustomTo(selection.to); }, [selection.from, selection.to]);
  const overview = useQuery({ queryKey: ["tutor-statistics", selection.from, selection.to], queryFn: () => fetchTutorStatistics(selection.from, selection.to), enabled: selection.tab === "overview" });
  const income = useQuery({ queryKey: ["tutor-statistics-income", selection.from, selection.to], queryFn: () => fetchTutorIncome(selection.from, selection.to), enabled: selection.tab === "income" });
  const changePeriod = (period: StatisticsPeriod) => {
    if (period === "custom") { navigate({ ...selection, period: "custom" }); return; }
    navigate(resolveStatisticsSelection(new URLSearchParams(`tab=${selection.tab}&period=${period}`), today));
  };
  const applyCustom = () => {
    const resolved = resolveStatisticsSelection(new URLSearchParams(`tab=${selection.tab}&period=custom&from=${customFrom}&to=${customTo}`), today);
    if (resolved.period !== "custom") { setCustomError("Bugünü aşmayan, en fazla 365 günlük geçerli bir aralık seç."); return; }
    setCustomError(""); navigate(resolved);
  };
  return <WorkspacePageShell title="İstatistiklerim" width="wide">
    <div className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between"><div role="tablist" aria-label="İstatistik bölümü" className="flex max-w-full gap-2 overflow-x-auto pb-1">{([{value:"overview",label:"Genel bakış"},{value:"reviews",label:"Değerlendirmeler"},{value:"income",label:"Gelir"}] as const).map(item => <Button key={item.value} role="tab" aria-selected={selection.tab === item.value} variant="outline" onClick={() => navigate({ ...selection, tab: item.value })} className={selection.tab === item.value ? "border-ink bg-ink text-paper hover:bg-ink hover:text-paper" : "border-line"}>{item.label}</Button>)}</div><div role="group" aria-label="İstatistik dönemi" className="flex flex-wrap gap-2">{periods.map(period => <Button key={period.value} variant="outline" size="sm" aria-pressed={selection.period === period.value} onClick={() => changePeriod(period.value)} className={selection.period === period.value ? "border-pink bg-pink text-white hover:bg-pink-deep hover:text-white" : "border-line"}>{period.label}</Button>)}</div></div>
    {selection.period === "custom" && <section className="rounded-card border border-line bg-surface p-4"><div className="flex flex-wrap items-end gap-3"><label className="text-small font-medium">Başlangıç<Input type="date" max={today} value={customFrom} onChange={event => setCustomFrom(event.target.value)} className="mt-1 w-[160px] border-line bg-surface" /></label><label className="text-small font-medium">Bitiş<Input type="date" max={today} value={customTo} onChange={event => setCustomTo(event.target.value)} className="mt-1 w-[160px] border-line bg-surface" /></label><Button onClick={applyCustom}>Uygula</Button></div>{customError && <p role="alert" className="mt-3 text-small text-error">{customError}</p>}</section>}
    {selection.tab === "reviews" ? <Reviews selection={selection} /> : (() => { const active = selection.tab === "overview" ? overview : income; return active.isPending ? <div role="status" className="rounded-card border border-line bg-surface p-8 text-center text-ink-mid">İstatistikler yükleniyor…</div> : active.isError ? <div role="alert" className="rounded-card border border-line bg-surface p-6"><p>İstatistikler yüklenemedi. Veriler sıfır kabul edilmedi.</p><Button variant="outline" className="mt-4" onClick={() => void active.refetch()}>Yeniden dene</Button></div> : selection.tab === "overview" && overview.data ? <Overview data={overview.data} /> : selection.tab === "income" && income.data ? <Income data={income.data} selection={selection} /> : null; })()}
  </WorkspacePageShell>;
}

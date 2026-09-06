import api from "@/lib/api";
import { formatTryMinor } from "@/lib/money";
import type { Subject } from "@/types";

export type StatisticsTab = "overview" | "reviews" | "income";
export type StatisticsPeriod = "30" | "90" | "365" | "custom";
export type StatisticsGranularity = "day" | "week" | "month";

export interface StatisticsSelection {
  tab: StatisticsTab;
  period: StatisticsPeriod;
  from: string;
  to: string;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  change_percent: number | null;
}

export interface TutorStatisticsResponse {
  from: string;
  to: string;
  timezone: "Europe/Istanbul";
  generated_at: string;
  granularity: StatisticsGranularity;
  summary: {
    completed_lessons: ComparisonMetric;
    completed_minutes: ComparisonMetric;
    students: ComparisonMetric;
    reviews: { average: number | null; count: number; previous_average: number | null; previous_count: number };
  };
  lesson_activity: Array<{ period_start: string; completed_count: number; completed_minutes: number }>;
  lesson_statuses: Array<{ status: string; count: number }>;
  subjects: Array<{ id: string; name: string; exam_type: string; completed_count: number; completed_minutes: number }>;
  students: { relationships: number; new: number; activity: Array<{ period_start: string; new_students: number }> };
  reviews: {
    trend: Array<{ period_start: string; average: number | null; count: number }>;
    criteria: Record<string, number | null>;
  };
  reliability: {
    missed_lessons: number;
    reply_rate_24h: { answered: number; total: number; rate: number | null };
    cancellations: Array<{ reason: string; count: number }>;
  };
  coaching: null | {
    summary: { total_sessions: number; completed_sessions: number; students: number };
    activity: Array<{ period_start: string; completed_count: number; completed_minutes: number }>;
    statuses: Array<{ status: string; count: number }>;
  };
}

export interface TutorIncomeResponse {
  from: string;
  to: string;
  timezone: "Europe/Istanbul";
  generated_at: string;
  granularity: StatisticsGranularity;
  currency: "TRY";
  lesson_earnings: { available: boolean; amount_minor: number | null; reason: string };
  packages: {
    count: number;
    recorded_amount_minor: number;
    statuses: Array<{ status: string; count: number; recorded_amount_minor: number }>;
    activity: Array<{ period_start: string; count: number; recorded_amount_minor: number }>;
  };
  coaching: null | {
    entitlement_amount_minor: number;
    status_amounts_minor: Record<string, number>;
    batched_ready_amount_minor: number;
    paid_amount_minor: number;
    activity: Array<{ period_start: string; count: number; entitlement_amount_minor: number }>;
    payout_batches: Array<{ id: string; local_month: string; status: string; total_amount_minor: number; paid_at: string | null }>;
  };
}

export type IncomeRecordKind = "packages" | "earnings" | "payouts";
export interface IncomeRecord {
  id: string;
  kind: IncomeRecordKind;
  occurred_at: string;
  label: string;
  status: string;
  amount_minor: number;
  student?: { id: string; display_name: string };
  service_period_id?: string;
  paid_at?: string | null;
}
export interface IncomeRecordsResponse { count: number; next: number | null; previous: number | null; results: IncomeRecord[] }
export interface TutorReviewRecord {
  id: string;
  subject?: Subject;
  clarity_rating: number;
  preparation_rating: number;
  progress_rating: number;
  confidence_rating: number;
  rating: number;
  comment: string;
  created_at: string;
}
export interface TutorReviewRecordsResponse { count: number; next: number | null; previous: number | null; results: TutorReviewRecord[] }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : parsed;
}

function addDays(value: string, days: number): string {
  const parsed = parseDate(value);
  if (!parsed) return value;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export function statisticsPeriod(period: Exclude<StatisticsPeriod, "custom">, today: string) {
  return { from: addDays(today, -(Number(period) - 1)), to: today };
}

function validCustom(from: string | null, to: string | null, today: string) {
  if (!from || !to) return false;
  const first = parseDate(from), last = parseDate(to), current = parseDate(today);
  if (!first || !last || !current || first > last || last > current) return false;
  return Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1 <= 365;
}

export function resolveStatisticsSelection(params: URLSearchParams, today: string): StatisticsSelection {
  const requestedTab = params.get("tab");
  const tab: StatisticsTab = requestedTab === "income" || requestedTab === "reviews" ? requestedTab : "overview";
  const rawPeriod = params.get("period");
  if (rawPeriod === "custom" && validCustom(params.get("from"), params.get("to"), today)) {
    return { tab, period: "custom", from: params.get("from")!, to: params.get("to")! };
  }
  const period = rawPeriod === "30" || rawPeriod === "365" || rawPeriod === "90" ? rawPeriod : "90";
  return { tab, period, ...statisticsPeriod(period, today) };
}

export function buildStatisticsQuery(selection: StatisticsSelection) {
  const params = new URLSearchParams({ tab: selection.tab, period: selection.period });
  if (selection.period === "custom") {
    params.set("from", selection.from);
    params.set("to", selection.to);
  }
  return params.toString();
}

export function istanbulToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatMinor(amount: number, currency = "TRY") {
  if (currency === "TRY") return formatTryMinor(amount);
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount / 100);
}

export async function fetchTutorStatistics(from: string, to: string): Promise<TutorStatisticsResponse> {
  return (await api.get<TutorStatisticsResponse>("/tutors/me/statistics/", { params: { from, to } })).data;
}
export async function fetchTutorIncome(from: string, to: string): Promise<TutorIncomeResponse> {
  return (await api.get<TutorIncomeResponse>("/tutors/me/statistics/income/", { params: { from, to } })).data;
}
export async function fetchTutorIncomeRecords(from: string, to: string, kind: IncomeRecordKind, page = 1): Promise<IncomeRecordsResponse> {
  return (await api.get<IncomeRecordsResponse>("/tutors/me/statistics/income/records/", { params: { from, to, kind, page } })).data;
}
export async function fetchTutorReviewRecords(from: string, to: string, page = 1): Promise<TutorReviewRecordsResponse> {
  return (await api.get<TutorReviewRecordsResponse>("/tutors/me/statistics/reviews/", { params: { from, to, page } })).data;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor", paid: "Ödendi kaydı", cancelled: "İptal", refunded: "İade edildi",
  confirmed: "Kesinleşti", in_progress: "Devam ediyor", awaiting_confirmation: "Onay bekliyor",
  completed: "Tamamlandı", disputed: "İnceleniyor", expired: "Süresi doldu",
  scheduled: "Planlandı", reschedule_requested: "Saat değişikliği bekliyor", awaiting_report: "Rapor bekliyor",
  student_no_show: "Öğrenci katılmadı", tutor_no_show: "Hoca katılmadı", technical_failure: "Teknik sorun",
  eligible_unfunded: "Fonlanmamış hakediş", on_hold: "Beklemede", reversed: "Ters kayıt", ready: "Ödemeye hazır",
};

export const CANCELLATION_LABELS: Record<string, string> = {
  student_cancelled: "Öğrenci iptal etti", student_late_cancel: "Öğrenci geç iptal etti",
  tutor_cancelled: "Hoca iptal etti", tutor_late_cancel: "Hoca geç iptal etti",
  tutor_no_show: "Hoca katılmadı", tutor_unanswered: "Hoca yanıtlamadı",
  no_attendance: "Katılım olmadı", admin_resolution: "Yönetici kararı", unknown: "Nedeni bilinmiyor",
};

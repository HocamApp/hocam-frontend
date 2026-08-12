import { CircleDollarSign, Info, Landmark, WalletCards } from "lucide-react";

import { CoachingEarningsChart } from "@/components/coaching/CoachingEarningsChart";
import { CoachingStudioPanel } from "@/components/coaching/CoachingStudioPanel";
import { coachingEarningStatusCopy, type CoachingTutorEarningSummary } from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

const SUMMARY_ROWS = [
  ["eligible_unfunded", "Kazanç hesabına uygun", "eligible_unfunded_minor"],
  ["pending", "Aylık değerlendirmede", "pending_minor"],
  ["on_hold", "İncelemede", "on_hold_minor"],
  ["reversed", "Geri çevrilen kayıt", "reversed_minor"],
] as const;

const STATUS_COLORS = ["bg-primary", "bg-foreground", "bg-amber-500", "bg-muted-foreground"];

export function CoachingEarningsSummary({ summary }: { summary: CoachingTutorEarningSummary }) {
  const values = SUMMARY_ROWS.map(([, , key]) => Math.max(0, summary[key]));
  const total = values.reduce((sum, value) => sum + value, 0);
  const orderedBatches = [...summary.payout_batches].sort((a, b) => b.local_month.localeCompare(a.local_month));

  return (
    <div className="space-y-5">
      <CoachingStudioPanel tone="dark" className="relative isolate overflow-hidden border-0">
        <div aria-hidden className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[2rem] border-primary/15" />
        <div aria-hidden className="absolute bottom-0 right-16 h-32 w-56 rounded-t-full bg-primary/10 blur-2xl" />
        <div className="relative grid gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end">
          <div>
            <div className="flex items-center gap-3 text-background/70">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-background/15 bg-background/10">
                <WalletCards className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em]">Çalışma koçluğu</p>
                <h2 className="mt-1 text-lg font-semibold text-background">Koçluk kazanç cüzdanı</h2>
              </div>
            </div>
            <p className="mt-8 text-sm text-background/65">Kazanç hesabına uygun</p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-background tabular-nums sm:text-5xl">
              {formatTryMinor(summary.eligible_unfunded_minor)}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-background/65">
              Bu tutar bir banka bakiyesi veya çekilebilir tutar değildir; kullanılabilir ödeme fonu henüz doğrulanmamıştır.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-[1.25rem] border border-background/15 bg-background/[0.07] p-4 backdrop-blur-sm">
            <HeroMetric label="Aylık değerlendirmede" value={formatTryMinor(summary.pending_minor)} />
            <HeroMetric label="Aylık kayıt" value={`${summary.payout_batches.length}`} />
          </div>
        </div>
      </CoachingStudioPanel>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.65fr)]">
        <CoachingStudioPanel className="min-w-0 overflow-hidden">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Gerçek aylık kayıtlar</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Koçluk kazanç akışı</h2>
                <p className="mt-1 text-sm text-muted-foreground">Son altı aylık muhasebe kaydı, tarih sırasıyla.</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Aylık</span>
            </div>
          </div>
          <div className="bg-[linear-gradient(to_bottom,hsl(var(--muted)/0.3),transparent)] px-2 pb-2 pt-4 sm:px-5">
            <CoachingEarningsChart batches={summary.payout_batches} />
            <p className="px-3 pb-3 pt-1 text-right text-[11px] font-medium text-muted-foreground sm:hidden">
              Ayları görmek için grafiği yatay kaydır
            </p>
          </div>
        </CoachingStudioPanel>

        <CoachingStudioPanel className="overflow-hidden">
          <div className="border-b border-border/60 bg-muted/30 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
                <Landmark className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Finansal görünüm</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Güncel durum dağılımı</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div aria-label="Kazanç durumlarının dağılımı" className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {values.map((value, index) => (
                <span
                  key={SUMMARY_ROWS[index][0]}
                  className={STATUS_COLORS[index]}
                  style={{ width: total > 0 ? `${(value / total) * 100}%` : "0%" }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="divide-y">
              {SUMMARY_ROWS.map(([status, label, key], index) => (
                <div key={status} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[index]}`} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{coachingEarningStatusCopy(status)}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">{formatTryMinor(summary[key])}</p>
                </div>
              ))}
            </div>
          </div>
        </CoachingStudioPanel>
      </div>

      <CoachingStudioPanel>
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]">
          <div>
            <h2 className="font-semibold">Aylık kazanç kayıtları</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Platform içi muhasebe durumlarının kronolojik görünümü.</p>
            {orderedBatches.length ? (
              <div className="mt-4 divide-y overflow-hidden rounded-[1.15rem] border">
                {orderedBatches.map((batch) => (
                  <div key={batch.local_month} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{formatMonth(batch.local_month)}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{coachingEarningStatusCopy(batch.status)}</p>
                    </div>
                    <p className="font-semibold tabular-nums">{formatTryMinor(batch.total_amount_minor)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex gap-3 rounded-[1.15rem] border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
                <CircleDollarSign aria-hidden className="h-5 w-5 shrink-0" />
                <p>Henüz aylık kazanç kaydı oluşmadı.</p>
              </div>
            )}
          </div>
          <div role="note" aria-label="Finansal kayıt açıklaması" className="flex gap-3 self-start rounded-[1.15rem] border bg-muted/25 p-4 text-xs leading-5 text-muted-foreground">
            <Info aria-hidden className="h-4 w-4 shrink-0" />
            <p>Kazancın hesaba uygun hale geldiği tarih bir ödeme tarihi değildir. Dış ödeme mutabakatı ayrıca doğrulanmadan banka aktarımının tamamlandığı sonucu çıkarılmaz.</p>
          </div>
        </div>
      </CoachingStudioPanel>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] leading-4 text-background/55">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-background tabular-nums">{value}</p>
    </div>
  );
}

function formatMonth(localMonth: string) {
  const [year, month] = localMonth.split("-").map(Number);
  if (!year || !month) return localMonth;
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

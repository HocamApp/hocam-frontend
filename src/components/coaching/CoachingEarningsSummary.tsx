import { CircleDollarSign, Info, WalletCards } from "lucide-react";

import { CoachingStudioPanel } from "@/components/coaching/CoachingStudioPanel";
import { coachingEarningStatusCopy, type CoachingTutorEarningSummary } from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

const SUMMARY_ROWS = [
  ["eligible_unfunded", "Kazanç hesabına uygun", "eligible_unfunded_minor"],
  ["pending", "Aylık değerlendirmede", "pending_minor"],
  ["on_hold", "İncelemede", "on_hold_minor"],
  ["reversed", "Geri çevrilen kayıt", "reversed_minor"],
] as const;

export function CoachingEarningsSummary({ summary }: { summary: CoachingTutorEarningSummary }) {
  const values = SUMMARY_ROWS.map(([, , key]) => Math.max(0, summary[key]));
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-5">
      <CoachingStudioPanel className="overflow-hidden">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <WalletCards className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Kazanç görünümü</h2>
              <p className="mt-1 text-sm text-muted-foreground">Koçluk kazanç kayıtlarının güncel dağılımı.</p>
            </div>
          </div>
          <div className="space-y-4 rounded-[1.25rem] bg-muted/40 p-4 sm:p-5">
            <div aria-label="Kazanç durumlarının dağılımı" className="flex h-3 overflow-hidden rounded-full bg-background">
              {values.map((value, index) => (
                <span
                  key={SUMMARY_ROWS[index][0]}
                  className={["bg-primary", "bg-foreground", "bg-amber-500", "bg-muted-foreground"][index]}
                  style={{ width: total > 0 ? `${(value / total) * 100}%` : index === 0 ? "100%" : "0%" }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SUMMARY_ROWS.map(([status, label, key], index) => (
                <div key={status} className="rounded-xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${["bg-primary", "bg-foreground", "bg-amber-500", "bg-muted-foreground"][index]}`} aria-hidden="true" />
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">{formatTryMinor(summary[key])}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{coachingEarningStatusCopy(status)}</p>
                </div>
              ))}
            </div>
          </div>
          <div role="note" aria-label="Finansal kayıt açıklaması" className="flex gap-3 rounded-[1.15rem] border bg-background/70 p-4 text-xs leading-5 text-muted-foreground">
            <Info aria-hidden className="h-4 w-4 shrink-0" />
            <p>Tutarlar platform içi muhasebe kaydını gösterir. Bir durumun işlenmiş olması banka aktarımının tamamlandığı anlamına gelmez.</p>
          </div>
        </div>
      </CoachingStudioPanel>

      <CoachingStudioPanel>
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Aylık kazanç kayıtları</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Bunlar platform içi muhasebe durumlarıdır; banka hesabına dış aktarımın tamamlandığını tek başına kanıtlamaz.</p>
          </div>
          {summary.payout_batches.length ? (
            <div className="divide-y overflow-hidden rounded-[1.15rem] border">
              {summary.payout_batches.map((batch) => (
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
            <div className="flex gap-3 rounded-[1.15rem] border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
              <CircleDollarSign aria-hidden className="h-5 w-5 shrink-0" />
              <p>Henüz aylık kazanç kaydı oluşmadı.</p>
            </div>
          )}
          <div className="flex gap-3 rounded-[1.15rem] border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
            <Info aria-hidden className="h-4 w-4 shrink-0" />
            <p>Kazancın hesaba uygun hale geldiği tarih bir ödeme tarihi değildir. Dış ödeme mutabakatı ayrıca doğrulanmadan banka aktarımının tamamlandığı sonucu çıkarılmaz.</p>
          </div>
        </div>
      </CoachingStudioPanel>
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

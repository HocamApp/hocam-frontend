import { CircleDollarSign, Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { coachingEarningStatusCopy, type CoachingTutorEarningSummary } from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

const SUMMARY_ROWS = [
  ["eligible_unfunded", "Kazanç hesabına uygun", "eligible_unfunded_minor"],
  ["pending", "Aylık değerlendirmede", "pending_minor"],
  ["on_hold", "İncelemede", "on_hold_minor"],
  ["reversed", "Geri çevrilen kayıt", "reversed_minor"],
] as const;

export function CoachingEarningsSummary({ summary }: { summary: CoachingTutorEarningSummary }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {SUMMARY_ROWS.map(([status, label, key]) => (
          <Card key={status} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{formatTryMinor(summary[key])}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{coachingEarningStatusCopy(status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Aylık kazanç kayıtları</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Bunlar platform içi muhasebe durumlarıdır; banka hesabına dış aktarımın tamamlandığını tek başına kanıtlamaz.</p>
          </div>
          {summary.payout_batches.length ? (
            <div className="divide-y rounded-lg border">
              {summary.payout_batches.map((batch) => (
                <div key={batch.local_month} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{batch.local_month}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{coachingEarningStatusCopy(batch.status)}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatTryMinor(batch.total_amount_minor)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 rounded-lg border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
              <CircleDollarSign aria-hidden className="h-5 w-5 shrink-0" />
              <p>Henüz aylık kazanç kaydı oluşmadı.</p>
            </div>
          )}
          <div className="flex gap-3 rounded-lg border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
            <Info aria-hidden className="h-4 w-4 shrink-0" />
            <p>Kazancın hesaba uygun hale geldiği tarih bir ödeme tarihi değildir. Dış ödeme mutabakatı ayrıca doğrulanmadan banka aktarımının tamamlandığı sonucu çıkarılmaz.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

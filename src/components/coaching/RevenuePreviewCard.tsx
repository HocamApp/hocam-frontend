"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { CoachingRevenuePreview } from "@/lib/coachingApi";

const DURATION_LABELS: Record<number, string> = {
  14: "2 hafta",
  30: "1 ay",
  90: "3 ay",
  180: "6 ay",
};

/**
 * Earnings preview across the four package lengths.
 *
 * Every amount here is computed and formatted by the backend — the client
 * does no pricing arithmetic. The API also returns raw `*_minor` integers
 * alongside these strings for callers that prefer to localise themselves.
 */
export function RevenuePreviewCard({
  preview,
}: {
  preview: CoachingRevenuePreview;
}) {
  const commissionPercent = preview.commission_bps / 100;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-lg font-semibold">Kazanç önizlemesi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Görüşme başına {preview.unit_price_display}. Platform komisyonu %
            {commissionPercent}. Tutarlar öğrencinin seçtiği paket süresine göre
            hesaplanır.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Paket</th>
                <th className="py-2 pr-3 font-medium">Görüşme</th>
                <th className="py-2 pr-3 font-medium">Liste</th>
                <th className="py-2 pr-3 font-medium">İndirim</th>
                <th className="py-2 pr-3 font-medium">Komisyon</th>
                <th className="py-2 font-medium">Net kazanç</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr key={row.duration_days} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    {DURATION_LABELS[row.duration_days] ?? `${row.duration_days} gün`}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{row.total_sessions}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {row.subtotal_price_display}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                    −{row.discount_amount_display}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-muted-foreground">
                    −{row.platform_fee_display}
                  </td>
                  <td className="py-2 font-medium tabular-nums">
                    {row.tutor_net_display}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Bu bir tahmindir. Gerçek tahsilat ve ödeme akışı henüz devrede
          değildir.
        </p>
      </CardContent>
    </Card>
  );
}

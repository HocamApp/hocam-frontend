"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachingRevenuePreview, CoachingRevenueRow } from "@/lib/coachingApi";

export function RevenuePreviewCard({ preview }: { preview: CoachingRevenuePreview }) {
  const primary = preview.rows.find((row) => row.weeks === 4) ?? preview.rows[0];
  const alternatives = preview.rows.filter((row) => row !== primary);
  if (!primary) return null;

  return (
    <Card>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sunucu hesaplaması</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Bir aylık tahmini kazanç</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Paket indirimi ve %{preview.commission_bps / 100} platform komisyonu mevcut katalog/config kurallarıyla hesaplanır.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <RevenueValue label="Görüşme" value={`${primary.total_sessions} görüşme`} />
          <RevenueValue label={`Paket indirimi · %${primary.discount_percent}`} value={`−${primary.discount_amount_display}`} />
          <RevenueValue label="Tahmini net" value={primary.tutor_net_display} prominent />
        </div>

        <div className="rounded-lg border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">
          Görüşme fiyatı {preview.unit_price_display}. Bu ekran tahsilat veya banka ödemesi göstermez; yalnız plan ve paket verilerinden oluşan bir tahmindir.
        </div>

        {alternatives.length > 0 ? (
          <Accordion type="single" collapsible>
            <AccordionItem value="other-packages" className="border-0">
              <AccordionTrigger>Diğer paketlerde kazancını gör</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {alternatives.map((row) => (
                    <PackageRevenue key={row.duration_days} row={row} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RevenueValue({ label, value, prominent = false }: { label: string; value: string; prominent?: boolean }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={prominent ? "mt-1 text-xl font-semibold tabular-nums" : "mt-1 font-semibold tabular-nums"}>{value}</p>
    </div>
  );
}

function PackageRevenue({ row }: { row: CoachingRevenueRow }) {
  return (
    <div className="rounded-lg border bg-background p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.weeks} haftalık paket</p>
          <p className="text-xs text-muted-foreground">{row.total_sessions} görüşme · %{row.discount_percent} paket indirimi</p>
        </div>
        <p className="font-semibold tabular-nums">{row.tutor_net_display}</p>
      </div>
      <dl className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">
        <div className="flex justify-between gap-3"><dt>Öğrenci toplamı</dt><dd>{row.total_price_display}</dd></div>
        <div className="flex justify-between gap-3"><dt>Platform komisyonu</dt><dd>−{row.platform_fee_display}</dd></div>
      </dl>
    </div>
  );
}

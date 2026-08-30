"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import type { CoachingRevenuePreview, CoachingRevenueRow } from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

export function RevenuePreviewCard({ preview }: { preview: CoachingRevenuePreview }) {
  const primary = preview.rows.find((row) => row.weeks === 4) ?? preview.rows[0];
  const alternatives = preview.rows.filter((row) => row !== primary);
  if (!primary) return null;

  return (
    <Card role="region" aria-label="Sunucu hesaplamalı kazanç tahmini" className="overflow-hidden rounded-card border-line bg-surface shadow-none">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold text-pink">Sunucu hesaplaması</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Bir aylık tahmini kazanç</h2>
          <p className="mt-1 text-sm leading-6 text-ink-mid">
            Paket indirimi ve %{preview.commission_bps / 100} platform komisyonu mevcut katalog/config kurallarıyla hesaplanır.
          </p>
        </div>

        <div className="rounded-card border border-line bg-paper p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-ink-mid">Tahmini net koçluk kazancı</p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-ink">{formatTryMinor(primary.tutor_net_minor)}</p>
            </div>
            <p className="flex flex-wrap items-center gap-1 text-sm font-semibold">
              <span>{primary.total_sessions} görüşme</span>
              <span aria-hidden="true">·</span>
              <span>{primary.weeks} hafta</span>
            </p>
          </div>
          <dl className="mt-5 flex flex-col gap-3 border-t border-line pt-4 text-xs sm:flex-row sm:flex-wrap sm:justify-between">
            <RevenueLine label="Öğrencinin koçluk toplamı" value={formatTryMinor(primary.total_price_minor)} />
            <RevenueLine label={`Paket indirimi · %${primary.discount_percent}`} value={`−${formatTryMinor(primary.discount_amount_minor)}`} />
            <RevenueLine label="Platform komisyonu" value={`−${formatTryMinor(primary.platform_fee_minor)}`} />
          </dl>
        </div>

        <div className="rounded-input border border-line bg-surface p-4 text-xs leading-5 text-ink-mid">
          Görüşme fiyatı {formatTryMinor(preview.unit_price_minor)}. Bu ekran tahsilat veya banka ödemesi göstermez; yalnız plan ve paket verilerinden oluşan bir tahmindir.
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

function RevenueLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-[11rem] justify-between gap-3 sm:block">
      <dt className="text-ink-mid">{label}</dt>
      <dd className="font-bold tabular-nums text-ink sm:mt-1">{value}</dd>
    </div>
  );
}

function PackageRevenue({ row }: { row: CoachingRevenueRow }) {
  return (
    <div className="rounded-input border border-line bg-surface p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{row.weeks} haftalık paket</p>
          <p className="text-xs text-ink-mid">{row.total_sessions} görüşme · %{row.discount_percent} paket indirimi</p>
        </div>
        <p className="font-semibold tabular-nums">{formatTryMinor(row.tutor_net_minor)}</p>
      </div>
      <dl className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-ink-mid">
        <div className="flex justify-between gap-3"><dt>Öğrenci toplamı</dt><dd>{formatTryMinor(row.total_price_minor)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Platform komisyonu</dt><dd>−{formatTryMinor(row.platform_fee_minor)}</dd></div>
      </dl>
    </div>
  );
}

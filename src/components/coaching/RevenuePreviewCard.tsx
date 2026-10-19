"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionBandHeading, sectionBandClass } from "@/components/shared/SectionBand";
import type { CoachingRevenuePreview, CoachingRevenueRow } from "@/lib/coachingApi";
import { formatBpsPercent, formatTryMinor } from "@/lib/money";


/** "−12,00 ₺" for a real deduction, plain "0,00 ₺" for none (a free plan
 * used to read "−0,00 ₺"). */
function deduction(minor: number) {
  return minor > 0 ? `−${formatTryMinor(minor)}` : formatTryMinor(0);
}

/**
 * What a month of coaching earns the tutor. The tutor's own numbers, so the
 * band is ink; the offer a student reads wears the pink one.
 *
 * Plain class strings: tailwind-merge would drop a named size such as
 * `text-h2-m` next to a text colour.
 */
export function RevenuePreviewCard({ preview }: { preview: CoachingRevenuePreview }) {
  const primary = preview.rows.find((row) => row.weeks === 4) ?? preview.rows[0];
  const alternatives = preview.rows.filter((row) => row !== primary);
  if (!primary) return null;

  return (
    <div
      role="region"
      aria-label="Tahmini kazanç"
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      <div className={sectionBandClass("ink")}>
        <SectionBandHeading
          id="coaching-revenue-title"
          title="Bir aylık tahmini kazanç"
          subtitle={`Paket indirimi ve %${formatBpsPercent(preview.commission_bps)} platform komisyonu düşülerek hesaplanır.`}
        />
      </div>

      <div className="space-y-5 px-6 pb-6 pt-5">
        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-label text-ink-mid">Tahmini net koçluk kazancı</p>
              <p className="mt-1 text-h2-m font-bold tabular-nums text-ink md:text-h2">{formatTryMinor(primary.tutor_net_minor)}</p>
            </div>
            <p className="flex flex-wrap items-center gap-1 text-small font-medium text-ink">
              <span>{primary.total_sessions} görüşme</span>
              <span aria-hidden="true">·</span>
              <span>{primary.weeks} hafta</span>
            </p>
          </div>
          <dl className="mt-4">
            <RevenueLine label="Öğrencinin koçluk toplamı" value={formatTryMinor(primary.total_price_minor)} />
            <RevenueLine label={`Paket indirimi · %${primary.discount_percent}`} value={deduction(primary.discount_amount_minor)} />
            <RevenueLine label="Platform komisyonu" value={deduction(primary.platform_fee_minor)} />
          </dl>
        </div>

        <div className="rounded-input border border-line p-4 text-label leading-5 text-ink-mid">
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
      </div>
    </div>
  );
}

function RevenueLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-line py-2.5 text-small">
      <dt className="text-ink-mid">{label}</dt>
      <dd className="font-bold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function PackageRevenue({ row }: { row: CoachingRevenueRow }) {
  return (
    <div className="rounded-input border border-line bg-surface p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{row.weeks} haftalık paket</p>
          <p className="text-xs text-ink-mid">{row.total_sessions} görüşme · %{row.discount_percent} paket indirimi</p>
        </div>
        <p className="font-medium tabular-nums">{formatTryMinor(row.tutor_net_minor)}</p>
      </div>
      <dl className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-ink-mid">
        <div className="flex justify-between gap-3"><dt>Öğrenci toplamı</dt><dd>{formatTryMinor(row.total_price_minor)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Platform komisyonu</dt><dd>{deduction(row.platform_fee_minor)}</dd></div>
      </dl>
    </div>
  );
}

"use client";

import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { formatTryMinor } from "@/lib/money";
import { formatPlanDuration, type PackagePricing } from "@/lib/lessonPricing";
import type { CoachingQuote } from "@/lib/coachingApi";
import type { TutorProfile } from "@/types";

interface CheckoutSummaryProps {
  tutor: TutorProfile;
  lessonsPerWeek: number;
  durationDays: number;
  /** Null while the plan catalog loads or when the combo has no active plan. */
  pricing: PackagePricing | null;
  /** False when the selected combo has no active backend plan. */
  planAvailable: boolean;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onPurchaseCta: () => void;
  purchasePending: boolean;
  /** Student already has a pending purchase for the selected plan. */
  pendingForSelectedPlan: boolean;
  /** Name of a different plan with a pending purchase for this tutor, if any. */
  otherPendingPlanName: string | null;
  /** Remaining credits on a paid package with this tutor, if any. */
  paidRemainingCredits: number | null;
  onUseCredits: () => void;
  /** Server-priced coaching add-on; null when coaching is not selected. */
  coachingQuote?: CoachingQuote | null;
  /** Server-issued hold expiry — the countdown source, not a local timer. */
  coachingHoldExpiresAt?: string | null;
  /**
   * Set when the student chose coaching but the server has not quoted or
   * held it. The summary then shows lesson-only numbers, so it must say
   * out loud that coaching is not in this order — and the CTA is blocked
   * rather than quietly submitting a different basket than the one shown.
   */
  coachingBlockedMessage?: string | null;
  /**
   * The student picked coaching but is not eligible for it. Unlike
   * `coachingBlockedMessage` this is not transient and does not block the
   * CTA — the lesson package alone is a valid order. It only has to be
   * said out loud instead of silently dropping what they chose.
   */
  coachingUnavailableMessage?: string | null;
  /** The server refused the submit because the coaching price moved. */
  coachingPriceChanged?: boolean;
  onAcceptNewCoachingPrice?: () => void;
  /** Back to the coaching choice step, keeping the package selection. */
  coachingEditHref?: string;
}

export function CheckoutSummary({
  tutor,
  lessonsPerWeek,
  durationDays,
  pricing,
  planAvailable,
  promoCode,
  onPromoCodeChange,
  onPurchaseCta,
  purchasePending,
  pendingForSelectedPlan,
  otherPendingPlanName,
  paidRemainingCredits,
  onUseCredits,
  coachingQuote = null,
  coachingHoldExpiresAt = null,
  coachingBlockedMessage = null,
  coachingUnavailableMessage = null,
  coachingPriceChanged = false,
  onAcceptNewCoachingPrice,
  coachingEditHref,
}: CheckoutSummaryProps) {
  const hasDiscount = !!pricing && pricing.discountPercent > 0;
  // Bundle total is summed in minor units — the lesson package's whole-TL
  // total is converted up, never the coaching total rounded down.
  const bundleTotalMinor =
    pricing && coachingQuote
      ? pricing.total * 100 + coachingQuote.total_price_minor
      : null;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-lg font-semibold">Paket özeti</h2>

        <dl className="space-y-2 text-sm" aria-live="polite">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Hoca</dt>
            <dd className="text-right font-medium">
              {tutor.name} {tutor.surname}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ders süresi</dt>
            <dd>40 dk</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Haftalık ders</dt>
            <dd>Haftada {lessonsPerWeek} ders</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Paket süresi</dt>
            <dd>{formatPlanDuration(durationDays)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Toplam ders</dt>
            <dd>{pricing ? `${pricing.lessonCount} ders` : "—"}</dd>
          </div>

          <Separator className="!my-3" />

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Ders başına</dt>
            <dd>
              {hasDiscount && pricing && (
                <span className="mr-1.5 text-xs text-muted-foreground line-through">
                  {formatPrice(pricing.basePerLesson)}
                </span>
              )}
              <span className="font-medium">
                {pricing ? formatPrice(pricing.discountedPerLesson) : "—"}
              </span>
            </dd>
          </div>
          {pricing && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                Ara toplam ({pricing.lessonCount} ders)
              </dt>
              <dd>{formatPrice(pricing.subtotal)}</dd>
            </div>
          )}
          {hasDiscount && pricing && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                İndirim (%{pricing.discountPercent})
              </dt>
              <dd className="text-green-700 dark:text-green-400">
                -{formatPrice(pricing.discountAmount)}
              </dd>
            </div>
          )}
          {coachingQuote && (
            <>
              <Separator className="!my-3" />
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium text-foreground">Çalışma koçluğu</dt>
                {coachingEditHref && (
                  <Link
                    href={coachingEditHref}
                    className="text-xs underline underline-offset-2 hover:text-foreground"
                  >
                    Düzenle
                  </Link>
                )}
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {coachingQuote.total_sessions} görüşme ×{" "}
                  {coachingQuote.unit_price_display}
                </dt>
                <dd>{coachingQuote.subtotal_price_display}</dd>
              </div>
              {/* Amount, not just percent: a free plan still carries the
                  package's discount percent, and "Paket indirimi (%16)
                  -0,00 ₺" is a line that says nothing. */}
              {coachingQuote.discount_percent > 0 &&
                coachingQuote.discount_amount_minor > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Paket indirimi (%{coachingQuote.discount_percent})
                  </dt>
                  <dd className="text-green-700 dark:text-green-400">
                    -{coachingQuote.discount_amount_display}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Koçluk toplamı</dt>
                <dd className="font-medium">
                  {coachingQuote.is_free
                    ? "₺0 — Ders paketinle ücretsiz"
                    : coachingQuote.total_price_display}
                </dd>
              </div>
              {coachingHoldExpiresAt && (
                <p className="text-xs text-muted-foreground">
                  Koçluk kontenjanın{" "}
                  {new Date(coachingHoldExpiresAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  &apos;e kadar senin için tutuluyor.
                </p>
              )}
            </>
          )}

        </dl>

        {/* Blocking notices live INSIDE the sticky footer, above the total.
            Below md that footer is pinned, so anything left in the scrolling
            list above it can sit off-screen while the CTA stays visible —
            i.e. the student reads "Paket talebi oluştur" and never sees why
            coaching is missing from the price next to it. */}
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-6 space-y-2 border-t bg-card/95 px-6 pt-2 backdrop-blur md:static md:bottom-auto md:z-auto md:mx-0 md:border-t-0 md:bg-transparent md:px-0 md:pt-1 md:backdrop-blur-none">
          {coachingUnavailableMessage && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-sm font-medium">
                Çalışma koçluğu şu anda eklenemiyor
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {coachingUnavailableMessage} Aşağıdaki tutar yalnız ders
                paketini kapsıyor.
              </p>
            </div>
          )}

          {coachingPriceChanged && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm font-medium">Koçluk fiyatı değişti</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Öğretmen sen bu sayfadayken koçluk ücretini güncelledi.
                Yukarıdaki tutarlar yeni fiyata göre. Talebin
                oluşturulmadı — devam etmek için yeni tutarı onayla.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={onAcceptNewCoachingPrice}
              >
                Yeni tutarı onaylıyorum
              </Button>
            </div>
          )}

          {coachingBlockedMessage && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm font-medium">
                Çalışma koçluğu bu talebe eklenemedi
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {coachingBlockedMessage} Aşağıdaki tutar yalnız ders
                paketini kapsıyor. Sayfayı yenileyip tekrar deneyebilir ya
                da koçluk seçimini kaldırıp devam edebilirsin.
              </p>
            </div>
          )}

          {/* Total sits directly above the CTA; below md (where MobileTabBar
              is visible — see components/layout/MobileTabBar.tsx's own
              md:hidden) this whole block is sticky so total + CTA stay
              reachable while detail rows scroll. Reset at md, not lg: the
              page's lg:grid-cols-3 column layout is a separate, unrelated
              breakpoint from the tab bar's. */}
          <div className="flex items-center justify-between gap-4 text-base font-semibold text-foreground">
            <span>{coachingQuote ? "Toplam" : "Paket toplamı"}</span>
            <span>
              {bundleTotalMinor !== null
                ? formatTryMinor(bundleTotalMinor)
                : pricing
                  ? formatPrice(pricing.total)
                  : "—"}
            </span>
          </div>
          {pendingForSelectedPlan ? (
            <div className="space-y-2 rounded-lg bg-amber-500/10 p-3 text-center">
              <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4 shrink-0" />
                Admin onayı bekleniyor
              </p>
              <p className="text-xs text-muted-foreground">
                Bu paket için talebin zaten var. Onaylandığında ders hakların
                aktifleşecek.
              </p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/profile/payments">Paketlerimi görüntüle</Link>
              </Button>
            </div>
          ) : (
            <>
              {otherPendingPlanName && (
                <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  Bu hoca için bekleyen bir paket talebin zaten var (
                  {otherPendingPlanName}). Yine de yeni bir talep
                  oluşturabilirsin.
                </p>
              )}
              <Input
                value={promoCode}
                onChange={(e) => onPromoCodeChange(e.target.value)}
                placeholder="İndirim kodu (opsiyonel)"
                className="h-9 text-sm"
                disabled={purchasePending}
                aria-label="İndirim kodu"
              />
              <p className="text-xs text-muted-foreground">
                İndirim kodu talep oluşturulurken uygulanır.
              </p>
              <Button
                className="w-full"
                onClick={onPurchaseCta}
                disabled={
                  purchasePending ||
                  !planAvailable ||
                  !!coachingBlockedMessage ||
                  coachingPriceChanged
                }
              >
                {purchasePending ? "Oluşturuluyor..." : "Paket talebi oluştur"}
              </Button>
              {!planAvailable && (
                <p className="text-center text-xs text-destructive">
                  Bu kombinasyon şu anda satışta değil.
                </p>
              )}
            </>
          )}

          {paidRemainingCredits !== null && paidRemainingCredits > 0 && (
            <div className="space-y-2 rounded-lg bg-green-500/10 p-3 text-center">
              <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Bu hocada kullanılabilir {paidRemainingCredits} ders hakkın var
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onUseCredits}
              >
                Ders hakkını kullan
              </Button>
            </div>
          )}

          <div className="space-y-1.5 rounded-lg bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              Tek seferlik ödeme — otomatik yenilenmez.
            </p>
            <p className="text-xs text-muted-foreground">
              Bu paket yalnızca {tutor.name} {tutor.surname} ile geçerlidir.
            </p>
            <p className="text-xs text-muted-foreground">
              Talebin önce öğretmenine iletilir. Öğretmen kabul ettikten sonra
              ödeme aktivasyonu beklenir; kartından anlık ödeme alınmaz.{" "}
              <Link
                href="/support#odeme-ve-iade"
                className="underline underline-offset-2 hover:text-foreground"
              >
                İade politikası
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

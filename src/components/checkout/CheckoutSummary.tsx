"use client";

import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { formatPlanDuration, type PackagePricing } from "@/lib/lessonPricing";
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
}: CheckoutSummaryProps) {
  const hasDiscount = !!pricing && pricing.discountPercent > 0;

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
          <div className="flex justify-between gap-4 text-base font-semibold text-foreground">
            <dt>Paket toplamı</dt>
            <dd>{pricing ? formatPrice(pricing.total) : "—"}</dd>
          </div>
        </dl>

        <div className="space-y-2 pt-1">
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
                disabled={purchasePending || !planAvailable}
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
              Talep admin onayıyla aktifleşir; kartından anlık ödeme alınmaz.{" "}
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

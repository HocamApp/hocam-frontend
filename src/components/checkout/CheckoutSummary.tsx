"use client";

import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { PackagePricing } from "@/lib/lessonPricing";
import type { TutorProfile } from "@/types";
import type { CheckoutPackageType } from "./CheckoutProductPicker";

interface CheckoutSummaryProps {
  tutor: TutorProfile;
  packageType: CheckoutPackageType;
  lessonsPerWeek: number;
  termMonths: number;
  pricing: PackagePricing;
  /** False when the selected weekly combo has no active backend plan. */
  planAvailable: boolean;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onSingleLessonCta: () => void;
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

const PACKAGE_LABELS: Record<CheckoutPackageType, string> = {
  single: "Tekli ders",
  ten_pack: "10 derslik avantajlı paket",
  weekly: "Haftalık ders paketi",
};

export function CheckoutSummary({
  tutor,
  packageType,
  lessonsPerWeek,
  termMonths,
  pricing,
  planAvailable,
  promoCode,
  onPromoCodeChange,
  onSingleLessonCta,
  onPurchaseCta,
  purchasePending,
  pendingForSelectedPlan,
  otherPendingPlanName,
  paidRemainingCredits,
  onUseCredits,
}: CheckoutSummaryProps) {
  const isSingle = packageType === "single";
  const hasDiscount = pricing.discountPercent > 0;

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
            <dd>{isSingle ? "Rezervasyonda seçilir (40–60 dk)" : "40 dk"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Paket</dt>
            <dd className="text-right">
              {packageType === "weekly"
                ? `Haftada ${lessonsPerWeek} ders`
                : PACKAGE_LABELS[packageType]}
            </dd>
          </div>
          {packageType === "weekly" && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Plan süresi</dt>
              <dd>{termMonths} Ay</dd>
            </div>
          )}
          {!isSingle && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Toplam ders</dt>
              <dd>{pricing.lessonCount} ders</dd>
            </div>
          )}

          <Separator className="!my-3" />

          {isSingle ? (
            <div className="flex justify-between gap-4 text-base font-semibold text-foreground">
              <dt>Ders ücreti (40 dk)</dt>
              <dd>{formatPrice(pricing.total)}</dd>
            </div>
          ) : (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Ders başına</dt>
                <dd>
                  {hasDiscount && (
                    <span className="mr-1.5 text-xs text-muted-foreground line-through">
                      {formatPrice(pricing.basePerLesson)}
                    </span>
                  )}
                  <span className="font-medium">
                    {formatPrice(pricing.discountedPerLesson)}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Ara toplam ({pricing.lessonCount} ders)
                </dt>
                <dd>{formatPrice(pricing.subtotal)}</dd>
              </div>
              {hasDiscount && (
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
                <dd>{formatPrice(pricing.total)}</dd>
              </div>
            </>
          )}
        </dl>

        {isSingle && (
          <p className="text-xs text-muted-foreground">
            50–60 dk seçersen fiyat orantılı artar.
          </p>
        )}

        <div className="space-y-2 pt-1">
          {isSingle ? (
            <Button className="w-full" onClick={onSingleLessonCta}>
              Ders saatini seç
            </Button>
          ) : pendingForSelectedPlan ? (
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

          <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Güvenli ödeme. Paket otomatik yenilenmez.
          </p>
          {!isSingle && (
            <p className="text-center text-xs text-muted-foreground">
              Talep admin onayıyla aktifleşir; kartından anlık ödeme alınmaz.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import type { FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ComparePlansDialog } from "@/components/checkout/ComparePlansDialog";
import { cn, formatPrice } from "@/lib/utils";
import {
  MOST_POPULAR_DURATION_DAYS,
  calculatePackagePricing,
  formatPlanDuration,
  type PackagePricing,
} from "@/lib/lessonPricing";
import type { PackagePlan, PromoPreviewResponse, TutorProfile } from "@/types";

export type PromoStatus = "idle" | "editing" | "loading" | "applied" | "error";

interface CheckoutSummaryProps {
  tutor: TutorProfile;
  lessonsPerWeek: number;
  durationDays: number;
  pricing: PackagePricing | null;
  planAvailable: boolean;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onPurchaseCta: () => void;
  purchasePending: boolean;
  pendingForSelectedPlan: boolean;
  otherPendingPlanName: string | null;
  paidRemainingCredits: number | null;
  onUseCredits: () => void;
  weeklyPlans: PackagePlan[];
  onDurationDaysChange: (days: number) => void;
  onApplyPromo: () => void;
  promoStatus: PromoStatus;
  promoMessage: string | null;
  promoPricing: PromoPreviewResponse | null;
  onRemovePromo: () => void;
}

function initials(tutor: TutorProfile) {
  return `${tutor.name?.[0] ?? ""}${tutor.surname?.[0] ?? ""}`.toUpperCase() || "?";
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
  weeklyPlans,
  onDurationDaysChange,
  onApplyPromo,
  promoStatus,
  promoMessage,
  promoPricing,
  onRemovePromo,
}: CheckoutSummaryProps) {
  const handleDurationKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const lastIndex = durations.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex == null) return;
    const nextDuration = durations[nextIndex]?.duration_days;
    if (nextDuration == null) return;
    event.preventDefault();
    onDurationDaysChange(nextDuration);
    const buttons = event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[nextIndex]?.focus();
  };

  const selectedTotal = promoPricing?.total_price ?? pricing?.total ?? null;
  const selectedUnit = promoPricing?.unit_price ?? pricing?.discountedPerLesson ?? null;
  const selectedLessonCount = promoPricing?.total_credits ?? pricing?.lessonCount ?? null;
  const selectedSubtotal = promoPricing?.subtotal_price ?? pricing?.subtotal ?? null;
  const selectedPlanDiscount = promoPricing?.discount_amount ?? pricing?.discountAmount ?? null;
  const durations = weeklyPlans
    .filter((plan) => plan.lessons_per_week === lessonsPerWeek && plan.duration_days != null)
    .sort((a, b) => (a.duration_days ?? 0) - (b.duration_days ?? 0));
  const busy = purchasePending || promoStatus === "loading";
  const unresolvedPromo = Boolean(promoCode.trim()) && promoStatus !== "applied";

  function submitPromo(event: FormEvent) {
    event.preventDefault();
    onApplyPromo();
  }

  return (
    <aside className="overflow-hidden rounded-[1.6rem] border border-border/75 bg-card shadow-[0_24px_70px_-45px_hsl(var(--foreground)/0.35)]">
      <div className="border-b bg-muted/35 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 rounded-xl">
            <AvatarImage src={tutor.profile_picture || undefined} alt={`${tutor.name} ${tutor.surname}`} />
            <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary">{initials(tutor)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{tutor.name} {tutor.surname}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{formatPrice(tutor.hourly_price)} / 40 dk</p>
          </div>
          <Badge variant="outline" className="rounded-md">Birebir</Badge>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-6">
        <section aria-labelledby="duration-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="duration-title" className="text-base font-semibold">Paket süresi</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sana uygun süreyi seç.</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Haftada {lessonsPerWeek} ders</span>
          </div>

          <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Paket süresi">
            {durations.map((plan, index) => {
              const days = plan.duration_days as number;
              const selected = days === durationDays;
              const optionPricing = calculatePackagePricing(
                tutor.hourly_price,
                plan.lesson_count,
                plan.discount_percent
              );
              const cardUnit = selected && promoPricing
                ? promoPricing.unit_price
                : optionPricing.discountedPerLesson;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-background transition duration-200",
                    selected ? "border-primary shadow-[0_12px_32px_-24px_hsl(var(--primary))] ring-1 ring-primary" : "border-border/80 hover:border-foreground/25"
                  )}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-describedby={selected ? `duration-details-${days}` : undefined}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => onDurationDaysChange(days)}
                    onKeyDown={(event) => handleDurationKeyDown(event, index)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:translate-y-px"
                  >
                    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-muted-foreground/50")}>
                      {selected && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{formatPlanDuration(days)}</span>
                        {days === MOST_POPULAR_DURATION_DAYS && <Badge className="rounded-md">En popüler</Badge>}
                      </span>
                      {optionPricing.discountPercent > 0 && (
                        <span className="mt-1 block text-xs font-medium text-primary">%{optionPricing.discountPercent} fiyat avantajı</span>
                      )}
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      <span className="block font-semibold">{formatPrice(cardUnit)}</span>
                      <span className="block text-xs text-muted-foreground">/ ders</span>
                    </span>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", selected && "rotate-180")} aria-hidden="true" />
                  </button>

                  {selected && (
                    <div id={`duration-details-${days}`} className="border-t bg-muted/25 px-4 py-4 text-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
                      <dl className="space-y-2.5 tabular-nums">
                        <SummaryRow label="Toplam ders" value={selectedLessonCount != null ? `${selectedLessonCount} ders` : "—"} />
                        <SummaryRow label="Liste fiyatı" value={selectedSubtotal != null ? formatPrice(selectedSubtotal) : "—"} />
                        {pricing && pricing.discountPercent > 0 && selectedPlanDiscount != null && (
                          <SummaryRow label={`Paket indirimi (%${pricing.discountPercent})`} value={`-${formatPrice(selectedPlanDiscount)}`} accent />
                        )}
                        {promoPricing && promoPricing.promo_discount_amount > 0 && (
                          <SummaryRow label={`İndirim kodu (${promoPricing.promotion_code})`} value={`-${formatPrice(promoPricing.promo_discount_amount)}`} accent />
                        )}
                        <Separator />
                        <SummaryRow label="Paket toplamı" value={selectedTotal != null ? formatPrice(selectedTotal) : "—"} strong />
                      </dl>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {durations.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Bu haftalık ders sayısı için sunulan bir paket bulunmuyor.
          </div>
        )}

        <section aria-labelledby="promo-title">
          <div className="flex items-center gap-2">
            <TicketPercent className="size-4 text-primary" aria-hidden="true" />
            <h2 id="promo-title" className="text-sm font-semibold">İndirim kodu</h2>
          </div>
          <form onSubmit={submitPromo} className="mt-3 flex gap-2">
            <Input
              value={promoCode}
              onChange={(event) => onPromoCodeChange(event.target.value)}
              placeholder="Kodunu yaz"
              aria-label="İndirim kodu"
              autoComplete="off"
              disabled={busy}
              className="h-11 rounded-xl"
            />
            <Button type="submit" variant="outline" className="h-11 rounded-xl px-4" disabled={busy || !promoCode.trim()}>
              {promoStatus === "loading" ? <Loader2 className="size-4 animate-spin" aria-label="Kod doğrulanıyor" /> : "Uygula"}
            </Button>
          </form>
          {promoMessage && (
            <div
              role={promoStatus === "error" ? "alert" : "status"}
              className={cn("mt-2 flex items-start justify-between gap-3 text-xs", promoStatus === "error" ? "text-destructive" : "text-emerald-700 dark:text-emerald-400")}
            >
              <span>{promoMessage}</span>
              {promoStatus === "applied" && (
                <button type="button" onClick={onRemovePromo} className="shrink-0 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Kodu kaldır
                </button>
              )}
            </div>
          )}
        </section>

        {pendingForSelectedPlan ? (
          <div className="rounded-xl bg-amber-500/10 p-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
              <Clock className="size-4" aria-hidden="true" /> Bekleyen paket talebin var
            </p>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Bu plan için yeniden talep oluşturamazsın.</p>
            <Button variant="outline" size="sm" className="mt-3 w-full rounded-xl" asChild><Link href="/profile/payments">Paketlerimi görüntüle</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {otherPendingPlanName && (
              <p className="rounded-xl bg-amber-500/10 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:text-amber-300">
                Bu hoca için başka bir bekleyen talebin var ({otherPendingPlanName}).
              </p>
            )}
            <div className="hidden items-center justify-between gap-4 lg:flex">
              <span className="text-sm font-medium text-muted-foreground">Ödenecek paket toplamı</span>
              <span className="text-xl font-bold tabular-nums">{selectedTotal != null ? formatPrice(selectedTotal) : "—"}</span>
            </div>
            <Button className="hidden h-12 w-full rounded-xl text-base lg:inline-flex" onClick={onPurchaseCta} disabled={busy || unresolvedPromo || !planAvailable}>
              {purchasePending ? "Talep oluşturuluyor…" : "Paket talebi oluştur"}
            </Button>
            {!planAvailable && <p className="text-center text-xs text-destructive">Bu kombinasyon şu anda sunulmuyor.</p>}
          </div>
        )}

        {paidRemainingCredits != null && paidRemainingCredits > 0 && (
          <div className="rounded-xl bg-emerald-500/10 p-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="size-4" aria-hidden="true" /> {paidRemainingCredits} ders hakkın kullanılabilir
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full rounded-xl bg-background" onClick={onUseCredits}>Mevcut ders hakkını kullan</Button>
          </div>
        )}

        <div className="rounded-xl bg-muted/45 p-4 text-xs leading-5 text-muted-foreground">
          <p className="flex items-center gap-2 font-semibold text-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Tek seferlik paket · otomatik yenilenmez</p>
          <p className="mt-2">Bu adımda kartından ücret alınmaz. Talebinin durumunu Paketlerim alanından takip edebilirsin.</p>
          <p className="mt-1">Paket yalnız {tutor.name} {tutor.surname} ile geçerlidir. <Link href="/support#odeme-ve-iade" className="underline underline-offset-2 hover:text-foreground">İade politikası</Link></p>
        </div>

        <div className="lg:hidden">
          <ComparePlansDialog>
            <Button variant="outline" className="w-full rounded-xl">
              Planları karşılaştır
            </Button>
          </ComparePlansDialog>
        </div>
      </div>

      {!pendingForSelectedPlan && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto max-w-md px-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">Paket toplamı</span>
              <span className="font-bold tabular-nums">{selectedTotal != null ? formatPrice(selectedTotal) : "—"}</span>
            </div>
            <Button className="h-11 w-full rounded-xl" onClick={onPurchaseCta} disabled={busy || unresolvedPromo || !planAvailable}>
              {purchasePending ? "Talep oluşturuluyor…" : "Paket talebi oluştur"}
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

function SummaryRow({ label, value, accent, strong }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", strong && "text-base font-semibold")}>
      <dt className={cn(!strong && "text-muted-foreground")}>{label}</dt>
      <dd className={cn("text-right", accent && "text-emerald-700 dark:text-emerald-400", strong && "font-bold")}>{value}</dd>
    </div>
  );
}

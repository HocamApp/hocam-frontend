"use client";

import type { FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import {
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
  weeklyPlans,
  onDurationDaysChange,
  onApplyPromo,
  promoStatus,
  promoMessage,
  promoPricing,
  onRemovePromo,
}: CheckoutSummaryProps) {
  const durations = weeklyPlans
    .filter((plan) => plan.lessons_per_week === lessonsPerWeek && plan.duration_days != null)
    .sort((a, b) => (a.duration_days ?? 0) - (b.duration_days ?? 0));
  const selectedTotal = promoPricing?.total_price ?? pricing?.total ?? null;
  const selectedLessonCount = promoPricing?.total_credits ?? pricing?.lessonCount ?? null;
  const selectedSubtotal = promoPricing?.subtotal_price ?? pricing?.subtotal ?? null;
  const selectedPlanDiscount = promoPricing?.discount_amount ?? pricing?.discountAmount ?? null;
  const busy = purchasePending || promoStatus === "loading";
  const unresolvedPromo = Boolean(promoCode.trim()) && promoStatus !== "applied";

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
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [nextIndex]?.focus();
  };

  function submitPromo(event: FormEvent) {
    event.preventDefault();
    onApplyPromo();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xs font-extrabold tracking-[0.16em] text-[var(--checkout-right-ink)]">
            PAKET SÜRESİNİ SEÇ
          </h1>
          <p className="mt-1 text-xs opacity-65">Haftada {lessonsPerWeek} ders</p>
        </div>
        <div className="flex min-w-0 items-center gap-2.5 text-right">
          <Avatar className="size-9 rounded-lg">
            <AvatarImage
              src={tutor.profile_picture || undefined}
              alt={`${tutor.name} ${tutor.surname}`}
            />
            <AvatarFallback className="rounded-lg bg-[var(--checkout-control)] text-xs font-bold text-[var(--checkout-on-control)]">
              {initials(tutor)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="max-w-48 truncate text-sm font-bold">
              {tutor.name} {tutor.surname}
            </p>
            <p className="text-xs opacity-65">{formatPrice(tutor.hourly_price)} / 40 dk</p>
          </div>
        </div>
      </div>

      <section aria-labelledby="duration-title" className="mt-3.5">
        <h2 id="duration-title" className="sr-only">Paket süresi</h2>
        <div className="space-y-1.5" role="radiogroup" aria-label="Paket süresi">
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
                data-selected={selected}
                className="checkout-duration-card overflow-hidden rounded-lg border transition duration-200"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-describedby={selected ? `duration-details-${days}` : undefined}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onDurationDaysChange(days)}
                  onKeyDown={(event) => handleDurationKeyDown(event, index)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--checkout-duration-control)] active:translate-y-px"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-[var(--checkout-duration-control)]"
                        : "border-[var(--checkout-duration-control)]/45"
                    )}
                  >
                    {selected && <span className="size-2 rounded-full bg-[var(--checkout-duration-control)]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold sm:text-base">{formatPlanDuration(days)}</span>
                      {days === MOST_POPULAR_DURATION_DAYS && (
                        <Badge className="rounded-md bg-[var(--checkout-duration-control)] text-[0.65rem] text-white hover:bg-[var(--checkout-duration-control)]">
                          En popüler
                        </Badge>
                      )}
                    </span>
                    {optionPricing.discountPercent > 0 && (
                      <span className="checkout-duration-advantage mt-1 inline-flex rounded px-1.5 py-0.5 text-xs font-bold leading-none">
                        %{optionPricing.discountPercent} fiyat avantajı
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block text-sm font-bold sm:text-base">{formatPrice(cardUnit)}</span>
                    <span className="block text-xs opacity-55">/ ders</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 opacity-55 transition-transform duration-200 motion-reduce:transition-none",
                      selected && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {selected && (
                  <div
                    id={`duration-details-${days}`}
                    className="border-t border-[var(--checkout-soft-line)] bg-[var(--checkout-selected-duration)] px-3 py-2.5 text-xs text-[var(--checkout-selected-duration-ink)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 sm:text-sm"
                  >
                    <dl className="space-y-1.5 tabular-nums">
                      <SummaryRow
                        label="Toplam ders"
                        value={selectedLessonCount != null ? `${selectedLessonCount} ders` : "—"}
                      />
                      <SummaryRow
                        label="Liste fiyatı"
                        value={selectedSubtotal != null ? formatPrice(selectedSubtotal) : "—"}
                      />
                      {pricing && pricing.discountPercent > 0 && selectedPlanDiscount != null && (
                        <SummaryRow
                          label={`Paket indirimi (%${pricing.discountPercent})`}
                          value={`-${formatPrice(selectedPlanDiscount)}`}
                          accent
                        />
                      )}
                      {promoPricing && promoPricing.promo_discount_amount > 0 && (
                        <SummaryRow
                          label={`İndirim kodu (${promoPricing.promotion_code})`}
                          value={`-${formatPrice(promoPricing.promo_discount_amount)}`}
                          accent
                        />
                      )}
                    </dl>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {durations.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--checkout-evergreen)] p-4 text-sm">
          Bu haftalık ders sayısı için sunulan bir paket bulunmuyor.
        </div>
      )}

      <div className="mt-3 space-y-2.5">
        {pendingForSelectedPlan ? (
          <div className="rounded-xl bg-[var(--checkout-switchback)] p-4 text-center text-[var(--checkout-nighttime)]">
            <p className="flex items-center justify-center gap-2 text-sm font-bold">
              <Clock className="size-4" aria-hidden="true" /> Bekleyen paket talebin var
            </p>
            <p className="mt-1.5 text-xs leading-5">Bu plan için yeniden talep oluşturamazsın.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full border-[var(--checkout-nighttime)] bg-transparent"
              asChild
            >
              <Link href="/profile/payments">Paketlerimi görüntüle</Link>
            </Button>
          </div>
        ) : (
          <>
            {otherPendingPlanName && (
              <p className="rounded-xl bg-[var(--checkout-switchback)] px-3 py-2.5 text-xs leading-5">
                Bu hoca için başka bir bekleyen talebin var ({otherPendingPlanName}).
              </p>
            )}
            <div className="hidden items-center justify-between gap-4 lg:flex">
              <span className="text-sm font-semibold opacity-65">Paket toplamı</span>
              <span className="text-xl font-extrabold tabular-nums">
                {selectedTotal != null ? formatPrice(selectedTotal) : "—"}
              </span>
            </div>
            <Button
              className="hidden h-11 w-full rounded-lg bg-[var(--checkout-cta)] text-base font-extrabold text-[var(--checkout-on-cta)] hover:bg-[var(--checkout-cta-hover)] lg:inline-flex"
              onClick={onPurchaseCta}
              disabled={busy || unresolvedPromo || !planAvailable}
            >
              {purchasePending ? "Talep oluşturuluyor…" : "Paket talebi oluştur"}
            </Button>
            {!planAvailable && (
              <p className="text-center text-xs text-destructive">
                Bu kombinasyon şu anda sunulmuyor.
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-3 border-y border-[var(--checkout-soft-line)] py-3 text-xs leading-4">
        <p className="flex items-center gap-2 font-bold">
          <ShieldCheck className="size-4 text-[var(--checkout-control)]" aria-hidden="true" />
          Tek seferlik paket · otomatik yenilenmez
        </p>
        <p className="mt-1 opacity-70">
          Bu adımda kartından ücret alınmaz. Talebinin durumunu Paketlerim alanından takip edebilirsin.
        </p>
        <p className="mt-1 opacity-70">
          Paket yalnız {tutor.name} {tutor.surname} ile geçerlidir.{" "}
          <Link
            href="/support#odeme-ve-iade"
            className="font-semibold underline underline-offset-2 hover:text-[var(--checkout-control)]"
          >
            İade politikası
          </Link>
        </p>
      </div>

      <section aria-labelledby="promo-title" className="mt-3">
        <div className="flex items-center gap-2">
          <TicketPercent className="size-4 text-[var(--checkout-control)]" aria-hidden="true" />
          <h2 id="promo-title" className="text-sm font-bold">İndirim kodu</h2>
        </div>
        <form onSubmit={submitPromo} className="mt-2 flex gap-2">
          <Input
            value={promoCode}
            onChange={(event) => onPromoCodeChange(event.target.value)}
            placeholder="Kodunu yaz"
            aria-label="İndirim kodu"
            autoComplete="off"
            disabled={busy}
            className="h-9 rounded-lg border-[var(--checkout-soft-line)] bg-[var(--checkout-promo-surface)] text-[var(--checkout-promo-ink)]"
          />
          <Button
            type="submit"
            variant="outline"
            className="h-9 rounded-lg border-[var(--checkout-control)] bg-transparent px-4 text-[var(--checkout-nighttime)]"
            disabled={busy || !promoCode.trim()}
          >
            {promoStatus === "loading" ? (
              <Loader2 className="size-4 animate-spin" aria-label="Kod doğrulanıyor" />
            ) : (
              "Uygula"
            )}
          </Button>
        </form>
        {promoMessage && (
          <div
            role={promoStatus === "error" ? "alert" : "status"}
            className={cn(
              "mt-2 flex items-start justify-between gap-3 text-xs",
              promoStatus === "error" ? "text-destructive" : "text-[var(--checkout-discount)]"
            )}
          >
            <span>{promoMessage}</span>
            {promoStatus === "applied" && (
              <button
                type="button"
                onClick={onRemovePromo}
                className="shrink-0 font-bold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkout-control)]"
              >
                Kodu kaldır
              </button>
            )}
          </div>
        )}
      </section>

      {!pendingForSelectedPlan && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--checkout-soft-line)] bg-[var(--checkout-right-surface)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
          <div className="mx-auto max-w-md px-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold opacity-65">Paket toplamı</span>
              <span className="font-extrabold tabular-nums">
                {selectedTotal != null ? formatPrice(selectedTotal) : "—"}
              </span>
            </div>
            <Button
              className="h-11 w-full rounded-lg bg-[var(--checkout-cta)] font-extrabold text-[var(--checkout-on-cta)] hover:bg-[var(--checkout-cta-hover)]"
              onClick={onPurchaseCta}
              disabled={busy || unresolvedPromo || !planAvailable}
            >
              {purchasePending ? "Talep oluşturuluyor…" : "Paket talebi oluştur"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", strong && "text-base font-bold")}>
      <dt className={cn(!strong && "opacity-65")}>{label}</dt>
      <dd
        className={cn(
          "text-right",
          accent && "font-bold text-[var(--checkout-discount)]",
          strong && "font-extrabold"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

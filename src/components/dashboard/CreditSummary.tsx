"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "@phosphor-icons/react";

import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { payTRPayHref } from "@/components/payments/paytr/paytrEntryPoints";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { computePackageExpiry } from "@/lib/packageExpiry";
import { packageLessons } from "@/lib/packageLessons";
import {
  awaitingPayment,
  deadlineTimeLabel,
  packageRestartHref,
  type AwaitingPayment,
} from "@/lib/packagePayment";
import { serverNow } from "@/lib/serverClock";
import { cn } from "@/lib/utils";
import type { Booking, PackagePurchase } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const RENEW_DAYS_THRESHOLD = 7;
const RENEW_CREDITS_THRESHOLD = 2;

function packageDaysLeft(purchase: PackagePurchase): number | null {
  const expiry = computePackageExpiry(purchase);
  if (!expiry) return null;
  if (expiry.isInGrace) return expiry.graceDaysLeft;
  return Math.max(0, Math.ceil((expiry.termEndDate.getTime() - serverNow()) / DAY_MS));
}

const linkClass =
  "mt-3 inline-flex items-center text-small font-medium text-ink transition-colors [transition-duration:120ms] hover:text-pink";

/**
 * A lesson package chosen and waiting for its payment: the next step is the
 * payment page while the hours are held, or a fresh start once they are not.
 * Nothing here says "under review": no tutor is looking at it.
 */
function PaymentWaiting({
  purchase,
  payment,
}: {
  purchase: PackagePurchase;
  payment: AwaitingPayment;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-ink text-white dark:bg-[var(--ink-on-light)]">
          <Clock className="size-5" weight="regular" aria-hidden="true" />
        </span>
        <div>
          <p className="text-body font-medium text-ink">
            {payment.open ? "Ödemeni tamamla" : "Ödeme süresi doldu"}
          </p>
          <p className="mt-1 text-small text-ink-mid">
            {payment.open
              ? `Saatlerin senin için ayrıldı. Son ödeme saati: ${deadlineTimeLabel(payment.deadlineMs)}.`
              : "Saatlerin yeniden herkese açıldı. İstersen baştan seçebilirsin."}
          </p>
          <Link
            href={payment.open ? payTRPayHref(purchase.id) : packageRestartHref(purchase)}
            className={linkClass}
          >
            {payment.open ? "Ödemeye devam et" : "Yeniden başla"}
            <ArrowRight className="ml-1 size-4" weight="regular" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CreditSummary({
  activePackage,
  pendingPackage,
  loading,
  error,
  onRetry,
  onSelect,
  bookings,
}: {
  activePackage?: PackagePurchase;
  pendingPackage?: PackagePurchase;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (purchase: PackagePurchase) => void;
  bookings: Booking[];
}) {
  if (loading) return <Skeleton className="h-[154px] w-full rounded-card" />;
  if (error) {
    return (
      <section className="rounded-card border border-line bg-surface p-6">
        <ErrorMessage message="Ders hakların yüklenemedi." />
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Tekrar dene</Button>
      </section>
    );
  }
  if (!activePackage && !pendingPackage) return null;

  if (pendingPackage && !activePackage) {
    const payment = awaitingPayment(pendingPackage);
    if (payment) return <PaymentWaiting purchase={pendingPackage} payment={payment} />;
    return (
      <section className="rounded-card border border-line bg-surface p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-ink text-white dark:bg-[var(--ink-on-light)]"><Clock className="size-5" weight="regular" aria-hidden="true" /></span>
          <div>
            <p className="text-body font-medium text-ink">Paket talebin inceleniyor</p>
            <p className="mt-1 text-small text-ink-mid">Senden ek bir işlem beklenmiyor.</p>
            <Link href="/profile/payments" className={linkClass}>Detayları gör <ArrowRight className="ml-1 size-4" weight="regular" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>
    );
  }

  if (!activePackage) return null;
  const daysLeft = packageDaysLeft(activePackage);
  const lessons = packageLessons(activePackage, bookings);
  const needsRenewal =
    lessons.remaining <= RENEW_CREDITS_THRESHOLD ||
    (daysLeft !== null && daysLeft <= RENEW_DAYS_THRESHOLD);
  const progress = lessons.total > 0
    ? Math.min(100, Math.round((lessons.behind / lessons.total) * 100))
    : 0;
  const tutor = `${activePackage.tutor.name} ${activePackage.tutor.surname}`.trim();
  const planned = [
    lessons.upcoming > 0 ? `${lessons.upcoming} ders planlandı` : null,
    lessons.unscheduled > 0 ? `${lessons.unscheduled} ders henüz planlanmadı` : null,
  ].filter(Boolean);

  return (
    <section className={cn("relative overflow-hidden rounded-card border bg-surface", needsRenewal ? "border-ink" : "border-line")}>
      <button type="button" onClick={() => onSelect(activePackage)} className="grid w-full gap-6 p-6 text-left transition-colors [transition-duration:120ms] hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink sm:p-8 lg:grid-cols-[minmax(230px,0.8fr)_minmax(320px,1.2fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <ParticipantAvatar name={tutor} avatarUrl={activePackage.tutor.profile_picture} className="h-16 w-16 shrink-0 border border-line" />
          <div className="min-w-0">
            <p className="text-label text-ink-mid">Ders paketin</p>
            <p className="mt-1 truncate text-h3-m text-ink">{activePackage.plan.name}</p>
            <p className="mt-1 truncate text-small text-ink-mid">{tutor}{daysLeft !== null ? ` · ${daysLeft} gün` : ""}</p>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <p className="text-h2-m font-bold tabular-nums text-ink md:text-h2">
              {lessons.remaining} <span className="text-body font-normal text-ink-mid">ders kaldı</span>
            </p>
            <p className="text-small tabular-nums text-ink-mid">{lessons.behind} / {lessons.total} kullanıldı</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-pill bg-line" aria-label={`Paketin yüzde ${progress} kadarı kullanıldı`}>
            <div className={cn("h-full rounded-pill", needsRenewal ? "bg-pink" : "bg-ink")} style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-small text-ink-mid">{planned.length > 0 ? planned.join(" · ") : "Yeni derslerini istediğin zaman planlayabilirsin."}</p>
        </div>

        <span className="flex items-center justify-between gap-3 border-t border-line pt-4 text-body font-medium text-ink lg:border-l lg:border-t-0 lg:py-3 lg:pl-6 lg:pt-3">
          Paket detayları
          <ArrowRight className="size-4" weight="regular" aria-hidden="true" />
        </span>
      </button>
      {needsRenewal && (
        <div className="flex flex-col gap-3 border-t border-ink bg-ink px-6 py-4 text-small text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-medium">Paketin yakında yenilenmeli.</span>
          <Button asChild size="sm"><Link href="/tutors">Ders hakkı al</Link></Button>
        </div>
      )}
    </section>
  );
}

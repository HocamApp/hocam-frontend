import Link from "next/link";
import { Calendar, ChevronRight, Clock3, Target } from "lucide-react";
import {
  formatDate,
  formatPrice,
  formatBookingDate,
  formatBookingTime,
  parseBookingDate,
} from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import type { Booking, PackagePurchase } from "@/types";

// Mirrors backend apps/payments/services.py PACKAGE_GRACE_PERIOD_DAYS — a
// package stays bookable until paid_at + plan.duration_days + this grace
// window. One-off legacy bundles have no expiry to compute.
const PACKAGE_GRACE_PERIOD_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface PackageExpiry {
  termEndDate: Date;
  hardExpiryDate: Date;
  isExpired: boolean;
  isInGrace: boolean;
  graceDaysLeft: number;
}

export function computePackageExpiry(purchase: PackagePurchase): PackageExpiry | null {
  const durationDays = purchase.plan.duration_days;
  if (!purchase.paid_at || !durationDays) return null;

  const paidAt = new Date(purchase.paid_at).getTime();
  const termEndDate = new Date(paidAt + durationDays * DAY_MS);
  const hardExpiryDate = new Date(termEndDate.getTime() + PACKAGE_GRACE_PERIOD_DAYS * DAY_MS);
  const now = Date.now();

  return {
    termEndDate,
    hardExpiryDate,
    isExpired: now > hardExpiryDate.getTime(),
    isInGrace: now > termEndDate.getTime() && now <= hardExpiryDate.getTime(),
    graceDaysLeft: Math.max(0, Math.ceil((hardExpiryDate.getTime() - now) / DAY_MS)),
  };
}

export function isPastPackage(purchase: PackagePurchase, expiry: PackageExpiry | null): boolean {
  if (purchase.status === "cancelled" || purchase.status === "refunded") return true;
  if (purchase.status === "paid" && expiry?.isExpired) return true;
  if (purchase.status === "paid" && purchase.remaining_credits <= 0) return true;
  return false;
}

export function PackagePurchaseCard({ purchase }: { purchase: PackagePurchase }) {
  const expiry = computePackageExpiry(purchase);

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">
            {purchase.tutor.name} {purchase.tutor.surname}
          </p>
          <p className="text-sm text-muted-foreground">{purchase.plan.name}</p>
        </div>
        <StatusBadge status={purchase.status} type="packagePurchase" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Ders hakkı</p>
          <p className="font-medium">
            {purchase.remaining_credits} / {purchase.total_credits}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Toplam tutar</p>
          <p className="font-medium">{formatPrice(purchase.total_price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Talep tarihi</p>
          <p className="font-medium">{formatDate(purchase.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {expiry ? "Süre sonu" : "Onay tarihi"}
          </p>
          <p className="font-medium">
            {expiry
              ? formatDate(expiry.termEndDate.toISOString())
              : purchase.paid_at
                ? formatDate(purchase.paid_at)
                : "—"}
          </p>
        </div>
      </div>
      {expiry?.isInGrace && (
        <p className="mt-2.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          Paket süren doldu. Kalan derslerini kullanmak için son{" "}
          <span className="font-medium">{expiry.graceDaysLeft} gün</span>.
        </p>
      )}
    </div>
  );
}

function formatTime(isoString: string) {
  return formatBookingTime(isoString);
}

function sortByStart(bookings: Booking[], direction: "asc" | "desc" = "asc") {
  return [...bookings].sort((a, b) => {
    const difference =
      parseBookingDate(a.start_time).getTime() -
      parseBookingDate(b.start_time).getTime();
    return direction === "asc" ? difference : -difference;
  });
}

function LessonTimeline({ title, bookings, emptyMessage }: {
  title: string;
  bookings: Booking[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {bookings.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{booking.subject.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {formatBookingDate(booking.start_time)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" /> {formatTime(booking.start_time)} · {booking.duration_minutes} dk
                    </span>
                  </p>
                </div>
                <StatusBadge status={booking.status} type="booking" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function PackageLearningCard({
  purchase,
  completedLessonCount,
  scheduledLessonCount,
  onClick,
}: {
  purchase: PackagePurchase;
  completedLessonCount: number;
  scheduledLessonCount: number;
  onClick: () => void;
}) {
  const expiry = computePackageExpiry(purchase);
  const progress = purchase.total_credits
    ? Math.round(((purchase.total_credits - purchase.remaining_credits) / purchase.total_credits) * 100)
    : 0;

  if (purchase.status === "pending") {
    return (
      <article className="overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/30">
        <button
          type="button"
          onClick={onClick}
          className="group w-full p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{purchase.plan.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {purchase.tutor.name} {purchase.tutor.surname} ile paket talebin
              </p>
            </div>
            <span className="flex items-center gap-2">
              <StatusBadge status={purchase.status} type="packagePurchase" />
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <p className="text-sm font-medium">Paket talebin alındı</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Talebin incelendikten sonra ders hakların kullanıma açılacak. Şu anda senden ek bir işlem beklenmiyor.
              </p>
            </div>
          </div>
        </button>
      </article>
    );
  }

  return (
    <article className="rounded-xl border bg-card transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={onClick}
        className="group w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{purchase.plan.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {purchase.tutor.name} {purchase.tutor.surname} ile hedefe yönelik çalışma planın
            </p>
          </div>
          <span className="flex items-center gap-2">
            <StatusBadge status={purchase.status} type="packagePurchase" />
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{purchase.remaining_credits} ders hakkın kaldı</span>
              <span className="text-muted-foreground">{completedLessonCount} ders tamamlandı</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {scheduledLessonCount > 0
              ? `${scheduledLessonCount} dersin planlandı`
              : "Sıradaki dersini planlayarak devam et"}
          </p>
        </div>

        {expiry?.isInGrace && (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            Kullanım süresinin bitmesine {expiry.graceDaysLeft} gün kaldı.
          </p>
        )}
      </button>

      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
        <Button asChild size="sm">
          <Link href={`/tutors/${purchase.tutor.id}`}>Sonraki dersi planla</Link>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClick}>
          Paket detayları
        </Button>
      </div>
    </article>
  );
}

export function PackageLearningDetailsSheet({
  purchase,
  bookings,
  open,
  onOpenChange,
}: {
  purchase: PackagePurchase | null;
  bookings: Booking[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!purchase) return null;

  const now = new Date();
  const packageBookings = bookings.filter((booking) => booking.package_purchase === purchase.id);
  const upcomingBookings = sortByStart(
    packageBookings.filter(
      (booking) =>
        parseBookingDate(booking.start_time) > now && booking.status !== "cancelled"
    )
  );
  const pastBookings = sortByStart(
    packageBookings.filter(
      (booking) =>
        parseBookingDate(booking.start_time) <= now && booking.status !== "cancelled"
    ),
    "desc"
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <ParticipantAvatar
              name={`${purchase.tutor.name} ${purchase.tutor.surname}`}
              avatarUrl={purchase.tutor.profile_picture}
              className="h-14 w-14"
            />
            <div className="min-w-0">
              <SheetTitle>{purchase.tutor.name} {purchase.tutor.surname}</SheetTitle>
              <SheetDescription className="mt-1">
                {purchase.tutor.subjects?.map((subject) => subject.name).join(" · ") || "Özel ders öğretmeni"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Hoca hakkında</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {purchase.tutor.bio?.trim() || "Bu hoca, hedeflerine uygun ders planını ilk görüşmede seninle birlikte oluşturacak."}
            </p>
            <Button asChild variant="link" className="h-auto px-0 text-sm">
              <Link href={`/tutors/${purchase.tutor.id}`}>Hoca profilini görüntüle</Link>
            </Button>
          </section>

          <section className="space-y-3 rounded-xl border p-4">
            <div>
              <h3 className="font-semibold">Bu paketin içeriği</h3>
              <p className="mt-1 text-sm text-muted-foreground">{purchase.plan.name}</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="font-medium text-foreground">{purchase.total_credits} canlı ders</span> · ders başına {purchase.plan.lesson_duration_minutes} dakika</li>
              {purchase.plan.lessons_per_week && (
                <li><span className="font-medium text-foreground">Haftada {purchase.plan.lessons_per_week} ders</span> ile düzenli çalışma ritmi</li>
              )}
              {purchase.plan.duration_days && (
                <li><span className="font-medium text-foreground">{Math.ceil(purchase.plan.duration_days / 7)} haftalık</span> hedef odaklı program</li>
              )}
              <li>İlk derste hedeflerin, eksik konuların ve ders akışın hocanla netleştirilir.</li>
            </ul>
          </section>

          <div className="rounded-xl border bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Hedefine düzenli adımlarla yaklaş</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Her ders, eksiklerini kapatıp sınav performansını geliştirmek için planlanır.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border p-4 text-sm">
            <div>
              <p className="text-muted-foreground">Kalan ders hakkı</p>
              <p className="mt-1 text-lg font-semibold">{purchase.remaining_credits} / {purchase.total_credits}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Planlanan ders</p>
              <p className="mt-1 text-lg font-semibold">{upcomingBookings.length}</p>
            </div>
          </div>

          <LessonTimeline
            title="Sıradaki derslerin"
            bookings={upcomingBookings}
            emptyMessage={purchase.status === "pending" ? "Paketin onaylandığında derslerini planlayabileceksin." : "Henüz planlanmış dersin yok."}
          />
          <LessonTimeline
            title="Ders geçmişin"
            bookings={pastBookings}
            emptyMessage="Bu paketten henüz tamamlanmış veya geçmiş bir dersin yok."
          />

          {purchase.status !== "pending" && (
            <Button asChild className="w-full">
              <Link href={`/tutors/${purchase.tutor.id}`}>Sonraki dersini planla</Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

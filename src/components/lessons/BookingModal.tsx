"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTutorAvailability } from "@/lib/dashboardApi";
import { createBooking, fetchTutorBusyIntervals } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import type { Booking, TutorProfile, AvailabilityRule, BusyInterval } from "@/types";
import {
  cn,
  formatDateLocal,
  formatPrice,
  getNext14Days,
  jsDayToBackendDay,
} from "@/lib/utils";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Package credits always reserve one standard 40-minute lesson. Keep in sync
// with apps/payments/services.py::PACKAGE_CREDIT_LESSON_MINUTES.
const LESSON_BASE_MINUTES = 40;
// Free trial lessons are always this length; the backend forces it
// regardless of what's sent (apps/lessons/pricing.py TRIAL_DURATION_MINUTES).
const TRIAL_DURATION_MINUTES = 20;

// Busy interval timestamps follow the project's naive wall-clock convention
// (see handleSubmit below): the YYYY-MM-DD/HH:mm digits ARE Turkey local time,
// with no real timezone conversion applied by the backend. Parsing via
// `new Date(iso)` would apply a spurious +3h shift on display; read the
// digits directly instead, exactly like the rest of this file already does.
function parseNaiveLocalDateTime(iso: string): { dateStr: string; minutes: number } {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return { dateStr: "", minutes: 0 };
  const [, dateStr, hh, mm] = match;
  return { dateStr, minutes: parseInt(hh, 10) * 60 + parseInt(mm, 10) };
}

// Parse "16:00" or "16:00:00" to minutes since midnight
function parseTimeToMinutes(t: string): number {
  const parts = t.trim().split(":");
  const h = parseInt(parts[0] ?? "0", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  return h * 60 + m;
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Generate 30-min slots for a day from availability rules. Exclude slots where
// start + duration would exceed rule end, or where the candidate interval
// overlaps an existing busy (pending/confirmed) booking on that exact date.
function getSlotsForDay(
  rules: AvailabilityRule[],
  backendDay: number,
  durationMinutes: number,
  busyIntervals: BusyInterval[],
  dateStr: string
): string[] {
  const dayRules = rules.filter((r) => r.day_of_week === backendDay);
  if (dayRules.length === 0) return [];

  // Only this exact calendar date's busy intervals, as local minutes-since-
  // midnight. Bookings never cross midnight (backend-enforced), so comparing
  // the start date's string is sufficient to scope busy intervals to this day.
  const busyForDay = busyIntervals
    .map((b) => ({
      start: parseNaiveLocalDateTime(b.start_time),
      end: parseNaiveLocalDateTime(b.end_time),
    }))
    .filter((b) => b.start.dateStr === dateStr)
    .map((b) => ({ startMin: b.start.minutes, endMin: b.end.minutes }));

  const slotSet = new Set<number>();
  for (const r of dayRules) {
    const startMin = parseTimeToMinutes(r.start_time);
    const endMin = parseTimeToMinutes(r.end_time);
    for (let m = startMin; m + durationMinutes <= endMin; m += 30) {
      const candidateEnd = m + durationMinutes;
      const overlapsBusy = busyForDay.some(
        (b) => m < b.endMin && candidateEnd > b.startMin
      );
      if (!overlapsBusy) {
        slotSet.add(m);
      }
    }
  }
  return Array.from(slotSet)
    .sort((a, b) => a - b)
    .map(minutesToTimeStr);
}

function translateApiError(message: string): string {
  if (message.includes("no availability on this day"))
    return "Hoca bu günde müsait değil.";
  if (message.includes("outside the tutor's available hours"))
    return "Bu saat dilimi hocanın müsait saatleri dışında.";
  if (message.includes("cannot cross midnight"))
    return "Gece yarısını geçen rezervasyon oluşturulamaz.";
  if (message.includes("at least 40 minutes"))
    return "Ders süresi en az 40 dakika olmalıdır.";
  if (message.includes("already booked"))
    return "Bu saat az önce doldu. Lütfen başka bir saat seçin.";
  if (message.includes("does not belong to you"))
    return "Bu paket sana ait değil.";
  if (message.includes("not for this tutor"))
    return "Bu paket bu hoca için geçerli değil.";
  if (message.includes("no remaining lesson credits"))
    return "Bu paketin kullanılabilir ders hakkı kalmamış.";
  if (message.includes("cannot be used for trial lessons"))
    return "Paket hakları deneme dersinde kullanılamaz.";
  if (message.includes("must be exactly 40 minutes"))
    return "Paket hakkı sadece 40 dakikalık derslerde kullanılabilir.";
  if (message.includes("is not active"))
    return "Bu paket henüz aktif değil.";
  return message;
}

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

interface BookingModalProps {
  tutor: TutorProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  lessonRequestId?: string;
  learningContext?: LearningContextQuery | null;
  isTrial?: boolean;
  allowTestCredit?: boolean;
}

export function BookingModal({
  tutor,
  isOpen,
  onClose,
  onSuccess,
  lessonRequestId,
  learningContext,
  isTrial = false,
  allowTestCredit = false,
}: BookingModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(LESSON_BASE_MINUTES);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  const { data: availabilityRules = [] } = useQuery({
    queryKey: ["tutor-availability", tutor.id],
    queryFn: () => fetchTutorAvailability(String(tutor.id)),
    enabled: isOpen,
  });

  // Trial bookings never offer credit payment, so skip the fetch entirely
  // when isTrial — in practice this query is almost always already warm
  // from PackageOfferPanel on the same tutor detail page.
  const { data: packagePurchases = [] } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isOpen && !isTrial,
  });

  // Same rolling 14-day window the date picker below already shows.
  const next14Days = getNext14Days();
  const busyRangeStart = formatDateLocal(next14Days[0]);
  const busyRangeEnd = formatDateLocal(next14Days[next14Days.length - 1]);

  const {
    data: busyIntervals = [],
    isLoading: busyIntervalsLoading,
    isFetching: busyIntervalsFetching,
    refetch: refetchBusyIntervals,
  } = useQuery({
    queryKey: ["tutor-busy-intervals", tutor.id, busyRangeStart, busyRangeEnd],
    queryFn: () =>
      fetchTutorBusyIntervals(String(tutor.id), busyRangeStart, busyRangeEnd),
    enabled: isOpen && Boolean(tutor.id),
  });

  useEffect(() => {
    // Reset on open (not close): this modal instance is reused for both
    // normal and trial bookings, so the fresh session must pick up whichever
    // mode is being opened via `isTrial`.
    if (isOpen) {
      setStep(1);
      setSelectedSubjectId("");
      setSelectedDuration(isTrial ? TRIAL_DURATION_MINUTES : LESSON_BASE_MINUTES);
      setSelectedDate(null);
      setSelectedTime("");
      setApiError(null);
      setIsSubmitting(false);
      setStep1Error(null);
    }
  }, [isOpen, isTrial]);

  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate]);

  const eligiblePackage = !isTrial
    ? packagePurchases.find(
        (p) =>
          p.status === "paid" &&
          p.remaining_credits > 0 &&
          p.tutor.id === tutor.id &&
          p.plan.lesson_duration_minutes === LESSON_BASE_MINUTES
      )
    : undefined;
  const usingPackageCredit = !isTrial && !!eligiblePackage;
  const usingTestCredit = !isTrial && allowTestCredit && !eligiblePackage;
  const displayPrice = 0;
  const endTime = selectedTime
    ? (() => {
        const [h, m] = selectedTime.split(":").map(Number);
        const end = new Date();
        end.setHours(h, m + selectedDuration, 0, 0);
        return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      })()
    : "";

  const backendDayForDate = (d: Date) => jsDayToBackendDay(d.getDay());
  const hasAvailabilityOnDay = (d: Date) =>
    availabilityRules.some((r) => r.day_of_week === backendDayForDate(d));
  const slotsForSelectedDay = useMemo(
    () =>
      selectedDate && availabilityRules.length > 0 && !busyIntervalsLoading
        ? getSlotsForDay(
            availabilityRules,
            backendDayForDate(selectedDate),
            selectedDuration,
            busyIntervals,
            formatDateLocal(selectedDate)
          )
        : [],
    [selectedDate, availabilityRules, busyIntervalsLoading, selectedDuration, busyIntervals]
  );

  useEffect(() => {
    // Reconcile a previously-picked time against the current slot list:
    // duration/availability/busy data can all change (or refetch) while the
    // modal is open, so a selection that was valid a moment ago may no
    // longer be. Skip while busy data isn't loaded yet — slotsForSelectedDay
    // is empty during that window regardless, and would otherwise clear a
    // perfectly valid selection just because data hasn't arrived yet.
    if (!selectedTime || busyIntervalsLoading) return;
    if (!slotsForSelectedDay.includes(selectedTime)) {
      setSelectedTime("");
      // If the user had already moved on to the confirmation step, send them
      // back to Step 2 instead of leaving the summary on a stale/empty time.
      setStep((s) => (s === 3 ? 2 : s));
    }
  }, [selectedTime, slotsForSelectedDay, busyIntervalsLoading]);

  const selectedSubject = tutor.subjects?.find((s) => String(s.id) === selectedSubjectId);

  const handleNextStep1 = () => {
    if (!selectedSubjectId) {
      setStep1Error("Lütfen bir ders konusu seçin.");
      return;
    }
    if (!isTrial && !eligiblePackage && !usingTestCredit) {
      setStep1Error(
        "Bu hocayla ders ayırtmak için kullanılabilir aktif bir paketin olmalı."
      );
      return;
    }
    setStep1Error(null);
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!selectedDate || !selectedTime || busyIntervalsFetching) return;
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedSubjectId || busyIntervalsFetching) return;
    if (!isTrial && !eligiblePackage && !usingTestCredit) {
      setApiError("Bu hocayla ders ayırtmak için kullanılabilir aktif bir paketin olmalı.");
      setStep(1);
      return;
    }
    setApiError(null);
    setIsSubmitting(true);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const start_time = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`;

    try {
      const booking = await createBooking({
        tutor: String(tutor.id),
        subject: selectedSubjectId,
        start_time,
        duration_minutes: selectedDuration,
        ...(isTrial ? { is_trial: true } : {}),
        ...(lessonRequestId ? { lesson_request: lessonRequestId } : {}),
        ...(!isTrial && eligiblePackage ? { package_purchase_id: eligiblePackage.id } : {}),
        ...(learningContext
          ? {
              learning_goal_id: learningContext.learning_goal_id,
              learning_milestone_id: learningContext.learning_milestone_id,
              ...(learningContext.learning_topic_id
                ? { learning_topic_id: learningContext.learning_topic_id }
                : {}),
            }
          : {}),
      });
      if (usingPackageCredit) {
        queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
        queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      }
      onSuccess(booking);
      onClose();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: unknown } };
      const data = axErr.response?.data;
      let message = "Rezervasyon oluşturulurken bir hata oluştu.";
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (typeof d.detail === "string") message = d.detail;
        else if (Array.isArray(d.non_field_errors) && d.non_field_errors[0])
          message = String(d.non_field_errors[0]);
        else {
          const firstKey = Object.keys(d)[0];
          const val = firstKey ? d[firstKey] : null;
          if (Array.isArray(val) && val[0]) message = String(val[0]);
          // Some backend validation paths (e.g. the post-lock package-credit
          // recheck) raise a bare string value instead of an array — without
          // this, that case silently fell through to the generic message.
          else if (typeof val === "string" && val) message = val;
        }
      }
      if (message.includes("already booked")) {
        // Someone else took this slot between opening the modal and
        // submitting. Refresh busy data and drop the stale selection so the
        // user picks a slot that's actually still free, instead of being
        // able to resubmit the same one.
        setSelectedTime("");
        refetchBusyIntervals();
      }
      if (usingPackageCredit) {
        // The failure may have been a lost race on the last credit — refresh
        // so a stale "remaining credits" count doesn't linger in the UI.
        queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
      }
      setApiError(translateApiError(message));
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="box-border w-[min(42rem,calc(100vw-2rem))] max-w-none overflow-hidden"
        showClose
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="mr-2">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={cn(
                    "inline-block h-2 w-2 rounded-full mr-1",
                    step === s ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </span>
            {step === 1 && "Ders Seç"}
            {step === 2 && "Tarih ve Saat Seç"}
            {step === 3 && "Rezervasyonu Onayla"}
          </DialogTitle>
        </DialogHeader>
        {isTrial && (
          <p className="-mt-2 text-center text-xs font-medium text-primary">
            Ücretsiz Deneme Dersi
          </p>
        )}

        <div className="min-w-0 max-w-full space-y-6 py-2">
          {/* Step 1 */}
          {step === 1 && (
            <>
              {learningContext && (
                <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                  Bu rezervasyon öğrenme hedefinle ilişkilendirilecek.
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Ders konusu</label>
                <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                  {(tutor.subjects ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(String(s.id))}
                      className={cn(
                        "min-w-0 rounded-lg border p-3 text-left transition-colors",
                        selectedSubjectId === String(s.id)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {s.exam_type}
                      </Badge>
                    </button>
                  ))}
                </div>
                {step1Error && (
                  <p className="mt-2 text-sm text-destructive">{step1Error}</p>
                )}
              </div>
              {!isTrial && eligiblePackage && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">Paket hakkın kullanılacak</p>
                  <p className="mt-1 text-muted-foreground">
                    {eligiblePackage.plan.name} · Kullanılabilir {eligiblePackage.remaining_credits} /{" "}
                    {eligiblePackage.total_credits} ders hakkı
                  </p>
                </div>
              )}
              {!isTrial && !eligiblePackage && (
                usingTestCredit ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                    QA test kredisi kullanılacak. Gerçek ödeme veya paket satın alımı oluşturulmaz.
                  </div>
                ) : (
                  <ErrorMessage message="Bu hocayla ders ayırtmak için kullanılabilir aktif bir paketin olmalı." />
                )
              )}
              {isTrial ? (
                <div>
                  <label className="text-sm font-medium">Ders süresi</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{TRIAL_DURATION_MINUTES} dk</Badge>
                    <Badge variant="secondary">{formatPrice(displayPrice)}</Badge>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">Ders süresi</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{LESSON_BASE_MINUTES} dk</Badge>
                    <Badge variant="secondary">{usingTestCredit ? "1 test kredisi kullanılacak" : "1 paket hakkı kullanılacak"}</Badge>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleNextStep1}
                  disabled={!isTrial && !eligiblePackage && !usingTestCredit}
                >
                  İleri →
                </Button>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              {apiError && (
                <ErrorMessage message={apiError} />
              )}
              <div className="min-w-0 max-w-full">
                <label className="text-sm font-medium">Tarih</label>
                <div className="mt-2 flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2">
                  {next14Days.map((d) => {
                    const disabled = !hasAvailabilityOnDay(d);
                    const selected =
                      selectedDate &&
                      selectedDate.toDateString() === d.toDateString();
                    return (
                      <button
                        key={d.toISOString()}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setSelectedDate(d)}
                        className={cn(
                          "w-16 shrink-0 rounded-lg border px-3 py-2 text-center text-sm transition-colors",
                          disabled && "cursor-not-allowed opacity-50",
                          selected && "bg-primary text-primary-foreground border-primary",
                          !selected && !disabled && "border-border hover:bg-muted"
                        )}
                      >
                        <span className="block">
                          {d.toLocaleDateString("tr-TR", { weekday: "short" })}
                        </span>
                        <span className="block font-medium">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="min-w-0 max-w-full">
                <label className="text-sm font-medium">Saat</label>
                {!selectedDate ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Önce bir tarih seçin
                  </p>
                ) : busyIntervalsLoading || busyIntervalsFetching ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Müsait saatler kontrol ediliyor...
                  </p>
                ) : slotsForSelectedDay.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Bu tarihte müsait saat yok
                  </p>
                ) : (
                  <div className="mt-2 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
                    {slotsForSelectedDay.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedTime === slot ? "default" : "outline"}
                        size="sm"
                        className="w-full min-w-0"
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {selectedDate && selectedTime && (
                <div className="min-w-0 max-w-full rounded-lg bg-muted p-3 text-sm">
                  <p>
                    📅{" "}
                    {selectedDate.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    {selectedTime} — {endTime}
                  </p>
                  <p className="mt-1 break-words text-muted-foreground">
                    {selectedSubject?.name} · {selectedDuration} dakika ·{" "}
                    {isTrial ? formatPrice(displayPrice) : usingTestCredit ? "1 test kredisi kullanılacak" : "1 paket hakkı kullanılacak"}
                  </p>
                </div>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className="w-full sm:w-auto"
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  ← Geri
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleNextStep2}
                  disabled={!selectedDate || !selectedTime || busyIntervalsFetching}
                >
                  İleri →
                </Button>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && selectedSubject && (
            <>
              {learningContext && (
                <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                  Bu rezervasyon öğrenme hedefinle ilişkilendirilecek.
                </div>
              )}
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={tutor.profile_picture || '/images/demo-teacher.jpg'}
                    alt={`${tutor.name} ${tutor.surname}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(tutor.name, tutor.surname)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {tutor.name} {tutor.surname}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {tutor.university}
                  </p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex min-w-0 flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">Ders:</dt>
                  <dd className="min-w-0 break-words text-right">
                    {selectedSubject.name}{" "}
                    <Badge variant="secondary" className="text-xs">
                      {selectedSubject.exam_type}
                    </Badge>
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">Tarih:</dt>
                  <dd>
                    {selectedDate?.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Saat:</dt>
                  <dd>
                    {selectedTime} – {endTime}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Süre:</dt>
                  <dd>{selectedDuration} dakika</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ücret:</dt>
                  <dd className="font-semibold">
                    {isTrial ? formatPrice(displayPrice) : usingTestCredit ? "1 test kredisi kullanılacak" : "1 paket hakkı kullanılacak"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                {isTrial
                  ? "Bu ücretsiz deneme dersi için ödeme veya paket hakkı gerekmez."
                  : usingTestCredit
                    ? "Bu QA dersi test kredisinden karşılanır; ödeme veya kazanç kaydı oluşturmaz."
                    : "Bu ders paket hakkından karşılanacak, ek ödeme gerekmez."}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  className="w-full sm:w-auto"
                  variant="ghost"
                  onClick={() => setStep(2)}
                >
                  ← Geri
                </Button>
                <Button
                  className="w-full sm:flex-1"
                  onClick={handleSubmit}
                  disabled={
                    !selectedDate ||
                    !selectedTime ||
                    !selectedSubjectId ||
                    isSubmitting ||
                    busyIntervalsFetching
                  }
                >
                  {isSubmitting ? "Gönderiliyor..." : "Rezervasyonu Tamamla"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

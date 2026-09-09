"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createBooking } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import type { Booking, TutorProfile } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toBookingStartTime } from "@/lib/bookingTime";
import { LessonSlotPicker, type SlotSelection } from "./LessonSlotPicker";
import { endTimeLabel, longDateLabel } from "./slotPickerFormat";

// Package credits always reserve one standard 40-minute lesson. Keep in sync
// with apps/payments/services.py::PACKAGE_CREDIT_LESSON_MINUTES.
const LESSON_BASE_MINUTES = 40;
// Free trial lessons are always this length; the backend forces it
// regardless of what's sent (apps/lessons/pricing.py TRIAL_DURATION_MINUTES).
const TRIAL_DURATION_MINUTES = 20;

const GENERIC_BOOKING_ERROR = "Rezervasyon oluşturulamadı. Lütfen tekrar dene.";

// The API answers with a mix of hand-written Turkish and raw framework
// English, and the unmatched ones fall through to the user verbatim. Turkish
// copy is worth showing; a serializer's internal wording is not. A malformed
// subject id, for instance, surfaced as “demo-ayt-biyoloji” is not a valid
// UUID. inside this dialog.
const TECHNICAL_MESSAGE_MARKERS = [
  "is not a valid UUID",
  "Incorrect type",
  "Expected pk value",
  "Invalid pk",
  "object does not exist",
  "This field is required",
  "This field may not be null",
  "A valid integer is required",
  "Datetime has wrong format",
  "Traceback",
];

function isTechnicalMessage(message: string): boolean {
  const lowered = message.toLowerCase();
  return TECHNICAL_MESSAGE_MARKERS.some((marker) =>
    lowered.includes(marker.toLowerCase())
  );
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
  if (isTechnicalMessage(message)) return GENERIC_BOOKING_ERROR;
  return message;
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

/**
 * Book one lesson: a free trial, a package credit, or a QA test credit.
 *
 * Was a three-step wizard (subject, then date, then a confirmation screen).
 * It is one screen now: the subject sits beside the calendar rather than in
 * front of it, so a student can see when the tutor is actually open before
 * committing to anything, and the summary is a line above the button rather
 * than a page of its own. What the lesson costs is stated on the same screen
 * throughout, so there is no step that hides it.
 */
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
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selection, setSelection] = useState<SlotSelection | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationMinutes = isTrial ? TRIAL_DURATION_MINUTES : LESSON_BASE_MINUTES;

  // Trial bookings never offer credit payment, so skip the fetch entirely
  // when isTrial — in practice this query is almost always already warm
  // from PackageOfferPanel on the same tutor detail page.
  const { data: packagePurchases = [] } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isOpen && !isTrial,
  });

  useEffect(() => {
    // Reset on open (not close): this modal instance is reused for both
    // normal and trial bookings, so the fresh session must pick up whichever
    // mode is being opened via `isTrial`.
    if (isOpen) {
      const subjects = tutor.subjects ?? [];
      setSelectedSubjectId(subjects.length === 1 ? String(subjects[0].id) : "");
      setSelection(null);
      setApiError(null);
      setValidationError(null);
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isTrial]);

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
  const blockedForMissingPackage = !isTrial && !eligiblePackage && !usingTestCredit;

  const priceLabel = isTrial
    ? formatPrice(0)
    : usingTestCredit
      ? "1 test kredisi kullanılacak"
      : "1 paket hakkı kullanılacak";

  const note = isTrial
    ? "Bu ücretsiz deneme dersi için ödeme veya paket hakkı gerekmez."
    : usingTestCredit
      ? "Bu QA dersi test kredisinden karşılanır; ödeme veya kazanç kaydı oluşturmaz."
      : eligiblePackage
        ? `${eligiblePackage.plan.name} · Kullanılabilir ${eligiblePackage.remaining_credits} / ${eligiblePackage.total_credits} ders hakkı`
        : undefined;

  const canSubmit =
    Boolean(selectedSubjectId) &&
    Boolean(selection?.time) &&
    !blockedForMissingPackage &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!selectedSubjectId) {
      setValidationError("Lütfen bir ders konusu seç.");
      return;
    }
    if (!selection?.time) {
      setValidationError("Lütfen bir gün ve saat seç.");
      return;
    }
    if (blockedForMissingPackage) {
      setApiError("Bu hocayla ders ayırtmak için kullanılabilir aktif bir paketin olmalı.");
      return;
    }
    setValidationError(null);
    setApiError(null);
    setIsSubmitting(true);

    // The picker speaks Istanbul wall clock in plain strings; rebuild the
    // local Date only here, at the single write boundary. One writer for the
    // whole app — see toBookingStartTime. This must stay a naive local string;
    // an ISO instant with a Z moves the lesson.
    const [year, month, day] = selection.date.split("-").map(Number);
    const [hours, minutes] = selection.time.split(":").map(Number);
    const start_time = toBookingStartTime(
      new Date(year, month - 1, day, hours, minutes, 0, 0)
    );

    try {
      const booking = await createBooking({
        tutor: String(tutor.id),
        subject: selectedSubjectId,
        start_time,
        duration_minutes: durationMinutes,
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
        // Someone else took this slot between opening the dialog and
        // submitting. Drop the stale time and refresh the slot list so the
        // student picks one that is actually still free, instead of being
        // able to resubmit the same one.
        setSelection((current) => (current ? { ...current, time: "" } : null));
        queryClient.invalidateQueries({ queryKey: ["tutor-slots", tutor.id] });
      }
      if (usingPackageCredit) {
        // The failure may have been a lost race on the last credit — refresh
        // so a stale "remaining credits" count doesn't linger in the UI.
        queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
      }
      setApiError(translateApiError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "box-border flex max-h-[90dvh] flex-col gap-0 overflow-hidden bg-surface p-0",
          "inset-x-0 bottom-0 top-auto w-full max-w-none translate-x-0 translate-y-0 rounded-t-modal rounded-b-none",
          "sm:inset-x-auto sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-h-[calc(100dvh-4rem)] sm:w-[min(52rem,calc(100vw-2rem))] sm:max-w-none sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-modal"
        )}
        showClose
      >
        <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="text-h3">
              {isTrial ? "Ücretsiz deneme dersi ayırt" : "Ders rezervasyonu yap"}
            </DialogTitle>
            <DialogDescription className="text-[0.875rem] text-ink-mid">
              Hocanın müsait olduğu bir gün ve saat seç. Saatler İstanbul saatine göredir.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 min-w-0 max-w-full flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {learningContext && (
            <p className="rounded-input border border-line px-3 py-2 text-[0.8125rem] text-ink-mid">
              Bu rezervasyon öğrenme hedefinle ilişkilendirilecek.
            </p>
          )}
          {apiError && <ErrorMessage message={apiError} />}
          {blockedForMissingPackage && (
            <ErrorMessage message="Bu hocayla ders ayırtmak için kullanılabilir aktif bir paketin olmalı." />
          )}

          <LessonSlotPicker
            tutor={tutor}
            durationMinutes={durationMinutes}
            subjects={tutor.subjects ?? []}
            selectedSubjectId={selectedSubjectId}
            onSubjectChange={(id) => {
              setSelectedSubjectId(id);
              setValidationError(null);
            }}
            value={selection}
            onChange={(next) => {
              setSelection(next);
              setValidationError(null);
            }}
            priceLabel={priceLabel}
            note={note}
            eyebrow={isTrial ? "Ücretsiz deneme dersi" : undefined}
            enabled={isOpen}
          />
        </div>

        <div className="shrink-0 border-t border-line bg-surface px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-[0.875rem]">
              {selection?.time ? (
                <>
                  <p className="tabular-nums text-ink">
                    {longDateLabel(selection.date)} · {selection.time} –{" "}
                    {endTimeLabel(selection.time, durationMinutes)}
                  </p>
                  <p className="text-ink-mid">
                    {durationMinutes} dakika · {priceLabel}
                  </p>
                </>
              ) : (
                <p className="text-ink-mid">
                  {validationError ?? "Devam etmek için bir gün ve saat seç."}
                </p>
              )}
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? "Gönderiliyor..." : "Rezervasyonu tamamla"}
            </Button>
          </div>
          {validationError && selection?.time && (
            <p className="mt-2 text-[0.8125rem] text-error">{validationError}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

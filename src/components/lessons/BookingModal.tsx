"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTutorAvailability } from "@/lib/dashboardApi";
import { createBooking } from "@/lib/lessonsApi";
import type { Booking, TutorProfile, AvailabilityRule } from "@/types";
import { formatPrice } from "@/lib/utils";
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
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [45, 60, 90] as const;

// Backend: 0=Monday, 6=Sunday. JS getDay(): 0=Sunday, 6=Saturday.
function jsDayToBackendDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function getNext14Days(): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const next = new Date(d);
    next.setDate(d.getDate() + i);
    out.push(next);
  }
  return out;
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

// Generate 30-min slots for a day from availability rules. Exclude slots where start + duration would exceed rule end.
function getSlotsForDay(
  rules: AvailabilityRule[],
  backendDay: number,
  durationMinutes: number
): string[] {
  const dayRules = rules.filter((r) => r.day_of_week === backendDay);
  if (dayRules.length === 0) return [];
  const slotSet = new Set<number>();
  for (const r of dayRules) {
    const startMin = parseTimeToMinutes(r.start_time);
    const endMin = parseTimeToMinutes(r.end_time);
    for (let m = startMin; m + durationMinutes <= endMin; m += 30) {
      slotSet.add(m);
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
  return message;
}

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

interface BookingModalProps {
  tutor: TutorProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
  lessonRequestId?: string;
}

export function BookingModal({
  tutor,
  isOpen,
  onClose,
  onSuccess,
  lessonRequestId,
}: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
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

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedSubjectId("");
      setSelectedDuration(60);
      setSelectedDate(null);
      setSelectedTime("");
      setApiError(null);
      setIsSubmitting(false);
      setStep1Error(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate]);

  const calculatedPrice = (tutor.hourly_price * selectedDuration) / 60;
  const endTime = selectedTime
    ? (() => {
        const [h, m] = selectedTime.split(":").map(Number);
        const end = new Date();
        end.setHours(h, m + selectedDuration, 0, 0);
        return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      })()
    : "";

  const next14Days = getNext14Days();
  const backendDayForDate = (d: Date) => jsDayToBackendDay(d.getDay());
  const hasAvailabilityOnDay = (d: Date) =>
    availabilityRules.some((r) => r.day_of_week === backendDayForDate(d));
  const slotsForSelectedDay =
    selectedDate && availabilityRules.length > 0
      ? getSlotsForDay(
          availabilityRules,
          backendDayForDate(selectedDate),
          selectedDuration
        )
      : [];

  const selectedSubject = tutor.subjects?.find((s) => String(s.id) === selectedSubjectId);

  const handleNextStep1 = () => {
    if (!selectedSubjectId) {
      setStep1Error("Lütfen bir ders konusu seçin.");
      return;
    }
    setStep1Error(null);
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!selectedDate || !selectedTime) return;
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedSubjectId) return;
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
        ...(lessonRequestId ? { lesson_request: lessonRequestId } : {}),
      });
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
        }
      }
      setApiError(translateApiError(message));
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" showClose>
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

        <div className="space-y-6 py-2">
          {/* Step 1 */}
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-medium">Ders konusu</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(tutor.subjects ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(String(s.id))}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
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
              <div>
                <label className="text-sm font-medium">Ders süresi</label>
                <div className="mt-2 flex gap-2">
                  {DURATION_OPTIONS.map((dur) => (
                    <Button
                      key={dur}
                      type="button"
                      variant={selectedDuration === dur ? "default" : "outline"}
                      onClick={() => setSelectedDuration(dur)}
                    >
                      {dur} dk
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tahmini ücret: {formatPrice(calculatedPrice)}
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNextStep1}>İleri →</Button>
              </div>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              {apiError && (
                <ErrorMessage message={apiError} />
              )}
              <div>
                <label className="text-sm font-medium">Tarih</label>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
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
                          "shrink-0 rounded-lg border px-3 py-2 text-center text-sm transition-colors",
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
              <div>
                <label className="text-sm font-medium">Saat</label>
                {!selectedDate ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Önce bir tarih seçin
                  </p>
                ) : slotsForSelectedDay.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Bu tarihte müsait saat yok
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {slotsForSelectedDay.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={selectedTime === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {selectedDate && selectedTime && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p>
                    📅{" "}
                    {selectedDate.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    {selectedTime} — {endTime}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {selectedSubject?.name} · {selectedDuration} dakika ·{" "}
                    {formatPrice(calculatedPrice)}
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  ← Geri
                </Button>
                <Button
                  onClick={handleNextStep2}
                  disabled={!selectedDate || !selectedTime}
                >
                  İleri →
                </Button>
              </div>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && selectedSubject && (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={tutor.profile_picture || '/images/demo-teacher.jpg'}
                    alt={`${tutor.name} ${tutor.surname}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(tutor.name, tutor.surname)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {tutor.name} {tutor.surname}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tutor.university}
                  </p>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ders:</dt>
                  <dd>
                    {selectedSubject.name}{" "}
                    <Badge variant="secondary" className="text-xs">
                      {selectedSubject.exam_type}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
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
                    {formatPrice(calculatedPrice)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                Ödeme ders sonrasında hoca ile mutabık kalınan yöntemle yapılır.
              </p>
              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  ← Geri
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { getBookingErrorMessage, requestEmergencyCancel } from "@/lib/lessonsApi";
import {
  EMERGENCY_REASON_MAX_LENGTH,
  emergencyReasonProblem,
} from "@/lib/lessonCancelPolicy";
import type { Booking } from "@/types";

interface EmergencyCancelDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  /** Called once the request reached the server (a new one, or the one already open). */
  onSuccess: () => void;
}

/**
 * A tutor cannot cancel a confirmed lesson inside its last 12 hours: the
 * student paid for that hour. This is the one way out. It does not cancel
 * anything, it asks, and staff decide; until they do the lesson stands.
 *
 * Errors are inline (a blocking form, not a toast): the tutor needs to see
 * what to fix next to the field.
 */
export function EmergencyCancelDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: EmergencyCancelDialogProps) {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const reset = () => {
    setReason("");
    setFieldError(null);
    setSubmitError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (isSending) return;
    reset();
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const problem = emergencyReasonProblem(reason);
    if (problem) {
      setFieldError(problem);
      return;
    }
    setFieldError(null);

    setIsSending(true);
    try {
      await requestEmergencyCancel(booking.id, reason.trim());
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(
        getBookingErrorMessage(error, "Talep gönderilemedi. Lütfen tekrar dene.")
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acil durum bildir</DialogTitle>
          <DialogDescription>
            Derse 12 saatten az kaldığı için bu dersi kendin iptal edemezsin.
            Gerçek bir acil durum varsa nedenini yaz, destek ekibi talebini
            inceler. Karar verilene kadar dersi vermeye hazır ol.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="emergency-reason">Neden</Label>
            <Textarea
              id="emergency-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              maxLength={EMERGENCY_REASON_MAX_LENGTH + 100}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "emergency-reason-error" : undefined}
              disabled={isSending}
            />
            <div className="flex items-start justify-between gap-3">
              <p
                id="emergency-reason-error"
                role={fieldError ? "alert" : undefined}
                className="text-sm text-[var(--error)]"
              >
                {fieldError}
              </p>
              <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {reason.trim().length} / {EMERGENCY_REASON_MAX_LENGTH}
              </p>
            </div>
          </div>
          {submitError && <ErrorMessage message={submitError} />}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSending}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? "Gönderiliyor…" : "Talebi gönder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

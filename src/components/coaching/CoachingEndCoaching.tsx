"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { terminateTutorCoaching } from "@/lib/coachingApi";
import { CoachingConfirmDialog } from "./CoachingConfirmDialog";

/**
 * Ending a student's coaching altogether. It cannot be undone and cancels every
 * remaining meeting, so it is never a button in a list a tutor scrolls past:
 * on the student's own program page it is a solid destructive button, and in a
 * list (only for a student who has no program page yet) it is a quiet link. In
 * both places it asks for a written reason first and then for a confirmation.
 *
 * The server keeps the reason as an immutable record, and a repeated request
 * with a different reason is refused, so the dialog says what happened instead
 * of retrying on its own.
 */
export function CoachingEndCoaching({
  purchaseId,
  studentName,
  variant,
  onEnded,
}: {
  purchaseId: string;
  studentName: string;
  variant: "link" | "button";
  onEnded?: () => void;
}) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const close = () => {
    setOpen(false);
    setReason("");
    terminate.reset();
  };

  const terminate = useMutation({
    mutationFn: () => terminateTutorCoaching(purchaseId, reason.trim()),
    onSuccess: () => {
      for (const queryKey of [
        ["coaching-tutor-students"],
        ["coaching-tutor-sessions"],
        ["coaching-disputes", "tutor"],
      ]) {
        client.invalidateQueries({ queryKey });
      }
      setOpen(false);
      setReason("");
      onEnded?.();
    },
  });

  return (
    <>
      {variant === "button" ? (
        <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
          Koçluğu sonlandır
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center text-small text-ink-mid underline underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          Koçluğu sonlandır
        </button>
      )}

      <CoachingConfirmDialog
        open={open}
        title={`${studentName} ile koçluğu sonlandır`}
        description="Bu işlem geri alınamaz. Kalan görüşmeler iptal olur, koçluk hemen durur ve öğrenciye haber verilir. Gerekçen kayda geçer."
        confirmLabel="Koçluğu sonlandır"
        onConfirm={() => terminate.mutate()}
        onCancel={close}
        isPending={terminate.isPending}
        confirmDisabled={reason.trim().length === 0}
      >
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Neden sonlandırıyorsun?"
            aria-label="Sonlandırma gerekçesi"
            disabled={terminate.isPending}
          />
          {terminate.isError ? (
            <InlineError
              size="sm"
              message="İşlem güncel koçluk durumuyla çakıştı; sayfayı yenileyip tekrar dene."
            />
          ) : null}
        </div>
      </CoachingConfirmDialog>
    </>
  );
}

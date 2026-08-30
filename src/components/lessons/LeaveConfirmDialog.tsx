"use client";

import { useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveConfirmDialogProps {
  open: boolean;
  /** Confirm leaving — runs the official hangup. Guarded against double-submit. */
  onConfirm: () => void;
  /** "Vazgeç" / Escape / overlay dismiss — stay in the conference. */
  onCancel: () => void;
  isLeaving: boolean;
  returnFocusRef?: RefObject<HTMLButtonElement>;
}

/**
 * Confirmation before leaving the live lesson conference. This is NOT "Dersi
 * bitir" (the tutor-initiated early-end flow) — it only removes this user from
 * the call. Escape and any dismiss map to "Vazgeç"; initial focus sits on the
 * safe secondary action so an accidental Enter can't leave the call.
 */
export function LeaveConfirmDialog({
  open,
  onConfirm,
  onCancel,
  isLeaving,
  returnFocusRef,
}: LeaveConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isLeaving) onCancel();
      }}
    >
      <DialogContent
        showClose={false}
        className="w-[calc(100dvw-2rem)] max-w-md rounded-modal border-line bg-surface p-6 text-ink shadow-float sm:p-7"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-xl font-bold tracking-[-0.02em]">
            Görüşmeden ayrılmak istiyor musunuz?
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-ink-mid">
            Ayrılırsanız canlı dersten çıkarsınız.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 gap-3 sm:space-x-0">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            className="min-w-32"
            onClick={onCancel}
            disabled={isLeaving}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-w-44"
            onClick={onConfirm}
            disabled={isLeaving}
          >
            Görüşmeden ayrıl
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

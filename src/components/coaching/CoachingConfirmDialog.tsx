"use client";

import { useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * One confirmation step before a coaching action that cannot be undone
 * (ending coaching, rejecting a request, reporting a no-show). Same shape as
 * LeaveConfirmDialog: focus starts on "Vazgeç" so a stray Enter is safe, and
 * dismissing is blocked while the request is in flight.
 */
export function CoachingConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
  tone = "destructive",
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  tone?: "destructive" | "default";
  children?: ReactNode;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isPending) onCancel();
      }}
    >
      <DialogContent
        showClose={false}
        className="w-[calc(100dvw-2rem)] max-w-md rounded-modal border-line bg-surface p-6 text-ink shadow-float sm:p-7"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="text-xl font-bold tracking-[-0.02em]">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-ink-mid">
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="mt-2 flex-col-reverse gap-3 sm:flex-row sm:space-x-0">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            className="sm:min-w-32"
            onClick={onCancel}
            disabled={isPending}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            variant={tone === "destructive" ? "destructive" : "default"}
            className="sm:min-w-40"
            onClick={onConfirm}
            disabled={isPending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

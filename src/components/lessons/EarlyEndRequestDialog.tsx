"use client";

import { useRef, type RefObject } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EarlyEndRequestDialogProps {
  open: boolean;
  /** "Dersi bitir" — accept the tutor's early-end request. */
  onAccept: () => void;
  /** "Devam et" / Escape / overlay dismiss — decline and resume the lesson. */
  onContinue: () => void;
  isSubmitting: boolean;
  hasError: boolean;
  returnFocusRef?: RefObject<HTMLButtonElement>;
}

/**
 * Student's blocking prompt when the tutor asks to end early. Escape and any
 * dismiss route through the same "continue" (decline) mutation as the button.
 * Stays open on error so the student can retry.
 */
export function EarlyEndRequestDialog({
  open,
  onAccept,
  onContinue,
  isSubmitting,
  hasError,
  returnFocusRef,
}: EarlyEndRequestDialogProps) {
  const acceptRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) onContinue();
      }}
    >
      <DialogContent
        showClose={false}
        className="w-[calc(100dvw-2rem)] max-w-md rounded-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          acceptRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Öğretmenin dersi bitirmek istiyor</DialogTitle>
          <DialogDescription>
            Dersi şimdi bitirmeyi onaylıyor musun?
          </DialogDescription>
        </DialogHeader>

        {hasError && (
          <p className="text-sm text-destructive" aria-live="polite">
            Yanıtın gönderilemedi. Lütfen tekrar dene.
          </p>
        )}

        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onContinue}
            disabled={isSubmitting}
          >
            Devam et
          </Button>
          <Button
            ref={acceptRef}
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Dersi bitir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

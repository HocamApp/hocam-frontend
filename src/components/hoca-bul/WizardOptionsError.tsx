"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Inline, not a toast or a modal: the student stays on the step and the answers
 * already given are untouched by a retry.
 */
export function WizardOptionsError({
  onRetry,
  isRetrying = false,
}: {
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
    >
      <p className="text-sm font-medium text-foreground">
        Seçenekler şu anda yüklenemedi.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Yanıtların korundu, tekrar deneyebilirsin.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-4 min-h-11 rounded-xl"
      >
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
        {isRetrying ? "Deneniyor…" : "Tekrar dene"}
      </Button>
    </div>
  );
}

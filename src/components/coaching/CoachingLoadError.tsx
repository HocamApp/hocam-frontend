"use client";

import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";

/**
 * A failed coaching read. Kept apart from the empty state on purpose: "we
 * could not load your coaching" and "you have no coaching" are different
 * facts, and showing the second for the first sends people away.
 */
export function CoachingLoadError({
  message = "Bilgiler yüklenemedi. Bağlantını kontrol edip tekrar dene.",
  onRetry,
  isRetrying = false,
}: {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div className="space-y-3 rounded-card border border-line bg-surface p-5">
      <InlineError message={message} />
      <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
        Tekrar dene
      </Button>
    </div>
  );
}

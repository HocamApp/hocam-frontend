"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A single primary action, pinned above the safe area on small screens so it is
 * never hidden behind browser chrome or a home indicator.
 */
export function WizardFooter({
  label,
  disabled = false,
  loading = false,
  loadingLabel,
  describedById,
  onPrimary,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  describedById?: string;
  onPrimary: () => void;
}) {
  return (
    <div
      className="sticky bottom-0 z-30 border-t bg-background/95 px-5 pt-4 backdrop-blur sm:px-8 lg:static lg:border-0 lg:bg-transparent lg:px-12 lg:pb-10 lg:backdrop-blur-none"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex w-full max-w-[38rem] justify-end">
        <Button
          type="button"
          size="lg"
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          aria-describedby={describedById}
          onClick={onPrimary}
          className="min-h-11 w-full rounded-xl sm:w-auto"
        >
          {loading && loadingLabel ? loadingLabel : label}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

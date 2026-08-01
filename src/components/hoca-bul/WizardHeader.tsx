"use client";

import { ArrowLeft, X } from "lucide-react";

import { WizardProgress } from "./WizardProgress";
import type { HocaBulStepTotal } from "@/types/hocaBul";

/**
 * Back, progress and exit. Back is a labelled control rather than a bare icon —
 * on the first step it leaves the flow, which is worth saying out loud.
 */
export function WizardHeader({
  humanIndex,
  total,
  backLabel,
  onBack,
  onExit,
}: {
  humanIndex: number;
  total: HocaBulStepTotal;
  backLabel: string;
  onBack: () => void;
  onExit: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 px-5 py-3 backdrop-blur sm:px-8 lg:static lg:border-0 lg:bg-transparent lg:px-12 lg:pt-8 lg:backdrop-blur-none">
      <div className="mx-auto flex w-full max-w-[38rem] items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </button>

        <div className="min-w-0 flex-1">
          <WizardProgress humanIndex={humanIndex} total={total} />
        </div>

        <button
          type="button"
          onClick={onExit}
          aria-label="Eşleşmeden çık"
          className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

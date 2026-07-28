"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder rows match the height of a real option row so nothing jumps when
 * the options arrive. Announced once, politely, rather than per row.
 */
export function WizardOptionsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Seçenekler yükleniyor</span>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} className="h-[68px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Full-page fallback used before the wizard's client bundle takes over. */
export function WizardBootSkeleton() {
  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="hidden lg:block lg:h-dvh lg:border-r lg:bg-muted/30" aria-hidden="true" />
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto w-full max-w-[38rem]" role="status" aria-live="polite">
          <span className="sr-only">Eşleşme akışı yükleniyor</span>
          <div aria-hidden="true">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="mt-8 h-10 w-3/4 rounded-xl" />
            <Skeleton className="mt-4 h-5 w-1/2 rounded-lg" />
            <div className="mt-10 space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-[68px] w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

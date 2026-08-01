"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Segment-level boundary for an unexpected client failure. Recoverable problems
 * (options that would not load, a preview that failed) are handled inline on
 * the step itself — this is the last resort.
 */
export default function HocaBulError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5">
      <div className="w-full max-w-md text-center" role="alert">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Eşleşme akışı açılamadı
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Beklenmeyen bir sorun oluştu. Yanıtların kayıtlı, tekrar
          deneyebilirsin.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-xl"
          >
            Tekrar dene
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-11 rounded-xl"
          >
            <Link href="/home">Ana sayfaya dön</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

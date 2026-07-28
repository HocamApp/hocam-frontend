"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type SubmissionStatusProps =
  | { state: "loading" }
  | {
      state: "error";
      rateLimited: boolean;
      onRetry: () => void;
      onBack: () => void;
    };

export function HocaBulSubmissionStatus(props: SubmissionStatusProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (props.state === "error") {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [props.state]);

  return (
    <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div
        role={props.state === "loading" ? "status" : "alert"}
        aria-live={props.state === "loading" ? "polite" : "assertive"}
        className="w-full max-w-lg rounded-3xl border bg-card p-7 text-center shadow-xl sm:p-10"
      >
        {props.state === "loading" ? (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sana uygun hocaları karşılaştırıyoruz
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Yanıtlarını doğrulanmış hocaların gerçek ders, fiyat ve müsaitlik
              bilgileriyle eşleştiriyoruz.
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-6 text-2xl font-bold tracking-tight text-foreground outline-none sm:text-3xl"
            >
              Eşleşmeler hazırlanamadı
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {props.rateLimited
                ? "Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene."
                : "Eşleşmeler hazırlanamadı. Yanıtların korundu, tekrar deneyebilirsin."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                className="min-h-11 rounded-xl"
                onClick={props.onRetry}
              >
                Tekrar dene
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={props.onBack}
              >
                Tercihlerime dön
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

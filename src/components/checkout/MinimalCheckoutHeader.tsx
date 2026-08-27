"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { BrandMark } from "@/components/brand/BrandMark";

export function MinimalCheckoutHeader({ tutorId }: { tutorId: string }) {
  const router = useRouter();

  function goBack() {
    let sameOriginReferrer = false;
    try {
      sameOriginReferrer = Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
    } catch {
      sameOriginReferrer = false;
    }
    if (sameOriginReferrer && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/tutors/${tutorId}`);
  }

  return (
    <header className="relative z-20 bg-[var(--checkout-header-surface)] text-[var(--checkout-header-ink)]">
      <a href="#checkout-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-3 focus:py-2 focus:text-paper focus:ring-2 focus:ring-ink">
        İçeriğe geç
      </a>
      <div className="flex h-[var(--app-header-row-1-h)] w-full items-center gap-3 px-4 sm:px-7 lg:px-10 xl:px-14">
        <button
          type="button"
          onClick={goBack}
          aria-label="Hoca profiline dön"
          className="flex size-10 items-center justify-center rounded-pill border border-[var(--checkout-soft-line)] bg-[var(--checkout-clearway)] text-[var(--checkout-nighttime)] transition-colors duration-[--duration-state] hover:border-[var(--checkout-evergreen)] hover:bg-[var(--checkout-nighttime)] hover:text-[var(--checkout-clearway)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkout-evergreen)] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-5" weight="regular" aria-hidden="true" />
        </button>
        <Link href="/home" aria-label="Hocam ana sayfa" className="inline-flex h-10 items-center rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">
          <BrandMark priority />
        </Link>
      </div>
    </header>
  );
}

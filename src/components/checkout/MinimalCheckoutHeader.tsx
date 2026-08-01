"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <header className="relative z-20 bg-[var(--checkout-header-surface)]">
      <a href="#checkout-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring">
        İçeriğe geç
      </a>
      <div className="flex h-[4.25rem] w-full items-center gap-3 px-4 sm:px-7 lg:px-10 xl:px-14">
        <button
          type="button"
          onClick={goBack}
          aria-label="Hoca profiline dön"
          className="flex size-10 items-center justify-center rounded-full border border-[var(--checkout-soft-line)] bg-[var(--checkout-clearway)] text-[var(--checkout-nighttime)] transition duration-200 hover:-translate-x-0.5 hover:border-[var(--checkout-evergreen)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkout-evergreen)] focus-visible:ring-offset-2 active:translate-x-0"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <Link href="/home" aria-label="Hocam ana sayfa" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <BrandMark priority />
        </Link>
      </div>
      <div className="h-1.5 w-full bg-[var(--checkout-accent)]" aria-hidden="true" />
    </header>
  );
}

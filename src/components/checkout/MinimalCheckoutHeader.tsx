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
    <header className="border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <a href="#checkout-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring">
        İçeriğe geç
      </a>
      <div className="mx-auto flex h-16 w-full max-w-[84rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={goBack}
          aria-label="Hoca profiline dön"
          className="flex size-11 items-center justify-center rounded-full border border-border/80 bg-background text-foreground transition duration-200 hover:-translate-x-0.5 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-x-0"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <Link href="/home" aria-label="Hocam ana sayfa" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <BrandMark priority />
        </Link>
        <span className="ml-auto hidden text-xs font-medium text-muted-foreground sm:block">Güvenli paket talebi</span>
      </div>
    </header>
  );
}

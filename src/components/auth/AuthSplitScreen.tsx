"use client";

import { ReactNode } from "react";
import { BrandMark } from "@/components/brand/BrandMark";

/**
 * Dark-variant input shell adapted from the 21st.dev reference. Neutral, not violet —
 * brand colors are intentionally deferred.
 */
export function GlassInputWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 transition-colors focus-within:border-white/30 focus-within:bg-white/10">
      {children}
    </div>
  );
}

interface AuthSplitScreenProps {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  rightPanel?: ReactNode;
}

/**
 * Full-screen split layout with a dark form column and a restrained brand panel.
 */
export function AuthSplitScreen({
  title,
  description,
  children,
  footer,
  rightPanel,
}: AuthSplitScreenProps) {
  return (
    <div className="flex min-h-dvh-safe w-full flex-col overflow-x-hidden md:flex-row">
      {/* Left column: form */}
      <main className="flex min-h-dvh-safe flex-1 items-center justify-center overflow-y-auto bg-neutral-950 p-6 py-10 text-white sm:p-8 md:flex-[3] lg:flex-1">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <BrandMark size="md" priority className="mb-2 text-white" />
            <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-neutral-400">
              {description}
            </p>
            {children}
            {footer}
          </div>
        </div>
      </main>

      {/* Right column: logo-led brand surface */}
      <section className="hidden flex-1 bg-[#f5f3ee] p-4 md:block md:flex-[2] lg:flex-1">
        <div
          className="animate-slide-right animate-delay-300 relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-[#ff5968]/20 bg-[#fbfaf7] shadow-sm"
        >
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#ff5968]/12 blur-3xl" aria-hidden />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#ff8a71]/10 blur-3xl" aria-hidden />
          {rightPanel ? (
            <div className="relative z-10 h-full w-full">{rightPanel}</div>
          ) : (
            <BrandMark size="hero" className="relative z-10 text-neutral-950" />
          )}
        </div>
      </section>
    </div>
  );
}

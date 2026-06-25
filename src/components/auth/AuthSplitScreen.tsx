"use client";

import { ReactNode } from "react";

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
}

/**
 * Full-screen split layout: dark neutral form column on the left, an intentionally blank
 * white panel on the right (reserved for future design — no testimonials/imagery).
 */
export function AuthSplitScreen({
  title,
  description,
  children,
  footer,
}: AuthSplitScreenProps) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col md:flex-row">
      {/* Left column: form */}
      <section className="flex min-h-[100dvh] flex-1 items-center justify-center overflow-y-auto bg-neutral-950 p-6 py-10 text-white sm:p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
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
      </section>

      {/* Right column: intentionally blank, reserved for future design */}
      <section className="hidden flex-1 bg-white p-4 md:block">
        <div
          className="animate-slide-right animate-delay-300 h-full w-full rounded-3xl border border-neutral-200 shadow-sm"
          aria-hidden
        />
      </section>
    </div>
  );
}

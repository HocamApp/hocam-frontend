"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";

/**
 * Wraps every coaching page: tutor-only, and only while coaching is on.
 *
 * When the feature is off — whether because the frontend build flag is
 * off, the backend build flag is off (the flag endpoint 404s), or an admin
 * turned the runtime switch off — a direct visit redirects to the tutor
 * dashboard instead of rendering a broken page or an error.
 */
export function CoachingGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireRole="tutor">
      <CoachingFlagGate>{children}</CoachingFlagGate>
    </RouteGuard>
  );
}

function CoachingFlagGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { enabled, isLoading } = useCoachingFlag();

  useEffect(() => {
    if (!isLoading && !enabled) {
      router.replace("/dashboard/tutor");
    }
  }, [enabled, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!enabled) return null;

  return <>{children}</>;
}

/**
 * Wraps existing-coaching-record tutor pages (disputes, earnings, the
 * students list): tutor-only, but deliberately NOT gated on the runtime
 * sales flag. Master Spec §42's kill switch only closes new coaching
 * sales/intake ("mevcut kayıtlar silinmez") — a tutor must still be able
 * to see and act on coaching they already have while new sales are off.
 * Sale-intake surfaces (plan, availability, onboarding) keep using
 * CoachingGuard above.
 */
export function CoachingRecordGuard({ children }: { children: React.ReactNode }) {
  return <RouteGuard requireRole="tutor">{children}</RouteGuard>;
}

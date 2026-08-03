"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";

// Routes a not-yet-activated tutor may still use: setup/onboarding (incl. the
// tutorial link target), their profile (required completion + account
// settings) and support. Everything else redirects into onboarding until the
// live-lesson tutorial is completed.
const ALLOWED_PREFIXES = ["/tutor", "/support", "/profile"];

// Exact-segment match: "/tutor" must NOT allow "/tutors" (the public
// marketplace listing lives there) or "/tutorabc" — only "/tutor" itself or
// anything nested under "/tutor/...". Exported for a regression test; a
// naive pathname.startsWith("/tutor") previously let "/tutors" through.
export function isAllowedPath(pathname: string) {
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export interface TutorActivationGateInput {
  isLoading: boolean;
  isTutor: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  tutorialCompleted: boolean;
  /**
   * Verification state of the tutor profile:
   * - `true`  — verified tutor. Per product decision a verified tutor keeps
   *   full navigation even with incomplete onboarding; missing steps surface
   *   as a banner/checklist instead of a lock-in.
   * - `false` — known unverified (or no profile yet): the hard gate stays.
   * - `null`  — not resolved yet (query in flight): stay put, no bounce.
   */
  isVerified: boolean | null;
  pathname: string;
}

/**
 * Pure redirect decision, exported for regression tests (same pattern as
 * isAllowedPath above).
 *
 * Staff exemption: admins may carry a tutor role in Django, but their primary
 * account belongs in the admin center — only gate them while they are viewing
 * a tutor account through the explicit impersonation flow. This mirrors
 * MainLayoutShell's (!isAdmin || isImpersonating) rule; a missing exemption
 * here once ping-ponged admins between /admin-control (this gate) and
 * /tutor/onboarding (RouteGuard's admin bounce), flickering the screen.
 */
export function shouldRedirectToOnboarding({
  isLoading,
  isTutor,
  isAdmin,
  isImpersonating,
  tutorialCompleted,
  isVerified,
  pathname,
}: TutorActivationGateInput) {
  return (
    !isLoading &&
    isTutor &&
    (!isAdmin || isImpersonating) &&
    !tutorialCompleted &&
    isVerified === false &&
    !isAllowedPath(pathname)
  );
}

/**
 * Hard frontend gate for tutors who have not completed the mandatory
 * live-lesson tutorial. UX only — the real enforcement lives in the backend
 * (marketplace visibility, booking accept/confirm, session tokens), so
 * bypassing this redirect gains nothing.
 *
 * Exempt (grandfathered) pre-existing tutors arrive with
 * jitsi_tutorial_completed=true from the migration backfill and never hit
 * this gate.
 *
 * Verified-tutor exemption (product decision): a verified tutor with
 * incomplete onboarding is NOT locked into /tutor/onboarding — they keep
 * full navigation and see a persistent banner pointing at the remaining
 * steps instead (MainLayoutShell). The lock-in stays only for tutors known
 * to be unverified; while verification state is unresolved the gate waits
 * rather than bouncing on a guess.
 */
export function TutorActivationGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isTutor, isAdmin, isLoading, isImpersonating } = useAuth();

  // Same queryKey/fn as MainLayoutShell — one shared fetch, no extra request.
  const profileQuery = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isTutor && !isLoading && user?.tutor_profile_id != null,
    retry: false,
  });
  const isVerified: boolean | null = !isTutor
    ? null
    : user?.tutor_profile_id == null
      ? false
      : profileQuery.data
        ? profileQuery.data.is_verified === true
        : null;

  const mustRedirect = shouldRedirectToOnboarding({
    isLoading,
    isTutor,
    isAdmin,
    isImpersonating,
    // A null user means auth has not resolved anyone to gate yet.
    tutorialCompleted: user?.jitsi_tutorial_completed ?? true,
    isVerified,
    pathname,
  });

  useEffect(() => {
    if (mustRedirect) router.replace("/tutor/onboarding");
  }, [mustRedirect, router]);

  return null;
}

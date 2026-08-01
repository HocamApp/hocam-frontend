"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

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
  pathname,
}: TutorActivationGateInput) {
  return (
    !isLoading &&
    isTutor &&
    (!isAdmin || isImpersonating) &&
    !tutorialCompleted &&
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
 */
export function TutorActivationGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isTutor, isAdmin, isLoading, isImpersonating } = useAuth();

  const mustRedirect = shouldRedirectToOnboarding({
    isLoading,
    isTutor,
    isAdmin,
    isImpersonating,
    // A null user means auth has not resolved anyone to gate yet.
    tutorialCompleted: user?.jitsi_tutorial_completed ?? true,
    pathname,
  });

  useEffect(() => {
    if (mustRedirect) router.replace("/tutor/onboarding");
  }, [mustRedirect, router]);

  return null;
}

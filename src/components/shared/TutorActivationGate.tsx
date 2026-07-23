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
  const { user, isTutor, isLoading, isImpersonating } = useAuth();

  const mustRedirect =
    !isLoading &&
    isTutor &&
    !isImpersonating &&
    user !== null &&
    !user.jitsi_tutorial_completed &&
    !isAllowedPath(pathname);

  useEffect(() => {
    if (mustRedirect) router.replace("/tutor/onboarding");
  }, [mustRedirect, router]);

  return null;
}

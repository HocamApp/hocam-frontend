"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { EarlySupporterWelcome } from "@/components/shared/EarlySupporterWelcome";
import { useAuth } from "@/hooks/useAuth";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { cn } from "@/lib/utils";

/**
 * Paths an unverified tutor may still open. Setup/onboarding and profile are
 * the completion flow itself; the legal texts are here because
 * VerificationForm links straight at /kvkk/hoca-dogrulama — bouncing an
 * unverified tutor away from it would hide the verification notice from the
 * only people who need to read it.
 *
 * Exact-segment matching, so "/profile" never swallows "/profiles".
 */
const GATE_EXEMPT_PREFIXES = [
  "/tutor/setup",
  "/tutor/onboarding",
  "/profile",
  "/kvkk",
  "/iptal-ve-iade",
  "/kullanim-kosullari",
  "/mesafeli-satis-sozlesmesi",
];

export function isTutorGateExemptPath(pathname: string) {
  return GATE_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

interface MainLayoutShellProps {
  children: ReactNode;
}

/** Reserves the authenticated mobile tab bar without changing md+ layout flow. */
export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const { isAuthenticated, isLoading, isTutor, isAdmin, isImpersonating, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { isKeyboardOpen } = useVisualViewport();
  const isGateExemptPath = isTutorGateExemptPath(pathname);
  const profileQuery = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated && isTutor && (!isAdmin || isImpersonating) && !isGateExemptPath,
    retry: false,
  });
  // Staff may have a tutor role in Django, but their primary account belongs in
  // the admin center. Only apply tutor onboarding checks while they are viewing
  // a tutor account through the explicit impersonation flow.
  const shouldCheckTutorOnboarding = isTutor && (!isAdmin || isImpersonating);
  const pendingVerification = shouldCheckTutorOnboarding && !isGateExemptPath && (
    user?.tutor_profile_id === null || Boolean(profileQuery.data && !profileQuery.data.is_verified)
  );

  useEffect(() => {
    if (pendingVerification) router.replace("/tutor/onboarding");
  }, [pendingVerification, router]);

  const showMobileNavigation = !isLoading && isAuthenticated;
  const isMessagesPath = pathname === "/messages" || pathname.startsWith("/messages/");
  const reserveMobileNavigation = showMobileNavigation && !isMessagesPath;
  const useStudentDashboardSurface = pathname === "/dashboard/student";
  const shellRef = useRef<HTMLDivElement>(null);
  const [messagesTop, setMessagesTop] = useState<number | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!isMessagesPath || !shell) return;
    // Include in-flow account warnings above main, not just the navbar token.
    // The flex shell resizes when an asynchronously loaded banner appears.
    const measure = () => setMessagesTop(shell.getBoundingClientRect().top);
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(shell);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isMessagesPath, pendingVerification]);

  if (pendingVerification) return null;

  return (
    <>
      <div
        ref={shellRef}
        style={isMessagesPath && messagesTop !== null
          ? { "--conversation-page-top": `${messagesTop}px` } as React.CSSProperties
          : undefined}
        className={cn(
          "flex flex-1 flex-col md:contents",
          useStudentDashboardSurface &&
            "[&>footer]:bg-white [&>main]:bg-white",
          isMessagesPath && "mobile-messages-shell [&>main]:min-h-0",
          reserveMobileNavigation &&
            "pb-[calc(4rem+env(safe-area-inset-bottom))] [&>main]:min-h-[calc(100dvh_-_var(--app-header-h)_-_4rem_-_env(safe-area-inset-bottom))] md:pb-0 md:[&>main]:min-h-[calc(100vh-var(--app-header-h))]"
        )}
      >
        {children}
      </div>
      <EarlySupporterWelcome
        role={user?.role}
        enabled={
          isAuthenticated &&
          !isAdmin &&
          !isImpersonating &&
          !pendingVerification
        }
      />
      {showMobileNavigation && !(isMessagesPath && isKeyboardOpen) && <MobileTabBar />}
    </>
  );
}

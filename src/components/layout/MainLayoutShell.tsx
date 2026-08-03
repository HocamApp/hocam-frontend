"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { EarlySupporterWelcome } from "@/components/shared/EarlySupporterWelcome";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { cn } from "@/lib/utils";

interface MainLayoutShellProps {
  children: ReactNode;
}

/** Reserves the authenticated mobile tab bar without changing md+ layout flow. */
export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const { isAuthenticated, isLoading, isTutor, isAdmin, isImpersonating, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingPath = pathname.startsWith("/tutor/setup") || pathname.startsWith("/tutor/onboarding") || pathname.startsWith("/profile");
  const profileQuery = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated && isTutor && (!isAdmin || isImpersonating) && !isOnboardingPath,
    retry: false,
  });
  // Staff may have a tutor role in Django, but their primary account belongs in
  // the admin center. Only apply tutor onboarding checks while they are viewing
  // a tutor account through the explicit impersonation flow.
  const shouldCheckTutorOnboarding = isTutor && (!isAdmin || isImpersonating);
  const pendingVerification = shouldCheckTutorOnboarding && !isOnboardingPath && (
    user?.tutor_profile_id === null || Boolean(profileQuery.data && !profileQuery.data.is_verified)
  );

  useEffect(() => {
    if (pendingVerification) router.replace("/tutor/onboarding");
  }, [pendingVerification, router]);

  // Verified tutors are no longer locked into onboarding (TutorActivationGate
  // exemption). While required steps are still missing, keep a slim visible
  // banner pointing back at the checklist instead of a redirect loop.
  const showOnboardingNudge =
    isAuthenticated &&
    shouldCheckTutorOnboarding &&
    !isOnboardingPath &&
    Boolean(profileQuery.data?.is_verified) &&
    !(user?.jitsi_tutorial_completed ?? true);

  const showMobileNavigation = !isLoading && isAuthenticated;

  if (pendingVerification) return null;

  return (
    <>
      {showOnboardingNudge && (
        <div className="border-b bg-primary/5 px-4 py-2.5 text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p className="text-foreground">
              Hesabın henüz tam açılmadı — eksik onboarding adımların var.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/tutor/onboarding">Adımları tamamla</Link>
            </Button>
          </div>
        </div>
      )}
      <div
        className={cn(
          "flex flex-1 flex-col md:contents",
          showMobileNavigation &&
            "pb-[calc(4rem+env(safe-area-inset-bottom))] [&>main]:min-h-[calc(100dvh_-_3.5rem_-_4rem_-_env(safe-area-inset-bottom))] md:pb-0 md:[&>main]:min-h-[calc(100vh-64px)]"
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
      {showMobileNavigation && <MobileTabBar />}
    </>
  );
}

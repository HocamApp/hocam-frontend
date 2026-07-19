"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { cn } from "@/lib/utils";

interface MainLayoutShellProps {
  children: ReactNode;
}

/** Reserves the authenticated mobile tab bar without changing md+ layout flow. */
export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const { isAuthenticated, isLoading, isTutor, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingPath = pathname.startsWith("/tutor/setup") || pathname.startsWith("/tutor/onboarding") || pathname.startsWith("/profile");
  const profileQuery = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated && isTutor && !isOnboardingPath,
    retry: false,
  });
  const pendingVerification = isTutor && !isOnboardingPath && (
    user?.tutor_profile_id === null || Boolean(profileQuery.data && !profileQuery.data.is_verified)
  );

  useEffect(() => {
    if (pendingVerification) router.replace("/tutor/onboarding");
  }, [pendingVerification, router]);

  const showMobileNavigation = !isLoading && isAuthenticated;

  if (pendingVerification) return null;

  return (
    <>
      <div
        className={cn(
          "flex flex-1 flex-col md:contents",
          showMobileNavigation &&
            "pb-[calc(4rem+env(safe-area-inset-bottom))] [&>main]:min-h-[calc(100dvh_-_3.5rem_-_4rem_-_env(safe-area-inset-bottom))] md:pb-0 md:[&>main]:min-h-[calc(100vh-64px)]"
        )}
      >
        {children}
      </div>
      {showMobileNavigation && <MobileTabBar />}
    </>
  );
}

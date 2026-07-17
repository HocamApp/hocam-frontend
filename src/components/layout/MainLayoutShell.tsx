"use client";

import type { ReactNode } from "react";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MainLayoutShellProps {
  children: ReactNode;
}

/** Reserves the authenticated mobile tab bar without changing md+ layout flow. */
export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const showMobileNavigation = !isLoading && isAuthenticated;

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

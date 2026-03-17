"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface RouteGuardProps {
  requireAuth?: boolean;
  requireRole?: "student" | "tutor";
  redirectTo?: string;
  children: React.ReactNode;
}

export function RouteGuard({
  requireAuth = true,
  requireRole,
  redirectTo = "/login",
  children,
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isStudent, isTutor } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requireRole === "student" && isTutor) {
      router.push("/dashboard/tutor");
      return;
    }

    if (requireRole === "tutor" && isStudent) {
      router.push("/dashboard/student");
      return;
    }
  }, [isLoading, isAuthenticated, isStudent, isTutor, requireAuth, requireRole, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireRole === "student" && isTutor) {
    return null;
  }

  if (requireRole === "tutor" && isStudent) {
    return null;
  }

  return <>{children}</>;
}

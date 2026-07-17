"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface RouteGuardProps {
  requireAuth?: boolean;
  requireRole?: "student" | "tutor";
  requireAdmin?: boolean;
  redirectTo?: string;
  children: React.ReactNode;
}

export function RouteGuard({
  requireAuth = true,
  requireRole,
  requireAdmin = false,
  redirectTo = "/login",
  children,
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isStudent, isTutor, isAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push("/home");
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
  }, [isLoading, isAuthenticated, isStudent, isTutor, isAdmin, requireAuth, requireRole, requireAdmin, redirectTo, router]);

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

  if (requireAdmin && !isAdmin) {
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

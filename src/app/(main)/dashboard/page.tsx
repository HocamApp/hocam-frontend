"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isStudent, isTutor, isAdmin, isImpersonating } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (isAdmin && !isImpersonating) {
    router.replace("/admin-control");
    return null;
  }

  if (isStudent) {
    router.replace("/dashboard/student");
    return null;
  }

  if (isTutor) {
    router.replace("/dashboard/tutor");
    return null;
  }

  // Fallback if role is missing (e.g. old token)
  router.replace("/tutors");
  return null;
}

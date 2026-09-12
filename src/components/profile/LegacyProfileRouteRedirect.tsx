"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";

interface LegacyProfileRouteRedirectProps {
  tutorHref: string;
}

export function LegacyProfileRouteRedirect({
  tutorHref,
}: LegacyProfileRouteRedirectProps) {
  const router = useRouter();
  const { user } = useAuth();
  const href = user?.role === "tutor"
    ? tutorHref
    : user?.role === "student"
      ? "/dashboard/student"
      : null;

  useEffect(() => {
    if (href) router.replace(href);
  }, [href, router]);

  return (
    <div className="py-12" role="status" aria-label="Yönlendiriliyor">
      <LoadingSpinner />
    </div>
  );
}

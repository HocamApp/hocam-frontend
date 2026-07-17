"use client";

import { useAuth } from "@/hooks/useAuth";
import { AuthenticatedHome } from "@/components/home/AuthenticatedHome";
import { TutorAuthenticatedHome } from "@/components/home/TutorAuthenticatedHome";

export function RoleAwareHome() {
  const { isTutor } = useAuth();

  return isTutor ? <TutorAuthenticatedHome /> : <AuthenticatedHome />;
}

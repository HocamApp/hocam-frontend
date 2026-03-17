"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { user, token, setAuth, clearAuth, isLoading } = useAuthContext();
  const router = useRouter();

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const isAuthenticated = !!token;
  const isStudent = user?.role === "student";
  const isTutor = user?.role === "tutor";

  return {
    user,
    token,
    setAuth,
    logout,
    isAuthenticated,
    isStudent,
    isTutor,
    isLoading,
  };
}

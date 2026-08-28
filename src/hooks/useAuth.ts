"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { COOKIE_AUTH_ENABLED } from "@/lib/authMode";

export function useAuth() {
  const { user, token, setAuth, clearAuth, updateUser, isLoading } = useAuthContext();
  const router = useRouter();

  const logout = () => {
    // Invalidate the shared server-side token too. Header mode supplies the
    // token explicitly after local cleanup; cookie mode sends the HttpOnly
    // cookie automatically and the backend expires it in the response.
    const currentToken = token;
    clearAuth();
    if (currentToken) {
      api
        .post("/auth/logout-all/", undefined, {
          headers: COOKIE_AUTH_ENABLED
            ? undefined
            : { Authorization: `Token ${currentToken}` },
        })
        .catch(() => {});
    }
    router.push("/login");
  };

  const isAuthenticated = !!token;
  const isStudent = user?.role === "student";
  const isTutor = user?.role === "tutor";
  const isAdmin = Boolean(user?.is_admin);
  const isImpersonating = Boolean(user?.impersonation);

  return {
    user,
    token,
    setAuth,
    logout,
    isAuthenticated,
    isStudent,
    isTutor,
    isAdmin,
    isImpersonating,
    updateUser,
    isLoading,
  };
}

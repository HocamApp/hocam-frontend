"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export function useAuth() {
  const { user, token, setAuth, clearAuth, updateUser, isLoading } = useAuthContext();
  const router = useRouter();

  const logout = () => {
    // Invalidate the token server-side too — otherwise it stays valid forever
    // (single DRF token per user, so this signs out every device, same as the
    // security page's "log out of all sessions"). Local state is cleared first
    // so the 401 interceptor can't mistake this for an expired session, and
    // the explicit header keeps working after the cookie is gone. Errors are
    // ignored: logout must always succeed locally, even offline.
    const currentToken = token;
    clearAuth();
    if (currentToken) {
      api
        .post("/auth/logout-all/", undefined, {
          headers: { Authorization: `Token ${currentToken}` },
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

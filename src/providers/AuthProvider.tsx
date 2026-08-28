"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { AUTH_TOKEN_MAX_AGE_DAYS } from "@/lib/browserStorageInventory";
import {
  COOKIE_AUTH_ENABLED,
  sessionStateToken,
} from "@/lib/authMode";
import { User } from "@/types";
import { fetchMe } from "@/lib/authApi";
import { IMPERSONATION_ENDED_EVENT, migrateLegacyAuthToken } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token?: string) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<User>;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      (parsed.role === "student" || parsed.role === "tutor")
    ) {
      return {
        id: parsed.id,
        email: parsed.email,
        role: parsed.role,
        tutor_profile_id: parsed.tutor_profile_id ?? null,
        is_email_verified: Boolean(parsed.is_email_verified),
        is_admin: Boolean(parsed.is_admin),
        is_test_account: Boolean(parsed.is_test_account),
        // Default true for caches written before this field existed, so an
        // active tutor is never flash-redirected to onboarding on refresh;
        // fetchMe replaces it with the backend truth moments later.
        jitsi_tutorial_completed: parsed.jitsi_tutorial_completed ?? true,
        jitsi_tutorial_grandfathered: Boolean(parsed.jitsi_tutorial_grandfathered),
        impersonation: parsed.impersonation ?? null,
      };
    }
  } catch {
    localStorage.removeItem("auth_user");
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rehydrate = async () => {
      const storedToken = Cookies.get("auth_token");

      if (!COOKIE_AUTH_ENABLED && !storedToken) {
        setIsLoading(false);
        return;
      }

      const cachedUser = readCachedUser();
      if (cachedUser) {
        setToken(sessionStateToken(storedToken));
        setUser(cachedUser);
        // Do not mount account-specific queries with an unverified, short-lived
        // impersonation token after refresh. fetchMe either restores the target
        // or safely falls back to the administrator first.
        if (!cachedUser.impersonation) {
          setIsLoading(false);
        }
      }

      try {
        if (COOKIE_AUTH_ENABLED && storedToken) {
          await migrateLegacyAuthToken(storedToken);
          Cookies.remove("auth_token");
        }
        const freshUser = await fetchMe();
        if (cachedUser && cachedUser.id !== freshUser.id) {
          queryClient.clear();
        }
        setToken(sessionStateToken(storedToken));
        setUser(freshUser);
        localStorage.setItem("auth_user", JSON.stringify(freshUser));
      } catch {
        // The API interceptor owns confirmed 401 session expiry. A temporary
        // network or server failure during refresh must not destroy a valid
        // seven-day browser session.
        const tokenStillAvailable = COOKIE_AUTH_ENABLED
          ? Boolean(cachedUser)
          : Boolean(Cookies.get("auth_token"));
        if (!tokenStillAvailable) {
          localStorage.removeItem("auth_user");
          setToken(null);
          setUser(null);
        } else {
          setToken(sessionStateToken(storedToken));
          setUser(cachedUser);
        }
      } finally {
        setIsLoading(false);
      }
    };

    rehydrate();
  }, []);

  useEffect(() => {
    const restoreAdmin = () => {
      fetchMe()
        .then((freshUser) => {
          queryClient.clear();
          localStorage.setItem("auth_user", JSON.stringify(freshUser));
          setUser(freshUser);
        })
        .catch(() => {});
    };
    window.addEventListener(IMPERSONATION_ENDED_EVENT, restoreAdmin);
    return () => window.removeEventListener(IMPERSONATION_ENDED_EVENT, restoreAdmin);
  }, []);

  const setAuth = (nextUser: User, nextToken?: string) => {
    const nextSessionToken = sessionStateToken(nextToken);
    if (!nextSessionToken) {
      throw new Error("Authentication response did not include a token.");
    }
    const identityChanged =
      user?.id !== nextUser.id || token !== nextSessionToken;

    Cookies.remove("admin_impersonation_token");
    if (COOKIE_AUTH_ENABLED) {
      Cookies.remove("auth_token");
    } else {
      Cookies.set("auth_token", nextSessionToken, {
        expires: AUTH_TOKEN_MAX_AGE_DAYS,
        secure: window.location.protocol === "https:",
        sameSite: "strict",
      });
    }
    localStorage.setItem("auth_user", JSON.stringify(nextUser));

    // React Query is shared across the app and caches account-specific data for
    // several minutes. Remove the previous account's queries before the new
    // authenticated screens mount so profile, lesson and message data can never
    // flash from another user after an account switch.
    if (identityChanged) {
      queryClient.clear();
    }

    setToken(nextSessionToken);
    setUser(nextUser);
  };

  const clearAuth = () => {
    Cookies.remove("auth_token");
    Cookies.remove("admin_impersonation_token");
    localStorage.removeItem("auth_user");
    queryClient.clear();
    setToken(null);
    setUser(null);
  };

  const updateUser = (nextUser: User) => {
    localStorage.setItem("auth_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, setAuth, clearAuth, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

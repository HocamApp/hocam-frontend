"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { User } from "@/types";
import { fetchMe } from "@/lib/authApi";
import { IMPERSONATION_ENDED_EVENT } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
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

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const cachedUser = readCachedUser();
      if (cachedUser) {
        setToken(storedToken);
        setUser(cachedUser);
        setIsLoading(false);
      }

      try {
        const freshUser = await fetchMe();
        setToken(storedToken);
        setUser(freshUser);
        localStorage.setItem("auth_user", JSON.stringify(freshUser));
      } catch {
        Cookies.remove("auth_token");
        localStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
      } finally {
        if (!cachedUser) {
          setIsLoading(false);
        }
      }
    };

    rehydrate();
  }, []);

  useEffect(() => {
    const restoreAdmin = () => {
      fetchMe()
        .then((freshUser) => {
          localStorage.setItem("auth_user", JSON.stringify(freshUser));
          setUser(freshUser);
        })
        .catch(() => {});
    };
    window.addEventListener(IMPERSONATION_ENDED_EVENT, restoreAdmin);
    return () => window.removeEventListener(IMPERSONATION_ENDED_EVENT, restoreAdmin);
  }, []);

  const setAuth = (user: User, token: string) => {
    Cookies.remove("admin_impersonation_token");
    Cookies.set("auth_token", token, {
      expires: 7, // days
      // Not HttpOnly (js-cookie can't set that) — documented architectural
      // limitation. These at least block plaintext transmission and
      // cross-site sends of the cookie itself.
      secure: window.location.protocol === "https:",
      sameSite: "strict",
    });
    localStorage.setItem("auth_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const clearAuth = () => {
    Cookies.remove("auth_token");
    Cookies.remove("admin_impersonation_token");
    localStorage.removeItem("auth_user");
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

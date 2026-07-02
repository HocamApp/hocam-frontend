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

interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
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

  const setAuth = (user: User, token: string) => {
    Cookies.set("auth_token", token, { expires: 7 }); // 7 days
    localStorage.setItem("auth_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const clearAuth = () => {
    Cookies.remove("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, setAuth, clearAuth, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

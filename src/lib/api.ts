import axios from "axios";
import Cookies from "js-cookie";
import { COOKIE_AUTH_ENABLED } from "@/lib/authMode";

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://web-production-22415.up.railway.app/api"
    : "http://localhost:8000/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const PUBLIC_AUTH_PATHS = new Set([
  "/auth/token/",
  "/auth/csrf/",
  "/auth/session/migrate/",
  "/auth/google/",
  "/auth/register/",
  "/auth/register/confirm/",
  "/auth/password-reset/",
  "/auth/password-reset-confirm/",
  "/privacy/notices/registration/",
]);

let csrfTokenPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = axios
      .get<{ csrf_token: string }>(`${API_BASE_URL}/auth/csrf/`, {
        withCredentials: true,
      })
      .then((response) => response.data.csrf_token)
      .catch((error) => {
        csrfTokenPromise = null;
        throw error;
      });
  }
  return csrfTokenPromise;
}

export async function migrateLegacyAuthToken(token: string) {
  return axios.post<{ user: import("@/types").User; auth_mode: string }>(
    `${API_BASE_URL}/auth/session/migrate/`,
    undefined,
    {
      withCredentials: true,
      headers: { Authorization: `Token ${token}` },
    }
  );
}

// Public authentication requests must never inherit a stale user or admin
// impersonation session. Some authentication backends reject the request as
// soon as an invalid Authorization header is encountered, before checking the
// credentials in the request body.
api.interceptors.request.use(async (config) => {
  const requestPath = config.url?.split("?")[0];
  const isPublicAuthPath = Boolean(
    requestPath && PUBLIC_AUTH_PATHS.has(requestPath)
  );
  if (isPublicAuthPath) {
    delete config.headers.Authorization;
    delete config.headers["X-Hocam-Impersonation-Token"];
  }

  const token = COOKIE_AUTH_ENABLED ? undefined : Cookies.get("auth_token");
  const impersonationToken = Cookies.get("admin_impersonation_token");
  if (!isPublicAuthPath && token) {
    config.headers.Authorization = `Token ${token}`;
  }
  if (!isPublicAuthPath && impersonationToken) {
    config.headers["X-Hocam-Impersonation-Token"] = impersonationToken;
  }
  const method = (config.method ?? "get").toLowerCase();
  if (
    COOKIE_AUTH_ENABLED &&
    !["get", "head", "options", "trace"].includes(method) &&
    requestPath !== "/auth/session/migrate/"
  ) {
    config.headers["X-CSRFToken"] = await getCsrfToken();
  }
  return config;
});

// Event fired when an authenticated session gets a 401; SessionExpiredDialog
// listens for it and takes over instead of a hard redirect.
export const SESSION_EXPIRED_EVENT = "hocam:session-expired";
export const IMPERSONATION_ENDED_EVENT = "hocam:impersonation-ended";

// Response interceptor: if 401 is returned for a request that carried a
// token, clear the cookie and announce the expired session. Anonymous 401s
// (no token) don't trigger the dialog. Auth pages are excluded.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const failedRequestPath = error.config?.url?.split("?")[0];
    const isPublicAuthRequest = Boolean(
      failedRequestPath && PUBLIC_AUTH_PATHS.has(failedRequestPath)
    );
    const failedWithImpersonation = Boolean(
      error.config?.headers?.get?.("X-Hocam-Impersonation-Token") ??
        error.config?.headers?.["X-Hocam-Impersonation-Token"]
    );
    const isImpersonationAuthFailure =
      status === 401 ||
      (status === 403 &&
        typeof detail === "string" &&
        detail.toLowerCase().includes("impersonation session"));

    // Inspect the failed request itself instead of the current cookie. Several
    // dashboard requests can fail together when an impersonation expires; the
    // first one removes the cookie, but every failed request still needs to be
    // retried as the administrator without deleting the primary admin token.
    if (failedWithImpersonation && isImpersonationAuthFailure) {
      Cookies.remove("admin_impersonation_token");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(IMPERSONATION_ENDED_EVENT));
      }
      if (error.config?.headers) {
        delete error.config.headers["X-Hocam-Impersonation-Token"];
      }
      return api.request(error.config);
    }

    const isCsrfFailure =
      COOKIE_AUTH_ENABLED &&
      status === 403 &&
      typeof detail === "string" &&
      detail.toLowerCase().includes("csrf failed");
    if (isCsrfFailure && !error.config?.__hocamCsrfRetried) {
      error.config.__hocamCsrfRetried = true;
      csrfTokenPromise = null;
      error.config.headers["X-CSRFToken"] = await getCsrfToken();
      return api.request(error.config);
    }

    if (status === 401) {
      const hadToken = COOKIE_AUTH_ENABLED
        ? typeof window !== "undefined" && Boolean(localStorage.getItem("auth_user"))
        : Boolean(Cookies.get("auth_token"));
      Cookies.remove("auth_token");
      if (
        hadToken &&
        !isPublicAuthRequest &&
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register") &&
        !window.location.pathname.startsWith("/forgot-password") &&
        !window.location.pathname.startsWith("/reset-password")
      ) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  }
);

export default api;

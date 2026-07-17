import axios from "axios";
import Cookies from "js-cookie";

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://web-production-22415.up.railway.app/api"
    : "http://localhost:8000/api";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_AUTH_PATHS = new Set([
  "/auth/token/",
  "/auth/google/",
  "/auth/register/",
  "/auth/register/confirm/",
  "/auth/password-reset/",
  "/auth/password-reset-confirm/",
]);

// Public authentication requests must never inherit a stale user or admin
// impersonation session. Some authentication backends reject the request as
// soon as an invalid Authorization header is encountered, before checking the
// credentials in the request body.
api.interceptors.request.use((config) => {
  const requestPath = config.url?.split("?")[0];
  if (requestPath && PUBLIC_AUTH_PATHS.has(requestPath)) {
    delete config.headers.Authorization;
    delete config.headers["X-Hocam-Impersonation-Token"];
    return config;
  }

  const token = Cookies.get("auth_token");
  const impersonationToken = Cookies.get("admin_impersonation_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  if (impersonationToken) {
    config.headers["X-Hocam-Impersonation-Token"] = impersonationToken;
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
  (error) => {
    if (error.response?.status === 401) {
      const hadImpersonation = Boolean(Cookies.get("admin_impersonation_token"));
      if (hadImpersonation) {
        Cookies.remove("admin_impersonation_token");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(IMPERSONATION_ENDED_EVENT));
        }
        if (error.config?.headers) {
          delete error.config.headers["X-Hocam-Impersonation-Token"];
        }
        return api.request(error.config);
      }
      const hadToken = Boolean(Cookies.get("auth_token"));
      Cookies.remove("auth_token");
      if (
        hadToken &&
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

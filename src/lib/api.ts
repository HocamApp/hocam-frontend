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

// Request interceptor: attach token from cookie if present
api.interceptors.request.use((config) => {
  const token = Cookies.get("auth_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Event fired when an authenticated session gets a 401; SessionExpiredDialog
// listens for it and takes over instead of a hard redirect.
export const SESSION_EXPIRED_EVENT = "hocam:session-expired";

// Response interceptor: if 401 is returned for a request that carried a
// token, clear the cookie and announce the expired session. Anonymous 401s
// (no token) don't trigger the dialog. Auth pages are excluded.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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

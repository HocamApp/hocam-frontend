export const COOKIE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_MODE === "cookie";

export const HTTP_ONLY_SESSION_SENTINEL = "http-only-cookie";

export function sessionStateToken(responseToken?: string): string | null {
  if (COOKIE_AUTH_ENABLED) return HTTP_ONLY_SESSION_SENTINEL;
  return responseToken ?? null;
}


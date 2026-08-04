import api from "./api";
import type {
  GoogleCalendarAuthorization,
  GoogleCalendarConnection,
} from "@/types/api";

/**
 * Role-neutral endpoints: every authenticated user — student or tutor, with
 * or without a tutor profile — reads and manages their own connection here.
 * The legacy `/tutor/google-calendar/` alias stays for old clients only; new
 * code must not call it.
 */
export async function fetchGoogleCalendarConnection(): Promise<GoogleCalendarConnection> {
  const { data } = await api.get<GoogleCalendarConnection>("/google-calendar/");
  return data;
}

/**
 * Starts the OAuth flow. The backend mints a one-time state and returns the
 * Google consent URL; the caller navigates the whole tab there.
 */
export async function startGoogleCalendarConnection(): Promise<GoogleCalendarAuthorization> {
  const { data } = await api.post<GoogleCalendarAuthorization>(
    "/google-calendar/"
  );
  return data;
}

/**
 * Disconnects locally and revokes the Google grant. Existing calendar events
 * are deliberately left in place — only future syncing stops.
 */
export async function disconnectGoogleCalendar(): Promise<void> {
  await api.delete("/google-calendar/");
}

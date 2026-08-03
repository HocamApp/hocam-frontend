import api from "./api";
import type {
  GoogleCalendarAuthorization,
  GoogleCalendarConnection,
} from "@/types/api";

/** The owning tutor's own connection. Students never call this. */
export async function fetchGoogleCalendarConnection(): Promise<GoogleCalendarConnection> {
  const { data } = await api.get<GoogleCalendarConnection>("/tutor/google-calendar/");
  return data;
}

/**
 * Starts the OAuth flow. The backend mints a one-time state and returns the
 * Google consent URL; the caller navigates the whole tab there.
 */
export async function startGoogleCalendarConnection(): Promise<GoogleCalendarAuthorization> {
  const { data } = await api.post<GoogleCalendarAuthorization>(
    "/tutor/google-calendar/"
  );
  return data;
}

/**
 * Disconnects locally and revokes the Google grant. Existing calendar events
 * are deliberately left in place — only future syncing stops.
 */
export async function disconnectGoogleCalendar(): Promise<void> {
  await api.delete("/tutor/google-calendar/");
}

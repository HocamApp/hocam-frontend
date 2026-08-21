import api from "./api";

export type DiscoveryConsentStatus = "unset" | "granted" | "denied" | "withdrawn";
export const DISCOVERY_CONSENT_CHANGED = "hocam:discovery-consent-changed";

export async function getDiscoveryConsent() {
  const response = await api.get<{
    status: DiscoveryConsentStatus;
    policy_version: string;
    collection_enabled: boolean;
  }>("/discovery/consent/");
  return response.data;
}

export async function setDiscoveryConsent(granted: boolean) {
  const response = await api.post<{ status: DiscoveryConsentStatus }>("/discovery/consent/", { granted });
  window.dispatchEvent(new CustomEvent(DISCOVERY_CONSENT_CHANGED, { detail: response.data.status }));
  return response.data;
}

export async function withdrawDiscoveryConsent() {
  const response = await api.post<{ status: DiscoveryConsentStatus }>("/discovery/consent/withdraw/", {});
  window.dispatchEvent(new CustomEvent(DISCOVERY_CONSENT_CHANGED, { detail: response.data.status }));
  return response.data;
}

export type DiscoveryEventKind =
  | "exposure" | "profile_view" | "favorite_added" | "favorite_removed"
  | "contact_started" | "booking_started" | "lesson_requested";

export async function createDirectoryImpression(input: {
  tutorIds: string[];
  page: number;
  ordering?: string;
  filters: Record<string, string>;
  search?: string;
  resolvedSubjectIds?: string[];
  resolvedTopicIds?: string[];
}): Promise<string | null> {
  try {
    const search = input.search?.trim() ?? "";
    const response = await api.post<{ impression_id: string }>("/discovery/impressions/directory/", {
      tutor_ids: input.tutorIds,
      selected_tutor_ids: input.tutorIds,
      page: input.page,
      ordering: input.ordering ?? "",
      filters: input.filters,
      search_present: search.length > 0,
      search_token_count: search ? search.split(/\s+/).length : 0,
      search_kind: search ? "text" : input.filters.subject ? "subject" : "none",
      resolved_subject_ids: input.resolvedSubjectIds ?? [],
      resolved_topic_ids: input.resolvedTopicIds ?? [],
    });
    return response.data.impression_id;
  } catch {
    return null;
  }
}

export async function recordDiscoveryEvent(
  impressionId: string | null | undefined,
  tutorId: string,
  kind: DiscoveryEventKind
) {
  if (!impressionId) return;
  try {
    await api.post("/discovery/interactions/", {
      client_event_id: crypto.randomUUID(), impression_id: impressionId,
      tutor_id: tutorId, kind, occurred_at: new Date().toISOString(),
    });
  } catch {
    // Measurement is deliberately fail-safe.
  }
}

export async function recordDiscoveryExposures(
  impressionId: string,
  tutorIds: string[]
) {
  if (tutorIds.length === 0) return;
  try {
    await api.post("/discovery/exposures/", {
      events: tutorIds.map((tutorId) => ({
        client_event_id: crypto.randomUUID(), impression_id: impressionId,
        tutor_id: tutorId, kind: "exposure", occurred_at: new Date().toISOString(),
      })),
    });
  } catch {
    // Measurement is deliberately fail-safe.
  }
}

import api from "./api";

// Mirrors ConsentPurpose in the backend's apps/privacy/models.py. Each value
// corresponds to an R-code in docs/kvkk/02-acik-riza-metinleri.md.
export type ConsentPurpose =
  | "R1_public_profile"
  | "R2_learning_tracking"
  | "R3_personalized_recs"
  | "R4_ai_assistant"
  | "R5_marketing";

export interface ConsentState {
  text_version: string;
  collection_enabled: boolean;
  guardian_approval_enabled: boolean;
  request_channel_enabled: boolean;
  birth_date: string | null;
  /**
   * null means we have never asked. Distinct from false on purpose: the UI
   * has to prompt for a birth date rather than assume an adult.
   */
  is_minor: boolean | null;
  guardian_required_purposes: ConsentPurpose[];
  consents: Record<ConsentPurpose, boolean>;
}

export type DataSubjectRequestType =
  | "info"
  | "correction"
  | "deletion"
  | "objection"
  | "transfer_info";

export interface DataSubjectRequest {
  id: string;
  request_type: DataSubjectRequestType;
  status: "received" | "in_review" | "completed" | "rejected";
  message: string;
  received_at: string;
  due_at: string;
  responded_at: string | null;
}

export async function fetchConsentState(): Promise<ConsentState> {
  const { data } = await api.get<ConsentState>("/privacy/consents/");
  return data;
}

export async function updateConsent(
  purpose: ConsentPurpose,
  granted: boolean,
): Promise<{ purpose: ConsentPurpose; granted: boolean }> {
  const { data } = await api.post("/privacy/consents/", { purpose, granted });
  return data;
}

export async function submitBirthDate(
  birthDate: string,
): Promise<{ birth_date: string; is_minor: boolean }> {
  const { data } = await api.post("/privacy/birth-date/", {
    birth_date: birthDate,
  });
  return data;
}

export async function startGuardianApproval(
  guardianEmail: string,
  purposes: ConsentPurpose[],
): Promise<{
  id: string;
  guardian_email: string;
  delivery_status: "sent";
}> {
  const { data } = await api.post("/privacy/guardian-approval/", {
    guardian_email: guardianEmail,
    purposes,
  });
  return data;
}

export async function verifyGuardianApproval(
  token: string,
): Promise<{ id: string; verified_at: string }> {
  const { data } = await api.post("/privacy/guardian-approval/verify/", {
    token,
  });
  return data;
}

export async function fetchDataSubjectRequests(): Promise<DataSubjectRequest[]> {
  const { data } = await api.get<DataSubjectRequest[]>("/privacy/requests/");
  return data;
}

export async function submitDataSubjectRequest(
  requestType: DataSubjectRequestType,
  message: string,
): Promise<DataSubjectRequest> {
  const { data } = await api.post<DataSubjectRequest>("/privacy/requests/", {
    request_type: requestType,
    message,
  });
  return data;
}

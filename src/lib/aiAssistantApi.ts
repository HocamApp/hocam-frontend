import api from "./api";

export type AIIntent =
  | "reservation_help"
  | "tutor_recommendation"
  | "study_guidance"
  | "platform_faq"
  | "support_escalation"
  | "general_smalltalk"
  | "tutor_profile_feedback"
  | "tutor_pricing_guidance"
  | "tutor_bio_draft"
  | "unknown";

export interface TutorProfileDraftContext {
  bio: string;
  hourly_price: number;
  subject_ids: string[];
}

export interface AIChatRequest {
  message: string;
  conversation_id?: string;
  surface?: "default" | "tutor_profile_edit";
  draft_profile?: TutorProfileDraftContext;
}

export interface AIChatResponse {
  conversation_id: string;
  message: string;
  intent: AIIntent;
  metadata: Record<string, unknown>;
}

export async function sendAIChatMessage(
  payload: AIChatRequest
): Promise<AIChatResponse> {
  const response = await api.post<AIChatResponse>("/ai/chat/", payload);
  return response.data;
}

import api from "./api";

export type AIIntent =
  | "reservation_help"
  | "tutor_recommendation"
  | "study_guidance"
  | "platform_faq"
  | "support_escalation"
  | "general_smalltalk"
  | "unknown";

export interface AIChatRequest {
  message: string;
  conversation_id?: string;
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

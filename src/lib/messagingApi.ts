import api from "./api";
import { Conversation, Message, MessageAttachment, MessageReplyPreview, MessageRequest } from "@/types";

export interface CreateMessageRequestPayload {
  tutor: string;
  message: string;
}

/** Send a first message to a tutor — creates a real conversation immediately. */
export async function createMessageRequest(
  payload: CreateMessageRequestPayload
): Promise<MessageRequest> {
  const response = await api.post<MessageRequest>(
    "/messaging/message-requests/",
    payload
  );
  return response.data;
}

/** Tutor-only: block the student in this conversation. Freezes it for both sides. */
export async function blockConversationParticipant(
  conversationId: string
): Promise<Conversation> {
  const response = await api.post<Conversation>(
    `/conversations/${conversationId}/block/`
  );
  return response.data;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>("/conversations/");
  return response.data;
}

export async function fetchConversation(conversationId: string): Promise<Conversation> {
  const response = await api.get<Conversation>(`/conversations/${conversationId}/`);
  return response.data;
}

// Backend may return sender as { id, email }; normalize to id string for Message type
interface RawMessage {
  id: string;
  sender: string | { id: string };
  message_text: string;
  image_url?: string;
  created_at: string;
  read_at?: string | null;
  reply_to?: MessageReplyPreview | null;
  is_deleted?: boolean;
  attachment?: MessageAttachment | null;
}

function normalizeMessage(m: RawMessage): Message {
  return {
    id: m.id,
    conversation: "", // not in list response
    sender: typeof m.sender === "string" ? m.sender : m.sender?.id ?? "",
    message_text: m.message_text,
    image_url: m.image_url ?? undefined,
    created_at: m.created_at,
    read_at: m.read_at ?? null,
    reply_to: m.reply_to ?? null,
    is_deleted: m.is_deleted ?? false,
    attachment: m.attachment ?? null,
  };
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const response = await api.get<Message[]>(
    `/conversations/${conversationId}/messages/`
  );
  return (response.data || []).map(normalizeMessage);
}

export interface TypingStatusResponse {
  is_typing: boolean;
}

export async function fetchTypingStatus(
  conversationId: string
): Promise<TypingStatusResponse> {
  const response = await api.get<TypingStatusResponse>(
    `/conversations/${conversationId}/typing/`
  );
  return response.data;
}

export async function updateTypingStatus(
  conversationId: string,
  isTyping: boolean
): Promise<TypingStatusResponse> {
  const response = await api.post<TypingStatusResponse>(
    `/conversations/${conversationId}/typing/`,
    { is_typing: isTyping }
  );
  return response.data;
}

export interface SendMessagePayload {
  conversation_id: string;
  message_text?: string;
  image?: File;
  attachment?: File;
  /** Voice messaging was removed; only image and file attachments may be sent. */
  attachment_kind?: "image" | "file";
  reply_to?: string;
}

export async function sendMessage(
  payload: SendMessagePayload
): Promise<Message> {
  let response;
  const attachment = payload.attachment ?? payload.image;
  if (attachment) {
    const formData = new FormData();
    formData.append("conversation_id", payload.conversation_id);
    if (payload.message_text) formData.append("message_text", payload.message_text);
    if (payload.reply_to) formData.append("reply_to", payload.reply_to);
    // Keep image for legacy conversations; coaching API recognizes attachment.
    if (payload.image && !payload.attachment) formData.append("image", payload.image);
    else formData.append("attachment", attachment);
    if (payload.attachment_kind) formData.append("attachment_kind", payload.attachment_kind);
    // Clear the global JSON default so the browser sets multipart/form-data WITH
    // its boundary; otherwise Django cannot parse the upload and the image is dropped.
    response = await api.post<Message>("/messages/", formData, {
      headers: { "Content-Type": undefined },
    });
  } else {
    response = await api.post<Message>("/messages/", {
      conversation_id: payload.conversation_id,
      message_text: payload.message_text ?? "",
      ...(payload.reply_to ? { reply_to: payload.reply_to } : {}),
    });
  }
  return normalizeMessage(response.data as unknown as RawMessage);
}

export async function fetchMessageAttachmentAccess(id: string): Promise<{ url: string; expires_in: number }> {
  const response = await api.get<{ url: string; expires_in: number }>(`/messages/attachments/${id}/download/`);
  return response.data;
}

export async function fetchCoachingPurchaseConversation(purchaseId: string): Promise<Conversation> {
  const response = await api.get<Conversation>(`/coaching/purchases/${purchaseId}/conversation/`);
  return response.data;
}

/** Soft-delete own message; returns the tombstoned message. */
export async function deleteMessage(messageId: string): Promise<Message> {
  const response = await api.delete<Message>(`/messages/${messageId}/`);
  return normalizeMessage(response.data as unknown as RawMessage);
}

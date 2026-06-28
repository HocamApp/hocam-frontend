import api from "./api";
import { Conversation, Message } from "@/types";

export async function fetchConversations(): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>("/conversations/");
  return response.data;
}

export async function fetchConversation(conversationId: string): Promise<Conversation> {
  const response = await api.get<Conversation>(`/conversations/${conversationId}/`);
  return response.data;
}

// Backend may return sender as { id, email }; normalize to id string for Message type
function normalizeMessage(m: { id: string; sender: string | { id: string }; message_text: string; image_url?: string; created_at: string }): Message {
  return {
    id: m.id,
    conversation: "", // not in list response
    sender: typeof m.sender === "string" ? m.sender : m.sender?.id ?? "",
    message_text: m.message_text,
    image_url: m.image_url ?? undefined,
    created_at: m.created_at,
  };
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const response = await api.get<Message[]>(
    `/conversations/${conversationId}/messages/`
  );
  return (response.data || []).map(normalizeMessage);
}

export interface SendMessagePayload {
  conversation_id: string;
  message_text?: string;
  image?: File;
}

export async function sendMessage(
  payload: SendMessagePayload
): Promise<Message> {
  let response;
  if (payload.image) {
    const formData = new FormData();
    formData.append("conversation_id", payload.conversation_id);
    if (payload.message_text) formData.append("message_text", payload.message_text);
    formData.append("image", payload.image);
    response = await api.post<Message>("/messages/", formData);
  } else {
    response = await api.post<Message>("/messages/", {
      conversation_id: payload.conversation_id,
      message_text: payload.message_text ?? "",
    });
  }
  const data = response.data as Message & { sender?: string | { id: string } };
  return normalizeMessage({
    id: data.id,
    sender: data.sender ?? "",
    message_text: data.message_text,
    image_url: data.image_url,
    created_at: data.created_at,
  });
}

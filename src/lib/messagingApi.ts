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
function normalizeMessage(m: { id: string; sender: string | { id: string }; message_text: string; created_at: string }): Message {
  return {
    id: m.id,
    conversation: "", // not in list response
    sender: typeof m.sender === "string" ? m.sender : m.sender?.id ?? "",
    message_text: m.message_text,
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
  message_text: string;
}

export async function sendMessage(
  payload: SendMessagePayload
): Promise<Message> {
  const response = await api.post<Message>("/messages/", payload);
  const data = response.data as Message & { sender?: string | { id: string } };
  return normalizeMessage({
    id: data.id,
    sender: data.sender ?? "",
    message_text: data.message_text,
    created_at: data.created_at,
  });
}

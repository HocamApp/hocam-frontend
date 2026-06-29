import api from "./api";
import type { CreateSupportTicketPayload, SupportTicket } from "@/types/api";

export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const { data } = await api.get<SupportTicket[]>("/support/tickets/");
  return data;
}

export async function createSupportTicket(
  payload: CreateSupportTicketPayload
): Promise<SupportTicket> {
  const { data } = await api.post<SupportTicket>("/support/tickets/", payload);
  return data;
}

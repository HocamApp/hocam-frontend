import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import type { ContactMessageRequest } from "@/types/api";

export async function sendContactMessage(message: ContactMessageRequest) {
  // This public endpoint must not inherit expired login or impersonation headers.
  const endpoint = process.env.NEXT_PUBLIC_CONTACT_API_URL
    || `${API_BASE_URL}/support/contact/`;
  const { data } = await axios.post<{ detail: string }>(endpoint, message, {
    timeout: 20000,
    withCredentials: false,
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

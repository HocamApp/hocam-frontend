/**
 * Whether online payment is open to the signed-in student. The answer is the
 * server's (one rule for the purchase gate, the payment gate and this), so the
 * screens never guess from a build flag alone. A 404 from an older deployment
 * is an answer too: closed.
 */
import api from "./api";
import type { CheckoutAvailability } from "@/types";

export async function fetchCheckoutAvailability(): Promise<CheckoutAvailability> {
  try {
    const response = await api.get<CheckoutAvailability>("/payments/checkout-availability/");
    return response.data;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) {
      return { available: false, code: "checkout_disabled" };
    }
    throw err;
  }
}

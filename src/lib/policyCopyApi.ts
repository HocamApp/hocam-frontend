/**
 * The summary of rules a student accepts before paying (apps.payments on the
 * backend). `null` when the server does not have it yet (a 404 from an older
 * deployment): the checkout then simply has nothing to show or send, and the
 * purchase is made as it was before the summary existed.
 */
import api from "./api";
import type { PolicyCopy } from "@/types";

export async function fetchPolicyCopy(): Promise<PolicyCopy | null> {
  try {
    const response = await api.get<PolicyCopy>("/payments/policy-copy/");
    return response.data;
  } catch (err) {
    if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
    throw err;
  }
}

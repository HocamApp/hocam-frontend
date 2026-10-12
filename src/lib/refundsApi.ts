/**
 * Refund requests of a lesson package (apps.payments on the backend).
 *
 * The student never types an amount. They ask for a preview, read the numbers,
 * and confirm those numbers by sending back the signed token the preview
 * carried; if anything moved in between, the server answers with the new
 * preview instead of creating a request for numbers the student did not see.
 * Asking cancels no lesson: that happens when staff approve.
 */
import api from "./api";
import type {
  RefundPreview,
  RefundPreviewPayload,
  RefundRequest,
  RefundRequestPayload,
} from "@/types";

export async function previewRefund(payload: RefundPreviewPayload): Promise<RefundPreview> {
  const response = await api.post<RefundPreview>("/payments/refund-preview/", payload);
  return response.data;
}

export async function requestRefund(payload: RefundRequestPayload): Promise<RefundRequest> {
  const response = await api.post<RefundRequest>("/payments/refund-requests/", payload);
  return response.data;
}

/** The list endpoint is not paginated today; accept either shape so a change
 * on the server cannot blank the screen. */
export async function fetchRefundRequests(): Promise<RefundRequest[]> {
  const response = await api.get<RefundRequest[] | { results: RefundRequest[] }>(
    "/payments/refund-requests/"
  );
  const data = response.data;
  return Array.isArray(data) ? data : (data?.results ?? []);
}

export async function fetchRefundRequest(id: string): Promise<RefundRequest> {
  const response = await api.get<RefundRequest>(`/payments/refund-requests/${id}/`);
  return response.data;
}

/**
 * What the screen should do next, not what the server said:
 *
 * - `changed`     the numbers moved (a lesson changed, or the preview went
 *                 stale). `preview` is the new one; show it and ask again.
 * - `in_progress` a request for this package is already open.
 * - `blocked`     the package cannot be refunded now (`code` says why).
 * - `token`       the preview is missing or no longer valid; ask for a new one.
 * - `invalid`     the reason is not one the server accepts.
 * - `unavailable` 404: not this student's package, or the service is not
 *                 there yet.
 * - `throttled`   too many requests in a short time.
 * - `unknown`     the answer was lost. A request may well exist; look at the
 *                 list before asking again.
 */
export type RefundErrorKind =
  | "changed"
  | "in_progress"
  | "blocked"
  | "token"
  | "invalid"
  | "unavailable"
  | "throttled"
  | "unknown";

export interface RefundError {
  kind: RefundErrorKind;
  /** The server's code when it sent one. */
  code: string;
  /** Present for `changed`: the numbers to show now. */
  preview: RefundPreview | null;
}

const BLOCKING_CODES = new Set([
  "already_refunded",
  "not_paid",
  "reason_not_applicable",
  "nothing_to_refund",
]);

/**
 * Classifies a failed refund call. Deliberately narrow: raw server text is
 * never forwarded (the copy lives in refundCopy.ts), and an answer that never
 * arrived is never turned into a confirmed failure.
 */
export function describeRefundError(err: unknown): RefundError {
  const response = (err as { response?: { status?: number; data?: unknown } })?.response;
  const status = response?.status;
  const body =
    response?.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : {};
  const code = typeof body.code === "string" ? body.code : "";

  if (status === 429) return { kind: "throttled", code, preview: null };
  if (status === 404) return { kind: "unavailable", code, preview: null };
  if (code === "refund_preview_changed") {
    const preview = body.preview;
    return {
      kind: "changed",
      code,
      preview: preview && typeof preview === "object" ? (preview as RefundPreview) : null,
    };
  }
  if (code === "refund_in_progress") return { kind: "in_progress", code, preview: null };
  if (BLOCKING_CODES.has(code)) return { kind: "blocked", code, preview: null };
  if (code === "preview_token_required") return { kind: "token", code, preview: null };
  if (code === "invalid_reason") return { kind: "invalid", code, preview: null };
  return { kind: "unknown", code, preview: null };
}

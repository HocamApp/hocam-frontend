/**
 * What went wrong when a package purchase could not be created, and what the
 * student can do about it.
 *
 * The server answers with a code (and sometimes a payload); the sentence the
 * student reads is ours, so a wording change on the API cannot change what is
 * promised. Every answer says what happened and then what to do (DESIGN.md).
 * An answer that never arrived is its own kind: the purchase may exist, and
 * nothing here ever posts again on the student's behalf.
 */

export type PurchaseErrorKind =
  /** The hours are no longer available or no longer valid: pick them again. */
  | "schedule"
  /** A purchase for this tutor is already waiting for its payment. */
  | "pending_exists"
  /** The tutor's places are full, or held by other students' checkouts. */
  | "capacity_full"
  | "tutor_unavailable"
  /** Online payment is not open (yet) to this student. */
  | "checkout_disabled"
  /** The student has to accept the rules before paying. */
  | "policy_not_accepted"
  /** The rules changed while the student was reading them. */
  | "policy_version_changed"
  /** The answer was lost: the purchase may exist. */
  | "unknown_outcome"
  | "other";

export interface PurchaseError {
  kind: PurchaseErrorKind;
  /** The sentence to show. */
  message: string;
  /** For `pending_exists`: the purchase to go and pay for. */
  purchaseId: string | null;
  /** For the two policy kinds: the version that is current now. */
  policyVersion: string | null;
}

const MESSAGES: Record<Exclude<PurchaseErrorKind, "other">, string> = {
  schedule: "Seçtiğin saatlerden biri artık uygun değil. Ders saatlerini yeniden seç.",
  pending_exists:
    "Bu hoca için ödemesi bekleyen bir satın alman var. Onu tamamla ya da iptal et.",
  capacity_full:
    "Bu hocanın son yerleri şu an başka öğrencilerin ödemesi için ayrıldı. Birkaç dakika sonra tekrar dene.",
  tutor_unavailable: "Bu hoca şu an paket satışına açık değil. Başka bir hoca seçebilirsin.",
  checkout_disabled: "Ödeme sistemi henüz açılmadı. Açıldığında buradan satın alabileceksin.",
  policy_not_accepted: "Ödemeye geçmeden önce koşulları okuyup onaylaman gerekiyor.",
  policy_version_changed: "Koşullar güncellendi. Yeni metni okuyup yeniden onaylaman gerekiyor.",
  unknown_outcome:
    "Satın alma isteğinin sonucunu öğrenemedik. Yeniden denemeden önce Paketlerim sayfasında bekleyen bir satın alman olup olmadığına bak.",
};

const SCHEDULE_REQUIRED = "Önce ders programını seçmen gerekiyor.";

function field(data: unknown, key: string): unknown {
  return data && typeof data === "object" ? (data as Record<string, unknown>)[key] : undefined;
}

export function describePurchaseError(err: unknown, fallback: string): PurchaseError {
  const response = (err as { response?: { status?: number; data?: unknown } })?.response;
  const make = (
    kind: PurchaseErrorKind,
    message: string,
    extra: Partial<Pick<PurchaseError, "purchaseId" | "policyVersion">> = {}
  ): PurchaseError => ({ kind, message, purchaseId: null, policyVersion: null, ...extra });

  if (!response) return make("unknown_outcome", MESSAGES.unknown_outcome);

  const code = field(response.data, "code");
  if (typeof code !== "string") return make("other", fallback);

  if (code === "schedule_required") return make("schedule", SCHEDULE_REQUIRED);
  if (code.startsWith("schedule_")) return make("schedule", MESSAGES.schedule);
  if (code === "pending_purchase_exists") {
    const id = field(response.data, "purchase_id");
    return make("pending_exists", MESSAGES.pending_exists, {
      purchaseId: typeof id === "string" ? id : null,
    });
  }
  if (code === "capacity_full") {
    return make(
      "capacity_full",
      field(response.data, "reserved_by_others") === false
        ? "Bu hoca şu an yeni öğrenci almıyor. Başka bir hoca seçebilirsin."
        : MESSAGES.capacity_full
    );
  }
  if (code === "tutor_unavailable") return make("tutor_unavailable", MESSAGES.tutor_unavailable);
  if (code === "checkout_disabled" || code === "live_not_approved") {
    return make("checkout_disabled", MESSAGES.checkout_disabled);
  }
  if (code === "policy_not_accepted" || code === "policy_version_changed") {
    const version = field(response.data, "policy_version");
    return make(code, MESSAGES[code], {
      policyVersion: typeof version === "string" ? version : null,
    });
  }
  return make("other", fallback);
}

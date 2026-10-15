/**
 * Whether online payment is open to the signed-in student
 * (GET /api/payments/checkout-availability/, apps.payments on the backend).
 *
 * The server answers for this user only, with the same rule that gates starting
 * a lesson package and a payment (it never reveals who else is on the list).
 * `code` says why it is closed; the screens only need `available`.
 */
export interface CheckoutAvailability {
  available: boolean;
  code: "checkout_disabled" | "live_not_approved" | "policy_acceptance_disabled" | null;
}

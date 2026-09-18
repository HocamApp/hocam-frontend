"use client";

import { PayTRReturnScreen } from "@/components/payments/paytr/PayTRReturnScreen";

/**
 * PayTR's success redirect. Landing here is not proof of payment, so this page
 * renders the shared return screen, which asks the backend and shows whatever
 * it answers.
 */
export default function PayTRSuccessReturnPage() {
  return <PayTRReturnScreen />;
}

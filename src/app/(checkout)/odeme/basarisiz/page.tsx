"use client";

import { PayTRReturnScreen } from "@/components/payments/paytr/PayTRReturnScreen";

/**
 * PayTR's failure redirect. Also not proof: a late success callback may
 * already have won the race, so this page renders the same shared screen and
 * lets the backend say what happened.
 */
export default function PayTRFailureReturnPage() {
  return <PayTRReturnScreen />;
}

import { LoaderCircle } from "lucide-react";

import type { CheckoutAvailabilityState } from "@/hooks/useCheckoutAvailability";
import type { CoachingCheckoutState } from "@/hooks/useCoachingFlag";
import { Button } from "@/components/ui/button";

export function TutorCheckoutCta({
  href,
  offersCoaching,
  checkoutState,
  lessonPayment = "off",
  onStart,
}: {
  href: string;
  offersCoaching: boolean;
  checkoutState: CoachingCheckoutState;
  /**
   * Whether this student may pay for a lesson package online (the server's
   * answer, see `useCheckoutAvailability`). It decides the button only for a
   * tutor with no coaching to offer, whose reservation is a lesson package and
   * nothing else. `"off"` (the build flag is off) leaves the button as it was.
   */
  lessonPayment?: CheckoutAvailabilityState;
  onStart: (href: string) => void;
}) {
  const lessonOnly = !offersCoaching;
  const waitingForPayment = lessonOnly && lessonPayment === "loading";
  const paymentClosed = lessonOnly && lessonPayment === "closed";
  const loading = (offersCoaching && checkoutState === "loading") || waitingForPayment;
  const unavailable = offersCoaching && checkoutState === "error";
  const blocked = loading || unavailable || paymentClosed;

  return (
    <Button
      className="w-full"
      disabled={blocked}
      aria-busy={loading || undefined}
      onClick={() => {
        if (!blocked) onStart(href);
      }}
    >
      {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {loading
        ? "Hazırlanıyor…"
        : unavailable
          ? "Koçluk bilgisi yüklenemedi"
          : paymentClosed
            ? "Ders paketleri yakında"
            : "Ders Rezervasyonu Yap"}
    </Button>
  );
}

import { LoaderCircle } from "lucide-react";

import type { CoachingCheckoutState } from "@/hooks/useCoachingFlag";
import { Button } from "@/components/ui/button";

export function TutorCheckoutCta({
  href,
  offersCoaching,
  checkoutState,
  onStart,
}: {
  href: string;
  offersCoaching: boolean;
  checkoutState: CoachingCheckoutState;
  onStart: (href: string) => void;
}) {
  const loading = offersCoaching && checkoutState === "loading";
  const unavailable = offersCoaching && checkoutState === "error";
  const blocked = loading || unavailable;

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
      {loading ? "Hazırlanıyor…" : unavailable ? "Koçluk bilgisi yüklenemedi" : "Ders Rezervasyonu Yap"}
    </Button>
  );
}

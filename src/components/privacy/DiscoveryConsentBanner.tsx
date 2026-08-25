"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getDiscoveryConsent,
  setDiscoveryConsent,
  type DiscoveryConsentStatus,
} from "@/lib/discovery";

/**
 * Analytics consent, asked once, as a centred card.
 *
 * Three things here are deliberate and should survive a redesign:
 *
 * **Reject is a button, not a link.** The card this borrows its shape from
 * pairs a large "Accept" with a small underlined "Manage your preferences",
 * which is the pattern KVKK and the GDPR both treat as invalid consent —
 * refusing has to cost no more effort than agreeing. Both options are buttons
 * of the same size for that reason.
 *
 * **It does not block the page.** The wrapper is `pointer-events-none` and
 * there is no scrim, so a visitor can keep browsing and answer whenever. A
 * modal that traps you until you consent is not freely given consent.
 *
 * **It sits above the homepage promo** at `z-[120]`. That dialog is at 110 and
 * appears at 700ms; a legal choice outranks a marketing one, so this is
 * answered first and the promo is waiting underneath.
 */
export function DiscoveryConsentBanner() {
  const [status, setStatus] = useState<DiscoveryConsentStatus | "loading">("loading");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getDiscoveryConsent()
      .then((value) => setStatus(value.status))
      .catch(() => setStatus("unset"));
  }, []);
  if (status !== "unset") return null;

  async function choose(granted: boolean) {
    setSaving(true);
    try {
      const result = await setDiscoveryConsent(granted);
      setStatus(result.status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4">
      <aside
        aria-label="Analiz tercihi"
        className="pointer-events-auto w-full max-w-[22rem] rounded-xl border bg-background p-6 shadow-2xl"
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {/* A chart, not a cookie: what is being asked for is measurement of
                search and match results, and no advertising cookie is set. */}
            <BarChart3 className="size-5" aria-hidden />
          </span>
          {/* A short label, not a question: beside a 36px icon in a 352px card
              anything longer wraps, and a wrapped heading next to an icon
              reads as a mistake. The asking happens in the body. */}
          <h2 className="text-lg font-semibold leading-tight">Ölçümleme izni</h2>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Hoca arama ve eşleşme sonuçlarının işe yarayıp yaramadığını, kimliğini açığa
          çıkarmayan bir oturumla ölçmek istiyoruz. Reddedersen site aynı şekilde
          çalışır.{" "}
          <Link className="font-medium underline underline-offset-2" href="/kvkk/analitik">
            Analitik aydınlatma metni
          </Link>
          .
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={saving} onClick={() => void choose(false)}>
            Reddet
          </Button>
          <Button disabled={saving} onClick={() => void choose(true)}>
            İzin ver
          </Button>
        </div>
      </aside>
    </div>
  );
}

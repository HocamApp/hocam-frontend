"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  getDiscoveryConsent,
  setDiscoveryConsent,
  type DiscoveryConsentStatus,
} from "@/lib/discovery";

/**
 * Consent for measuring how discovery performs, asked once, as a small card in
 * the bottom-left corner.
 *
 * **It is not a cookie notice and must not be dressed as one.** Nothing here
 * writes a cookie: the answer is a record on `/discovery/consent/` and what it
 * covers is impressions, profile views and favourites. "Çerez Tercihleri" is
 * the phrase Turkish sites use and it would have been the familiar choice, but
 * it would be a false statement in a consent prompt, which is the one place a
 * familiar-sounding lie costs the most.
 *
 * Corner on desktop, full width on a phone — a 304px card pinned to one side
 * of a 390px screen just looks misaligned.
 *
 * Corner, not centre. Bottom-left corner cards draw the most interaction of
 * any placement — declines as well as accepts — while a centre modal buys
 * opt-ins by frustration, and NN/g measured 18% of visitors leaving outright
 * when a banner covers half the screen on load.
 *
 * Reject is a button the same size as accept. The reference this borrows its
 * shape from pairs a big filled "Accept" with a small underlined link, which
 * KVKK and the GDPR both treat as invalid consent: refusing cannot cost more
 * effort than agreeing.
 *
 * Nothing blocks the page — no scrim, no focus trap. Consent taken by trapping
 * someone is not freely given.
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
    <aside
      aria-label="Gizlilik tercihi"
      className="fixed bottom-4 left-4 right-4 z-[120] rounded-2xl border bg-background p-5 shadow-xl duration-500 animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none sm:right-auto sm:max-w-[19rem]"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          <ShieldCheck className="size-[18px]" aria-hidden />
        </span>
        <h2 className="text-base font-semibold">Kullanım verileri</h2>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Aramaların işe yarayıp yaramadığını ölçüyoruz. Kimliğin açığa çıkmaz.{" "}
        <Link className="font-medium underline underline-offset-2" href="/kvkk/analitik">
          Detaylar
        </Link>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" disabled={saving} onClick={() => void choose(false)}>
          Reddet
        </Button>
        <Button size="sm" disabled={saving} onClick={() => void choose(true)}>
          İzin ver
        </Button>
      </div>
    </aside>
  );
}

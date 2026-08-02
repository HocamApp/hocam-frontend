"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDiscoveryConsent, setDiscoveryConsent, type DiscoveryConsentStatus } from "@/lib/discovery";

export function DiscoveryConsentBanner() {
  const [status, setStatus] = useState<DiscoveryConsentStatus | "loading">("loading");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getDiscoveryConsent().then((value) => setStatus(value.status)).catch(() => setStatus("unset"));
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
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-xl border bg-background p-4 shadow-xl" aria-label="Analiz tercihi">
      <p className="text-sm font-semibold">Hocam’ı geliştirmemize yardımcı olur musun?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Onay verirsen hoca arama ve eşleşme sonuçlarının nasıl kullanıldığını kimliğini doğrudan açığa çıkarmayan bir oturumla ölçeriz. Ayrıntılar için{" "}
        <Link className="underline" href="/kvkk/analitik">analitik aydınlatma metnini</Link> inceleyebilirsin.
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={saving} onClick={() => void choose(false)}>Reddet</Button>
        <Button disabled={saving} onClick={() => void choose(true)}>İzin ver</Button>
      </div>
    </aside>
  );
}

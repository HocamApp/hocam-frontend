"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDiscoveryConsent, setDiscoveryConsent, withdrawDiscoveryConsent, type DiscoveryConsentStatus } from "@/lib/discovery";

export function DiscoveryConsentControls() {
  const [status, setStatus] = useState<DiscoveryConsentStatus>("unset");
  const [collectionEnabled, setCollectionEnabled] = useState(false);
  useEffect(() => {
    void getDiscoveryConsent().then((value) => {
      setStatus(value.status);
      setCollectionEnabled(value.collection_enabled);
    });
  }, []);
  if (status === "granted") {
    return <Button variant="outline" onClick={() => void withdrawDiscoveryConsent().then((value) => setStatus(value.status))}>Analitik onayımı geri çek</Button>;
  }
  if (!collectionEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Yeni analitik onayı, hukuki dayanak incelemesi tamamlanana kadar alınmamaktadır.
      </p>
    );
  }
  return <Button onClick={() => void setDiscoveryConsent(true).then((value) => setStatus(value.status))}>Analitik ölçüme izin ver</Button>;
}

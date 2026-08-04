"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDiscoveryConsent, setDiscoveryConsent, withdrawDiscoveryConsent, type DiscoveryConsentStatus } from "@/lib/discovery";

export function DiscoveryConsentControls() {
  const [status, setStatus] = useState<DiscoveryConsentStatus>("unset");
  useEffect(() => { void getDiscoveryConsent().then((value) => setStatus(value.status)); }, []);
  if (status === "granted") {
    return <Button variant="outline" onClick={() => void withdrawDiscoveryConsent().then((value) => setStatus(value.status))}>Analitik onayımı geri çek</Button>;
  }
  return <Button onClick={() => void setDiscoveryConsent(true).then((value) => setStatus(value.status))}>Analitik ölçüme izin ver</Button>;
}

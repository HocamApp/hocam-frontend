"use client";

import { useQuery } from "@tanstack/react-query";

import { HintPanel } from "@/components/shared/HintPanel";
import { useUiHints } from "@/hooks/useUiHints";
import { fetchAvailability } from "@/lib/dashboardApi";
import { acknowledgedPatch, hasAvailability } from "@/lib/tutorSetupHints";

/**
 * First-time explanation at the top of the availability dialog. It shows for a
 * tutor who has no availability yet and has not pressed "Anladım" before, and
 * it goes away for good once either is true.
 */
export function AvailabilityDialogHint() {
  const { hints, ready, record } = useUiHints();
  const rules = useQuery({ queryKey: ["availability"], queryFn: fetchAvailability });

  if (!ready || !Array.isArray(rules.data)) return null;
  if (hasAvailability(rules.data) || hints.tutor_availability_hint?.acknowledged_at) return null;

  return (
    <HintPanel
      title="Saatlerini böyle ekle"
      onAcknowledge={() => record("tutor_availability_hint", acknowledgedPatch())}
    >
      Her hafta aynı saatlerde müsaitsen Her hafta tekrarla’yı seç. Sadece bir gün için eklemek istiyorsan Yalnızca bu gün’ü seç. Başlangıç ve bitişi seçip Ekle’ye bas.
    </HintPanel>
  );
}

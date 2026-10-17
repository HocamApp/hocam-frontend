"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useQuery } from "@tanstack/react-query";

import { Coachmark } from "@/components/shared/Coachmark";
import { useUiHints } from "@/hooks/useUiHints";
import { fetchAvailability } from "@/lib/dashboardApi";
import { fetchTutorPackageOffers } from "@/lib/paymentsApi";
import {
  acknowledgedPatch,
  decideTour,
  pendingTourSteps,
  shownPatch,
  type TourStep,
} from "@/lib/tutorSetupHints";

/** Same beat the landing page waits before its coachmark: let the page land first. */
const SHOW_DELAY_MS = 900;

const COPY: Record<TourStep, { title: string; body: string }> = {
  packages: {
    title: "Paketlerini ayarla",
    body: "Haftada kaç ders vereceğini, hangi sürelerde paket sunacağını ve indirimini belirle. Öğrenciler bu paketler üzerinden ders alır.",
  },
  availability: {
    title: "Öğrenci alman için müsaitlik ekle",
    body: "Öğrenciler yalnızca müsait olarak işaretlediğin saatlerde ders alabilir. Saatlerini takvimi açmadan buradan ekleyebilirsin.",
  },
};

interface TutorSetupTourProps {
  anchors: Record<TourStep, RefObject<HTMLElement>>;
  /** Tests pass 0; the page keeps the default. */
  delayMs?: number;
}

/**
 * The first-visit tour on Panom: package settings, then availability. The steps
 * come from the tutor's own data (see `tutorSetupHints.ts`), so a tutor who has
 * already done one of them sees only the other, and one who has done both sees
 * nothing.
 *
 * It waits for every input before deciding. Showing nothing while loading, or
 * when any request failed, is the right failure: a tour that flashes for
 * someone who finished it is worse than one that is late.
 */
export function TutorSetupTour({ anchors, delayMs = SHOW_DELAY_MS }: TutorSetupTourProps) {
  const { hints, ready, record } = useUiHints();
  const rules = useQuery({ queryKey: ["availability"], queryFn: fetchAvailability, retry: false });
  const offers = useQuery({ queryKey: ["tutor-package-offers"], queryFn: fetchTutorPackageOffers, retry: false });

  const [session, setSession] = useState<{ steps: TourStep[]; forced: boolean } | null>(null);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const hintsRef = useRef(hints);
  hintsRef.current = hints;

  const dataReady = ready && Array.isArray(rules.data) && Array.isArray(offers.data);
  const steps = dataReady ? pendingTourSteps({ rules: rules.data ?? [], offers: offers.data ?? [], hints }) : [];
  const decision = dataReady ? decideTour({ hints, steps }) : ({ show: false } as const);
  const stepKey = decision.show ? decision.steps.join(",") : "";
  const forced = decision.show && decision.forced;

  useEffect(() => {
    if (session || finished || !stepKey) return;
    const timer = window.setTimeout(() => {
      // A modal is already asking for attention (the welcome dialog, a consent
      // prompt). Skip this visit without counting it; the tour comes back.
      if (document.querySelector('[role="dialog"]')) return;
      setSession({ steps: stepKey.split(",") as TourStep[], forced });
      setIndex(0);
      record("tutor_setup_tour", shownPatch(hintsRef.current));
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [session, finished, stepKey, forced, record, delayMs]);

  const step = session?.steps[index];
  const anchor = step ? anchors[step] : undefined;

  const finish = (acknowledge: boolean) => {
    if (acknowledge) record("tutor_setup_tour", acknowledgedPatch());
    setSession(null);
    setFinished(true);
  };

  // Using the control the bubble points at is the answer the bubble wanted.
  useEffect(() => {
    const element = anchor?.current;
    if (!element) return;
    const onClick = () => finish(true);
    element.addEventListener("click", onClick);
    return () => element.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, step]);

  if (!session || !step || !anchor) return null;

  const last = index === session.steps.length - 1;
  const copy = COPY[step];

  return (
    <Coachmark
      open
      anchorRef={anchor}
      title={copy.title}
      stepLabel={session.steps.length > 1 ? `Adım ${index + 1}/${session.steps.length}` : undefined}
      actionLabel={last ? "Anladım" : "İleri"}
      forced={session.forced}
      onAction={() => (last ? finish(true) : setIndex(index + 1))}
      onDismiss={() => finish(false)}
    >
      {copy.body}
    </Coachmark>
  );
}

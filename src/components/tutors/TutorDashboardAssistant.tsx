"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { TUTOR_DASHBOARD_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { Coachmark } from "@/components/shared/Coachmark";
import { useUiHints } from "@/hooks/useUiHints";
import { acknowledgedPatch } from "@/lib/tutorSetupHints";
import { resolveTutorDashboardRoute } from "@/lib/tutorDashboard";

const SHOW_DELAY_MS = 900;

/**
 * The assistant button on Panom plus its one-time explanation.
 *
 * They live together because the widget is a sibling of the dashboard content
 * and the bubble has to point at the widget's round button. The bubble waits
 * for the dashboard tour to be answered, so the two never compete: the tour
 * orients the tutor in the page, this one names the button in the corner.
 */
export function TutorDashboardAssistant({ delayMs = SHOW_DELAY_MS }: { delayMs?: number }) {
  const searchParams = useSearchParams();
  const overview = useMemo(
    () => resolveTutorDashboardRoute(new URLSearchParams(searchParams.toString())).mode === "overview",
    [searchParams],
  );
  const { hints, ready, record } = useUiHints();
  const fabRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const tourAnswered = Boolean(hints.tutor_dashboard_tour?.acknowledged_at);
  const chatAnswered = Boolean(hints.tutor_chat_hint?.acknowledged_at);
  const eligible = ready && overview && tourAnswered && !chatAnswered;

  // While the tour and this hint are still to be answered, the corner is
  // spoken for: the widget's own attention card ("Profilini güçlendirmek ister
  // misin?") would sit on top of the tour's bubble on a phone. Once a visit has
  // been a hint visit it stays quiet for that visit, so the card does not pop
  // up the moment the last "Anladım" is pressed.
  const hintVisit = ready && overview && (!tourAnswered || !chatAnswered);
  const [hintVisitSeen, setHintVisitSeen] = useState(false);
  useEffect(() => {
    if (hintVisit) setHintVisitSeen(true);
  }, [hintVisit]);

  useEffect(() => {
    if (!eligible || open) return;
    const timer = window.setTimeout(() => {
      // Another dialog is asking for attention: try again next visit.
      if (document.querySelector('[role="dialog"]')) return;
      setOpen(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [eligible, open, delayMs]);

  const answer = () => {
    setOpen(false);
    record("tutor_chat_hint", acknowledgedPatch());
  };

  // Opening the chat is the answer too.
  useEffect(() => {
    const button = fabRef.current;
    if (!open || !button) return;
    const onClick = () => {
      setOpen(false);
      record("tutor_chat_hint", acknowledgedPatch());
    };
    button.addEventListener("click", onClick);
    return () => button.removeEventListener("click", onClick);
  }, [open, record]);

  const visible = open && eligible;
  const quiet = hintVisit || hintVisitSeen;

  return (
    <>
      <AISupportChatWidget
        title={TUTOR_DASHBOARD_ASSISTANT.title}
        welcomeMessage={TUTOR_DASHBOARD_ASSISTANT.welcomeMessage}
        attentionMessages={TUTOR_DASHBOARD_ASSISTANT.attentionMessages}
        starterPrompts={TUTOR_DASHBOARD_ASSISTANT.starterPrompts}
        fabRef={fabRef}
        suppressAttention={quiet}
      />
      <Coachmark
        open={visible}
        anchorRef={fabRef}
        side="top"
        align="end"
        title="Soruların için yardımcın burada"
        actionLabel="Anladım"
        onAction={answer}
        onDismiss={answer}
      >
        Rezervasyonların, müsaitliğin, öğrencilerin ve profilin hakkındaki sorularını bu balondan Hocam AI Hoca Yardımcısı’na yazabilirsin.
      </Coachmark>
    </>
  );
}

"use client";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingOnboardingFlow } from "@/components/coaching/CoachingOnboardingFlow";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";

export default function CoachingOnboardingPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell
        title="Koçluk vermeye başla"
        width="default"
        currentHref="/dashboard/tutor/coaching/onboarding"
        audience="tutor"
      >
        <CoachingOnboardingFlow />
      </CoachingPageShell>
    </CoachingGuard>
  );
}

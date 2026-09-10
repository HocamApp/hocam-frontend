"use client";

import { TutorCard } from "@/components/tutors/TutorCard";
import {
  TutorTrialBookingOverlays,
  useTutorTrialBookingLauncher,
} from "@/components/tutors/TutorTrialBookingLauncher";
import type { TutorProfile } from "@/types";

export function TutorCardGridWithTrial({
  tutors,
  returnUrl,
}: {
  tutors: TutorProfile[];
  returnUrl: string;
}) {
  const trialBooking = useTutorTrialBookingLauncher();

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {tutors.map((tutor) => (
          <TutorCard
            key={tutor.id}
            tutor={tutor}
            onStartTrial={trialBooking.startTrial}
            trialPending={trialBooking.pendingTutorId === tutor.id}
            trialDisabled={trialBooking.trialDisabled}
          />
        ))}
      </div>
      <TutorTrialBookingOverlays launcher={trialBooking} returnUrl={returnUrl} />
    </>
  );
}

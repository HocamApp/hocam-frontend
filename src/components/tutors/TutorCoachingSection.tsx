"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { CoachingOfferCard } from "@/components/coaching/CoachingOfferCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { coachingFrequencyLabel, fetchCoachingEligibility } from "@/lib/coachingApi";
import type { TutorCoachingSummary } from "@/types/api";

export function TutorCoachingSection({
  tutorId,
  coaching,
  isStudent,
  checkoutEnabled,
  checkoutHref,
}: {
  tutorId: string;
  coaching: TutorCoachingSummary;
  isStudent: boolean;
  checkoutEnabled: boolean;
  checkoutHref: string;
}) {
  const { data: eligibility, isLoading } = useQuery({
    queryKey: ["coaching-eligibility", tutorId],
    queryFn: () => fetchCoachingEligibility(tutorId),
    enabled: isStudent,
  });

  const intakeClosed = !coaching.is_accepting_new_students;
  const canBuy = isStudent && checkoutEnabled && !isLoading && eligibility?.eligible === true && !intakeClosed;
  const statusMessage = intakeClosed
    ? "Bu hoca şu anda koçluk için yeni öğrenci almıyor."
    : isStudent && !isLoading && eligibility && !eligibility.eligible
      ? eligibility.message
      : null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Çalışma Koçluğu</h2>
      <Separator className="mt-2" />
      <div className="mt-4">
        <CoachingOfferCard
          offer={{
            frequencyLabel: coachingFrequencyLabel(coaching.frequency),
            sessionDurationMinutes: coaching.session_duration_minutes,
            priceMinor: coaching.price_per_session_minor,
            isFree: coaching.is_free,
            examTypes: coaching.target_exam_types,
            description: coaching.description,
            capacityAvailable: !intakeClosed,
          }}
          statusMessage={statusMessage}
          action={canBuy ? <Button asChild className="w-full sm:w-auto"><Link href={checkoutHref}>Ders paketiyle koçluk al</Link></Button> : null}
          showHowItWorks
        />
      </div>
    </section>
  );
}

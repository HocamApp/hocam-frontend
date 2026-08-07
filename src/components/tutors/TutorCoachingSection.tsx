"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  COACHING_HOW_IT_WORKS,
  coachingFrequencyLabel,
  fetchCoachingEligibility,
} from "@/lib/coachingApi";
import type { TutorCoachingSummary } from "@/types/api";

const INCLUDED = [
  "Çalışma programı",
  "Deneme değerlendirmesi",
  "İlerleme raporu",
  "Kaynak önerileri",
  "Mesajlara 24 saat içinde yanıt",
];

/**
 * The coaching block on a tutor's public profile.
 *
 * Two sources, deliberately kept apart:
 *
 * - `coaching` comes from the tutor detail endpoint. It is tutor-global and
 *   public: what is on offer, at what price, for which exams.
 * - eligibility comes from `/coaching/eligibility/` and is per-student. It
 *   is the ONLY thing allowed to decide whether a buy CTA appears.
 *
 * That split is why an anonymous visitor sees the offer but no CTA: we
 * genuinely do not know yet whether they could buy it, and a CTA that
 * dead-ends after login would be a worse answer than no CTA.
 */
export function TutorCoachingSection({
  tutorId,
  coaching,
  isStudent,
  checkoutHref,
}: {
  tutorId: string;
  coaching: TutorCoachingSummary;
  isStudent: boolean;
  checkoutHref: string;
}) {
  // Only students have an eligibility verdict at all. Anonymous visitors
  // and tutors skip the request entirely rather than reading a 403.
  const { data: eligibility, isLoading } = useQuery({
    queryKey: ["coaching-eligibility", tutorId],
    queryFn: () => fetchCoachingEligibility(tutorId),
    enabled: isStudent,
  });

  const intakeClosed = !coaching.is_accepting_new_students;
  // A CTA appears only on a positive server verdict. Not on "probably",
  // not while the verdict is still loading.
  const canBuy = isStudent && !isLoading && eligibility?.eligible === true;
  const blockedMessage =
    isStudent && !isLoading && eligibility && !eligibility.eligible
      ? eligibility.message
      : null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Çalışma Koçluğu</h2>
      <Separator className="mt-2" />

      <Card className="mt-4">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">
                {coaching.is_free
                  ? "Ücretsiz Çalışma Koçluğu"
                  : "Çalışma Koçluğu"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {coachingFrequencyLabel(coaching.frequency)} ·{" "}
                {coaching.session_duration_minutes} dakika
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold">
              {coaching.is_free ? "₺0" : coaching.price_per_session_display}
              <span className="font-normal text-muted-foreground">
                {" "}
                / görüşme
              </span>
            </p>
          </div>

          {coaching.target_exam_types.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {coaching.target_exam_types.map((exam) => (
                <Badge key={exam} variant="secondary">
                  {exam}
                </Badge>
              ))}
            </div>
          ) : null}

          {coaching.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {coaching.description}
            </p>
          ) : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dahil olanlar
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-primary">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {intakeClosed ? (
            <p className="text-sm text-muted-foreground">
              Bu hoca şu anda koçluk için yeni öğrenci almıyor.
            </p>
          ) : blockedMessage ? (
            <p className="text-sm text-muted-foreground">{blockedMessage}</p>
          ) : null}

          {canBuy && !intakeClosed ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href={checkoutHref}>Ders paketiyle koçluk al</Link>
            </Button>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Koçluk yalnız ders paketiyle birlikte alınır. Talebin önce
            öğretmenine iletilir; kabul edilmeden hiçbir işlem başlamaz.
          </p>

          <Accordion type="single" collapsible>
            <AccordionItem value="how" className="border-b-0">
              <AccordionTrigger className="text-sm">
                Koçluk nasıl çalışır?
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {COACHING_HOW_IT_WORKS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span aria-hidden="true">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </section>
  );
}

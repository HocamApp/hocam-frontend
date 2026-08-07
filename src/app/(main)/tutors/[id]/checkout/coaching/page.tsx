"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { CoachingChoiceCard } from "@/components/checkout/CoachingChoiceCard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import { fetchTutorById } from "@/lib/tutorsApi";
import {
  COACHING_HOW_IT_WORKS,
  fetchCoachingEligibility,
} from "@/lib/coachingApi";

function CoachingChoiceContent({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState(false);

  const { data: tutor, isLoading: tutorLoading } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => fetchTutorById(tutorId),
  });
  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: ["coaching-eligibility", tutorId],
    queryFn: () => fetchCoachingEligibility(tutorId),
  });

  const checkoutHref = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (selected) {
      next.set("coaching", "1");
    } else {
      next.delete("coaching");
    }
    const query = next.toString();
    return `/tutors/${tutorId}/checkout${query ? `?${query}` : ""}`;
  }, [searchParams, selected, tutorId]);

  if (tutorLoading || eligibilityLoading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // No coaching on offer at all: this step has nothing to ask, so skip it
  // entirely rather than showing an empty screen (master spec §14.1).
  if (!eligibility || eligibility.reason === "no_plan" || !eligibility.plan) {
    router.replace(`/tutors/${tutorId}/checkout?${searchParams.toString()}`);
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href={`/tutors/${tutorId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Hoca profiline dön
      </Link>

      <h1 className="mt-6 text-2xl font-bold">Çalışma Koçluğu</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ders paketine çalışma koçluğu eklemek ister misin? Bu adımı
        atlayabilirsin.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CoachingChoiceCard
            eligibility={eligibility}
            selected={selected}
            onSelect={() => setSelected(true)}
          />

          <button
            type="button"
            aria-pressed={!selected}
            onClick={() => setSelected(false)}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              !selected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/40"
            )}
          >
            <p className="font-medium">Koçluk olmadan devam et</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Yalnız ders paketi satın al.
            </p>
          </button>

          <Accordion type="single" collapsible>
            <AccordionItem value="how">
              <AccordionTrigger>Koçluk nasıl çalışır?</AccordionTrigger>
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
        </div>

        <div>
          <div className="lg:sticky lg:top-24">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <h2 className="text-lg font-semibold">Özet</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Hoca</dt>
                    <dd className="text-right font-medium">
                      {tutor ? `${tutor.name} ${tutor.surname}` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Ders fiyatı</dt>
                    <dd>{tutor ? `${formatPrice(tutor.hourly_price)} / 40 dk` : "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Çalışma koçluğu</dt>
                    <dd className="text-right font-medium">
                      {selected
                        ? eligibility.plan.is_free
                          ? "₺0 — Ders paketinle ücretsiz"
                          : `${eligibility.plan.price_per_session_display} / görüşme`
                        : "Seçilmedi"}
                    </dd>
                  </div>
                </dl>

                <Button className="w-full" asChild>
                  <Link href={checkoutHref}>Paket seçeneklerine devam et</Link>
                </Button>

                <p className="text-xs text-muted-foreground">
                  Koçluk toplamı, bir sonraki adımda seçeceğin paket süresine
                  göre hesaplanır.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoachingChoicePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <RouteGuard requireRole="student">
      <CoachingChoiceContent tutorId={params.id} />
    </RouteGuard>
  );
}

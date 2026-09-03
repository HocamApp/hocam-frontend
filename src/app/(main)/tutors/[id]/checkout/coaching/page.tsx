"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { CoachingChoiceCard } from "@/components/checkout/CoachingChoiceCard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTryMinor } from "@/lib/money";
import { fetchTutorById } from "@/lib/tutorsApi";
import { updateMatchingGoal } from "@/lib/matchingApi";
import {
  COACHING_HOW_IT_WORKS,
  eligibilityAllowsCoachingChoice,
  fetchCoachingEligibility,
  readCoachingSelectedFromSearchParams,
} from "@/lib/coachingApi";

const EXAM_TARGET_LABEL: Record<string, string> = { YKS: "YKS", DGS: "DGS", KPSS: "KPSS" };

/**
 * Master Spec §14.6 "Sınav hedefi eksik" — "YKS / DGS / KPSS seçimi
 * istenir. Yalnız öğretmenin desteklediği seçenekler aktiftir": only this
 * tutor's own supported exam targets are offered, never the full YKS/DGS/
 * KPSS set. Saving refetches eligibility so the card above unlocks in
 * place — no page reload, no trip to the general profile settings page.
 */
function ExamTargetPicker({
  targets,
  onSaved,
}: {
  targets: string[];
  onSaved: () => void;
}) {
  const save = useMutation({
    mutationFn: (goal: "YKS" | "DGS" | "KPSS") => updateMatchingGoal(goal),
    onSuccess: () => {
      toast.success("Sınav hedefin kaydedildi.");
      onSaved();
    },
    onError: () => {
      toast.error("Sınav hedefi kaydedilemedi. Lütfen tekrar dene.");
    },
  });

  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div>
          <h2 className="font-semibold">Sınav hedefini seç</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bu hocanın koçluk planını görebilmek için sınav hedefini seçmen gerekiyor.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {targets.map((target) => (
            <Button
              key={target}
              type="button"
              variant="outline"
              disabled={save.isPending}
              onClick={() => save.mutate(target as "YKS" | "DGS" | "KPSS")}
            >
              {EXAM_TARGET_LABEL[target] ?? target}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CoachingChoiceContent({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { checkoutEnabled, isLoading: flagLoading } = useCoachingFlag();
  const [selected, setSelected] = useState(() =>
    readCoachingSelectedFromSearchParams(searchParams)
  );

  const { data: tutor, isLoading: tutorLoading } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => fetchTutorById(tutorId),
  });
  const eligibilityQueryKey = ["coaching-eligibility", tutorId];
  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: eligibilityQueryKey,
    queryFn: () => fetchCoachingEligibility(tutorId),
  });
  const shouldRedirectToLessonCheckout =
    !flagLoading &&
    !tutorLoading &&
    !eligibilityLoading &&
    !eligibilityAllowsCoachingChoice(eligibility, checkoutEnabled);

  useEffect(() => {
    if (!shouldRedirectToLessonCheckout) return;
    router.replace(`/tutors/${tutorId}/checkout?${searchParams.toString()}`);
  }, [router, searchParams, shouldRedirectToLessonCheckout, tutorId]);

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

  if (tutorLoading || eligibilityLoading || flagLoading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // No coaching on offer at all (§14.1), or this tutor's plan doesn't
  // cover the student's exam group (§14.5 "Sınav grubu uyumsuz" — "Koçluk
  // ekranı gösterilmez"): this step has nothing the student could pick, so
  // skip it entirely rather than showing a disabled card. Distinct from
  // §14.6 missing_target_exam, which still shows the screen and asks the
  // student to choose an exam target.
  if (shouldRedirectToLessonCheckout || !eligibilityAllowsCoachingChoice(eligibility, checkoutEnabled)) {
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
          {eligibility.reason === "missing_target_exam" && eligibility.available_exam_targets?.length ? (
            <ExamTargetPicker
              targets={eligibility.available_exam_targets}
              onSaved={() => queryClient.invalidateQueries({ queryKey: eligibilityQueryKey })}
            />
          ) : (
            <CoachingChoiceCard
              eligibility={eligibility}
              selected={selected}
              onSelect={() => setSelected(true)}
            />
          )}

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
                    <dd>{tutor ? `${formatTryMinor(Number(tutor.hourly_price) * 100)} / 40 dk` : "—"}</dd>
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
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RouteGuard requireRole="student">
      <CoachingChoiceContent tutorId={id} />
    </RouteGuard>
  );
}

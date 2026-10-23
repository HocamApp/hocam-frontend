"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "@phosphor-icons/react";
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
import { checkoutPackageLabel } from "@/lib/coachingCheckoutStep";
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
    <div className="space-y-3 rounded-card border border-line bg-surface px-6 py-5">
      <div>
        <h2 className="text-h3-m font-bold md:text-h3 md:font-bold">Sınav hedefini seç</h2>
        <p className="mt-1 text-small text-ink-mid">
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
    </div>
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

  const eligibilityQueryKey = ["coaching-eligibility", tutorId];
  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: eligibilityQueryKey,
    queryFn: () => fetchCoachingEligibility(tutorId),
  });
  const shouldRedirectToLessonCheckout =
    !flagLoading &&
    !eligibilityLoading &&
    !eligibilityAllowsCoachingChoice(eligibility, checkoutEnabled);

  useEffect(() => {
    if (!shouldRedirectToLessonCheckout) return;
    router.replace(`/tutors/${tutorId}/checkout?${searchParams.toString()}`);
  }, [router, searchParams, shouldRedirectToLessonCheckout, tutorId]);

  // A link that says coaching=1 for an offer the server no longer lets her
  // take is not a choice: nothing is shown as chosen and nothing is carried on.
  const chosen = selected && Boolean(eligibility?.eligible);

  const checkoutHref = (withCoaching: boolean) => {
    const next = new URLSearchParams(searchParams.toString());
    if (withCoaching) {
      next.set("coaching", "1");
    } else {
      next.delete("coaching");
    }
    const query = next.toString();
    return `/tutors/${tutorId}/checkout${query ? `?${query}` : ""}`;
  };
  const packageLabel = useMemo(() => checkoutPackageLabel(searchParams), [searchParams]);

  if (eligibilityLoading || flagLoading) {
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

  const missingTarget =
    eligibility.reason === "missing_target_exam" && Boolean(eligibility.available_exam_targets?.length);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/tutors/${tutorId}`}
        className="inline-flex items-center gap-1.5 text-small text-ink-mid transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Hoca profiline dön
      </Link>

      <h1 className="mt-6 text-h2">Çalışma Koçluğu</h1>
      <p className="mt-1 text-small text-ink-mid">
        Ders paketine çalışma koçluğu eklemek ister misin? Bu adımı atlayabilirsin.
      </p>

      <div className="mt-6 space-y-4">
        {missingTarget ? (
          <ExamTargetPicker
            targets={eligibility.available_exam_targets ?? []}
            onSaved={() => queryClient.invalidateQueries({ queryKey: eligibilityQueryKey })}
          />
        ) : (
          <CoachingChoiceCard
            eligibility={eligibility}
            selected={chosen}
            onToggle={() => setSelected((current) => !current)}
          />
        )}

        {chosen && !missingTarget ? (
          <div className="flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
            <div>
              <p className="text-label text-ink-mid">Seçtiğin paket</p>
              <p className="text-body font-medium text-ink">
                {`${packageLabel ?? "Ders paketin"} + koçluk`}
              </p>
            </div>
            {/* The label may wrap on a 320px phone: the button's own nowrap would push the page sideways. */}
            <Button
              asChild
              className="h-auto min-h-10 w-full whitespace-normal py-2 text-center sm:w-auto sm:whitespace-nowrap"
            >
              <Link href={checkoutHref(true)}>Paket seçeneklerine devam et</Link>
            </Button>
          </div>
        ) : null}

        <p className="text-center">
          <Link
            href={checkoutHref(false)}
            className="text-small text-ink-mid underline underline-offset-4 transition-colors hover:text-ink"
          >
            Koçluk olmadan devam et
          </Link>
        </p>

        <div className="rounded-card border border-line bg-surface px-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="how" className="border-b-0">
              <AccordionTrigger className="py-4 text-[1rem] font-bold hover:no-underline">
                Koçluk nasıl çalışır?
              </AccordionTrigger>
              <AccordionContent>
                <ul className="divide-y divide-line">
                  {COACHING_HOW_IT_WORKS.map((item) => (
                    <li key={item} className="py-2.5 text-small text-ink first:pt-0 last:pb-0">
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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

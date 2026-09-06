"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, Circle } from "@phosphor-icons/react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTutorPerformance } from "@/lib/tutorsApi";
import type { TutorPriceInsight } from "@/lib/tutorsApi";
import { buildTutorMetrics, type TutorMetric } from "@/lib/tutorPerformance";
import { cn } from "@/lib/utils";
import type { AvailabilityRule, TutorProfile } from "@/types";

/**
 * Whether a tutor's tutoring is healthy, with a target beside every number.
 *
 * The dashboard already showed three counts — lessons this month, active
 * students, rating — and none of them said whether the number was good. A
 * count without a target is trivia; the target is the whole product.
 *
 * Four of the six cards describe the profile as it stands rather than a
 * stretch of activity, so the period selector does not move them. They say so
 * rather than sitting there unchanged and looking broken.
 */

const WINDOWS = [
  { days: 30, label: "Son 30 gün" },
  { days: 90, label: "Son 90 gün" },
  { days: 365, label: "Son 1 yıl" },
] as const;

export function TutorPerformanceSection({
  profile,
  availability,
  priceInsight,
}: {
  profile: TutorProfile;
  availability: AvailabilityRule[];
  priceInsight: TutorPriceInsight | null;
}) {
  const [windowDays, setWindowDays] = useState<number>(90);

  const { data: performance, isLoading } = useQuery({
    queryKey: ["tutor-performance", windowDays],
    queryFn: () => fetchTutorPerformance(windowDays),
    staleTime: 5 * 60_000,
  });

  const metrics = buildTutorMetrics({
    profile,
    availability,
    performance: performance ?? null,
    priceInsight,
  });

  return (
    <section aria-labelledby="tutor-performance-title">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="tutor-performance-title" className="text-h2-m sm:text-h2">
            Başarının anahtarları
          </h2>
          <p className="mt-1 text-small text-ink-mid">
            Bu sayıları hedefte tutmak yeni öğrenci almanı ve mevcutlarını
            tutmanı kolaylaştırır.
          </p>
          <Link
            href={`/dashboard/tutor/statistics?tab=overview&period=${windowDays}`}
            className="mt-2 inline-flex items-center gap-1 text-small font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
          >
            Ayrıntıları gör
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Plain buttons with aria-pressed, not tabs: nothing here has a
            panel to be linked to, and the ARIA tabs contract would promise
            one. Same construction as the schedule view switch. */}
        <div
          role="group"
          aria-label="Dönem"
          className="inline-flex w-full rounded-pill bg-paper p-1 lg:w-auto"
        >
          {WINDOWS.map((option) => {
            const selected = option.days === windowDays;
            return (
              <button
                key={option.days}
                type="button"
                aria-pressed={selected}
                onClick={() => setWindowDays(option.days)}
                /* The Small step is spelled as an arbitrary length because
                   tailwind-merge cannot tell a custom `text-*` size from a
                   custom `text-*` colour, and drops the size on the branch
                   that sets one. */
                className={cn(
                  "flex-1 rounded-pill px-4 py-2 text-[0.875rem] font-medium leading-[1.5] transition-colors duration-[var(--duration-state)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 lg:flex-none",
                  selected ? "bg-ink text-paper" : "text-ink-mid hover:text-ink"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* One bordered surface holding cells, not six cards laid side by side:
          a row of separate cards is the feature-grid tell, and these are one
          reading, not six. */}
      <Card className="grid gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCell
            key={metric.key}
            metric={metric}
            isLoading={isLoading && !metric.isLive}
          />
        ))}
      </Card>
    </section>
  );
}

function MetricCell({
  metric,
  isLoading,
}: {
  metric: TutorMetric;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-input border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label text-ink-mid">{metric.label}</p>
          <p className="mt-0.5 text-label text-ink-mid">{metric.targetLabel}</p>
        </div>
        <StatusMark status={metric.status} />
      </div>

      {isLoading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <p className="mt-3 text-h3 font-bold tabular-nums">{metric.displayValue}</p>
      )}

      {metric.isLive ? (
        /* An outline pill, not a filled one: this is a note about what the
           number is, not a status about how it is doing. */
        <span className="mt-3 inline-flex rounded-pill border border-line px-2.5 py-0.5 text-label text-ink-mid">
          Anlık
        </span>
      ) : null}
    </div>
  );
}

/**
 * Met or not met, carried by the icon's weight rather than by colour alone.
 *
 * Gold is the palette's achievement surface, so a met target fills; anything
 * else stays an outline. An unknown metric gets no mark at all — a hollow
 * circle would read as failure, and not having been measured is not failing.
 */
function StatusMark({ status }: { status: TutorMetric["status"] }) {
  if (status === "unknown") return null;
  if (status === "met") {
    return (
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-gold text-gold-ink">
        <CheckCircle aria-label="Hedefte" className="h-4 w-4" weight="fill" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-line text-ink-mid">
      <Circle aria-label="Hedefin altında" className="h-4 w-4" weight="regular" />
    </span>
  );
}

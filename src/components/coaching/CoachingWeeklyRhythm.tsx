import Link from "next/link";
import { CalendarDays, ClipboardCheck, UserPlus, UsersRound } from "lucide-react";

import { buildMetricShare } from "@/lib/coachingVisuals";
import { cn } from "@/lib/utils";
import type { CoachingMetricValues } from "./CoachingMetricGrid";
import { CoachingStudioPanel } from "./CoachingStudioPanel";

const ITEMS = [
  {
    key: "activeStudents",
    label: "Aktif öğrenci",
    href: "/dashboard/tutor/coaching/students",
    icon: UsersRound,
    segment: "bg-foreground",
  },
  {
    key: "upcomingSessions",
    label: "Yaklaşan görüşme",
    href: "/dashboard/tutor/coaching/upcoming",
    icon: CalendarDays,
    segment: "bg-primary",
  },
  {
    key: "pendingReports",
    label: "Rapor bekleyen",
    href: "/dashboard/tutor/coaching/reports",
    icon: ClipboardCheck,
    segment: "bg-amber-400",
  },
  {
    key: "pendingRequests",
    label: "Yeni talep",
    href: "/dashboard/tutor/coaching/requests",
    icon: UserPlus,
    segment: "bg-rose-300",
  },
] as const;

export function CoachingWeeklyRhythm({ metrics }: { metrics: CoachingMetricValues }) {
  const values = ITEMS.map(({ key }) => metrics[key]);
  const shares = buildMetricShare(values);
  const knownValues = values.filter((value): value is number => value !== null);
  const allKnown = knownValues.length === values.length;
  const allZero = allKnown && knownValues.every((value) => value === 0);
  const attentionCount = [
    metrics.upcomingSessions,
    metrics.pendingReports,
    metrics.pendingRequests,
  ].reduce<number>((sum, value) => sum + (value ?? 0), 0);

  return (
    <CoachingStudioPanel className="overflow-hidden p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Güncel akış
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Haftanın ritmi</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Öğrencilerin, görüşmelerin ve bekleyen işlerin tek bakışta.
          </p>
        </div>
        {!allZero && knownValues.length ? (
          <p className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Şu an ilgilenmen gereken {attentionCount} iş var.
          </p>
        ) : null}
      </div>

      {allZero ? (
        <div className="mt-6 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.045] p-5 sm:p-6">
          <p className="font-semibold">Koçluk akışın burada şekillenecek</p>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            Yeni öğrenciler, yaklaşan görüşmeler ve rapor işleri oluştuğunda bu alan haftalık çalışma ritmini gösterecek.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            {ITEMS.map((item, index) => {
              const share = shares[index];
              return share && share > 0 ? (
                <span
                  key={item.key}
                  className={cn("h-full", item.segment)}
                  style={{ width: `${share}%` }}
                />
              ) : null;
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {ITEMS.map(({ key, label, href, icon: Icon }, index) => {
              const value = metrics[key];
              const share = shares[index];
              return (
                <Link
                  key={key}
                  href={href}
                  aria-label={share === null ? undefined : `${label}: %${Math.round(share)} pay`}
                  className="group rounded-2xl border border-transparent bg-muted/45 p-4 transition-colors hover:border-border hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="flex items-center justify-between gap-3">
                    <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                    {value === null ? (
                      <span className="text-xs font-medium text-muted-foreground">Şu anda görüntülenemiyor</span>
                    ) : (
                      <span className="text-2xl font-semibold tabular-nums">{value}</span>
                    )}
                  </span>
                  <span className="mt-3 block text-xs font-semibold text-muted-foreground">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </CoachingStudioPanel>
  );
}

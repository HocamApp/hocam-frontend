import Link from "next/link";
import {
  CalendarBlank,
  ClipboardText,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react/ssr";

import { buildMetricShare } from "@/lib/coachingVisuals";
import { cn } from "@/lib/utils";
import type { CoachingMetricValues } from "./CoachingMetricGrid";
import { CoachingStudioPanel } from "./CoachingStudioPanel";

/*
 * Segment fills come off the brand palette rather than Tailwind's amber/rose
 * steps. DESIGN.md holds the site at three hues plus neutrals, and a bar whose
 * fourth colour is a stock utility is the rainbow tell it exists to prevent.
 * Gold reads here as a surface with no text on it, which is the only way gold
 * is ever allowed to appear.
 */
const ITEMS = [
  {
    key: "activeStudents",
    label: "Aktif öğrenci",
    href: "/dashboard/tutor/coaching/students",
    icon: UsersThree,
    segment: "bg-ink",
  },
  {
    key: "upcomingSessions",
    label: "Yaklaşan görüşme",
    href: "/dashboard/tutor/coaching/upcoming",
    icon: CalendarBlank,
    segment: "bg-pink",
  },
  {
    key: "pendingReports",
    label: "Rapor bekleyen",
    href: "/dashboard/tutor/coaching/reports",
    icon: ClipboardText,
    segment: "bg-gold",
  },
  {
    key: "pendingRequests",
    label: "Yeni talep",
    href: "/dashboard/tutor/coaching/requests",
    icon: UserPlus,
    segment: "bg-ink-mid",
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
          <p className="text-label uppercase tracking-[0.16em] text-pink">
            Güncel akış
          </p>
          <h2 className="mt-1 text-h3">Haftanın ritmi</h2>
          <p className="mt-2 max-w-2xl text-small text-ink-mid">
            Öğrencilerin, görüşmelerin ve bekleyen işlerin tek bakışta.
          </p>
        </div>
        {!allZero && knownValues.length ? (
          /* The sticker: a solid pill rotated a couple of degrees. Static
             rotation, never animated. It reads handmade and slightly
             irreverent, which is the right register for this audience, and
             past four degrees it stops looking intentional and starts looking
             like a CSS mistake. One per section, and this is the page's. */
          <p className="-rotate-[2.5deg] rounded-pill bg-ink px-4 py-1.5 text-label text-paper tabular-nums">
            Şu an ilgilenmen gereken {attentionCount} iş var.
          </p>
        ) : null}
      </div>

      {/* A hairline on the empty block, not a dashed one: the shared coaching
          surface holds one border treatment, so an empty state reads as the
          same material as a full one, just without content in it yet. */}
      {allZero ? (
        <div className="mt-6 rounded-input border border-line bg-paper p-5 sm:p-6">
          <p className="font-medium">Koçluk akışın burada şekillenecek</p>
          <p className="mt-1 max-w-xl text-small text-ink-mid">
            Yeni öğrenciler, yaklaşan görüşmeler ve rapor işleri oluştuğunda bu alan haftalık çalışma ritmini gösterecek.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex h-2.5 w-full overflow-hidden rounded-pill bg-line" aria-hidden="true">
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
                  /* Hover moves the hairline to ink and nothing else. No lift,
                     no shadow, no fill swap: colour-only state at 120ms needs
                     no prefers-reduced-motion escape hatch. */
                  className="group rounded-input border border-line bg-surface p-4 transition-colors duration-[var(--duration-state)] hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                >
                  <span className="flex items-center justify-between gap-3">
                    <Icon aria-hidden="true" className="h-5 w-5 text-ink-mid transition-colors duration-[var(--duration-state)] group-hover:text-ink" weight="regular" />
                    {value === null ? (
                      <span className="text-label text-ink-mid">Şu anda görüntülenemiyor</span>
                    ) : (
                      <span className="text-h3 font-bold tabular-nums">{value}</span>
                    )}
                  </span>
                  <span className="mt-3 block text-label text-ink-mid">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </CoachingStudioPanel>
  );
}

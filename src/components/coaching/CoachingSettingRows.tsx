"use client";

import Link from "next/link";
import {
  CalendarCheck,
  Check,
  Clock,
  GraduationCap,
  Tag,
  TextAlignLeft,
  Users,
  type Icon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import type { CoachingSettingRow } from "@/lib/coachingPlanSummary";

const ROW_ICONS: Record<CoachingSettingRow["step"], Icon> = {
  frequency: CalendarCheck,
  price: Tag,
  exams: GraduationCap,
  description: TextAlignLeft,
  availability: Clock,
  capacity: Users,
};

/**
 * The saved settings as hairline rows: what each one is, what it is set to,
 * and a way back to change just that one.
 *
 * The same rows serve two screens. On the summary each carries its icon; on
 * the review step each carries a gold tick, because there the question is
 * "is everything here", not "what is this". Plain class strings throughout:
 * tailwind-merge would drop a named size next to a text colour.
 */
export function CoachingSettingRows({
  rows,
  leading,
  ariaLabel,
}: {
  rows: readonly CoachingSettingRow[];
  leading: "icon" | "check";
  ariaLabel?: string;
}) {
  return (
    <ul aria-label={ariaLabel}>
      {rows.map((row) => {
        const RowIcon = ROW_ICONS[row.step];
        return (
          <li
            key={row.step}
            // Below ~400px the button drops under the text: beside it, the value
            // would be left about 120px and "600,00 ₺ / görüşme" would wrap.
            className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 border-t border-line px-4 py-3 first:border-t-0 min-[400px]:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6"
          >
            {leading === "check" ? (
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-gold text-gold-ink"
              >
                <Check className="h-3.5 w-3.5" weight="bold" />
              </span>
            ) : (
              <RowIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-mid" />
            )}
            <div className="min-w-0">
              <p className="text-label text-ink-mid">{row.label}</p>
              <p
                className={`mt-0.5 break-words text-body font-medium text-ink ${
                  row.step === "description" ? "line-clamp-2" : ""
                }`}
              >
                {row.value}
              </p>
              {row.hint ? <p className="mt-0.5 text-small text-ink-mid">{row.hint}</p> : null}
            </div>
            {/* A solid gold button: the outline pill was the colour of the row behind it. */}
            <Button
              asChild
              size="sm"
              variant="gold"
              className="col-start-2 mt-2 min-h-11 justify-self-start min-[400px]:col-start-3 min-[400px]:mt-0 min-[400px]:justify-self-auto"
            >
              <Link href={`/dashboard/tutor/coaching/plan?step=${row.step}`}>
                Düzenle <span className="sr-only">{row.label}</span>
              </Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

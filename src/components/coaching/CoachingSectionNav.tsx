import Link from "next/link";
import {
  ArrowUpRight,
  CalendarBlank,
  FileText,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react/ssr";

import { CoachingStudioPanel } from "./CoachingStudioPanel";

const GROUP = {
  title: "Koçluğu yürüt",
  description: "Öğrencilerinle haftalık çalışma düzenini ve görüşme akışını sürdür.",
  tone: "accent" as const,
  links: [
    { label: "Koçluk öğrencilerim", href: "/dashboard/tutor/coaching/students", icon: UsersThree },
    { label: "Görüşmeler", href: "/dashboard/tutor/coaching/upcoming", icon: CalendarBlank },
    { label: "Raporlar", href: "/dashboard/tutor/coaching/reports", icon: FileText },
    { label: "Yeni öğrenci talepleri", href: "/dashboard/tutor/coaching/requests", icon: UserPlus },
  ],
} as const;

export function CoachingSectionNav() {
  return (
    /*
      An ordinary section on the page's own surface. It was a full-bleed pale
      band, which made a list of navigation links the loudest thing on the
      overview — louder than the status panel above it. The heading is enough
      separation for a set of links.
    */
    <section aria-label="Koçluğu yürüt">
      <CoachingStudioPanel tone={GROUP.tone} className="p-5 sm:p-6">
        <h2 className="text-h3">{GROUP.title}</h2>
        <p className="mt-1 max-w-2xl text-small text-ink-mid">{GROUP.description}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {GROUP.links.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              /* Hairline to ink on hover. No fill swap, no lift: the
                 border carries the state and costs nothing at 120ms. */
              className="group flex min-h-12 items-center justify-between gap-3 rounded-input border border-line bg-surface px-3.5 text-[0.9375rem] font-medium transition-colors duration-[var(--duration-state)] hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  aria-hidden="true"
                  className="h-5 w-5 text-ink-mid transition-colors duration-[var(--duration-state)] group-hover:text-ink"
                  weight="regular"
                />
                {label}
              </span>
              {/* Static. An arrow that slides on hover is decoration, and
                  decoration does not get to move. */}
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-ink-mid"
                weight="regular"
              />
            </Link>
          ))}
        </div>
      </CoachingStudioPanel>
    </section>
  );
}

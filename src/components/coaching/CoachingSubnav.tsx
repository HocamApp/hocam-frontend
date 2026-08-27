import Link from "next/link";
import {
  CalendarBlank,
  ClipboardText,
  CurrencyCircleDollar,
  FileText,
  GearSix,
  ShieldCheck,
  SquaresFour,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const TUTOR_LINKS = [
  {
    label: "Genel bakış",
    href: "/dashboard/tutor/coaching",
    icon: SquaresFour,
  },
  {
    label: "Öğrenciler",
    href: "/dashboard/tutor/coaching/students",
    icon: UsersThree,
  },
  {
    label: "Görüşmeler",
    href: "/dashboard/tutor/coaching/upcoming",
    icon: CalendarBlank,
  },
  {
    label: "Talepler",
    href: "/dashboard/tutor/coaching/requests",
    icon: UserPlus,
  },
  {
    label: "Kayıtlar",
    href: "/dashboard/tutor/coaching/reports",
    icon: ClipboardText,
  },
  {
    label: "Kazançlar",
    href: "/dashboard/tutor/coaching/earnings",
    icon: CurrencyCircleDollar,
  },
  {
    label: "Teklif ayarları",
    href: "/dashboard/tutor/coaching/plan",
    icon: GearSix,
  },
] as const;

const STUDENT_LINKS = [
  {
    label: "Genel bakış",
    href: "/dashboard/student/coaching",
    icon: SquaresFour,
  },
  {
    label: "Programım",
    href: "/dashboard/student/coaching/program",
    icon: FileText,
  },
  {
    label: "Görüşmeler",
    href: "/dashboard/student/coaching/upcoming",
    icon: CalendarBlank,
  },
  {
    label: "Raporlar",
    href: "/dashboard/student/coaching/reports",
    icon: ClipboardText,
  },
  {
    label: "Destek",
    href: "/dashboard/student/coaching/complaints",
    icon: ShieldCheck,
  },
] as const;

type Audience = "tutor" | "student";

/** Sub-pages that belong under a tab without matching its href exactly. */
function matchesGroup(href: string, currentHref: string, audience: Audience) {
  if (href.endsWith("/upcoming")) {
    return (
      currentHref.includes("/sessions/") ||
      currentHref.includes("/reschedule-requests")
    );
  }
  if (href.endsWith("/plan")) {
    return (
      currentHref.includes("/availability") ||
      currentHref.includes("/preview") ||
      currentHref.includes("/onboarding")
    );
  }
  if (href.endsWith("/students")) {
    return (
      currentHref.includes("/service-periods/") ||
      currentHref.includes("/time-requests")
    );
  }
  if (href.endsWith("/reports")) {
    // The tutor files complaints under "Kayıtlar" and has no separate tab for
    // them. The student does have one — "Destek" — so folding /complaints into
    // Raporlar there lit two tabs at once on the complaints page.
    if (audience === "tutor") {
      return (
        currentHref.includes("/reports") || currentHref.includes("/complaints")
      );
    }
    return currentHref.includes("/reports");
  }
  return false;
}

/**
 * The one current tab. Resolved once rather than per link: the pill and the
 * screen-reader announcement used to decide independently, so an overlapping
 * rule could — and did — highlight two tabs while announcing a third.
 * An exact href always wins; grouping is only the fallback.
 */
export function resolveCoachingSubnavHref(
  links: readonly { href: string }[],
  currentHref: string,
  audience: Audience,
): string | null {
  const exact = links.find((link) => link.href === currentHref);
  if (exact) return exact.href;
  return (
    links.find((link) => matchesGroup(link.href, currentHref, audience))
      ?.href ?? null
  );
}

export function CoachingSubnav({
  currentHref,
  audience,
}: {
  currentHref: string;
  audience: Audience;
}) {
  const links = audience === "tutor" ? TUTOR_LINKS : STUDENT_LINKS;
  const activeHref = resolveCoachingSubnavHref(links, currentHref, audience);
  const current = links.find((link) => link.href === activeHref);

  return (
    <div className="space-y-2">
      <p className="text-label font-medium text-ink-mid md:hidden">
        Koçlukta konumun
      </p>
      <div className="relative">
        <nav
          aria-label="Koçluk bölümleri"
          className="flex gap-1 overflow-x-auto rounded-card border border-line bg-surface p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {links.map(({ label, href, icon: Icon }) => {
            const active = href === activeHref;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-pill px-4 text-small font-medium transition-colors duration-[--duration-state] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-mid hover:bg-paper hover:text-ink",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className="h-4 w-4"
                  weight={active ? "fill" : "regular"}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      {current ? (
        <p className="sr-only" aria-live="polite">
          Koçlukta konumun: {current.label}
        </p>
      ) : null}
    </div>
  );
}

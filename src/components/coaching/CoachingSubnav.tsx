import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings2,
  ShieldAlert,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TUTOR_LINKS = [
  { label: "Genel bakış", href: "/dashboard/tutor/coaching", icon: LayoutDashboard },
  { label: "Öğrenciler", href: "/dashboard/tutor/coaching/students", icon: UsersRound },
  { label: "Görüşmeler", href: "/dashboard/tutor/coaching/upcoming", icon: CalendarDays },
  { label: "Talepler", href: "/dashboard/tutor/coaching/requests", icon: UserPlus },
  { label: "Kayıtlar", href: "/dashboard/tutor/coaching/reports", icon: ClipboardList },
  { label: "Kazançlar", href: "/dashboard/tutor/coaching/earnings", icon: CircleDollarSign },
  { label: "Teklif ayarları", href: "/dashboard/tutor/coaching/plan", icon: Settings2 },
] as const;

const STUDENT_LINKS = [
  { label: "Genel bakış", href: "/dashboard/student/coaching", icon: LayoutDashboard },
  { label: "Programım", href: "/dashboard/student/coaching/program", icon: FileText },
  { label: "Görüşmeler", href: "/dashboard/student/coaching/upcoming", icon: CalendarDays },
  { label: "Raporlar", href: "/dashboard/student/coaching/reports", icon: FileText },
  { label: "Destek", href: "/dashboard/student/coaching/complaints", icon: ShieldAlert },
] as const;

type Audience = "tutor" | "student";

/** Sub-pages that belong under a tab without matching its href exactly. */
function matchesGroup(href: string, currentHref: string, audience: Audience) {
  if (href.endsWith("/upcoming")) {
    return currentHref.includes("/sessions/") || currentHref.includes("/reschedule-requests");
  }
  if (href.endsWith("/plan")) {
    return currentHref.includes("/availability") || currentHref.includes("/preview") || currentHref.includes("/onboarding");
  }
  if (href.endsWith("/students")) {
    return currentHref.includes("/service-periods/") || currentHref.includes("/time-requests");
  }
  if (href.endsWith("/reports")) {
    // The tutor files complaints under "Kayıtlar" and has no separate tab for
    // them. The student does have one — "Destek" — so folding /complaints into
    // Raporlar there lit two tabs at once on the complaints page.
    if (audience === "tutor") {
      return currentHref.includes("/reports") || currentHref.includes("/complaints");
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
  audience: Audience
): string | null {
  const exact = links.find((link) => link.href === currentHref);
  if (exact) return exact.href;
  return links.find((link) => matchesGroup(link.href, currentHref, audience))?.href ?? null;
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:hidden">
        Koçlukta konumun
      </p>
      <div className="relative">
        <nav
          aria-label="Koçluk bölümleri"
          className="flex gap-1.5 overflow-x-auto rounded-2xl border border-border/60 bg-card/90 p-1.5 pr-12 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:pr-1.5"
        >
        {links.map(({ label, href, icon: Icon }) => {
          const active = href === activeHref;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
        </nav>
        <span
          aria-label="Diğer koçluk bölümleri için yatay kaydır"
          className="pointer-events-none absolute inset-y-1 right-1 flex w-12 items-center justify-end rounded-r-xl bg-gradient-to-l from-card via-card/95 to-transparent pr-2 text-muted-foreground md:hidden"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      {current ? (
        <p className="sr-only" aria-live="polite">
          Koçlukta konumun: {current.label}
        </p>
      ) : null}
    </div>
  );
}

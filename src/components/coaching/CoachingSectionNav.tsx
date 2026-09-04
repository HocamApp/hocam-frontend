import Link from "next/link";
import {
  ArrowUpRight,
  CalendarBlank,
  CalendarCheck,
  CurrencyCircleDollar,
  FileText,
  ShieldWarning,
  SlidersHorizontal,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";
import { CoachingStudioPanel } from "./CoachingStudioPanel";

const GROUPS = [
  {
    title: "Koçluğu yürüt",
    description: "Öğrencilerinle haftalık çalışma düzenini ve görüşme akışını sürdür.",
    tone: "accent" as const,
    className: "lg:col-span-2",
    links: [
      { label: "Koçluk öğrencilerim", href: "/dashboard/tutor/coaching/students", icon: UsersThree },
      { label: "Görüşmeler", href: "/dashboard/tutor/coaching/upcoming", icon: CalendarBlank },
      { label: "Raporlar", href: "/dashboard/tutor/coaching/reports", icon: FileText },
      { label: "Yeni öğrenci talepleri", href: "/dashboard/tutor/coaching/requests", icon: UserPlus },
    ],
  },
  {
    title: "Teklif ve ayarlar",
    description: "Koçluk düzenini, saatlerini ve öğrencinin göreceği teklifi yönet.",
    tone: "plain" as const,
    className: "",
    links: [
      { label: "Teklifini düzenle", href: "/dashboard/tutor/coaching/plan", icon: SlidersHorizontal },
      { label: "Koçluk müsaitliği", href: "/dashboard/tutor/coaching/availability", icon: CalendarCheck },
      { label: "Öğrenci görünümü", href: "/dashboard/tutor/coaching/preview", icon: FileText },
    ],
  },
  {
    title: "Kayıtlar ve destek",
    description: "Kazanç kayıtlarını incele; gerektiğinde anlaşmazlık sürecini takip et.",
    tone: "soft" as const,
    className: "lg:col-span-3",
    links: [
      { label: "Koçluk kazançları", href: "/dashboard/tutor/coaching/earnings", icon: CurrencyCircleDollar },
      { label: "Bildirimler ve anlaşmazlıklar", href: "/dashboard/tutor/coaching/complaints", icon: ShieldWarning },
    ],
  },
] as const;

export function CoachingSectionNav() {
  return (
    /*
      The page's second band, and --pink-pale's one legitimate job: a large
      section background. It never fills a badge, a chip or an avatar, and if
      it cannot earn this single use it leaves the palette entirely.

      The diagonal runs the same direction as the header band above it, and the
      cut eats into the top edge, so the top padding carries an extra
      --band-cut on top of the section rhythm.
    */
    <section
      aria-labelledby="coaching-sections-title"
      /* The negative bottom margin cancels the shell stack's own bottom
         padding. A band is the page's last surface before the footer, and a
         strip of paper under it reads as the band having stopped short rather
         than as the section ending. */
      className="band-full-bleed band-cut-top -mb-16 bg-band-pale pb-16 pt-[calc(4rem+var(--band-cut))] sm:-mb-24 sm:pb-24 sm:pt-[calc(6rem+var(--band-cut))]"
    >
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 sm:px-6">
        <div>
          <p className="text-label uppercase tracking-[0.16em] text-pink">Çalışma alanların</p>
          <h2 id="coaching-sections-title" className="mt-1 text-h2-m sm:text-h2">Koçluk alanların</h2>
          <p className="mt-1 text-small text-ink-mid">Yapmak istediğin işe göre devam et.</p>
        </div>
        {/* 2+1 and then a full-width band, never three equal columns — the
            feature-card row is the layout tell DESIGN.md rules out. */}
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          {GROUPS.map((group) => (
            <CoachingStudioPanel key={group.title} tone={group.tone} className={cn("p-5 sm:p-6", group.className)}>
              <h3 className="text-h3">{group.title}</h3>
              <p className="mt-1 max-w-2xl text-small text-ink-mid">{group.description}</p>
              <div className={cn("mt-5 grid gap-2", group.links.length > 3 && "sm:grid-cols-2")}>
                {group.links.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    /* Hairline to ink on hover. No fill swap, no lift: the
                       border carries the state and costs nothing at 120ms. */
                    className="group flex min-h-12 items-center justify-between gap-3 rounded-input border border-line bg-surface px-3.5 text-[0.9375rem] font-medium transition-colors duration-[var(--duration-state)] hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon aria-hidden="true" className="h-5 w-5 text-ink-mid transition-colors duration-[var(--duration-state)] group-hover:text-ink" weight="regular" />
                      {label}
                    </span>
                    {/* Static. An arrow that slides on hover is decoration, and
                        decoration does not get to move. */}
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-mid" weight="regular" />
                  </Link>
                ))}
              </div>
            </CoachingStudioPanel>
          ))}
        </div>
      </div>
    </section>
  );
}

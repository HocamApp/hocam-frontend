import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  FileText,
  Settings2,
  ShieldAlert,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CoachingStudioPanel } from "./CoachingStudioPanel";

const GROUPS = [
  {
    title: "Koçluğu yürüt",
    description: "Öğrencilerinle haftalık çalışma düzenini ve görüşme akışını sürdür.",
    tone: "accent" as const,
    className: "lg:col-span-2",
    links: [
      { label: "Koçluk öğrencilerim", href: "/dashboard/tutor/coaching/students", icon: UsersRound },
      { label: "Görüşmeler", href: "/dashboard/tutor/coaching/upcoming", icon: CalendarClock },
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
      { label: "Teklifini düzenle", href: "/dashboard/tutor/coaching/plan", icon: Settings2 },
      { label: "Koçluk müsaitliği", href: "/dashboard/tutor/coaching/availability", icon: CalendarClock },
      { label: "Öğrenci görünümü", href: "/dashboard/tutor/coaching/preview", icon: FileText },
    ],
  },
  {
    title: "Kayıtlar ve destek",
    description: "Kazanç kayıtlarını incele; gerektiğinde anlaşmazlık sürecini takip et.",
    tone: "soft" as const,
    className: "lg:col-span-3",
    links: [
      { label: "Koçluk kazançları", href: "/dashboard/tutor/coaching/earnings", icon: CircleDollarSign },
      { label: "Bildirimler ve anlaşmazlıklar", href: "/dashboard/tutor/coaching/complaints", icon: ShieldAlert },
    ],
  },
] as const;

export function CoachingSectionNav() {
  return (
    <section aria-labelledby="coaching-sections-title" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Çalışma alanların</p>
        <h2 id="coaching-sections-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Koçluk alanların</h2>
        <p className="mt-1 text-sm text-muted-foreground">Yapmak istediğin işe göre devam et.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <CoachingStudioPanel key={group.title} tone={group.tone} className={cn("p-5 sm:p-6", group.className)}>
            <h3 className="text-lg font-semibold tracking-tight">{group.title}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{group.description}</p>
            <div className={cn("mt-5 grid gap-2", group.links.length > 3 && "sm:grid-cols-2")}>
              {group.links.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-transparent bg-card/80 px-3.5 text-sm font-semibold transition-colors hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                    {label}
                  </span>
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CoachingStudioPanel>
        ))}
      </div>
    </section>
  );
}

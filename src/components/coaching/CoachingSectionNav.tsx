import Link from "next/link";
import { ArrowUpRight, CalendarClock, CircleDollarSign, FileText, Settings2, ShieldAlert, UserPlus, UsersRound } from "lucide-react";

const GROUPS = [
  {
    title: "Teklif ve ayarlar",
    description: "Koçluk düzenini oluştur, saatlerini ayır ve öğrenci görünümünü kontrol et.",
    links: [
      { label: "Teklifini düzenle", href: "/dashboard/tutor/coaching/plan", icon: Settings2 },
      { label: "Koçluk müsaitliği", href: "/dashboard/tutor/coaching/availability", icon: CalendarClock },
      { label: "Öğrenci görünümü", href: "/dashboard/tutor/coaching/preview", icon: FileText },
    ],
  },
  {
    title: "Öğrenciler ve görüşmeler",
    description: "Yeni bundle taleplerini, aktif öğrencileri ve görüşme işlerini takip et.",
    links: [
      { label: "Yeni öğrenci talepleri", href: "/dashboard/tutor/coaching/requests", icon: UserPlus },
      { label: "Koçluk öğrencilerim", href: "/dashboard/tutor/coaching/students", icon: UsersRound },
      { label: "Görüşmeler ve raporlar", href: "/dashboard/tutor/coaching/upcoming", icon: CalendarClock },
    ],
  },
  {
    title: "Kayıtlar ve destek",
    description: "Kazanç kayıtlarını ve gerektiğinde anlaşmazlık süreçlerini görüntüle.",
    links: [
      { label: "Kazanç kayıtları", href: "/dashboard/tutor/coaching/earnings", icon: CircleDollarSign },
      { label: "Bildirimler ve anlaşmazlıklar", href: "/dashboard/tutor/coaching/complaints", icon: ShieldAlert },
    ],
  },
] as const;

export function CoachingSectionNav() {
  return (
    <section aria-labelledby="coaching-sections-title" className="space-y-4">
      <div>
        <h2 id="coaching-sections-title" className="text-lg font-semibold tracking-tight">Koçluk alanların</h2>
        <p className="text-sm text-muted-foreground">Yapmak istediğin işe göre devam et.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">{group.title}</h3>
            <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{group.description}</p>
            <div className="mt-4 divide-y">
              {group.links.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md px-1 text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </span>
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

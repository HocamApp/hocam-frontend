import Link from "next/link";
import { CalendarDays, ClipboardCheck, UserPlus, UsersRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export interface CoachingMetricValues {
  activeStudents: number | null;
  upcomingSessions: number | null;
  pendingReports: number | null;
  pendingRequests: number | null;
}

const METRICS = [
  { key: "activeStudents", label: "Aktif öğrenci", href: "/dashboard/tutor/coaching/students", icon: UsersRound },
  { key: "upcomingSessions", label: "Yaklaşan görüşme", href: "/dashboard/tutor/coaching/upcoming", icon: CalendarDays },
  { key: "pendingReports", label: "Rapor bekleyen", href: "/dashboard/tutor/coaching/reports", icon: ClipboardCheck },
  { key: "pendingRequests", label: "Yeni talep", href: "/dashboard/tutor/coaching/requests", icon: UserPlus },
] as const;

export function CoachingMetricGrid({ metrics }: { metrics: CoachingMetricValues }) {
  return (
    <section aria-label="Koçluk özeti" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map(({ key, label, href, icon: Icon }) => (
        <Link key={key} href={href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Card className="h-full shadow-none transition-colors hover:border-foreground/30">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {metrics[key] === null ? (
                  <p className="mt-2 text-sm font-medium text-muted-foreground">Şu anda görüntülenemiyor</p>
                ) : (
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{metrics[key]}</p>
                )}
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </section>
  );
}

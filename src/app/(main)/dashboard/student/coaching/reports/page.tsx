"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  COACHING_FAZ6_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingReports,
} from "@/lib/coachingApi";

function StudentReportsContent() {
  const query = useQuery({ queryKey: COACHING_FAZ6_QUERY_KEYS.studentReportList(), queryFn: fetchCoachingReports });
  if (query.isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (query.isError) return <ErrorMessage message={extractCoachingErrorMessage(query.error)} />;
  const reports = query.data ?? [];
  if (!reports.length) return <EmptyState title="Henüz yayınlanmış rapor yok" description="Öğretmenin rapor yayınladığında burada en güncel revizyonu göreceksin." />;
  return <div className="space-y-3">{reports.filter((report) => report.latest_revision).map((report) => {
    const revision = report.latest_revision!;
    return <Link key={report.id} href={`/dashboard/student/coaching/reports/${report.id}`}><Card className="transition-colors hover:bg-muted/50"><CardContent className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">Görüşme raporu</p><p className="mt-1 text-sm text-muted-foreground">Revizyon {revision.revision_number} · {new Date(revision.published_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</p></div><FileText className="h-5 w-5 text-primary" /></CardContent></Card></Link>;
  })}</div>;
}

export default function StudentCoachingReportsPage() {
  return <RouteGuard requireAuth requireRole="student"><CoachingPageShell title="Görüşme raporlarım" description="Öğretmeninin yayınladığı en güncel görüşme raporlarını incele ve geri bildirim ver." parentHref="/dashboard/student/coaching" parentLabel="Çalışma koçluğum" eyebrow="Raporlar" width="narrow"><StudentReportsContent /></CoachingPageShell></RouteGuard>;
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FilePenLine } from "lucide-react";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
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

function TutorReportsContent() {
  const query = useQuery({ queryKey: COACHING_FAZ6_QUERY_KEYS.tutorReportList(), queryFn: fetchCoachingReports });
  if (query.isLoading) return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  if (query.isError) return <ErrorMessage message={extractCoachingErrorMessage(query.error)} />;
  if (!query.data?.length) return <EmptyState title="Henüz rapor taslağı yok" description="Rapor bekleyen bir görüşmeyi açtığında taslak burada görünür." steps={["Görüşme tamamlanır", "Öğrenciye açık raporu hazırlarsın"]} tone="accent" />;
  return <div className="space-y-3">{query.data.map((report) => <Link key={report.id} href={`/dashboard/tutor/coaching/sessions/${report.session_id}/report`}><Card className="transition-colors hover:bg-muted/50"><CardContent className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">Görüşme raporu</p><p className="mt-1 text-sm text-muted-foreground">Taslak sürümü {report.draft_version ?? 1}{report.latest_revision ? ` · Son yayın: revizyon ${report.latest_revision.revision_number}` : " · Henüz yayınlanmadı"}</p></div><FilePenLine className="h-5 w-5 text-primary" /></CardContent></Card></Link>)}</div>;
}

export default function TutorCoachingReportsPage() {
  return <CoachingGuard><CoachingPageShell title="Görüşme raporları" description="Taslak, yayınlanan ve revizyon bekleyen koçluk raporlarını yönet." parentHref="/dashboard/tutor/coaching" parentLabel="Koçluk ana sayfası" eyebrow="Raporlar" width="narrow" currentHref="/dashboard/tutor/coaching/reports" audience="tutor"><TutorReportsContent /></CoachingPageShell></CoachingGuard>;
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardText } from "@phosphor-icons/react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingSectionHeading } from "@/components/coaching/CoachingSectionHeading";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { Card, CardContent } from "@/components/ui/card";
import {
  COACHING_FAZ6_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingReports,
} from "@/lib/coachingApi";

function StudentReportsContent() {
  const query = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.studentReportList(),
    queryFn: fetchCoachingReports,
  });
  if (query.isLoading) return <CoachingLoadingState rows={3} />;
  if (query.isError)
    return <ErrorMessage message={extractCoachingErrorMessage(query.error)} />;
  const reports = query.data ?? [];
  if (!reports.length)
    return (
      <EmptyState
        icon={ClipboardText}
        title="Henüz yayınlanmış raporun yok"
        description="Öğretmenin rapor yayınladığında en güncel revizyon burada görünecek."
        steps={["Koçluk görüşmen tamamlanır", "Öğretmenin raporu yayınlar"]}
      />
    );
  return (
    <div className="space-y-3">
      <CoachingSectionHeading>Yayınlanan raporlar</CoachingSectionHeading>
      {reports
        .filter((report) => report.latest_revision)
        .map((report) => {
          const revision = report.latest_revision!;
          return (
            <Link
              key={report.id}
              href={`/dashboard/student/coaching/reports/${report.id}`}
            >
              <Card className="text-ink transition-colors duration-[--duration-state] hover:border-ink">
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <p className="text-body font-medium">Görüşme raporu</p>
                    <p className="mt-1 text-small text-ink-mid tabular-nums">
                      Revizyon {revision.revision_number} ·{" "}
                      {new Date(revision.published_at).toLocaleString("tr-TR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <ClipboardText
                    className="h-5 w-5 text-ink"
                    weight="regular"
                  />
                </CardContent>
              </Card>
            </Link>
          );
        })}
    </div>
  );
}

export default function StudentCoachingReportsPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Görüşme raporlarım"
        description="Öğretmeninin yayınladığı en güncel görüşme raporlarını incele ve geri bildirim ver."
        parentHref="/dashboard/student/coaching"
        parentLabel="Çalışma koçluğum"
        eyebrow="Raporlar"
        width="narrow"
        currentHref="/dashboard/student/coaching/reports"
        audience="student"
      >
        <StudentReportsContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}

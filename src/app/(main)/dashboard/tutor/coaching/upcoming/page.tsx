"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchTutorCoachingSessions } from "@/lib/coachingApi";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Planlandı",
  reschedule_requested: "Değişiklik bekleniyor",
  in_progress: "Devam ediyor",
  awaiting_report: "Rapor bekleniyor",
};

const JOINABLE_STATUSES = new Set(["scheduled", "in_progress"]);

function UpcomingList() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["coaching-tutor-sessions"],
    queryFn: fetchTutorCoachingSessions,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return <CoachingEmptyState title="Yaklaşan görüşme yok" description="Planlanan bir koçluk görüşmesi olduğunda tarihi, hazırlık alanı ve katılım bağlantısı burada görünür." steps={["Öğrenciyle düzenli saat belirlenir", "Görüşme öncesi hazırlık alanı açılır"]} tone="accent" />;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium">
                {session.student_name ?? "Öğrenci"} ·{" "}
                {new Date(session.scheduled_start).toLocaleString("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <Badge variant="secondary" className="mt-1">
                {STATUS_LABEL[session.status] ?? session.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/tutor/coaching/sessions/${session.id}/prepare`}>
                  Hazırlan
                </Link>
              </Button>
              {JOINABLE_STATUSES.has(session.status) && (
                <Button asChild size="sm">
                  <Link href={`/session/coaching/${session.id}`}>Katıl</Link>
                </Button>
              )}
              {session.status === "awaiting_report" ? (
                <Button asChild size="sm">
                  <Link href={`/dashboard/tutor/coaching/sessions/${session.id}/report`}>
                    Raporu hazırla
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TutorCoachingUpcomingPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell title="Yaklaşan görüşmeler" description="Planlanan koçluk görüşmelerine hazırlan, katıl ve görüşme sonrası rapor akışını tamamla." parentHref="/dashboard/tutor/coaching" parentLabel="Koçluk ana sayfası" eyebrow="Takvim" width="narrow" currentHref="/dashboard/tutor/coaching/upcoming" audience="tutor"><UpcomingList /></CoachingPageShell>
    </CoachingGuard>
  );
}

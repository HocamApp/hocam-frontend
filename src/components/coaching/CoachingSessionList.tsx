"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarBlank } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { RescheduleDialog } from "@/components/coaching/RescheduleDialog";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { fetchCoachingSessions } from "@/lib/coachingApi";

const JOINABLE_STATUSES = new Set(["scheduled", "in_progress"]);

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Planlandı",
  reschedule_requested: "Değişiklik bekleniyor",
  in_progress: "Devam ediyor",
  awaiting_report: "Rapor bekleniyor",
  completed: "Tamamlandı",
  student_no_show: "Öğrenci katılmadı",
  tutor_no_show: "Öğretmen katılmadı",
  cancelled: "İptal edildi",
  technical_failure: "Teknik sorun",
};

/** The student's confirmed koçluk session list — reschedule entry point
 * for each upcoming, still-editable session. */
export function CoachingSessionList() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["coaching-sessions"],
    queryFn: fetchCoachingSessions,
  });

  if (isLoading) {
    return <CoachingLoadingState rows={3} />;
  }

  if (sessions.length === 0) {
    return (
      <CoachingEmptyState
        icon={CalendarBlank}
        title="Henüz görüşmen oluşturulmadı"
        description="Düzenli koçluk saatlerin onaylandığında planlanan görüşmeler burada görünür."
        steps={["Koçluk saatin belirlenir", "Görüşme takvimine eklenir"]}
      />
    );
  }

  const now = Date.now();

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isFuture = new Date(session.scheduled_start).getTime() > now;
        const canReschedule = isFuture && session.status === "scheduled";
        return (
          <Card key={session.id} className="text-ink">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-body font-medium tabular-nums">
                  {session.sequence_number}. görüşme ·{" "}
                  {new Date(session.scheduled_start).toLocaleString("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <Badge
                  variant="outline"
                  className="mt-2 border-line bg-transparent text-ink"
                >
                  {STATUS_LABEL[session.status] ?? session.status}
                </Badge>
                {session.report_overdue && session.report_due_at ? (
                  <p className="mt-2 text-small text-error">
                    Görüşme raporu gecikti. Son zaman:{" "}
                    {new Date(session.report_due_at).toLocaleString("tr-TR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                ) : null}
                {session.complaint_eligible ? (
                  <Link
                    href="/support"
                    className="mt-2 inline-block text-small font-medium text-pink underline underline-offset-4"
                  >
                    Eksik rapor için desteğe başvur
                  </Link>
                ) : null}
                {!session.complaint_eligible &&
                session.complaint_eligible_at ? (
                  <p className="mt-2 text-small text-ink-mid">
                    Eksik rapor desteği{" "}
                    {new Date(session.complaint_eligible_at).toLocaleString(
                      "tr-TR",
                      { dateStyle: "medium", timeStyle: "short" },
                    )}{" "}
                    itibarıyla kullanılabilir.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {JOINABLE_STATUSES.has(session.status) && (
                  <Button size="sm" asChild>
                    <Link href={`/session/coaching/${session.id}`}>Katıl</Link>
                  </Button>
                )}
                {canReschedule ? <RescheduleDialog session={session} /> : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

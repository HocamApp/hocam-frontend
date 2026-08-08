"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RescheduleDialog } from "@/components/coaching/RescheduleDialog";
import { fetchCoachingSessions } from "@/lib/coachingApi";

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
    return (
      <div className="flex min-h-[8rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Henüz görüşme oluşturulmadı.</p>
    );
  }

  const now = Date.now();

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isFuture = new Date(session.scheduled_start).getTime() > now;
        const canReschedule = isFuture && session.status === "scheduled";
        return (
          <Card key={session.id}>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">
                  {session.sequence_number}. görüşme ·{" "}
                  {new Date(session.scheduled_start).toLocaleString("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {STATUS_LABEL[session.status] ?? session.status}
                </Badge>
              </div>
              {canReschedule ? <RescheduleDialog session={session} /> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

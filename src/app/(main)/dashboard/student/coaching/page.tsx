"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, HelpCircle, ListTodo, MessageCircle, ShieldAlert } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchCoachingSchedulingState,
  fetchCoachingSessions,
} from "@/lib/coachingApi";

const SERVICE_STATUS_LABEL: Record<string, string> = {
  accepted_awaiting_schedule: "Saat seçimi bekleniyor",
  active: "Aktif",
  cancellation_pending: "İptal işleniyor",
  cancelled: "İptal edildi",
};

function OverviewContent() {
  const { data: state, isLoading: stateLoading } = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["coaching-sessions"],
    queryFn: fetchCoachingSessions,
    enabled: state?.service_status === "active",
  });

  if (stateLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!state) {
    return (
      <EmptyState
        title="Henüz bir çalışma koçluğun yok"
        description="Ders paketine koçluk ekleyip bundle talebin öğretmenin tarafından kabul edildikten sonra koçluk alanın burada açılır."
      />
    );
  }

  const nextSession = sessions?.find((s) => s.status === "scheduled" || s.status === "in_progress");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-2 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Çalışma Koçluğu</p>
            <Badge variant="secondary">
              {SERVICE_STATUS_LABEL[state.service_status] ?? state.service_status}
            </Badge>
          </div>
          {sessionsLoading ? (
            <LoadingSpinner />
          ) : nextSession ? (
            <p className="text-sm text-muted-foreground">
              Sonraki görüşme:{" "}
              {new Date(nextSession.scheduled_start).toLocaleString("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : state.service_status === "active" ? (
            <p className="text-sm text-muted-foreground">Yaklaşan görüşme yok.</p>
          ) : (
            <Link href="/dashboard/student/coaching/schedule" className="text-sm text-primary underline">
              Koçluk saatini seç
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/student/coaching/upcoming">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Yaklaşan Görüşmeler</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/student/coaching/program">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <ListTodo className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Programım</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/student/coaching/reports">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Raporlarım</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/messages">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Mesajlar</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/support">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <HelpCircle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Destek</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/student/coaching/complaints">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Koçluk Başvurularım</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default function StudentCoachingOverviewPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell title="Çalışma koçluğum" description="Koçluk görüşmelerini, programını, raporlarını ve hizmet durumunu tek yerden takip et." parentHref="/dashboard/student" parentLabel="Öğrenci paneli" eyebrow="Çalışma koçluğu" width="narrow"><OverviewContent /></CoachingPageShell>
    </RouteGuard>
  );
}

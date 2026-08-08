"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, HelpCircle, ListTodo, MessageCircle } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
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
        description="Bir öğretmenin koçluk teklifini kabul ettiğinde burada göreceksin."
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
        <Card className="opacity-60">
          <CardContent className="flex items-center gap-3 py-4">
            <ListTodo className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Programım</span>
              <p className="text-xs text-muted-foreground">Yakında</p>
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardContent className="flex items-center gap-3 py-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Raporlarım</span>
              <p className="text-xs text-muted-foreground">Yakında</p>
            </div>
          </CardContent>
        </Card>
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
      </div>
    </div>
  );
}

export default function StudentCoachingOverviewPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Koçluk</h1>
        <OverviewContent />
      </div>
    </RouteGuard>
  );
}

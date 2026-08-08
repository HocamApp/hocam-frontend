"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COACHING_DAY_LABEL, fetchCoachingStudents } from "@/lib/coachingApi";

const SERVICE_STATUS_LABEL: Record<string, string> = {
  accepted_awaiting_schedule: "Saat seçimi bekleniyor",
  active: "Aktif",
  cancellation_pending: "İptal işleniyor",
};

function StudentsContent() {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["coaching-tutor-students"],
    queryFn: fetchCoachingStudents,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        title="Henüz koçluk öğrencin yok"
        description="Bir öğrenci koçluk talebini kabul edip ödemesi aktive olduğunda burada görünecek."
      />
    );
  }

  return (
    <div className="space-y-3">
      {students.map((row) => (
        <Card key={row.purchase_id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{row.student_name}</p>
              <Badge variant="secondary">
                {SERVICE_STATUS_LABEL[row.service_status] ?? row.service_status}
              </Badge>
            </div>
            {row.recurring_slots.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {row.recurring_slots.map((slot) => (
                  <span
                    key={slot.id}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {COACHING_DAY_LABEL[slot.day_of_week]} {slot.start_time.slice(0, 5)}
                    {slot.source === "tutor_proposal" ? " · özel saat" : ""}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Öğrenci henüz saat seçmedi.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CoachingStudentsPage() {
  return (
    <CoachingGuard>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Koçluk Öğrencilerim</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Aktif koçluk öğrencilerin ve düzenli saatleri.
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <Link href="/dashboard/tutor/coaching/time-requests" className="underline">
              Saat talepleri
            </Link>
            <Link href="/dashboard/tutor/coaching/reschedule-requests" className="underline">
              Değişiklik talepleri
            </Link>
          </div>
        </div>
        <div className="mt-6">
          <StudentsContent />
        </div>
      </div>
    </CoachingGuard>
  );
}

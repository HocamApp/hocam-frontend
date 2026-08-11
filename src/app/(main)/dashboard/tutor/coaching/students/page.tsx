"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { COACHING_DAY_LABEL, fetchCoachingStudents, terminateTutorCoaching } from "@/lib/coachingApi";

const SERVICE_STATUS_LABEL: Record<string, string> = {
  accepted_awaiting_schedule: "Saat seçimi bekleniyor",
  active: "Aktif",
  cancellation_pending: "İptal işleniyor",
};

function StudentsContent() {
  const client = useQueryClient();
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["coaching-tutor-students"],
    queryFn: fetchCoachingStudents,
  });
  const [terminationFor, setTerminationFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const terminate = useMutation({
    mutationFn: (purchaseId: string) => terminateTutorCoaching(purchaseId, reason),
    onSuccess: () => {
      setTerminationFor(null);
      setReason("");
      client.invalidateQueries({ queryKey: ["coaching-tutor-students"] });
      client.invalidateQueries({ queryKey: ["coaching-tutor-sessions"] });
      client.invalidateQueries({ queryKey: ["coaching-disputes", "tutor"] });
    },
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
            {row.service_period_id ? (
              <Link
                href={`/dashboard/tutor/coaching/service-periods/${row.service_period_id}/program`}
                className="inline-block text-sm font-medium text-primary underline"
              >
                Programı yönet
              </Link>
            ) : null}
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
            {terminationFor === row.purchase_id ? (
              <div className="space-y-2 rounded border p-3">
                <p className="text-sm font-medium">Koçluğun tamamını sonlandırma</p>
                <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Gerekli gerekçe" />
                <div className="flex gap-2"><Button size="sm" variant="destructive" disabled={!reason.trim() || terminate.isPending} onClick={() => terminate.mutate(row.purchase_id)}>Sonlandırmayı kaydet</Button><Button size="sm" variant="ghost" onClick={() => setTerminationFor(null)}>Vazgeç</Button></div>
                {terminate.error ? <p className="text-xs text-destructive">İşlem güncel koçluk durumuyla çakıştı; sayfayı yenileyip tekrar dene.</p> : null}
              </div>
            ) : <Button size="sm" variant="outline" onClick={() => setTerminationFor(row.purchase_id)}>Koçluğu sonlandır</Button>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CoachingStudentsPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell title="Koçluk öğrencilerim" description="Aktif öğrencilerin hizmet durumunu, düzenli koçluk saatlerini ve çalışma programlarını yönet." parentHref="/dashboard/tutor/coaching" parentLabel="Koçluk ana sayfası" eyebrow="Öğrenciler" width="narrow" actions={<div className="flex flex-wrap gap-3 text-sm"><Link href="/dashboard/tutor/coaching/time-requests" className="underline">Saat talepleri</Link><Link href="/dashboard/tutor/coaching/reschedule-requests" className="underline">Değişiklik talepleri</Link></div>}><StudentsContent /></CoachingPageShell>
    </CoachingRecordGuard>
  );
}

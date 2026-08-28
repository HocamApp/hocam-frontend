"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarBlank,
  CaretRight,
  ChatsCircle,
  ClipboardText,
  GraduationCap,
  ListChecks,
  Question,
  ShieldCheck,
} from "@phosphor-icons/react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingSectionHeading } from "@/components/coaching/CoachingSectionHeading";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  coachingServiceStatusLabel,
  fetchCoachingSchedulingState,
  fetchCoachingSessions,
} from "@/lib/coachingApi";

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
    return <CoachingLoadingState rows={3} />;
  }

  if (!state) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Henüz bir çalışma koçluğun yok"
        description="Ders paketine çalışma koçluğu eklediğin talep öğretmenin tarafından kabul edildikten sonra koçluk alanın burada açılır."
        steps={[
          "Ders paketi ve koçluk talebin kabul edilir",
          "Ödemen aktive olduğunda koçluk alanın açılır",
        ]}
      />
    );
  }

  const nextSession = sessions?.find(
    (s) => s.status === "scheduled" || s.status === "in_progress",
  );

  return (
    <div className="space-y-6">
      <Card className="text-ink">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-label font-medium uppercase tracking-[0.08em] text-ink-mid">
                Hizmet durumu
              </p>
              <p className="mt-2 text-[1.375rem] font-medium tracking-[-0.01em]">
                Çalışma koçluğu
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit border-line bg-transparent px-3 py-1 text-ink"
            >
              {coachingServiceStatusLabel(state.service_status)}
            </Badge>
          </div>
          <div className="mt-6 border-t border-line pt-5">
            {sessionsLoading ? (
              <div className="h-5 w-64 animate-pulse rounded-input bg-[var(--skeleton)]" />
            ) : nextSession ? (
              <p className="text-body text-ink-mid tabular-nums">
                Sonraki görüşme:{" "}
                {new Date(nextSession.scheduled_start).toLocaleString("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : state.service_status === "active" ? (
              <p className="text-body text-ink-mid">Yaklaşan görüşmen yok.</p>
            ) : state.service_status === "accepted_awaiting_payment" ? (
              <p className="max-w-2xl text-body leading-[1.6] text-ink-mid">
                Öğretmenin koçluk talebini kabul etti. Ödeme doğrulandıktan
                sonra görüşme saatini seçebilirsin.
              </p>
            ) : (
              <Link
                href="/dashboard/student/coaching/schedule"
                className="text-body font-medium text-pink underline underline-offset-4"
              >
                Koçluk saatini seç
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <CoachingSectionHeading>Koçluk alanların</CoachingSectionHeading>

      <div className="grid overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-2">
        {[
          {
            href: "/dashboard/student/coaching/upcoming",
            label: "Yaklaşan görüşmeler",
            icon: CalendarBlank,
          },
          {
            href: "/dashboard/student/coaching/program",
            label: "Programım",
            icon: ListChecks,
          },
          {
            href: "/dashboard/student/coaching/reports",
            label: "Raporlarım",
            icon: ClipboardText,
          },
          { href: "/messages", label: "Mesajlar", icon: ChatsCircle },
          { href: "/support", label: "Destek", icon: Question },
          {
            href: "/dashboard/student/coaching/complaints",
            label: "Koçluk başvurularım",
            icon: ShieldCheck,
          },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-16 items-center gap-3 border-b border-line px-5 py-4 text-ink transition-colors duration-[--duration-state] last:border-b-0 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
          >
            <Icon
              className="h-5 w-5 shrink-0"
              weight="regular"
              aria-hidden="true"
            />
            <span className="text-body font-medium">{label}</span>
            <CaretRight
              className="ml-auto h-4 w-4 text-ink-mid group-hover:text-ink"
              weight="regular"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function StudentCoachingOverviewPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Çalışma koçluğum"
        description="Koçluk görüşmelerini, programını, raporlarını ve hizmet durumunu tek yerden takip et."
        parentHref="/dashboard/student"
        parentLabel="Öğrenci paneli"
        eyebrow="Çalışma koçluğu"
        width="narrow"
        currentHref="/dashboard/student/coaching"
        audience="student"
      >
        <OverviewContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}

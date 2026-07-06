"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, Video } from "lucide-react";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { fetchCalendar } from "@/lib/profileLessonsApi";
import { formatDate } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CalendarContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-calendar"],
    queryFn: fetchCalendar,
  });

  const sortedEvents = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      ),
    [data]
  );

  const groups = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of sortedEvents) {
      const key = formatDate(event.start);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [sortedEvents]);

  const nextEvent = sortedEvents[0];

  return (
    <ProfileScreen
      title="Ders takvimi"
      description="Onaylanmış derslerinin takvim görünümü."
    >
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <ErrorMessage message="Takvim yüklenemedi. Lütfen tekrar deneyin." />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Takvimin boş"
          description="Onaylanmış yaklaşan dersin bulunmuyor."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                Toplam ders
              </p>
              <p className="mt-1 text-2xl font-semibold">{sortedEvents.length}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Takvim günü
              </p>
              <p className="mt-1 text-2xl font-semibold">{groups.length}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Sıradaki
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {nextEvent
                  ? `${formatDate(nextEvent.start)} · ${formatTime(nextEvent.start)}`
                  : "-"}
              </p>
            </div>
          </div>

          {groups.map(([date, events]) => (
            <div key={date}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {date}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {events.length} ders
                </span>
              </div>
              <div className="space-y-3">
                {events.map((event) => (
                  <LessonItemCard
                    key={event.id}
                    subject={event.subject}
                    participantName={event.participant_name}
                    participantRole={event.participant_role}
                    startTime={event.start}
                    endTime={event.end}
                    status={event.status}
                    actions={
                      event.room_url ? (
                        <Button asChild size="sm">
                          <a href={`/session/${event.id}`}>
                            <Video className="mr-2 h-4 w-4" />
                            Derse Katıl
                          </a>
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ProfileScreen>
  );
}

export default function CalendarPage() {
  return (
    <RouteGuard requireAuth>
      <CalendarContent />
    </RouteGuard>
  );
}

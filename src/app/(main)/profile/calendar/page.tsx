"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Video } from "lucide-react";
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

function CalendarContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-calendar"],
    queryFn: fetchCalendar,
  });

  const groups = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of data ?? []) {
      const key = formatDate(event.start);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [data]);

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
          {groups.map(([date, events]) => (
            <div key={date}>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                {date}
              </h2>
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
                          <a href={event.room_url} target="_blank" rel="noreferrer">
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

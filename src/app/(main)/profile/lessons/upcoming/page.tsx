"use client";

import { useQuery } from "@tanstack/react-query";
import { Video } from "lucide-react";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { fetchUpcomingLessons } from "@/lib/profileLessonsApi";

function UpcomingLessonsContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-upcoming-lessons"],
    queryFn: fetchUpcomingLessons,
  });

  return (
    <ProfileScreen
      title="Yaklaşan dersler"
      description="Onaylanmış, yaklaşan derslerin."
    >
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <ErrorMessage message="Dersler yüklenemedi. Lütfen tekrar deneyin." />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Yaklaşan ders yok"
          description="Onaylanmış yaklaşan dersin bulunmuyor."
        />
      ) : (
        <div className="space-y-3">
          {data.map((lesson) => (
            <LessonItemCard
              key={lesson.id}
              subject={lesson.subject}
              participantName={lesson.participant_name}
              participantRole={lesson.participant_role}
              startTime={lesson.start_time}
              endTime={lesson.end_time}
              status={lesson.status}
              price={lesson.price}
              actions={
                lesson.can_join ? (
                  <Button asChild size="sm">
                    <a href={`/session/${lesson.id}`}>
                      <Video className="mr-2 h-4 w-4" />
                      Derse Katıl
                    </a>
                  </Button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </ProfileScreen>
  );
}

export default function UpcomingLessonsPage() {
  return (
    <RouteGuard requireAuth>
      <UpcomingLessonsContent />
    </RouteGuard>
  );
}

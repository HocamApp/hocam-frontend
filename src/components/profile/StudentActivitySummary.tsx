"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Star, Video } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { ProfileMenuRow } from "@/components/profile/ProfileMenuRow";
import { fetchUpcomingLessons } from "@/lib/profileLessonsApi";

interface StudentActivitySummaryProps {
  pendingReviewsCount: number;
  pendingBookingsCount: number;
}

export function StudentActivitySummary({
  pendingReviewsCount,
  pendingBookingsCount,
}: StudentActivitySummaryProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-upcoming-lessons"],
    queryFn: fetchUpcomingLessons,
  });

  const nextLesson = data?.[0];
  const hasMore = (data?.length ?? 0) > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Yaklaşan ders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Dersler yüklenemedi. Lütfen tekrar deneyin.
          </p>
        ) : !nextLesson ? (
          <EmptyState
            title="Henüz yaklaşan dersiniz yok"
            description="Yeni bir ders planlamak için hoca listesine göz atabilirsiniz."
            action={
              <Button asChild size="sm">
                <Link href="/tutors">Hoca bul</Link>
              </Button>
            }
          />
        ) : (
          <>
            <LessonItemCard
              subject={nextLesson.subject}
              participantName={nextLesson.participant_name}
              participantRole={nextLesson.participant_role}
              startTime={nextLesson.start_time}
              endTime={nextLesson.end_time}
              status={nextLesson.status}
              price={nextLesson.price}
              actions={
                nextLesson.can_join ? (
                  <Button asChild size="sm">
                    <a href={`/session/${nextLesson.id}`}>
                      <Video className="mr-2 h-4 w-4" />
                      Derse Katıl
                    </a>
                  </Button>
                ) : undefined
              }
            />
            {hasMore && (
              <Link
                href="/profile/lessons/upcoming"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                Tümünü gör
              </Link>
            )}
          </>
        )}

        {(pendingReviewsCount > 0 || pendingBookingsCount > 0) && (
          <div className="space-y-1 border-t border-border pt-2">
            {pendingReviewsCount > 0 && (
              <ProfileMenuRow
                icon={<Star className="h-4 w-4" />}
                label={`${pendingReviewsCount} değerlendirme bekliyor`}
                showChevron
                onClick={() => router.push("/profile/reviews/pending")}
              />
            )}
            {pendingBookingsCount > 0 && (
              <ProfileMenuRow
                icon={<CalendarClock className="h-4 w-4" />}
                label={`${pendingBookingsCount} rezervasyon onay bekliyor`}
                showChevron
                onClick={() => router.push("/profile/reservations/pending")}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

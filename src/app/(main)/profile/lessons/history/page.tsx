"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Star } from "lucide-react";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { fetchPastLessons } from "@/lib/profileLessonsApi";
import { useAuth } from "@/hooks/useAuth";

function PastLessonsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-past-lessons"],
    queryFn: fetchPastLessons,
    enabled: user?.role !== "student",
  });

  useEffect(() => {
    if (user?.role === "student") {
      router.replace("/profile/lessons?tab=history");
    }
  }, [router, user?.role]);

  if (user?.role === "student") {
    return <div className="py-12"><LoadingSpinner /></div>;
  }

  return (
    <ProfileScreen title="Geçmiş dersler" description="Tamamlanan ve geçmiş derslerin.">
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <ErrorMessage message="Geçmiş dersler yüklenemedi. Lütfen tekrar deneyin." />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Geçmiş ders yok"
          description="Henüz tamamlanmış bir dersin bulunmuyor."
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
              meta={
                lesson.has_review ? (
                  <p className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Değerlendirildi
                  </p>
                ) : undefined
              }
              actions={
                lesson.can_review ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/profile/reviews/pending">
                      <Star className="mr-1.5 h-4 w-4" />
                      Değerlendir
                    </Link>
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

export default function PastLessonsPage() {
  return (
    <RouteGuard requireAuth>
      <PastLessonsContent />
    </RouteGuard>
  );
}

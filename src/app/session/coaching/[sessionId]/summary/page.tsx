"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, LifeBuoy, Star } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachingIncidentActions } from "@/components/coaching/CoachingIncidentActions";
import { CoachingSessionRatingForm } from "@/components/coaching/CoachingSessionRatingForm";
import {
  fetchCoachingSessionDetail,
  submitCoachingSessionRating,
  extractCoachingErrorMessage,
  type CoachingSessionRatingScores,
} from "@/lib/coachingApi";

/**
 * Master Spec §24 — the exact five post-session options: "Görüşmeyi
 * değerlendir · Teknik sorun bildir · Öğretmen katılmadı bildir · Sonraki
 * görüşmeyi görüntüle · Koçluk desteğine git." Student-only: rating and
 * "tutor didn't show" reporting are both student actions.
 */
function RatingCard({ sessionId }: { sessionId: string }) {
  const [submitted, setSubmitted] = useState(false);

  const ratingMutation = useMutation({
    mutationFn: ({ scores, comment }: { scores: CoachingSessionRatingScores; comment: string }) =>
      submitCoachingSessionRating(sessionId, scores, comment),
    onSuccess: () => {
      toast.success("Değerlendirmen kaydedildi.");
      setSubmitted(true);
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  if (submitted) {
    return (
      <p className="text-body text-ink-mid">
        Bu görüşme için değerlendirmen alındı, teşekkürler.
      </p>
    );
  }

  return (
    <CoachingSessionRatingForm
      isPending={ratingMutation.isPending}
      onSubmit={(scores, comment) => ratingMutation.mutate({ scores, comment })}
    />
  );
}

function PostSessionContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["coaching-session-detail", sessionId],
    queryFn: () => fetchCoachingSessionDetail(sessionId),
    enabled: user?.role !== "tutor",
  });

  const isTutor = user?.role === "tutor";
  // Redirect from an effect: calling router.replace during render is a
  // side effect React may run twice or warn about.
  useEffect(() => {
    if (isTutor) router.replace("/dashboard/tutor");
  }, [isTutor, router]);

  if (isTutor) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (isError || !detail) {
    return <ErrorMessage message={extractCoachingErrorMessage(error)} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Görüşme tamamlandı</h1>
        <p className="text-sm text-muted-foreground">
          {detail.tutor_name} ile görüşmen sona erdi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-4 w-4" /> Görüşmeyi değerlendir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RatingCard sessionId={sessionId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teknik sorun mu vardı ya da öğretmen gelmedi mi?</CardTitle>
        </CardHeader>
        <CardContent>
          <CoachingIncidentActions sessionId={sessionId} viewerRole="student" />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/dashboard/student/coaching/upcoming">
            <CalendarClock className="mr-2 h-4 w-4" aria-hidden="true" /> Sonraki görüşmeyi görüntüle
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link href="/dashboard/student/coaching/complaints">
            <LifeBuoy className="mr-2 h-4 w-4" aria-hidden="true" /> Koçluk desteğine git
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function CoachingPostSessionPage() {
  return (
    <RouteGuard requireAuth>
      <PostSessionContent />
    </RouteGuard>
  );
}

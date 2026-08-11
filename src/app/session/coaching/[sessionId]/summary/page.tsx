"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CoachingIncidentActions } from "@/components/coaching/CoachingIncidentActions";
import {
  RATING_CRITERIA,
  RATING_CRITERIA_LABELS,
  fetchCoachingSessionDetail,
  submitCoachingSessionRating,
  extractCoachingErrorMessage,
  type CoachingRatingCriterion,
  type CoachingSessionRatingScores,
} from "@/lib/coachingApi";

const DEFAULT_SCORES: CoachingSessionRatingScores = RATING_CRITERIA.reduce(
  (acc, key) => ({ ...acc, [key]: 3 }),
  {} as CoachingSessionRatingScores
);

/**
 * Master Spec §24 — the exact five post-session options: "Görüşmeyi
 * değerlendir · Teknik sorun bildir · Öğretmen katılmadı bildir · Sonraki
 * görüşmeyi görüntüle · Koçluk desteğine git." Student-only: rating and
 * "tutor didn't show" reporting are both student actions.
 */
function RatingCard({ sessionId }: { sessionId: string }) {
  const [scores, setScores] = useState<CoachingSessionRatingScores>(DEFAULT_SCORES);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const ratingMutation = useMutation({
    mutationFn: () => submitCoachingSessionRating(sessionId, scores, comment),
    onSuccess: () => {
      toast.success("Değerlendirmen kaydedildi.");
      setSubmitted(true);
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu görüşme için değerlendirmen alındı, teşekkürler.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {RATING_CRITERIA.map((criterion: CoachingRatingCriterion) => (
        <div key={criterion} className="flex items-center justify-between gap-3">
          <p className="text-sm">{RATING_CRITERIA_LABELS[criterion]}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${RATING_CRITERIA_LABELS[criterion]}: ${value}`}
                onClick={() => setScores((current) => ({ ...current, [criterion]: value }))}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                  scores[criterion] >= value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input text-muted-foreground"
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Herkese açık yorum (opsiyonel — yalnız uygun dönemlerde yayınlanır)"
        aria-label="Herkese açık yorum"
      />
      <Button disabled={ratingMutation.isPending} onClick={() => ratingMutation.mutate()}>
        Değerlendirmeyi gönder
      </Button>
    </div>
  );
}

function PostSessionContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["coaching-session-detail", sessionId],
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });

  if (user?.role === "tutor") {
    router.replace("/dashboard/tutor");
    return null;
  }

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
        <Link href="/dashboard/student/coaching/upcoming">
          <Button variant="outline" className="w-full justify-start">
            <CalendarClock className="mr-2 h-4 w-4" /> Sonraki görüşmeyi görüntüle
          </Button>
        </Link>
        <Link href="/dashboard/student/coaching/complaints">
          <Button variant="outline" className="w-full justify-start">
            <LifeBuoy className="mr-2 h-4 w-4" /> Koçluk desteğine git
          </Button>
        </Link>
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

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { fetchPendingReviews } from "@/lib/profileLessonsApi";
import type { PendingReviewItem } from "@/types";

function PendingReviewsContent() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PendingReviewItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile-pending-reviews"],
    queryFn: fetchPendingReviews,
  });

  return (
    <ProfileScreen
      title="Değerlendirme bekleyenler"
      description="Tamamlanan derslerini değerlendirebilirsin."
    >
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <ErrorMessage message="Değerlendirmeler yüklenemedi. Lütfen tekrar deneyin." />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Değerlendirme bekleyen ders yok"
          description="Değerlendirebileceğin tamamlanmış bir ders bulunmuyor."
        />
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <LessonItemCard
              key={item.id}
              subject={item.subject}
              participantName={item.participant_name}
              participantRole="tutor"
              startTime={item.completed_at}
              price={item.price}
              actions={
                <Button size="sm" onClick={() => setSelected(item)}>
                  <Star className="mr-1.5 h-4 w-4" />
                  Değerlendir
                </Button>
              }
            />
          ))}
        </div>
      )}

      {selected && (
        <ReviewModal
          booking={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            toast.success("Değerlendirmen gönderildi.");
            setSelected(null);
            queryClient.invalidateQueries({ queryKey: ["profile-pending-reviews"] });
            queryClient.invalidateQueries({ queryKey: ["profile-me"] });
          }}
        />
      )}
    </ProfileScreen>
  );
}

export default function PendingReviewsPage() {
  return (
    <RouteGuard requireAuth>
      <PendingReviewsContent />
    </RouteGuard>
  );
}

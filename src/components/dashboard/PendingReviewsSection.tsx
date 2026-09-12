"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { fetchPendingReviews } from "@/lib/profileLessonsApi";
import { bookingDateLabel } from "@/lib/bookingTime";
import type { PendingReviewItem } from "@/types";

/**
 * Lessons the student finished and never rated.
 *
 * The dashboard never asked. The prompt existed only inside the lessons
 * workspace, behind the settings menu, so a review depended on someone going
 * looking for the place to leave one — and reviews are how the next student
 * picks a tutor. This is a section of its own rather than a row inside the
 * confirm/dispute card: those are deadlines, this is a favour, and mixing them
 * makes the deadlines look optional.
 *
 * There is no post-lesson popup, deliberately. Interrupting someone the moment
 * a lesson ends is the loudest possible ask and the easiest to dismiss.
 */
export function PendingReviewsSection() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PendingReviewItem | null>(null);

  const { data } = useQuery({
    queryKey: ["profile-pending-reviews"],
    queryFn: fetchPendingReviews,
  });
  const pending = data ?? [];

  if (pending.length === 0) return null;

  return (
    <>
      <section
        aria-labelledby="pending-reviews-title"
        className="rounded-card border border-line bg-surface p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-input bg-ink text-white">
            <Star className="size-4" weight="regular" aria-hidden="true" />
          </span>
          <div>
            <p className="text-label text-ink-mid">Değerlendirme bekliyor</p>
            <h2 id="pending-reviews-title" className="text-h3-m text-ink">
              {pending.length === 1
                ? "Bir dersini henüz değerlendirmedin"
                : `${pending.length} dersini henüz değerlendirmedin`}
            </h2>
          </div>
        </div>
        <p className="text-small text-ink-mid">
          Değerlendirmen hocanın profilinde görünür ve senden sonraki öğrencinin
          seçimini kolaylaştırır.
        </p>
        <ol className="mt-4 divide-y divide-line border-t border-line">
          {pending.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-4">
              <ParticipantAvatar
                name={item.participant_name}
                avatarUrl={item.tutor?.profile_picture}
                className="h-10 w-10 shrink-0 border border-line"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-ink">
                  {item.subject.name}
                </p>
                <p className="mt-0.5 truncate text-small text-ink-mid">
                  {item.participant_name} · {bookingDateLabel(item.start_time)}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => setSelected(item)}
              >
                Değerlendir
              </Button>
            </li>
          ))}
        </ol>
      </section>

      {selected && (
        <ReviewModal
          booking={selected}
          isOpen
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
            void queryClient.invalidateQueries({
              queryKey: ["profile-pending-reviews"],
            });
            void queryClient.invalidateQueries({ queryKey: ["bookings"] });
          }}
        />
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, Check, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/tutors/FavoriteButton";
import { VerifiedTutorMark } from "@/components/tutors/VerifiedTutorMark";
import { trackHocaBul } from "@/lib/hocaBulAnalytics";
import { caveatTexts, reasonTexts } from "@/lib/hocaBulResults";
import { formatLessonCount, formatPrice, formatRating } from "@/lib/utils";
import type { TutorMatchResult } from "@/types";
import { recordDiscoveryEvent } from "@/lib/discovery";
import { hideTutorRecommendation } from "@/lib/matchingApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RecommendationControlReason } from "@/types";

interface HocaBulResultCardProps {
  match: TutorMatchResult;
  position: number;
  isFavorite: boolean;
  favoritePending: boolean;
  onToggleFavorite: (tutorId: string) => void;
  discoveryImpressionId?: string | null;
  onHidden?: (tutorId: string) => void;
}

function initials(name: string, surname: string): string {
  return `${name.trim()[0] ?? ""}${surname.trim()[0] ?? ""}`.toLocaleUpperCase("tr-TR") || "?";
}

function formatAvailability(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function HocaBulResultCard({
  match,
  position,
  isFavorite,
  favoritePending,
  onToggleFavorite,
  discoveryImpressionId,
  onHidden,
}: HocaBulResultCardProps) {
  const [hideOpen, setHideOpen] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const queryClient = useQueryClient();
  const { tutor } = match;
  const href = `/tutors/${tutor.id}${discoveryImpressionId ? `?discovery_impression_id=${encodeURIComponent(discoveryImpressionId)}` : ""}`;
  const availability = match.nearest_available_at
    ? formatAvailability(match.nearest_available_at)
    : null;
  const reasons = reasonTexts(match);
  const caveats = caveatTexts(match);

  function trackOpen() {
    trackHocaBul({
      event: "hoca_bul_result_opened",
      tutor_id: tutor.id,
      position,
      match_level: match.match_level,
    });
  }

  async function hide(reason: RecommendationControlReason) {
    setIsHiding(true);
    try {
      await hideTutorRecommendation(tutor.id, reason);
      setHideOpen(false);
      onHidden?.(tutor.id);
      await queryClient.invalidateQueries({ queryKey: ["recommendation-controls"] });
      toast.success("Bu öneri sana tekrar gösterilmeyecek.");
    } catch {
      toast.error("Öneri gizlenemedi.");
    } finally {
      setIsHiding(false);
    }
  }

  return (
    <>
    <article
      aria-label={`${tutor.name} ${tutor.surname}`}
      data-discovery-tutor-id={discoveryImpressionId ? tutor.id : undefined}
      data-discovery-impression-id={discoveryImpressionId || undefined}
    >
      <Card className="overflow-hidden border-border/70 bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex min-w-0 gap-4">
            <Avatar className="h-16 w-16 shrink-0 sm:h-20 sm:w-20">
              <AvatarImage src={tutor.profile_picture || undefined} alt={`${tutor.name} ${tutor.surname}`} />
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials(tutor.name, tutor.surname)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1">
                    <h2 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                      {tutor.name} {tutor.surname}
                    </h2>
                    <VerifiedTutorMark verified={tutor.is_verified} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {tutor.university} · {tutor.department}
                  </p>
                </div>
                <FavoriteButton
                  tutorId={tutor.id}
                  isFavorite={isFavorite}
                  isPending={favoritePending}
                  onToggle={(tutorId) => {
                    void recordDiscoveryEvent(
                      discoveryImpressionId, tutorId,
                      isFavorite ? "favorite_removed" : "favorite_added"
                    );
                    onToggleFavorite(tutorId);
                  }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {tutor.total_reviews > 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                    {formatRating(tutor.rating)}
                    <span className="font-normal text-muted-foreground">({tutor.total_reviews} değerlendirme)</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Henüz değerlendirme yok</span>
                )}
                <span className="text-muted-foreground">· {formatLessonCount(tutor.completed_lessons_count ?? 0)} ders</span>
              </div>
            </div>
          </div>

          {reasons.length > 0 && (
            <div className="mt-5 rounded-xl bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">Neden önerdik?</p>
              <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {availability && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              En yakın müsaitlik: {availability}
            </p>
          )}

          {caveats.map((caveat) => (
            <p key={caveat} className="mt-3 flex gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{caveat}</span>
            </p>
          ))}

          <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="text-xl font-semibold">{formatPrice(tutor.hourly_price)}</span>
              <span className="ml-1 text-sm text-muted-foreground">/40 dk</span>
            </p>
            <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => setHideOpen(true)}>
              <X className="mr-1.5 h-4 w-4" />Bana uygun değil
            </Button>
            <Link
              href={href}
              aria-label={`${tutor.name} ${tutor.surname} profilini gör`}
              onClick={trackOpen}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Profili gör
            </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </article>
    <Dialog open={hideOpen} onOpenChange={setHideOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Bu öneri neden uygun değil?</DialogTitle><DialogDescription>Yanıtın yalnızca senin sonuçlarını düzeltir; hocanın genel puanını etkilemez.</DialogDescription></DialogHeader>
        <div className="grid gap-2">
          {([
            ["price", "Bütçeme uymuyor"], ["schedule", "Saatleri uymuyor"],
            ["teaching_style", "Anlatım tarzı bana uygun değil"],
            ["exam_experience", "Aradığım sınav deneyimi değil"],
            ["not_relevant", "İhtiyacıma uygun değil"], ["do_not_show", "Bir daha gösterme"],
          ] as Array<[RecommendationControlReason, string]>).map(([value, label]) => (
            <Button key={value} variant="outline" className="justify-start" disabled={isHiding} onClick={() => void hide(value)}>{label}</Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

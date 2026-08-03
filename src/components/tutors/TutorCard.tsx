"use client";

import Link from "next/link";
import { ArrowRight, Award, Scale } from "lucide-react";
import { TutorProfile } from "@/types";
import { formatLessonCount, formatPrice, formatRating } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TutorPresenceBadge } from "@/components/tutors/TutorPresenceBadge";
import { FavoriteButton } from "@/components/tutors/FavoriteButton";
import { VerifiedTutorMark } from "@/components/tutors/VerifiedTutorMark";
import { recordDiscoveryEvent } from "@/lib/discovery";

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

function formatYksRank(rank: number): string {
  return rank.toLocaleString("tr-TR");
}

interface TutorCardProps {
  tutor: TutorProfile;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  favoritePending?: boolean;
  learningContext?: LearningContextQuery | null;
  discoveryImpressionId?: string | null;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  compareDisabled?: boolean;
}

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

function buildTutorHref(
  tutorId: string,
  learningContext?: LearningContextQuery | null,
  discoveryImpressionId?: string | null
): string {
  const params = new URLSearchParams();
  if (learningContext) {
    params.set("learning_goal_id", learningContext.learning_goal_id);
    params.set("learning_milestone_id", learningContext.learning_milestone_id);
  }

  if (learningContext?.learning_topic_id) {
    params.set("learning_topic_id", learningContext.learning_topic_id);
  }
  if (discoveryImpressionId) params.set("discovery_impression_id", discoveryImpressionId);
  const query = params.toString();
  return `/tutors/${tutorId}${query ? `?${query}` : ""}`;
}

export function TutorCard({
  tutor,
  isFavorite,
  onToggleFavorite,
  favoritePending,
  learningContext,
  discoveryImpressionId,
  isCompared,
  onToggleCompare,
  compareDisabled,
}: TutorCardProps) {
  const examOrder = ["TYT", "AYT", "YDT", "DGS", "KPSS"] as const;
  const orderedSubjectsWithDuplicates = examOrder.flatMap((exam) =>
    tutor.subjects.filter((s) => s.exam_type === exam)
  );
  const seenSubjectNames = new Set<string>();
  const orderedSubjects = orderedSubjectsWithDuplicates.filter((subject) => {
    const normalizedName = subject.name.trim().toLocaleLowerCase("tr-TR");
    if (seenSubjectNames.has(normalizedName)) return false;
    seenSubjectNames.add(normalizedName);
    return true;
  });
  const visibleSubjects = orderedSubjects.slice(0, 4);
  const remainingCount = orderedSubjects.length - 4;
  const tutorHref = buildTutorHref(tutor.id, learningContext, discoveryImpressionId);
  const completedLessonsLabel = `${formatLessonCount(tutor.completed_lessons_count ?? 0)} ders`;

  return (
    <Card
      data-discovery-tutor-id={discoveryImpressionId ? tutor.id : undefined}
      data-discovery-impression-id={discoveryImpressionId || undefined}
      className="relative h-full min-w-0 overflow-visible border-t-2 border-t-transparent transition-all duration-200 hover:z-10 hover:-translate-y-0.5 hover:border-t-primary hover:shadow-lg"
    >
      <CardContent className="p-0">
        <Link href={tutorHref} className="block cursor-pointer">
          <div className="flex gap-4 p-4">
            <div className="relative h-16 w-16 shrink-0">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={tutor.profile_picture || undefined}
                  alt={`${tutor.name} ${tutor.surname}`}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {getInitials(tutor.name, tutor.surname)}
                </AvatarFallback>
              </Avatar>
              {tutor.is_online && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" aria-label="Çevrim içi" />}
              <VerifiedTutorMark verified={tutor.is_verified} className="absolute -right-1 -top-1 rounded-full border-2 border-background" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1">
                <p className="min-w-0 truncate text-lg font-semibold">
                  {tutor.name} {tutor.surname}
                </p>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {tutor.university} · {tutor.department}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <TutorPresenceBadge
                  isOnline={tutor.is_online}
                  lastSeenAt={tutor.last_seen_at}
                />
                {tutor.yks_rank > 0 && (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                    <Award className="h-3 w-3" />
                    YKS Sıralaması: {formatYksRank(tutor.yks_rank)}
                  </span>
                )}
                {tutor.is_new_tutor && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Yeni hoca</span>
                )}
                {tutor.launch_program_available && (
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">Tanıtım programına açık</span>
                )}
                {tutor.is_bookable === true && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">Yeni öğrenci kabul ediyor</span>
                )}
                {tutor.is_bookable === false && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">Şu anda yeni öğrenci almıyor</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 px-4 pb-3">
            {visibleSubjects.map((sub, index) => (
              <Badge key={sub.id} variant={index === 0 ? "default" : "outline"} className="text-xs">
                {sub.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs text-muted-foreground">+{remainingCount} daha</span>
            )}
            {(tutor.teaching_attributes ?? []).slice(0, 2).map((attribute) => (
              <Badge key={attribute.code} variant="secondary" className="text-xs">
                {attribute.name}
              </Badge>
            ))}
          </div>
        </Link>

        <div className="border-t px-4 py-3">
          <Link href={tutorHref} className="block min-w-0 cursor-pointer">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1 text-sm">
              {tutor.total_reviews > 0 ? (
                <>
                  <span className="font-medium">★ {formatRating(tutor.rating)}</span>
                  <span className="text-muted-foreground">
                    ({tutor.total_reviews} değerlendirme)
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Henüz değerlendirme yok</span>
              )}
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{completedLessonsLabel}</span>
            </div>
          </Link>
          <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={tutorHref} className="min-w-0 sm:shrink-0">
              <span className="text-lg font-semibold">{formatPrice(tutor.hourly_price)}</span>
              <span className="ml-1 text-sm text-muted-foreground">/40 dk</span>
            </Link>
            <div className="flex w-full shrink-0 items-center gap-1 sm:w-auto">
              {onToggleCompare && (
                <button
                  type="button"
                  disabled={compareDisabled && !isCompared}
                  aria-pressed={isCompared}
                  aria-label={isCompared ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
                  title={compareDisabled && !isCompared ? "En fazla üç hoca karşılaştırılabilir" : undefined}
                  onClick={() => onToggleCompare(tutor.id)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isCompared ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <Scale className="h-4 w-4" />
                </button>
              )}
              <Link href={tutorHref} className="flex-1 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:flex-none">
                Profili Gör <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
              {onToggleFavorite && (
                <FavoriteButton
                  tutorId={tutor.id}
                  isFavorite={isFavorite ?? false}
                  isPending={favoritePending ?? false}
                  onToggle={(tutorId) => {
                    void recordDiscoveryEvent(
                      discoveryImpressionId, tutorId,
                      isFavorite ? "favorite_removed" : "favorite_added"
                    );
                    onToggleFavorite(tutorId);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

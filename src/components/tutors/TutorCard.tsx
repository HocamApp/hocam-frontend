"use client";

import Link from "next/link";
import { ArrowRight, TrendUp } from "@phosphor-icons/react";
import { TutorProfile } from "@/types";
import { RankMark } from "@/components/brand/marks";
import { cn, formatLessonCount, formatPrice, formatRating } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TutorPresenceBadge } from "@/components/tutors/TutorPresenceBadge";
import { FavoriteButton } from "@/components/tutors/FavoriteButton";
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
  /** "lg" is used by the main directory grid: a wider, photo-left row
   * (portrait photo, bio excerpt, price/rating/CTA column) instead of the
   * compact stacked card. Every other call site keeps the original size. */
  size?: "default" | "lg";
}

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

function buildTutorHref(
  tutorId: string,
  learningContext?: LearningContextQuery | null,
  discoveryImpressionId?: string | null,
  intent?: TutorHrefIntent | null
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
  if (intent) params.set("intent", intent);
  const query = params.toString();
  return `/tutors/${tutorId}${query ? `?${query}` : ""}`;
}

/** The profile page reads `?intent=trial` and decides real eligibility there. */
type TutorHrefIntent = "trial";

/** Preply shows "Booked 65 times recently". We have no booking-velocity field,
 *  so the line is derived from lesson/review volume and simply omitted when
 *  the tutor has not earned it — no filler copy. */
function tutorPopularityLabel(tutor: TutorProfile): string | null {
  const lessons = tutor.completed_lessons_count ?? 0;
  if (lessons >= 100) {
    return `Çok tercih ediliyor · ${formatLessonCount(lessons)} ders verdi`;
  }
  if (lessons >= 30) return "Öğrenciler arasında popüler";
  // Deliberately no "new tutor" fallback: today every tutor is under the
  // threshold, so it printed the same line on every card in the list — filler,
  // not signal. The line appears only once a tutor has earned it.
  return null;
}

/** Bios run from ~100 to ~600 characters. Trimmed in JS rather than with
 *  `line-clamp`, because a `-webkit-box` does not wrap around a float: it
 *  would pin the bio to the narrow strip beside the portrait and leave the
 *  space under it empty. Plain text flows beside the photo and then under it. */
function truncateBio(bio: string, maxLength = 260): string {
  const text = bio.trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?]$/, "")}…`;
}

function PresenceDot({ isOnline }: { isOnline: boolean }) {
  const label = isOnline ? "Çevrim içi" : "Çevrim dışı";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "absolute -bottom-1 -right-1 h-5 w-5 rounded-md border-2 border-background",
        isOnline ? "bg-[--success]" : "bg-line"
      )}
    />
  );
}

function useTutorCardData(tutor: TutorProfile) {
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
  const completedLessonsLabel = `${formatLessonCount(tutor.completed_lessons_count ?? 0)} ders`;
  return { visibleSubjects, remainingCount, completedLessonsLabel };
}

function StatusBadges({
  tutor,
  showPresence = true,
  showNewTutorBadge = true,
  showLaunchProgram = true,
  showBookable = true,
}: {
  tutor: TutorProfile;
  showPresence?: boolean;
  showNewTutorBadge?: boolean;
  showLaunchProgram?: boolean;
  showBookable?: boolean;
}) {
  return (
    <>
      {showPresence && (
        <TutorPresenceBadge isOnline={tutor.is_online} lastSeenAt={tutor.last_seen_at} />
      )}
      {/* Every badge below used to be a tint fill: a pale same-hue background
          under saturated same-hue text. That is the bg-x-100/text-x-700 shape
          that ships in every generated dashboard, and it was here five times
          over in four different hues. A badge now either has real contrast or
          it has no container at all.

          Gold carries the rank because rank is the achievement this product
          is built around. Gold is a surface and --gold-ink sits on it, never
          the other way round: #FFD100 as a text colour measures about 1.6:1. */}
      {tutor.yks_rank > 0 && (
        <span
          className="inline-flex w-fit items-center gap-1 rounded-[14px] bg-gold px-2 py-0.5 text-xs font-semibold tabular-nums text-gold-ink"
          title="YKS sıralaması"
          aria-label={`YKS sıralaması: ${formatYksRank(tutor.yks_rank)}`}
        >
          <RankMark className="h-3 w-3" />
          {formatYksRank(tutor.yks_rank)}
        </span>
      )}
      {showNewTutorBadge && tutor.is_new_tutor && (
        <span className="rounded-pill border border-line px-2 py-0.5 text-xs font-medium text-ink">
          Yeni hoca
        </span>
      )}
      {showLaunchProgram && tutor.launch_program_available && (
        <span className="rounded-pill border border-line px-2 py-0.5 text-xs font-medium text-ink">
          Tanıtım programına açık
        </span>
      )}
      {/* Availability is the one state worth a solid fill, because it is the
          thing that decides whether the rest of the card is actionable. */}
      {showBookable && tutor.is_bookable === true && (
        <span className="rounded-pill bg-[--success] px-2 py-0.5 text-xs font-medium text-white">
          Yeni öğrenci kabul ediyor
        </span>
      )}
      {showBookable && tutor.is_bookable === false && (
        <span className="text-xs font-medium text-ink-mid">Şu anda yeni öğrenci almıyor</span>
      )}
    </>
  );
}

export function TutorCard(props: TutorCardProps) {
  if (props.size === "lg") {
    return <TutorCardLarge {...props} />;
  }
  return <TutorCardDefault {...props} />;
}

function TutorCardDefault({
  tutor,
  isFavorite,
  onToggleFavorite,
  favoritePending,
  learningContext,
  discoveryImpressionId,
}: TutorCardProps) {
  const { visibleSubjects, remainingCount, completedLessonsLabel } = useTutorCardData(tutor);
  const tutorHref = buildTutorHref(tutor.id, learningContext, discoveryImpressionId);

  return (
    <Card
      data-discovery-tutor-id={discoveryImpressionId ? tutor.id : undefined}
      data-discovery-impression-id={discoveryImpressionId || undefined}
      /* Was a lift plus a shadow. A card sits in the document flow and does
         not float, so a shadow on it is a lie about its physics, and the lift
         needs its own prefers-reduced-motion escape hatch. The hairline going
         to ink says the same thing in 120ms and degrades to nothing. */
      className="relative h-full min-w-0 overflow-visible border-line transition-colors duration-[var(--duration-state)] hover:border-ink"
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
                <AvatarFallback className="bg-ink text-lg font-medium text-paper">
                  {getInitials(tutor.name, tutor.surname)}
                </AvatarFallback>
              </Avatar>
              {tutor.is_online && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-pill border-2 border-white bg-[--success]" aria-label="Çevrim içi" />}
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
                <StatusBadges tutor={tutor} />
              </div>
            </div>
          </div>

          {tutor.offers_coaching && (
            <div className="px-4 pb-2">
              <Badge variant="secondary" className="text-xs">
                {tutor.offers_free_coaching
                  ? "Ücretsiz çalışma koçluğu"
                  : "Çalışma koçluğu"}
              </Badge>
            </div>
          )}

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
          {/* min-h-6: the rating row is a link of its own, and a 14px line box
              is 20px tall — under WCAG 2.2's 24px target floor, which a card
              row does not get an exemption from. */}
          <Link href={tutorHref} className="block min-h-6 min-w-0 cursor-pointer">
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

// Photo-left / details-middle / price+CTA-right row. The information order
// follows the tutor-marketplace convention (identity -> trust line -> tags ->
// bio -> numbers -> CTA); below `sm` the three zones stack so it still holds up
// in the single mobile column.
function TutorCardLarge({
  tutor,
  isFavorite,
  onToggleFavorite,
  favoritePending,
  learningContext,
  discoveryImpressionId,
}: TutorCardProps) {
  const { visibleSubjects, remainingCount } = useTutorCardData(tutor);
  const tutorHref = buildTutorHref(tutor.id, learningContext, discoveryImpressionId);
  const trialHref = buildTutorHref(tutor.id, learningContext, discoveryImpressionId, "trial");

  // Both flags are tutor-global and present on the cached list response. Real
  // per-student trial eligibility (no prior booking with this tutor + monthly
  // quota) lives only on the uncached detail endpoint, so the card never
  // promises a *free* lesson — it just opens the flow, and
  // /tutors/[id] decides. `=== true` rather than `!== false`: a missing field
  // must hide the button, never reveal one the backend has not allowed.
  const showTrialCta = tutor.accepts_trial_lessons === true && tutor.is_bookable === true;

  const coachingLabel = tutor.offers_free_coaching
    ? "Ücretsiz koçluk"
    : tutor.offers_coaching
    ? "Koçluk"
    : null;

  const popularityLabel = tutorPopularityLabel(tutor);

  // Value-over-label stat columns. Anything the tutor has no data for drops
  // out rather than rendering a zero.
  const stats = [
    tutor.total_reviews > 0
      ? { value: `${formatRating(tutor.rating)} ★`, label: `${tutor.total_reviews} yorum` }
      : null,
    { value: formatLessonCount(tutor.completed_lessons_count ?? 0), label: "verilen ders" },
    tutor.yks_rank > 0
      ? { value: `İlk ${formatYksRank(tutor.yks_rank)}`, label: "YKS sıralaması", rank: true }
      : null,
  ].filter((stat): stat is { value: string; label: string; rank?: boolean } => stat !== null);

  return (
    <Card
      data-discovery-tutor-id={discoveryImpressionId ? tutor.id : undefined}
      data-discovery-impression-id={discoveryImpressionId || undefined}
      className="relative h-full min-w-0 overflow-visible border-line transition-colors duration-[var(--duration-state)] hover:border-ink sm:min-h-[320px]"
    >
      <CardContent className="flex h-full flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-6">
        <Link href={tutorHref} className="block min-w-0 flex-1 cursor-pointer">
          <div className="float-left mb-2 mr-4 h-28 w-28 sm:h-40 sm:w-40">
            <div className="relative h-full w-full">
              <Avatar className="h-full w-full rounded-xl">
                <AvatarImage
                  className="rounded-xl object-cover"
                  src={tutor.profile_picture || undefined}
                  alt={`${tutor.name} ${tutor.surname}`}
                />
                <AvatarFallback className="rounded-xl bg-ink text-3xl font-medium text-paper">
                  {getInitials(tutor.name, tutor.surname)}
                </AvatarFallback>
              </Avatar>
              <PresenceDot isOnline={tutor.is_online} />
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-xl font-semibold">
              {tutor.name} {tutor.surname}
            </p>
            {onToggleFavorite && (
              <FavoriteButton
                className="-mr-2 -mt-1.5"
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
          {/* Full school and department, wrapped rather than truncated — where
              the tutor studies is a primary trust signal here. */}
          <p className="mt-1 text-xs font-medium leading-5 text-foreground/80">
            {tutor.university} · {tutor.department}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {coachingLabel && (
              <Badge className="border-transparent bg-ink text-xs text-paper">
                {coachingLabel}
              </Badge>
            )}
            {visibleSubjects.map((sub) => (
              <Badge key={sub.id} variant="outline" className="text-xs">
                {sub.name}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <span className="self-center text-xs text-muted-foreground">
                +{remainingCount} daha
              </span>
            )}
          </div>
          {/* Clears the portrait so the tutor's own words start at the card's
              left edge and run the full width, rather than in the gutter. */}
          {tutor.bio && (
            <p className="clear-left pt-3 text-sm leading-6 text-foreground/90">
              {truncateBio(tutor.bio)}
            </p>
          )}
          {popularityLabel && (
            <p className="clear-left mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-300">
              <TrendUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{popularityLabel}</span>
            </p>
          )}
        </Link>

        {/* Deliberately not a boxed panel: a plain column separated by a rule,
            so price -> numbers -> CTA reads as one vertical flow. */}
        <div className="flex flex-col gap-3 border-t pt-4 sm:w-44 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <Link href={tutorHref} className="min-w-0 cursor-pointer">
            <p className="text-3xl font-bold leading-none">{formatPrice(tutor.hourly_price)}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">40 dk ders</p>
          </Link>

          {/* Stacked, not columnar: the rail is too narrow for three labels
              side by side and they truncated. Values carry the weight, labels
              stay quiet — the reader scans the numbers first. */}
          <dl className="space-y-1.5">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                {stat.rank ? (
                  /* Gold, and the only gold on the card. It is a surface with
                     --gold-ink on it, never a text colour: #FFD100 as type
                     measures about 1.6:1 on paper. 14px inside the 20px shell,
                     following the nesting subtraction rule. */
                  <dd className="inline-flex items-center gap-1.5 rounded-[14px] bg-gold px-2 py-0.5 text-lg font-bold leading-tight tabular-nums text-gold-ink">
                    <RankMark className="h-3.5 w-3.5" />
                    {stat.value}
                  </dd>
                ) : (
                  <dd className="truncate text-lg font-bold leading-tight tabular-nums">
                    {stat.value}
                  </dd>
                )}
                <dt className="mt-0.5 truncate text-xs leading-4 text-ink-mid">{stat.label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-auto flex flex-col gap-2 pt-3">
            <Link
              href={tutorHref}
              className="rounded-pill bg-ink px-4 py-2 text-center text-sm font-semibold text-paper transition-colors duration-[var(--duration-state)] hover:bg-pink"
            >
              Profili Gör <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
            {showTrialCta && (
              <Link
                href={trialHref}
                className="rounded-md border px-4 py-2 text-center text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Deneme Dersi Al
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

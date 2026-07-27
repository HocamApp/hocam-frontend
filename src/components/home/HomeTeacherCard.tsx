import Link from "next/link";
import { GraduationCap, Star } from "lucide-react";
import type { TutorProfile } from "@/types";
import { cn, formatPrice, formatRating } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Compact teacher card for the homepage rails.
 *
 * Intentionally lighter than `TutorCard` (favourites, presence badges and
 * verification marks make that card too tall and too stateful for a rail).
 * `TutorCard` remains the card used on `/tutors`.
 *
 * The tutor leads the card. The previous version opened with a decorative
 * banner and demoted the person to a small overlapping avatar; this one gives
 * the portrait a near-square block across the full card width, so the first
 * thing read is who the teacher is. Decorative artwork only appears as a
 * quiet backdrop behind the initials when there is no photo.
 */

export interface HomeTeacherCardData {
  id: string;
  href: string | null;
  name: string;
  university: string;
  department: string;
  subjects: string[];
  rating: number;
  totalReviews: number;
  price: number;
  profilePicture?: string;
}

/** Fallback tints, cycled so adjacent photo-less cards do not match. */
const FALLBACK_TINTS = [
  "from-brand-100 to-brand-50 text-brand-700 dark:from-brand-900/50 dark:to-brand-900/20 dark:text-brand-200",
  "from-sky-100 to-sky-50 text-sky-800 dark:from-sky-900/50 dark:to-sky-900/20 dark:text-sky-200",
  "from-amber-100 to-amber-50 text-amber-800 dark:from-amber-900/40 dark:to-amber-900/15 dark:text-amber-200",
  "from-violet-100 to-violet-50 text-violet-800 dark:from-violet-900/50 dark:to-violet-900/20 dark:text-violet-200",
  "from-slate-200 to-slate-100 text-slate-700 dark:from-slate-700/60 dark:to-slate-800/30 dark:text-slate-200",
];

export function tutorToTeacherCard(tutor: TutorProfile): HomeTeacherCardData {
  return {
    id: tutor.id,
    href: `/tutors/${tutor.id}`,
    name: `${tutor.name} ${tutor.surname}`.trim(),
    university: tutor.university,
    department: tutor.department,
    subjects: tutor.subjects.slice(0, 2).map((subject) => subject.name),
    rating: tutor.rating,
    totalReviews: tutor.total_reviews,
    price: tutor.hourly_price,
    profilePicture: tutor.profile_picture || undefined,
  };
}

export function mockToTeacherCard(teacher: {
  id: string;
  name: string;
  university: string;
  department: string;
  subjects: string[];
  rating: number;
  totalReviews: number;
  price: number;
}): HomeTeacherCardData {
  return {
    // Placeholder teachers have no profile to open.
    href: null,
    ...teacher,
  };
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toLocaleUpperCase("tr-TR") || "?"
  );
}

export function HomeTeacherCard({
  teacher,
  index = 0,
  onOpen,
}: {
  teacher: HomeTeacherCardData;
  index?: number;
  onOpen?: () => void;
}) {
  const isPlaceholder = !teacher.href;
  const tint = FALLBACK_TINTS[index % FALLBACK_TINTS.length];

  const body = (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden transition-all duration-200",
        isPlaceholder
          ? "border-dashed bg-muted/20"
          : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
      )}
    >
      {/* Portrait block: the tutor, full card width, near-square. */}
      <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden bg-muted">
        <Avatar shape="square" className="h-full w-full rounded-none">
          {!isPlaceholder && (
            <AvatarImage
              src={teacher.profilePicture}
              alt=""
              className="aspect-auto h-full w-full object-cover"
            />
          )}
          <AvatarFallback
            className={cn(
              "relative rounded-none bg-gradient-to-br",
              tint,
              isPlaceholder && "from-muted to-muted/60 text-muted-foreground"
            )}
          >
            {isPlaceholder ? (
              <GraduationCap className="relative h-12 w-12 opacity-60" aria-hidden="true" />
            ) : (
              <span className="relative text-4xl font-semibold tracking-tight">
                {initials(teacher.name)}
              </span>
            )}
          </AvatarFallback>
        </Avatar>

        {isPlaceholder && (
          <Badge
            variant="secondary"
            className="absolute right-2.5 top-2.5 text-[11px] font-medium shadow-sm"
          >
            Örnek içerik
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-[15px] font-semibold leading-tight">{teacher.name}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{teacher.university}</p>
        <p className="truncate text-xs text-muted-foreground">{teacher.department}</p>

        <div className="mt-2.5 flex min-w-0 flex-wrap gap-1">
          {teacher.subjects.map((subject, subjectIndex) => (
            <Badge
              key={subject}
              variant={subjectIndex === 0 ? "default" : "outline"}
              className="block max-w-full truncate text-xs"
            >
              {subject}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
          <span className="min-w-0 text-sm">
            {teacher.totalReviews > 0 ? (
              <span className="inline-flex items-center gap-1 font-medium">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {formatRating(teacher.rating)}
                <span className="font-normal text-muted-foreground">
                  ({teacher.totalReviews})
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Yeni</span>
            )}
          </span>
          <span className="shrink-0 text-right">
            <span className="text-base font-semibold">{formatPrice(teacher.price)}</span>
            <span className="ml-1 text-xs text-muted-foreground">/40 dk</span>
          </span>
        </div>
      </div>
    </Card>
  );

  if (isPlaceholder) {
    return <div className="h-full">{body}</div>;
  }

  return (
    <Link
      href={teacher.href!}
      onClick={onOpen}
      className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {body}
    </Link>
  );
}

export function HomeTeacherCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="aspect-[5/4] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full" />
      </div>
    </Card>
  );
}

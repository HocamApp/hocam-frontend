"use client";

import Link from "next/link";
import { ArrowRight, Award, GraduationCap, ShieldCheck, Star } from "lucide-react";
import type { Subject, TutorProfile } from "@/types";
import { formatPrice, formatRating } from "@/lib/utils";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TutorPresenceBadge } from "@/components/tutors/TutorPresenceBadge";
import { VerifiedTutorMark } from "@/components/tutors/VerifiedTutorMark";

interface HomeTutorPreviewProps {
  tutor?: TutorProfile;
  selectedSubject: Subject | null;
  isLoading: boolean;
  isError: boolean;
}

function getInitials(tutor: TutorProfile) {
  return `${tutor.name.trim()[0] ?? ""}${tutor.surname.trim()[0] ?? ""}`.toUpperCase() || "?";
}

function subjectMatches(tutor: TutorProfile, selectedSubject: Subject | null) {
  if (!selectedSubject) return false;
  return tutor.subjects.some(
    (subject) =>
      subject.name === selectedSubject.name &&
      subject.exam_type === selectedSubject.exam_type
  );
}

export function HomeTutorPreview({
  tutor,
  selectedSubject,
  isLoading,
  isError,
}: HomeTutorPreviewProps) {
  if (isLoading) {
    return (
      <div className="relative mx-auto w-full max-w-md" aria-label="Hoca profili yükleniyor">
        <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/[0.04]" aria-hidden="true" />
        <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-primary/5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
          <Skeleton className="mt-5 h-11 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !tutor) {
    return (
      <div className="relative mx-auto w-full max-w-md">
        <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/[0.04]" aria-hidden="true" />
        <div className="rounded-3xl border bg-card p-7 shadow-xl shadow-primary/5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-tight">
            Doğrulanmış hoca profilleri
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Akademik bilgileri, değerlendirmeleri ve ders alanlarını karşılaştırarak sana uygun hocayı seç.
          </p>
          <Button asChild className="mt-6 w-full rounded-xl" size="lg">
            <Link href="/tutors">
              Hocaları keşfet
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const matched = subjectMatches(tutor, selectedSubject);
  const visibleSubjects = tutor.subjects.slice(0, 2);
  const hasRating = tutor.total_reviews > 0;

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-5 -z-10 rounded-[2.25rem] bg-gradient-to-br from-primary/[0.08] via-rose-400/[0.10] to-transparent" aria-hidden="true" />
      <div className="absolute -right-3 -top-4 z-10 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs font-semibold shadow-md">
        {matched ? (
          <>
            <Star className="h-3.5 w-3.5 fill-current text-primary" aria-hidden="true" />
            Sana uygun eşleşme
          </>
        ) : (
          <>
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Doğrulanmış hoca
          </>
        )}
      </div>

      <article className="overflow-hidden rounded-3xl border bg-card shadow-xl shadow-primary/10">
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 rounded-2xl">
                <AvatarImage
                  src={tutor.profile_picture || "/images/demo-teacher.jpg"}
                  alt={`${tutor.name} ${tutor.surname}`}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
                  {getInitials(tutor)}
                </AvatarFallback>
              </Avatar>
              <VerifiedTutorMark
                verified={tutor.is_verified}
                className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-background"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {tutor.name} {tutor.surname}
              </h2>
              {(tutor.university || tutor.department) && (
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {[tutor.university, tutor.department].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-2">
                <TutorPresenceBadge
                  isOnline={tutor.is_online}
                  lastSeenAt={tutor.last_seen_at}
                />
              </div>
            </div>
          </div>

          {visibleSubjects.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {visibleSubjects.map((subject) => (
                <Badge key={subject.id} variant="secondary" className="rounded-full">
                  {subject.exam_type} {subject.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border bg-muted/30 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Değerlendirme</p>
              <p className="mt-1 text-sm font-semibold">
                {hasRating ? `★ ${formatRating(tutor.rating)} · ${tutor.total_reviews}` : "Henüz değerlendirme yok"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ders ücreti</p>
              <p className="mt-1 text-sm font-semibold">
                {formatPrice(tutor.hourly_price)} <span className="font-normal text-muted-foreground">/40 dk</span>
              </p>
            </div>
            {tutor.yks_rank > 0 && (
              <div className="col-span-2 flex items-center gap-2 border-t pt-3 text-sm">
                <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <span className="font-medium">
                  YKS sıralaması {tutor.yks_rank.toLocaleString("tr-TR")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t bg-muted/20 p-4 sm:px-7">
          <Button asChild className="w-full rounded-xl" size="lg">
            <Link
              href={`/tutors/${tutor.id}`}
              onClick={() =>
                trackHomeEvent("home_tutor_profile_opened", {
                  tutor_id: tutor.id,
                  placement: "hero",
                  position: 1,
                })
              }
            >
              Profili gör
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}

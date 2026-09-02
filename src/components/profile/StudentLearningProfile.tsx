"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  PackageCheck,
  RotateCcw,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStudentLearningProfile } from "@/lib/profileApi";
import { formatDate } from "@/lib/utils";
import { SectionCardTitle } from "./SectionCardTitle";

function RetryState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-dashed p-5 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        <RotateCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
        Tekrar dene
      </Button>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  loading,
  featured = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
  loading: boolean;
  featured?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-input border border-line p-4 ${
        featured ? "bg-gold text-gold-ink" : "bg-paper text-ink"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs font-medium ${
          featured ? "text-gold-ink/75" : "text-ink-mid"
        }`}
      >
        {icon}
        <span>{label}</span>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-28 max-w-full" />
        </div>
      ) : (
        <>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight ${
              featured ? "text-gold-ink" : "text-ink"
            }`}
          >
            {value}
          </p>
          <p
            className={`mt-1 text-xs leading-5 ${
              featured ? "text-gold-ink/75" : "text-ink-mid"
            }`}
          >
            {detail}
          </p>
        </>
      )}
    </div>
  );
}

export function StudentLearningProfile() {
  const learningQuery = useQuery({
    queryKey: ["student-learning-profile"],
    queryFn: fetchStudentLearningProfile,
    staleTime: 5 * 60_000,
  });
  const learning = learningQuery.data;
  const tutor = learning?.most_studied_tutor;
  const tutorName = tutor ? `${tutor.name} ${tutor.surname}`.trim() : "";
  const tutorInitials = tutor
    ? `${tutor.name.trim()[0] ?? ""}${tutor.surname.trim()[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5 lg:items-stretch lg:gap-8">
      <Card className="order-1 min-w-0 lg:col-span-3">
        <CardHeader>
          <SectionCardTitle className="text-base">Öğrenme özetin</SectionCardTitle>
          <p className="text-sm text-muted-foreground">
            Hocam&apos;daki tamamlanan derslerin ve aktif paketlerin.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric
              icon={<BookOpenCheck className="h-4 w-4" aria-hidden="true" />}
              label="Tamamlanan ders"
              value={learningQuery.isError ? "—" : learning?.completed_lessons ?? 0}
              detail={
                learningQuery.isError
                  ? "Ders özeti yüklenemedi"
                  : "Uzun vadeli öğrenme emeğin"
              }
              loading={learningQuery.isLoading}
              featured
            />
            <Metric
              icon={<PackageCheck className="h-4 w-4" aria-hidden="true" />}
              label="Aktif paket"
              value={learningQuery.isError ? "—" : learning?.active_packages ?? 0}
              detail={
                learningQuery.isError
                  ? "Paket özeti yüklenemedi"
                  : "Kullanılabilir ders hakkı olan paket"
              }
              loading={learningQuery.isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="order-3 min-w-0 lg:order-2 lg:col-span-2">
        <CardHeader>
          <SectionCardTitle className="text-base">
            {tutor?.completed_lessons === 1 ? "Son çalıştığın hoca" : "En çok çalıştığın hoca"}
          </SectionCardTitle>
        </CardHeader>
        <CardContent className="flex flex-col lg:h-[calc(100%-5rem)]">
          {learningQuery.isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ) : learningQuery.isError ? (
            <RetryState
              message="Hoca geçmişin yüklenemedi."
              onRetry={() => void learningQuery.refetch()}
            />
          ) : !tutor ? (
            <div className="flex flex-1 flex-col justify-center rounded-lg border border-dashed p-5 text-center">
              <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">Henüz düzenli çalıştığın bir hoca yok.</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Tamamlanan derslerin oldukça öğrenme ilişkilerin burada görünecek.
              </p>
              <Button asChild variant="outline" size="sm" className="mx-auto mt-4">
                <Link href="/tutors">Hocaları keşfet</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border border-border">
                  {tutor.profile_picture ? (
                    <AvatarImage src={tutor.profile_picture} alt={tutorName} />
                  ) : null}
                  <AvatarFallback className="bg-gold font-semibold text-gold-ink">
                    {tutorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{tutorName}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {tutor.primary_subject?.name ?? "Ders geçmişin"}
                  </p>
                </div>
              </div>
              <dl className="mt-5 space-y-2 rounded-input border border-line bg-paper p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Tamamlanan ders</dt>
                  <dd className="font-semibold">{tutor.completed_lessons}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Son ders</dt>
                  <dd className="text-right font-medium">{formatDate(tutor.last_lesson_at)}</dd>
                </div>
              </dl>
              {tutor.is_bookable ? (
                // Two separate defects in one row of buttons:
                //
                // `flex-1` in this column layout zeroes the flex basis, so the
                // buttons collapsed to the height of their own text. min-height
                // is a floor flex cannot argue with, and lands the phone on the
                // 44px target; `sm`'s 36px stays right on the desktop card.
                //
                // `!text-white` because tailwind-merge does not know this
                // design system's named type scale, files `text-small` under
                // text *colour*, and drops the variant's `text-white` — which
                // left ink text on a pink pill. Same workaround as BookingModal.
                <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row lg:flex-col xl:flex-row">
                  <Button asChild variant="outline" size="sm" className="max-md:min-h-11 flex-1">
                    <Link href={`/tutors/${tutor.id}`}>Profili görüntüle</Link>
                  </Button>
                  <Button asChild size="sm" className="!text-white max-md:min-h-11 flex-1">
                    <Link href={`/tutors/${tutor.id}/checkout`}>Yeni ders planla</Link>
                  </Button>
                </div>
              ) : (
                <p className="mt-auto pt-5 text-xs leading-5 text-muted-foreground">
                  Bu hoca şu anda yeni rezervasyon kabul etmiyor.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="order-4 min-w-0 lg:col-span-2">
        <CardHeader>
          <SectionCardTitle className="text-base">En çok çalıştığın dersler</SectionCardTitle>
          <p className="text-sm text-muted-foreground">Tamamlanan derslerine göre.</p>
        </CardHeader>
        <CardContent>
          {learningQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-14 w-full" />
              ))}
            </div>
          ) : learningQuery.isError ? (
            <RetryState
              message="Ders dağılımın yüklenemedi."
              onRetry={() => void learningQuery.refetch()}
            />
          ) : !learning?.top_subjects.length ? (
            <div className="rounded-lg border border-dashed p-5 text-center">
              <p className="text-sm font-medium">Henüz ders dağılımın oluşmadı.</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Tamamlanan derslerin burada konu alanlarına göre sıralanacak.
              </p>
            </div>
          ) : (
            <ol className="space-y-3">
              {learning.top_subjects.map((subject, index) => (
                <li key={subject.id} className="flex items-center gap-3 rounded-input border border-line bg-paper p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-semibold text-gold-ink">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">{subject.exam_type}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {subject.completed_lessons} ders
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

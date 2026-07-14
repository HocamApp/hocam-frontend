"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  PackageCheck,
  RotateCcw,
  Target,
  XCircle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchStudentLearningProfile,
  fetchStudentQuestionPerformance,
} from "@/lib/profileApi";
import { formatDate } from "@/lib/utils";
import { SectionCardTitle } from "./SectionCardTitle";

const PERCENT_FORMATTER = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 0,
});

function formatAccuracy(value: number | null | undefined): string {
  return value == null ? "—" : `%${PERCENT_FORMATTER.format(value)}`;
}

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
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
  loading: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/35 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
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
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
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
  const questionQuery = useQuery({
    queryKey: ["student-question-performance"],
    queryFn: fetchStudentQuestionPerformance,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const learning = learningQuery.data;
  const questions = questionQuery.data;
  const tutor = learning?.most_studied_tutor;
  const tutorName = tutor ? `${tutor.name} ${tutor.surname}`.trim() : "";
  const tutorInitials = tutor
    ? `${tutor.name.trim()[0] ?? ""}${tutor.surname.trim()[0] ?? ""}`.toUpperCase()
    : "";
  const correctPercent = questions?.total_attempts
    ? (questions.correct_attempts / questions.total_attempts) * 100
    : 0;
  const hasStableDistribution = (questions?.total_attempts ?? 0) >= 10;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-stretch lg:gap-8">
      <Card className="order-1 lg:col-span-3">
        <CardHeader>
          <SectionCardTitle className="text-base">Öğrenme özetin</SectionCardTitle>
          <p className="text-sm text-muted-foreground">
            Hocam&apos;daki gerçek ders ve soru etkinliğin.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
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
            />
            <Metric
              icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
              label="Çözülen soru"
              value={questionQuery.isError ? "—" : questions?.total_attempts ?? 0}
              detail={
                questionQuery.isError
                  ? "Soru özeti yüklenemedi"
                  : "Cevapladığın toplam deneme"
              }
              loading={questionQuery.isLoading}
            />
            <Metric
              icon={<Target className="h-4 w-4" aria-hidden="true" />}
              label="Doğruluk"
              value={questionQuery.isError ? "—" : formatAccuracy(questions?.accuracy_percent)}
              detail={
                questionQuery.isError
                  ? "Soru özeti yüklenemedi"
                  : questions?.total_attempts
                    ? `${questions.total_attempts} cevap üzerinden`
                    : "Soru çözdükçe oluşacak"
              }
              loading={questionQuery.isLoading}
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

      <Card className="order-3 lg:order-2 lg:col-span-2">
        <CardHeader>
          <SectionCardTitle className="text-base">
            {tutor?.completed_lessons === 1 ? "Son çalıştığın hoca" : "En çok çalıştığın hoca"}
          </SectionCardTitle>
        </CardHeader>
        <CardContent className="flex h-[calc(100%-5rem)] flex-col">
          {learningQuery.isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
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
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
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
              <dl className="mt-5 space-y-2 rounded-lg bg-muted/35 p-4 text-sm">
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
                <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row lg:flex-col xl:flex-row">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/tutors/${tutor.id}`}>Profili görüntüle</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
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

      <Card className="order-2 lg:order-3 lg:col-span-3">
        <CardHeader>
          <SectionCardTitle className="text-base">Soru performansın</SectionCardTitle>
          <p className="text-sm text-muted-foreground">
            Yalnızca cevapladığın sorular üzerinden hesaplanır.
          </p>
        </CardHeader>
        <CardContent>
          {questionQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-9 w-36" />
            </div>
          ) : questionQuery.isError ? (
            <RetryState
              message="Soru performansın yüklenemedi. Diğer profil bilgilerini kullanmaya devam edebilirsin."
              onRetry={() => void questionQuery.refetch()}
            />
          ) : !questions?.total_attempts ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 font-medium">Henüz sistem üzerinden soru çözmedin.</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Soru çözdükçe doğru, yanlış ve ders dağılımını burada görebileceksin.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/cikmis-sorular">Soru çözmeye başla</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {questions.total_attempts} soru çözdün
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {questions.correct_attempts} doğru · {questions.incorrect_attempts} yanlış ·{" "}
                  {formatAccuracy(questions.accuracy_percent)} doğruluk
                </p>
              </div>

              {hasStableDistribution ? (
                <div className="space-y-3">
                  <div
                    className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${questions.correct_attempts} doğru, ${questions.incorrect_attempts} yanlış, ${formatAccuracy(questions.accuracy_percent)} doğruluk`}
                  >
                    <span className="bg-emerald-500" style={{ width: `${correctPercent}%` }} />
                    <span className="bg-rose-500" style={{ width: `${100 - correctPercent}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      <span><strong>{questions.correct_attempts}</strong> doğru</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
                      <span><strong>{questions.incorrect_attempts}</strong> yanlış</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-sm font-medium">İlk sonuçların oluşuyor</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Daha anlamlı bir dağılım için en az 10 soru çözmeye devam et.
                  </p>
                </div>
              )}

              {questions.top_subject && (
                <div className="flex flex-col justify-between gap-2 rounded-lg bg-muted/35 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      En çok çözdüğün ders
                    </p>
                    <p className="mt-1 font-semibold">{questions.top_subject.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {questions.top_subject.attempt_count} soru ·{" "}
                    {formatAccuracy(questions.top_subject.accuracy_percent)} doğruluk
                  </p>
                </div>
              )}

              <Button asChild variant="outline" size="sm">
                <Link href="/cikmis-sorular">
                  Çözmeye devam et
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="order-4 lg:col-span-2">
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
                <li key={subject.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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

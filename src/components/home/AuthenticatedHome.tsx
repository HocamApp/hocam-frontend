"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileQuestion,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Star,
  Target,
  WalletCards,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchTutors, fetchSubjects } from "@/lib/tutorsApi";
import {
  fetchLearningDashboard,
  fetchLearningGoalTemplates,
} from "@/lib/learningApi";
import { fetchBookings } from "@/lib/lessonsApi";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { fetchProfileMe } from "@/lib/profileApi";
import { fetchQuestionMetadata } from "@/lib/questionsApi";
import { goalPackageHref } from "@/lib/learning";
import {
  computePackageExpiry,
  isPastPackage,
} from "@/components/payments/PackagePurchaseCard";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { formatDate } from "@/lib/utils";
import type {
  Booking,
  LearningGoalTemplate,
  PackagePurchase,
  ProfileStudent,
  StudentGoal,
  Subject,
} from "@/types";
import { HomeSubjectSearch } from "@/components/home/HomeSubjectSearch";
import { HomeTutorPreview } from "@/components/home/HomeTutorPreview";
import { TutorCard } from "@/components/tutors/TutorCard";
import { GoalPackageCard } from "@/components/learning/GoalPackageCard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function HomeSectionHeader({
  headingId,
  title,
  description,
  href,
  action,
  onAction,
}: {
  headingId?: string;
  title: string;
  description: string;
  href?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={headingId} className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {href && action && (
        <Button asChild variant="ghost" className="w-fit shrink-0 px-0 text-primary hover:bg-transparent hover:underline">
          <Link href={href} onClick={onAction}>
            {action}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function TutorCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-20 w-full rounded-xl" />
    </div>
  );
}

function ContinueCard({
  icon,
  eyebrow,
  title,
  description,
  meta,
  progress,
  href,
  action,
  contentType,
  contentId,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
  progress?: number;
  href: string;
  action: string;
  contentType: string;
  contentId: string;
}) {
  return (
    <Card className="group h-full overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-sm">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {eyebrow}
            </p>
            <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {typeof progress === "number" && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>İlerleme</span>
              <span>%{Math.round(progress)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {meta && <p className="text-xs font-medium text-muted-foreground">{meta}</p>}
          <Button asChild variant="outline" className="rounded-xl sm:ml-auto">
            <Link
              href={href}
              onClick={() =>
                trackHomeEvent("home_continue_clicked", {
                  content_type: contentType,
                  content_id: contentId,
                })
              }
            >
              {action}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatLessonDateTime(booking: Booking) {
  const date = new Date(booking.start_time);
  return date.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function firstUpcomingBooking(bookings: Booking[]) {
  const now = Date.now();
  return [...bookings]
    .filter((booking) => {
      const status = booking.status.toLowerCase();
      return (
        status === "in_progress" ||
        (status === "confirmed" && new Date(booking.start_time).getTime() > now)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0];
}

function firstActiveGoal(goals: StudentGoal[]) {
  return goals.find((goal) => goal.status === "active");
}

function firstActivePackage(purchases: PackagePurchase[]) {
  return purchases.find((purchase) => {
    const expiry = computePackageExpiry(purchase);
    return (
      purchase.status === "paid" &&
      purchase.remaining_credits > 0 &&
      !isPastPackage(purchase, expiry)
    );
  });
}

function prioritizedTemplates(
  templates: LearningGoalTemplate[],
  targetExamType?: string
) {
  return templates
    .map((template, index) => ({ template, index }))
    .sort((a, b) => {
      const aTarget =
        Boolean(targetExamType) &&
        a.template.exam_type.toUpperCase() === targetExamType?.toUpperCase();
      const bTarget =
        Boolean(targetExamType) &&
        b.template.exam_type.toUpperCase() === targetExamType?.toUpperCase();
      if (aTarget !== bTarget) return aTarget ? -1 : 1;
      if (a.template.is_featured !== b.template.is_featured) {
        return a.template.is_featured ? -1 : 1;
      }
      return a.index - b.index;
    })
    .slice(0, 3)
    .map(({ template }) => template);
}

function PracticeCard({
  icon,
  title,
  description,
  href,
  action,
  resource,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
  resource: string;
}) {
  return (
    <Card className="group rounded-2xl transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <Button asChild variant="ghost" className="mt-5 w-fit px-0 text-primary hover:bg-transparent hover:underline">
          <Link
            href={href}
            onClick={() => trackHomeEvent("home_practice_opened", { resource })}
          >
            {action}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function AuthenticatedHome() {
  const { isAuthenticated } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const trackedView = useRef(false);

  const profileQuery = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchProfileMe,
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    enabled: isAuthenticated,
    staleTime: Infinity,
  });
  const tutorsQuery = useQuery({
    queryKey: ["home-tutors"],
    queryFn: () => fetchTutors({ ordering: "rating" }, 1, 4),
    enabled: isAuthenticated,
  });
  const learningQuery = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });
  const templatesQuery = useQuery({
    queryKey: ["learning-goal-templates"],
    queryFn: fetchLearningGoalTemplates,
    enabled: isAuthenticated,
    retry: false,
  });
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });
  const packagesQuery = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isAuthenticated,
    retry: false,
  });
  const questionsQuery = useQuery({
    queryKey: ["question-metadata"],
    queryFn: fetchQuestionMetadata,
    enabled: isAuthenticated,
    retry: false,
  });

  const studentProfile = useMemo(() => {
    const profile = profileQuery.data?.profile;
    if (!profile || !("target_exam_type" in profile)) return null;
    return profile as ProfileStudent;
  }, [profileQuery.data?.profile]);

  const tutorResults = tutorsQuery.data?.results ?? [];
  const heroTutor = tutorResults[0];
  const recommendedTutors =
    tutorResults.length >= 4 ? tutorResults.slice(1, 4) : tutorResults.slice(0, 3);
  const templates = useMemo(
    () => templatesQuery.data ?? learningQuery.data?.templates ?? [],
    [learningQuery.data?.templates, templatesQuery.data]
  );
  const packageTemplates = useMemo(
    () => prioritizedTemplates(templates, studentProfile?.target_exam_type),
    [studentProfile?.target_exam_type, templates]
  );
  const activeGoal = firstActiveGoal(learningQuery.data?.goals ?? []);
  const upcomingBooking = firstUpcomingBooking(bookingsQuery.data ?? []);
  const activePackage = firstActivePackage(packagesQuery.data ?? []);

  useEffect(() => {
    if (trackedView.current || learningQuery.isLoading || bookingsQuery.isLoading) return;
    trackedView.current = true;
    const hasActivity = Boolean(activeGoal || upcomingBooking || activePackage);
    trackHomeEvent("authenticated_home_viewed", {
      student_state: hasActivity ? "active" : "new_or_inactive",
      has_active_goal: Boolean(activeGoal),
      has_upcoming_lesson: Boolean(upcomingBooking),
    });
  }, [
    activeGoal,
    activePackage,
    bookingsQuery.isLoading,
    learningQuery.isLoading,
    upcomingBooking,
  ]);

  const continuationCards: ReactNode[] = [];
  if (upcomingBooking) {
    const tutorName = `${upcomingBooking.tutor.name} ${upcomingBooking.tutor.surname}`.trim();
    continuationCards.push(
      <ContinueCard
        key={`lesson-${upcomingBooking.id}`}
        icon={<CalendarCheck2 className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Sıradaki dersin"
        title={upcomingBooking.subject.name}
        description={`${tutorName || "Hoca bilgisi bekleniyor"} ile ${upcomingBooking.duration_minutes} dakikalık ders`}
        meta={formatLessonDateTime(upcomingBooking)}
        href="/profile/lessons/upcoming"
        action="Dersi görüntüle"
        contentType="lesson"
        contentId={upcomingBooking.id}
      />
    );
  }
  if (activeGoal && continuationCards.length < 2) {
    const nextMilestone = activeGoal.milestones.find(
      (milestone) => milestone.status !== "completed"
    );
    continuationCards.push(
      <ContinueCard
        key={`goal-${activeGoal.id}`}
        icon={<Target className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Aktif hedefin"
        title={activeGoal.title}
        description={nextMilestone?.title ?? "Hedef yolculuğundaki ilerlemeni görüntüle."}
        progress={activeGoal.progress}
        href={goalPackageHref(activeGoal.id)}
        action="Yola devam et"
        contentType="goal"
        contentId={activeGoal.id}
      />
    );
  }
  if (activePackage && continuationCards.length < 2) {
    const expiry = computePackageExpiry(activePackage);
    continuationCards.push(
      <ContinueCard
        key={`package-${activePackage.id}`}
        icon={<WalletCards className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Aktif ders paketin"
        title={`${activePackage.tutor.name} ${activePackage.tutor.surname}`}
        description={`${activePackage.remaining_credits} ders kredisi kaldı.`}
        meta={expiry ? `Süre sonu ${formatDate(expiry.termEndDate.toISOString())}` : undefined}
        href="/dashboard/student"
        action="Paketi görüntüle"
        contentType="package"
        contentId={activePackage.id}
      />
    );
  }

  const questionResourcesEnabled = questionsQuery.data?.enabled !== false;
  const greetingName = studentProfile?.name?.trim();

  return (
    <div className="overflow-hidden">
      <section className="relative border-b bg-gradient-to-br from-muted/60 via-background to-violet-500/[0.08]">
        <div className="pointer-events-none absolute left-1/2 top-16 -z-0 h-80 w-80 rounded-full bg-primary/[0.04] blur-3xl" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 sm:py-16 min-[880px]:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] min-[880px]:gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-16 lg:px-8 lg:py-[72px]">
          <div className="max-w-2xl">
            {greetingName && (
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Merhaba {greetingName}, bugün neye odaklanmak istersin?
              </p>
            )}
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary sm:text-sm">
              Doğrulanmış YKS hocaları
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[3.55rem]">
              Hedefine uygun hocayı bul, öğrenmeye bugün başla.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Dersine, sınav hedefine, bütçene ve uygun saatlerine göre doğrulanmış hocaları karşılaştır. İstersen hazır çalışma paketleri ve soru içerikleriyle kendi hızında ilerle.
            </p>

            <div className="mt-8">
              <HomeSubjectSearch
                subjects={subjectsQuery.data}
                isLoading={subjectsQuery.isLoading}
                isError={subjectsQuery.isError}
                onSelectedSubjectChange={setSelectedSubject}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-5">
              <Link
                href="/dashboard/student/learning"
                onClick={() => trackHomeEvent("home_learning_link_clicked", { placement: "hero" })}
                className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Hedef paketlerini keşfet
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/cikmis-sorular"
                onClick={() => trackHomeEvent("home_question_link_clicked", { placement: "hero" })}
                className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Çıkmış sorulara göz at
              </Link>
            </div>

            <ul className="mt-7 grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-3">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  {tutorsQuery.data
                    ? `${tutorsQuery.data.count} doğrulanmış hoca`
                    : "Doğrulanmış bilgiler"}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Şeffaf değerlendirmeler</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Esnek ders saatleri</span>
              </li>
            </ul>
          </div>

          <HomeTutorPreview
            tutor={heroTutor}
            selectedSubject={selectedSubject}
            isLoading={tutorsQuery.isLoading}
            isError={tutorsQuery.isError}
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 sm:py-20 lg:space-y-24 lg:px-8 lg:py-24">
        <section aria-labelledby="home-tutors-title" className="space-y-8">
          <HomeSectionHeader
            headingId="home-tutors-title"
            title="Sana uygun hocaları keşfet"
            description="Ders, sınav ve uygunluk bilgilerine göre karşılaştır."
            href="/tutors"
            action="Tüm hocaları gör"
            onAction={() => trackHomeEvent("home_all_tutors_clicked", { placement: "tutor_section" })}
          />

          {tutorsQuery.isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => <TutorCardSkeleton key={item} />)}
            </div>
          ) : tutorsQuery.isError ? (
            <div className="space-y-3">
              <ErrorMessage message="Hoca önerileri şu anda yüklenemedi. Tüm hocaları görüntülemeye devam edebilirsin." />
              <Button variant="outline" onClick={() => void tutorsQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Tekrar dene
              </Button>
            </div>
          ) : recommendedTutors.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {recommendedTutors.map((tutor, index) => (
                <div
                  key={tutor.id}
                  className="min-w-0"
                  onClickCapture={(event) => {
                    if ((event.target as HTMLElement).closest("a")) {
                      trackHomeEvent("home_tutor_profile_opened", {
                        tutor_id: tutor.id,
                        placement: "list",
                        position: index + 1,
                      });
                    }
                  }}
                >
                  <TutorCard tutor={tutor} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-medium">Şu anda gösterilecek hoca yok.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/tutors">Hoca aramasına git</Link>
              </Button>
            </div>
          )}
        </section>

        {continuationCards.length > 0 && (
          <section aria-labelledby="home-continue-title" className="space-y-7">
            <h2 id="home-continue-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Kaldığın yerden devam et
            </h2>
            <div className="grid gap-5 md:grid-cols-2">{continuationCards}</div>
          </section>
        )}

        <section aria-labelledby="home-packages-title" className="space-y-8">
          <HomeSectionHeader
            headingId="home-packages-title"
            title="Hedefine göre çalışma paketleri"
            description="Sınavına ve seviyene uygun hazır yol haritalarını keşfet."
            href="/dashboard/student/learning"
            action="Tümünü gör"
            onAction={() => trackHomeEvent("home_learning_link_clicked", { placement: "package_section" })}
          />

          {(templatesQuery.isLoading && learningQuery.isLoading) ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-[390px] rounded-2xl" />)}
            </div>
          ) : templatesQuery.isError && learningQuery.isError ? (
            <div className="space-y-3">
              <ErrorMessage message="Çalışma paketleri şu anda yüklenemedi." />
              <Button asChild variant="outline">
                <Link href="/dashboard/student/learning">Öğrenme merkezine git</Link>
              </Button>
            </div>
          ) : packageTemplates.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {packageTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className="min-w-0"
                  onClickCapture={(event) => {
                    if ((event.target as HTMLElement).closest("a")) {
                      trackHomeEvent("home_package_opened", {
                        template_id: template.id,
                        position: index + 1,
                        is_active: Boolean(
                          learningQuery.data?.goals.some(
                            (goal) => goal.template === template.id
                          )
                        ),
                      });
                    }
                  }}
                >
                  <GoalPackageCard
                    template={template}
                    isAdded={Boolean(
                      learningQuery.data?.goals.some(
                        (goal) => goal.template === template.id
                      )
                    )}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 font-medium">Hazır paketler yakında burada</p>
              <p className="mt-1 text-sm text-muted-foreground">Öğrenme merkezindeki içerikleri takip edebilirsin.</p>
            </div>
          )}
        </section>

        {questionResourcesEnabled && (
          <section aria-labelledby="home-practice-title" className="space-y-8">
            <HomeSectionHeader
              headingId="home-practice-title"
              title="Bugün biraz pratik yap"
              description="Kısa bir çalışma seç ve hemen başla."
            />
            {questionsQuery.isLoading ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Skeleton className="h-56 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <PracticeCard
                  icon={<FileQuestion className="h-5 w-5" aria-hidden="true" />}
                  title="Çıkmış Sorular"
                  description="TYT, AYT ve YDT sorularını yıl, ders ve konuya göre filtreleyerek çöz."
                  href="/cikmis-sorular"
                  action="Soruları aç"
                  resource="question_library"
                />
                <PracticeCard
                  icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                  title="Yanlış Sorularım"
                  description="Yanlış cevapladığın soruları yeniden çöz ve tekrar havuzunu temizle."
                  href="/dashboard/student/learning/yanlis-sorular"
                  action="Tekrar havuzunu aç"
                  resource="wrong_questions"
                />
              </div>
            )}
          </section>
        )}

        <section className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-9 text-primary-foreground sm:px-9 sm:py-10">
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-[48%] lg:block" aria-hidden="true">
            <Image
              src="/images/home/blackboard.jpg"
              alt=""
              fill
              quality={60}
              sizes="(min-width: 1280px) 614px, 48vw"
              className="object-cover opacity-45 grayscale"
              style={{ objectPosition: "38% center" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/30" />
          </div>

          <div className="relative z-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                Bir hocayla başlamaya hazır mısın?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
                Dersine ve hedeflerine uygun doğrulanmış hocaları karşılaştır.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="mt-7 w-full rounded-xl lg:mt-0 lg:w-auto lg:shrink-0">
              <Link
                href="/tutors"
                onClick={() => trackHomeEvent("home_all_tutors_clicked", { placement: "closing_cta" })}
              >
                Hocaları keşfet
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
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
import {
  HOME_TUTOR_PAGE_SIZE,
  HOME_TUTOR_TAB_ALL,
  buildHomeTutorsQueryKey,
  examTabsFromSubjects,
  homeTutorFilterFor,
  prioritizedTemplates,
  selectHomeTutors,
  selectResumeEntries,
  type ResumeEntry,
} from "@/lib/homeContent";
import { formatDate } from "@/lib/utils";
import type { Booking, ProfileStudent, TutorProfile } from "@/types";
import { HomeSubjectSearch } from "@/components/home/HomeSubjectSearch";
import { HomeCardRow } from "@/components/home/HomeCardRow";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { TutorCard } from "@/components/tutors/TutorCard";
import { GoalPackageCard } from "@/components/learning/GoalPackageCard";
import { CategoryNavPills } from "@/components/learning/CategoryNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

function ResumeCard({
  icon,
  eyebrow,
  title,
  description,
  meta,
  metaDateTime,
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
  metaDateTime?: string;
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
          {meta &&
            (metaDateTime ? (
              <time
                dateTime={metaDateTime}
                className="text-xs font-medium text-muted-foreground"
              >
                {meta}
              </time>
            ) : (
              <p className="text-xs font-medium text-muted-foreground">{meta}</p>
            ))}
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

function formatLessonDateTime(booking: Booking) {
  return new Date(booking.start_time).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resumeCardFor(entry: ResumeEntry): ReactNode {
  if (entry.kind === "lesson") {
    const booking = entry.booking;
    const tutorName = `${booking.tutor.name} ${booking.tutor.surname}`.trim();
    return (
      <ResumeCard
        key={`lesson-${booking.id}`}
        icon={<CalendarCheck2 className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Sıradaki dersin"
        title={booking.subject.name}
        description={`${tutorName || "Hoca bilgisi bekleniyor"} ile ${booking.duration_minutes} dakikalık ders`}
        meta={formatLessonDateTime(booking)}
        metaDateTime={booking.start_time}
        href="/profile/lessons/upcoming"
        action="Dersi görüntüle"
        contentType="lesson"
        contentId={booking.id}
      />
    );
  }

  if (entry.kind === "goal") {
    const goal = entry.goal;
    const nextMilestone = goal.milestones.find(
      (milestone) => milestone.status !== "completed"
    );
    return (
      <ResumeCard
        key={`goal-${goal.id}`}
        icon={<Target className="h-5 w-5" aria-hidden="true" />}
        eyebrow="Aktif hedefin"
        title={goal.title}
        description={nextMilestone?.title ?? "Hedef yolculuğundaki ilerlemeni görüntüle."}
        progress={goal.progress}
        href={goalPackageHref(goal.id)}
        action="Yola devam et"
        contentType="goal"
        contentId={goal.id}
      />
    );
  }

  const purchase = entry.purchase;
  const expiry = computePackageExpiry(purchase);
  return (
    <ResumeCard
      key={`package-${purchase.id}`}
      icon={<WalletCards className="h-5 w-5" aria-hidden="true" />}
      eyebrow="Aktif ders paketin"
      title={`${purchase.tutor.name} ${purchase.tutor.surname}`}
      description={`${purchase.remaining_credits} ders kredisi kaldı.`}
      meta={expiry ? `Süre sonu ${formatDate(expiry.termEndDate.toISOString())}` : undefined}
      href="/dashboard/student"
      action="Paketi görüntüle"
      contentType="package"
      contentId={purchase.id}
    />
  );
}

export function AuthenticatedHome() {
  const { isAuthenticated } = useAuth();
  const {
    favorites,
    favoriteIds,
    toggle: toggleFavorite,
    isFavoritePending,
  } = useFavorites();
  const [examTab, setExamTab] = useState<string>(HOME_TUTOR_TAB_ALL);
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
  // Every result-affecting parameter is in the key, so a tab switch can never
  // read another tab's cached page, and revisiting a tab is served from cache
  // instead of refetching.
  const tutorsQuery = useQuery({
    queryKey: buildHomeTutorsQueryKey({
      ordering: "rating",
      examType: examTab,
      pageSize: HOME_TUTOR_PAGE_SIZE,
    }),
    queryFn: () =>
      fetchTutors(
        { ordering: "rating", exam_type: homeTutorFilterFor(examTab) },
        1,
        HOME_TUTOR_PAGE_SIZE
      ),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
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

  const tutors = useMemo(
    () => selectHomeTutors(tutorsQuery.data?.results),
    [tutorsQuery.data?.results]
  );
  const examTabs = useMemo(
    () => examTabsFromSubjects(subjectsQuery.data),
    [subjectsQuery.data]
  );
  const templates = useMemo(
    () => templatesQuery.data ?? learningQuery.data?.templates ?? [],
    [learningQuery.data?.templates, templatesQuery.data]
  );
  const packageTemplates = useMemo(
    () => prioritizedTemplates(templates, studentProfile?.target_exam_type),
    [studentProfile?.target_exam_type, templates]
  );
  const resumeEntries = useMemo(
    () =>
      selectResumeEntries({
        bookings: bookingsQuery.data,
        goals: learningQuery.data?.goals,
        purchases: packagesQuery.data,
        isPastPackage: (purchase) =>
          isPastPackage(purchase, computePackageExpiry(purchase)),
      }),
    [bookingsQuery.data, learningQuery.data?.goals, packagesQuery.data]
  );
  const favoriteTutors = useMemo(
    () => selectHomeTutors(favorites.map((favorite) => favorite.tutor)),
    [favorites]
  );

  const isResumeLoading = bookingsQuery.isLoading || learningQuery.isLoading;
  const showResumeSection = isResumeLoading || resumeEntries.length > 0;

  useEffect(() => {
    if (trackedView.current || learningQuery.isLoading || bookingsQuery.isLoading) return;
    trackedView.current = true;
    trackHomeEvent("authenticated_home_viewed", {
      student_state: resumeEntries.length > 0 ? "active" : "new_or_inactive",
      has_active_goal: resumeEntries.some((entry) => entry.kind === "goal"),
      has_upcoming_lesson: resumeEntries.some((entry) => entry.kind === "lesson"),
    });
  }, [bookingsQuery.isLoading, learningQuery.isLoading, resumeEntries]);

  const questionResourcesEnabled = questionsQuery.data?.enabled !== false;
  const greetingName = studentProfile?.name?.trim();

  function renderTutorCard(tutor: TutorProfile, index: number, placement: string) {
    return (
      <div
        key={tutor.id}
        className="min-w-0"
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            trackHomeEvent("home_tutor_profile_opened", {
              tutor_id: tutor.id,
              placement,
              position: index + 1,
            });
          }
        }}
      >
        <TutorCard
          tutor={tutor}
          isFavorite={favoriteIds.has(tutor.id)}
          onToggleFavorite={toggleFavorite}
          favoritePending={isFavoritePending(tutor.id)}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Compact functional hero: greeting, one supporting line, the existing
          subject combobox and a single primary action. No marketing rail. */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="max-w-2xl">
            {greetingName && (
              <p className="text-sm font-medium text-muted-foreground">
                Merhaba {greetingName},
              </p>
            )}
            <h1 className="mt-1 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl">
              Bugün neye odaklanmak istersin?
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Dersini seç, doğrulanmış YKS hocalarını karşılaştır ve uygun saatte
              dersini planla.
            </p>

            <div className="mt-6">
              <HomeSubjectSearch
                subjects={subjectsQuery.data}
                isLoading={subjectsQuery.isLoading}
                isError={subjectsQuery.isError}
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="rounded-xl">
                <Link
                  href="/match"
                  onClick={() =>
                    trackHomeEvent("home_matching_started", { placement: "hero" })
                  }
                >
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sana uygun hocayı bulalım
                </Link>
              </Button>
              <Link
                href="/cikmis-sorular"
                onClick={() =>
                  trackHomeEvent("home_question_link_clicked", { placement: "hero" })
                }
                className="inline-flex min-h-11 items-center px-1 text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Çıkmış sorulara göz at
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 sm:py-14 lg:space-y-20 lg:px-8 lg:py-16">
        {/* Resume: the returning student's own state, before any catalog.
            Unmounts entirely for a student with nothing in progress. */}
        {showResumeSection && (
          <section aria-labelledby="home-continue-title" className="space-y-6">
            <h2
              id="home-continue-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Kaldığın yerden devam et
            </h2>
            {isResumeLoading && resumeEntries.length === 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Skeleton className="h-56 rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {resumeEntries.map((entry) => resumeCardFor(entry))}
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="home-tutors-title" className="space-y-6">
          <HomeSectionHeader
            headingId="home-tutors-title"
            title="Hocaları keşfet"
            description="Doğrulanmış hocaları puanına, dersine ve fiyatına göre karşılaştır."
            href="/tutors"
            action="Tüm hocaları gör"
            onAction={() =>
              trackHomeEvent("home_all_tutors_clicked", { placement: "tutor_section" })
            }
          />

          {examTabs.length > 0 && (
            <CategoryNavPills
              label="Sınava göre hocalar"
              items={examTabs}
              activeId={examTab}
              onSelect={(id) => {
                setExamTab(id);
                trackHomeEvent("home_tutor_tab_changed", { exam_type: id });
              }}
            />
          )}

          {tutorsQuery.isLoading ? (
            <HomeCardRow>
              {[0, 1, 2].map((item) => (
                <TutorCardSkeleton key={item} />
              ))}
            </HomeCardRow>
          ) : tutorsQuery.isError ? (
            <div className="space-y-3">
              <ErrorMessage message="Hoca önerileri şu anda yüklenemedi. Tüm hocaları görüntülemeye devam edebilirsin." />
              <Button variant="outline" onClick={() => void tutorsQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Tekrar dene
              </Button>
            </div>
          ) : tutors.length > 0 ? (
            <HomeCardRow>
              {tutors.map((tutor, index) =>
                renderTutorCard(tutor, index, "tutor_section")
              )}
            </HomeCardRow>
          ) : (
            <EmptyState
              title={
                examTab === HOME_TUTOR_TAB_ALL
                  ? "Şu anda gösterilecek hoca yok."
                  : `${examTab} için şu anda hoca yok.`
              }
              description="Diğer sınavları ve dersleri hoca aramasından inceleyebilirsin."
              action={
                <Button asChild variant="outline">
                  <Link
                    href="/tutors"
                    onClick={() =>
                      trackHomeEvent("home_all_tutors_clicked", {
                        placement: "tutor_empty_state",
                      })
                    }
                  >
                    Hoca aramasına git
                  </Link>
                </Button>
              }
            />
          )}
        </section>

        {/* Favorites only exist as a section when the student really has some. */}
        {favoriteTutors.length > 0 && (
          <section aria-labelledby="home-favorites-title" className="space-y-6">
            <HomeSectionHeader
              headingId="home-favorites-title"
              title="Favori hocaların"
              description="Daha önce kaydettiğin hocalar."
              href="/tutors?favorites=1"
              action="Tümünü gör"
              onAction={() =>
                trackHomeEvent("home_all_tutors_clicked", { placement: "favorites" })
              }
            />
            <HomeCardRow>
              {favoriteTutors.map((tutor, index) =>
                renderTutorCard(tutor, index, "favorites")
              )}
            </HomeCardRow>
          </section>
        )}

        <section aria-labelledby="home-packages-title" className="space-y-6">
          <HomeSectionHeader
            headingId="home-packages-title"
            title="Hedefine göre çalışma paketleri"
            description="Sınavına ve seviyene uygun hazır yol haritalarını keşfet."
            href="/dashboard/student"
            action="Panelime git"
          />

          {templatesQuery.isLoading && learningQuery.isLoading ? (
            <HomeCardRow>
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-[390px] rounded-2xl" />
              ))}
            </HomeCardRow>
          ) : templatesQuery.isError && learningQuery.isError ? (
            <div className="space-y-3">
              <ErrorMessage message="Çalışma paketleri şu anda yüklenemedi." />
              <Button asChild variant="outline">
                <Link href="/dashboard/student">Panelime git</Link>
              </Button>
            </div>
          ) : packageTemplates.length > 0 ? (
            <HomeCardRow>
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
            </HomeCardRow>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 font-medium">Hazır paketler yakında burada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Yeni içerikler yakında burada olacak.
              </p>
            </div>
          )}
        </section>

        {questionResourcesEnabled && (
          <section aria-labelledby="home-practice-title" className="space-y-6">
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
                onClick={() =>
                  trackHomeEvent("home_all_tutors_clicked", { placement: "closing_cta" })
                }
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

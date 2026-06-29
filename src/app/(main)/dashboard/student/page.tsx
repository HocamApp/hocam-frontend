"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Target } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { createStudentGoal, fetchLearningDashboard } from "@/lib/learningApi";
import {
  fetchLessonRequests,
  fetchBookings,
  updateBookingStatus,
  withdrawLessonRequest,
} from "@/lib/lessonsApi";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { BookingCard } from "@/components/lessons/BookingCard";
import { LessonRequestCard } from "@/components/lessons/LessonRequestCard";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Booking,
  LearningActivityStatus,
  LearningLevel,
  NextLearningMilestone,
  StudentGoalStatus,
  StudentMilestoneStatus,
} from "@/types";
import { toast } from "sonner";

function formatLevel(level: LearningLevel) {
  const labels: Record<LearningLevel, string> = {
    beginner: "Başlangıç",
    intermediate: "Orta",
    advanced: "İleri",
  };

  return labels[level] ?? level;
}

function formatMilestoneStatus(status: StudentMilestoneStatus) {
  const labels: Record<StudentMilestoneStatus, string> = {
    not_started: "Başlamadı",
    planned: "Planlandı",
    in_progress: "Devam ediyor",
    pending_confirmation: "Onay bekliyor",
    completed: "Tamamlandı",
  };

  return labels[status] ?? status;
}

function formatGoalStatus(status: StudentGoalStatus) {
  const labels: Record<StudentGoalStatus, string> = {
    active: "Aktif",
    completed: "Tamamlandı",
    paused: "Duraklatıldı",
    archived: "Arşivlendi",
  };

  return labels[status] ?? status;
}

function formatActivityStatus(status: LearningActivityStatus) {
  const labels: Record<LearningActivityStatus, string> = {
    planned: "Planlandı",
    pending_confirmation: "Onay bekliyor",
    confirmed: "Onaylandı",
    cancelled: "İptal edildi",
  };

  return labels[status] ?? status;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Tarih bekleniyor";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarih bekleniyor";

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours: number): string {
  if (!hours) return "0";
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function buildTutorSearchHref(item: NextLearningMilestone) {
  const params = new URLSearchParams({
    learning_goal_id: item.cta.query.learning_goal_id,
    learning_milestone_id: item.cta.query.learning_milestone_id,
  });

  if (item.cta.query.learning_topic_id) {
    params.set("learning_topic_id", item.cta.query.learning_topic_id);
  }

  return `/tutors?${params.toString()}`;
}

function ProgressBar({ value }: { value: number }) {
  const progress = Math.max(0, Math.min(100, value));

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      aria-label={`İlerleme yüzde ${progress}`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  isLoading,
}: {
  label: string;
  value: string | number;
  detail: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 text-3xl font-bold tracking-normal">{value}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyLearningCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-5 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

function LearningSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StudentDashboardContent() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [withdrawingRequestId, setWithdrawingRequestId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());

  const {
    data: learningDashboard,
    isLoading: learningLoading,
    isError: learningError,
  } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: lessonRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["lesson-requests"],
    queryFn: fetchLessonRequests,
    enabled: isAuthenticated,
  });

  const startGoalMutation = useMutation({
    mutationFn: (templateId: string) => createStudentGoal({ template: templateId }),
    onSuccess: async () => {
      toast.success("Hedef başlatıldı.");
      await queryClient.invalidateQueries({ queryKey: ["learning-dashboard"] });
    },
    onError: () => {
      toast.error("Hedef başlatılamadı.");
    },
  });

  const activeLessonRequests = lessonRequests.filter((lr) => {
    const s = (lr.status || "").toLowerCase();
    return s === "pending" || s === "accepted";
  });

  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });

  const handleStatusUpdate = async (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      refetchBookings();
    } catch {
      toast.error("Rezervasyon güncellenemedi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWithdrawRequest = async (lessonRequestId: string) => {
    setWithdrawingRequestId(lessonRequestId);
    try {
      await withdrawLessonRequest(lessonRequestId);
      await queryClient.invalidateQueries({ queryKey: ["lesson-requests"] });
    } catch {
      toast.error("Ders talebi geri alınamadı.");
    } finally {
      setWithdrawingRequestId(null);
    }
  };

  const now = new Date();
  const upcomingConfirmed =
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      return s === "confirmed" && new Date(b.start_time) > now;
    }) ?? [];
  const pendingBookings =
    bookings?.filter((b) => (b.status || "").toLowerCase() === "pending") ?? [];
  const pastBookings =
    bookings?.filter((b) => {
      const s = (b.status || "").toLowerCase();
      const isConfirmedPast =
        s === "confirmed" && new Date(b.start_time) <= now;
      return s === "completed" || s === "cancelled" || isConfirmedPast;
    }) ?? [];
  const completedBookings =
    bookings?.filter((b) => (b.status || "").toLowerCase() === "completed") ?? [];
  const completedHours =
    completedBookings.reduce((sum, b) => sum + (b.duration_minutes || 0), 0) / 60;

  const templates = learningDashboard?.templates ?? [];
  const goals = learningDashboard?.goals ?? [];
  const nextMilestones = learningDashboard?.next_milestones ?? [];
  const pendingConfirmations = learningDashboard?.pending_confirmations ?? [];
  const notes = learningDashboard?.notes ?? [];
  const recentProgress = learningDashboard?.recent_progress ?? [];
  const stats = learningDashboard?.stats;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div>
              <div className="mb-4 flex w-fit items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Learning hub
              </div>
              <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
                Öğrenci Panosu
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Hedeflerini takip et, sıradaki konunu seç ve derslerinden ilerleme kazan.
              </p>
              {user?.email && (
                <p className="mt-4 text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
            <div className="grid min-w-[12rem] gap-3 rounded-2xl border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sıradaki odak</p>
                  <p className="text-xs text-muted-foreground">
                    {nextMilestones[0]?.title ?? "Hedef seçmeye hazır"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Aktif hedefler"
            value={stats?.active_goals_count ?? "-"}
            detail="Şu anda takip ettiğin hedefler"
            isLoading={learningLoading}
          />
          <StatCard
            label="Ortalama ilerleme"
            value={stats ? `%${Math.round(stats.average_progress)}` : "-"}
            detail="Aktif planların genel ritmi"
            isLoading={learningLoading}
          />
          <StatCard
            label="Açık milestone"
            value={stats?.open_milestones_count ?? "-"}
            detail="Devam eden konu adımları"
            isLoading={learningLoading}
          />
          <StatCard
            label="Tutor onayı bekleyen"
            value={stats?.pending_confirmations_count ?? "-"}
            detail="Ders sonrası ilerleme onayları"
            isLoading={learningLoading}
          />
        </section>

        {learningLoading && (
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-48 rounded-2xl" />
            ))}
          </div>
        )}

        {learningError && (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertDescription>
              Öğrenme paneli şu anda hazırlanıyor. Ders talepleri ve rezervasyonlarınızı kullanmaya devam edebilirsiniz.
            </AlertDescription>
          </Alert>
        )}

        {!learningLoading && !learningError && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-8">
            <LearningSection title="Hazır Hedef Paketleri">
              {templates.length === 0 ? (
                <EmptyLearningCard
                  title="Hazır paketler yakında burada"
                  description="Backend hazır olduğunda YKS hedef paketlerini buradan seçebileceksin."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((template) => {
                    const goalExists = goals.some((goal) => goal.template === template.id);
                    const isStarting =
                      startGoalMutation.isPending &&
                      startGoalMutation.variables === template.id;

                    return (
                      <article
                        key={template.id}
                        className="flex min-h-64 flex-col rounded-2xl border bg-card p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {template.exam_type} / {template.subject_name}
                          </span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                            {formatLevel(template.level)}
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold tracking-normal">
                          {template.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <div className="mt-auto pt-5">
                          <p className="mb-3 text-xs font-medium text-muted-foreground">
                            {template.estimated_milestones} milestone
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={goalExists || startGoalMutation.isPending}
                            onClick={() => startGoalMutation.mutate(template.id)}
                          >
                            {goalExists
                              ? "Hedefe eklendi"
                              : isStarting
                                ? "Başlatılıyor..."
                                : "Hedefe başla"}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </LearningSection>

            <LearningSection title="Aktif Hedeflerim">
              {goals.length === 0 ? (
                <EmptyLearningCard
                  title="Henüz aktif hedefin yok"
                  description="Hazır paketlerden birini seçerek öğrenme planını başlatabileceksin."
                />
              ) : (
                <div className="grid gap-4">
                  {goals.map((goal) => (
                    <article key={goal.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold tracking-normal">
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {formatGoalStatus(goal.status)}
                        </span>
                      </div>
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Genel ilerleme</span>
                          <span className="font-medium">%{goal.progress}</span>
                        </div>
                        <ProgressBar value={goal.progress} />
                      </div>
                      <div className="mt-5 grid gap-3">
                        {goal.milestones.slice(0, 4).map((milestone) => (
                          <div
                            key={milestone.id}
                            className="rounded-xl border bg-background p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{milestone.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatMilestoneStatus(milestone.status)}
                                </p>
                              </div>
                              <span className="text-sm font-semibold">
                                %{milestone.progress}
                              </span>
                            </div>
                            <div className="mt-3">
                              <ProgressBar value={milestone.progress} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </LearningSection>

            <LearningSection title="Sıradaki Konular">
              {nextMilestones.length === 0 ? (
                <EmptyLearningCard
                  title="Sıradaki konu bekleniyor"
                  description="Aktif hedeflerinde açık milestone oluştuğunda burada görünecek."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {nextMilestones.map((item) => (
                    <article key={item.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                          <Clock3 className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="font-semibold tracking-normal">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.goal_title}
                          </p>
                          {item.topic_title && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Konu: {item.topic_title}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">İlerleme</span>
                          <span className="font-medium">%{item.progress}</span>
                        </div>
                        <ProgressBar value={item.progress} />
                      </div>
                      <Button asChild className="mt-5 w-full">
                        <Link href={buildTutorSearchHref(item)}>
                          Bu konu için hoca bul
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </LearningSection>
          </div>

          <aside className="space-y-6">
            <LearningSection title="Tutor Onayı Bekleyenler">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                {pendingConfirmations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Onay bekleyen ilerleme yok.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingConfirmations.map((item) => (
                      <article key={item.id} className="rounded-xl border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {item.milestone?.title ?? "Milestone"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.booking?.tutor
                                ? `${item.booking.tutor.name} ${item.booking.tutor.surname}`
                                : "Tutor bilgisi bekleniyor"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(item.booking?.start_time)}
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                            {formatActivityStatus(item.status)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </LearningSection>

            <LearningSection title="Notlarım">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz not eklemedin.</p>
                ) : (
                  <div className="space-y-4">
                    {notes.slice(0, 4).map((note) => (
                      <article key={note.id} className="rounded-xl border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{note.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {note.body}
                            </p>
                          </div>
                          {note.is_pinned && (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              Sabit
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </LearningSection>

            <LearningSection title="Son İlerleme">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                {recentProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz ilerleme kaydı yok.</p>
                ) : (
                  <div className="space-y-4">
                    {recentProgress.slice(0, 5).map((event) => (
                      <article key={event.id} className="rounded-xl border bg-background p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-primary/10 p-2 text-primary">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">+{event.progress_delta}%</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(event.created_at)}
                            </p>
                            {event.tutor_note && (
                              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                {event.tutor_note}
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </LearningSection>
          </aside>
        </div>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">Ders Özeti</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Tamamlanan ders"
              value={completedBookings.length}
              detail="Bugüne kadar aldığın dersler"
              isLoading={bookingsLoading}
            />
            <StatCard
              label="Toplam ders saati"
              value={formatHours(completedHours)}
              detail="Tamamlanan derslerin toplam süresi"
              isLoading={bookingsLoading}
            />
            <StatCard
              label="Yaklaşan onaylı ders"
              value={upcomingConfirmed.length}
              detail="Onaylanmış, henüz gerçekleşmemiş dersler"
              isLoading={bookingsLoading}
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-normal">Ders Yönetimi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ders taleplerin ve rezervasyonların eskisi gibi buradan yönetilir.
            </p>
          </div>

          <Tabs defaultValue="requests">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">Ders Taleplerim</TabsTrigger>
              <TabsTrigger value="bookings">Rezervasyonlarım</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-6">
              {requestsLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))}
                </div>
              )}
              {!requestsLoading && activeLessonRequests.length === 0 && (
                <EmptyState
                  title="Henüz ders talebiniz yok"
                  description="Bir hoca profili ziyaret ederek ders talebi gönderin"
                  action={
                    <Button asChild>
                      <Link href="/tutors">Hoca Bul</Link>
                    </Button>
                  }
                />
              )}
              {!requestsLoading && activeLessonRequests.length > 0 && (
                <div className="space-y-3">
                  {activeLessonRequests.map((lr) => (
                    <LessonRequestCard
                      key={lr.id}
                      lessonRequest={lr}
                      currentUserRole="student"
                      onWithdraw={handleWithdrawRequest}
                      isWithdrawing={withdrawingRequestId === lr.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="mt-6">
              {bookingsLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-lg" />
                  ))}
                </div>
              )}
              {!bookingsLoading && (
                <>
                  <section className="mb-8">
                    <h3 className="mb-3 text-sm font-semibold">Yaklaşan Onaylı Dersler</h3>
                    {upcomingConfirmed.length === 0 ? (
                      <EmptyState
                        title="Yaklaşan onaylı dersiniz yok"
                        description="Hoca ile rezervasyon oluşturulduktan ve onaylandıktan sonra burada görünecek"
                        action={
                          <Button asChild variant="outline" size="sm">
                            <Link href="/tutors">Hoca Bul</Link>
                          </Button>
                        }
                      />
                    ) : (
                      <div className="space-y-3">
                        {upcomingConfirmed.map((b) => (
                          <BookingCard
                            key={b.id}
                            booking={b}
                            currentUserRole="student"
                            onStatusUpdate={handleStatusUpdate}
                            isUpdating={updatingId === b.id}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="mb-8">
                    <h3 className="mb-3 text-sm font-semibold">Onay Bekleyen Rezervasyonlar</h3>
                    {pendingBookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Yok</p>
                    ) : (
                      <div className="space-y-3">
                        {pendingBookings.map((b) => (
                          <BookingCard
                            key={b.id}
                            booking={b}
                            currentUserRole="student"
                            onStatusUpdate={handleStatusUpdate}
                            isUpdating={updatingId === b.id}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="mb-3 text-sm font-semibold">Geçmiş Dersler</h3>
                    {pastBookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Yok</p>
                    ) : (
                      <div className="space-y-3">
                        {pastBookings.map((b) => (
                          <BookingCard
                            key={b.id}
                            booking={b}
                            currentUserRole="student"
                            onStatusUpdate={handleStatusUpdate}
                            onReviewClick={reviewedBookingIds.has(b.id) ? undefined : setReviewBooking}
                            isUpdating={updatingId === b.id}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            isOpen={!!reviewBooking}
            onClose={() => setReviewBooking(null)}
            onSuccess={() => {
              if (reviewBooking) setReviewedBookingIds((prev) => new Set(prev).add(reviewBooking.id));
              setReviewBooking(null);
              refetchBookings();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <StudentDashboardContent />
    </RouteGuard>
  );
}

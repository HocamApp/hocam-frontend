"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock3,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchLearningDashboard } from "@/lib/learningApi";
import { buildTutorSearchHref } from "@/lib/learning";
import {
  fetchLessonRequests,
  fetchBookings,
  updateBookingStatus,
  withdrawLessonRequest,
} from "@/lib/lessonsApi";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ActiveGoalCard } from "@/components/learning/ActiveGoalCard";
import { GoalPackageCard } from "@/components/learning/GoalPackageCard";
import { ProgressBar } from "@/components/learning/ProgressBar";
import { BookingCard } from "@/components/lessons/BookingCard";
import { LessonRequestCard } from "@/components/lessons/LessonRequestCard";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, LearningActivityStatus } from "@/types";
import { toast } from "sonner";

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

function StatCard({
  icon,
  label,
  value,
  detail,
  isLoading,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-14" />
          ) : (
            <p className="text-xl font-semibold leading-tight">{value}</p>
          )}
        </div>
      </div>
      <p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function EmptyLearningCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed bg-card/50 p-4 text-sm">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
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
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Learning Hub
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Öğrenci Panosu
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Hedeflerini takip et, sıradaki konunu seç ve derslerinden ilerleme kazan.
              {user?.email && <span className="ml-1">· {user.email}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Target className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Sıradaki odak</p>
              <p className="truncate text-sm font-medium">
                {nextMilestones[0]?.title ?? "Hedef seçmeye hazır"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label="Aktif hedefler"
            value={stats?.active_goals_count ?? "-"}
            detail="Şu anda takip ettiğin hedefler"
            isLoading={learningLoading}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
            label="Ortalama ilerleme"
            value={stats ? `%${Math.round(stats.average_progress)}` : "-"}
            detail="Aktif planların genel ritmi"
            isLoading={learningLoading}
          />
          <StatCard
            icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
            label="Açık milestone"
            value={stats?.open_milestones_count ?? "-"}
            detail="Devam eden konu adımları"
            isLoading={learningLoading}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
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
          <div className="space-y-6">
            <LearningSection title="Hazır Hedef Paketleri">
              {templates.length === 0 ? (
                <EmptyLearningCard
                  icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                  title="Hazır paketler yakında burada"
                  description="Backend hazır olduğunda YKS hedef paketlerini buradan seçebileceksin."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {templates.map((template) => (
                    <GoalPackageCard
                      key={template.id}
                      template={template}
                      isAdded={goals.some((goal) => goal.template === template.id)}
                    />
                  ))}
                </div>
              )}
            </LearningSection>

            <LearningSection title="Aktif Hedeflerim">
              {goals.length === 0 ? (
                <EmptyLearningCard
                  icon={<Target className="h-4 w-4" aria-hidden="true" />}
                  title="Henüz aktif hedefin yok"
                  description="Hazır paketlerden birini seçerek öğrenme planını başlatabileceksin."
                />
              ) : (
                <div className="grid gap-4">
                  {goals.map((goal) => (
                    <ActiveGoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
            </LearningSection>

            <LearningSection title="Sıradaki Konular">
              {nextMilestones.length === 0 ? (
                <EmptyLearningCard
                  icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                  title="Sıradaki konu bekleniyor"
                  description="Aktif hedeflerinde açık milestone oluştuğunda burada görünecek."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {nextMilestones.map((item) => (
                    <article key={item.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Clock3 className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold tracking-normal">{item.title}</h3>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {item.goal_title}
                          </p>
                          {item.topic_title && (
                            <p className="mt-1 truncate text-xs text-muted-foreground">
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
              <div className="rounded-xl border bg-card p-4">
                {pendingConfirmations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Onay bekleyen ilerleme yok.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingConfirmations.map((item) => (
                      <article key={item.id} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {item.milestone?.title ?? "Milestone"}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {item.booking?.tutor
                                ? `${item.booking.tutor.name} ${item.booking.tutor.surname}`
                                : "Tutor bilgisi bekleniyor"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(item.booking?.start_time)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300"
                          >
                            {formatActivityStatus(item.status)}
                          </Badge>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </LearningSection>

            <LearningSection title="Notlarım">
              <div className="rounded-xl border bg-card p-4">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz not eklemedin.</p>
                ) : (
                  <div className="space-y-3">
                    {notes.slice(0, 4).map((note) => (
                      <article key={note.id} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{note.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {note.body}
                            </p>
                          </div>
                          {note.is_pinned && (
                            <Badge className="shrink-0 bg-primary/10 text-primary hover:bg-primary/10">
                              Sabit
                            </Badge>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </LearningSection>

            <LearningSection title="Son İlerleme">
              <div className="rounded-xl border bg-card p-4">
                {recentProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz ilerleme kaydı yok.</p>
                ) : (
                  <div className="space-y-3">
                    {recentProgress.slice(0, 5).map((event) => (
                      <article key={event.id} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
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

        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Ders Özeti</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              label="Tamamlanan ders"
              value={completedBookings.length}
              detail="Bugüne kadar aldığın dersler"
              isLoading={bookingsLoading}
            />
            <StatCard
              icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
              label="Toplam ders saati"
              value={formatHours(completedHours)}
              detail="Tamamlanan derslerin toplam süresi"
              isLoading={bookingsLoading}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
              label="Yaklaşan onaylı ders"
              value={upcomingConfirmed.length}
              detail="Onaylanmış, henüz gerçekleşmemiş dersler"
              isLoading={bookingsLoading}
            />
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight">Ders Yönetimi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ders taleplerin ve rezervasyonların eskisi gibi buradan yönetilir.
            </p>
          </div>

          <Tabs defaultValue="requests">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">
                Ders Taleplerim
                {activeLessonRequests.length > 0 && ` (${activeLessonRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="bookings">
                Rezervasyonlarım
                {bookings && bookings.length > 0 && ` (${bookings.length})`}
              </TabsTrigger>
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
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Yaklaşan Onaylı Dersler</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {upcomingConfirmed.length}
                      </span>
                    </div>
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
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Onay Bekleyen Rezervasyonlar</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {pendingBookings.length}
                      </span>
                    </div>
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
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Geçmiş Dersler</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {pastBookings.length}
                      </span>
                    </div>
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

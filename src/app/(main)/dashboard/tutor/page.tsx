"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarDays,
  ExternalLink,
  Info,
  MessageCircle,
  Pencil,
  Star,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchBookings,
  getBookingErrorMessage,
  updateBookingStatus,
} from "@/lib/lessonsApi";
import {
  fetchMyTutorProfile,
  fetchTutorPriceInsight,
  fetchTutorReviewSummary,
  fetchTutorReviews,
  updateMyTutorProfile,
} from "@/lib/tutorsApi";
import { fetchAvailability } from "@/lib/dashboardApi";
import { fetchConversations } from "@/lib/messagingApi";
import { confirmLearningActivity } from "@/lib/learningApi";
import { TutorLaunchProgramCard } from "@/components/tutors/TutorLaunchProgramCard";
import {
  fetchTutorEarnings,
  fetchTutorPackageOffers,
  fetchTutorPackagePurchases,
} from "@/lib/paymentsApi";
import {
  calculatePackagePricing,
  formatPlanDuration,
  MOST_POPULAR_DURATION_DAYS,
  PLAN_DURATION_DAYS,
  WEEKLY_LESSON_OPTIONS,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import { cn, formatDate, formatPrice, formatRating } from "@/lib/utils";
import { useHighlightTarget, HIGHLIGHT_CLASSNAME, HIGHLIGHT_PARAM } from "@/hooks/useHighlightTarget";
import type {
  AvailabilityRule,
  Booking,
  ConfirmLearningActivityPayload,
  LearningLevel,
  PackagePurchase,
  TutorPackageOffer,
  TutorProfile,
  TutorProgressResult,
} from "@/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { TUTOR_DASHBOARD_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { TutorialNudgeBanner } from "@/components/shared/TutorialNudgeBanner";
import StatusBadge from "@/components/shared/StatusBadge";
import { BookingCard, paymentLabel } from "@/components/lessons/BookingCard";
import { canJoinLesson } from "@/components/lessons/LessonJoinButton";
import { LessonMaterialsDialog } from "@/components/lessons/LessonMaterialsDialog";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { AvailabilityCalendar } from "@/components/tutors/AvailabilityCalendar";
import { TutorStudentPrivateWorkspace } from "@/components/tutors/TutorStudentPrivateWorkspace";
import { VerifiedTutorMark } from "@/components/tutors/VerifiedTutorMark";
import { ReviewCard } from "@/components/tutors/ReviewCard";
import { SubjectRatingBreakdown } from "@/components/tutors/SubjectRatingBreakdown";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TUTOR_TABS = [
  { value: "bookings", label: "Rezervasyonlar" },
  { value: "students", label: "Öğrencilerim" },
  { value: "earnings", label: "Ders Özeti" },
  { value: "reviews", label: "Değerlendirmeler" },
  { value: "availability", label: "Müsaitlik" },
  { value: "packages", label: "Paketlerim" },
];

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const DASHBOARD_LIST_PREVIEW_COUNT = 3;
const PAST_BATCH_SIZE = 5;

function getInitials(name?: string, surname?: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

function sortByStartTime(bookings: Booking[]) {
  return [...bookings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}

// "Bugün"/"Yarın" must follow calendar-day boundaries in the user's local
// timezone (booking start_time is treated as local, never UTC), not a raw
// 24h/48h cutoff, so a late-night lesson still reads as "Bugün".
function startOfDay(date: Date): Date {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function isSameCalendarDay(first: Date, second: Date): boolean {
  return startOfDay(first).getTime() === startOfDay(second).getTime();
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

function formatLessonCountdown(startTime: string): string {
  const diffDays = Math.round(
    (startOfDay(new Date(startTime)).getTime() - startOfDay(new Date()).getTime()) /
      (24 * 60 * 60 * 1000)
  );
  if (diffDays < 0) return "";
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Yarın";
  return `Derse ${diffDays} gün kaldı`;
}

interface StudentRosterEntry {
  student: Booking["student"];
  totalLessons: number;
  upcomingLessons: number;
  lastCompletedAt: string | null;
  remainingCredits: number;
  totalCredits: number;
}

function getStudentRoster(
  bookings: Booking[],
  packagePurchases: PackagePurchase[] = []
): StudentRosterEntry[] {
  const roster = new Map<string, StudentRosterEntry>();

  for (const booking of bookings) {
    const status = (booking.status || "").toLowerCase();
    if (status === "cancelled") continue;

    const entry =
      roster.get(booking.student.id) ??
      ({
        student: booking.student,
        totalLessons: 0,
        upcomingLessons: 0,
        lastCompletedAt: null,
        remainingCredits: 0,
        totalCredits: 0,
      } satisfies StudentRosterEntry);

    entry.totalLessons += 1;
    if (
      (status === "pending" || status === "confirmed") &&
      new Date(booking.start_time) > new Date()
    ) {
      entry.upcomingLessons += 1;
    }
    if (
      status === "completed" &&
      (!entry.lastCompletedAt ||
        new Date(booking.start_time) > new Date(entry.lastCompletedAt))
    ) {
      entry.lastCompletedAt = booking.start_time;
    }

    roster.set(booking.student.id, entry);
  }

  // Only enriches students who already have a booking-derived roster entry —
  // a student who bought a package but hasn't booked a lesson yet won't
  // appear here, since the roster itself is seeded purely from bookings.
  for (const purchase of packagePurchases) {
    if (purchase.status !== "paid") continue;
    const entry = roster.get(purchase.student.id);
    if (!entry) continue;
    entry.remainingCredits += purchase.remaining_credits;
    entry.totalCredits += purchase.total_credits;
  }

  return Array.from(roster.values()).sort((a, b) => {
    if (b.upcomingLessons !== a.upcomingLessons) {
      return b.upcomingLessons - a.upcomingLessons;
    }
    return b.totalLessons - a.totalLessons;
  });
}

function StatTile({
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
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-14" />
          ) : (
            <p className="text-2xl font-semibold leading-tight">{value}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentRosterCard({
  entry,
  onSelect,
}: {
  entry: StudentRosterEntry;
  onSelect: (studentId: string) => void;
}) {
  const {
    student,
    totalLessons,
    upcomingLessons,
    lastCompletedAt,
    remainingCredits,
    totalCredits,
  } = entry;
  const name = student.display_name || student.email;
  const [firstName, lastName] = name.trim().split(/\s+/);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(student.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(student.id);
        }
      }}
      className="cursor-pointer transition-colors hover:bg-muted/40"
    >
      <CardContent className="flex items-start gap-3 p-4">
        <Avatar className="h-10 w-10 shrink-0">
          {student.avatar_url ? (
            <AvatarImage src={student.avatar_url} alt={name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(firstName, lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              {student.display_name && (
                <p className="truncate text-sm text-muted-foreground">{student.email}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {totalCredits > 0 && (
                <Badge variant="outline" className="shrink-0">
                  {remainingCredits}/{totalCredits} paket hakkı
                </Badge>
              )}
              {upcomingLessons > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {upcomingLessons} yaklaşan
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {lastCompletedAt
                ? `Son ders: ${formatDate(lastCompletedAt)}`
                : "Henüz ders tamamlanmadı"}
            </span>
            <span>{totalLessons} ders</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const body = data as Record<string, unknown>;
  if (typeof body.detail === "string") {
    return body.detail;
  }

  for (const value of Object.values(body)) {
    if (Array.isArray(value) && value[0]) {
      return String(value[0]);
    }
    if (typeof value === "string") {
      return value;
    }
  }

  return fallback;
}

function formatLearningLevel(level: LearningLevel | "") {
  const labels: Record<LearningLevel | "", string> = {
    "": "Seçme",
    beginner: "Başlangıç",
    intermediate: "Orta",
    advanced: "İleri",
  };

  return labels[level] ?? level;
}

function LearningProgressConfirmModal({
  booking,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  booking: Booking;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ConfirmLearningActivityPayload) => void;
}) {
  const [progressResult, setProgressResult] = useState<TutorProgressResult>("good");
  const [tutorNote, setTutorNote] = useState("");
  const [studentLevel, setStudentLevel] = useState<LearningLevel | "">("");
  const milestoneTitle = booking.learning_context?.milestone?.title;

  useEffect(() => {
    setProgressResult("good");
    setTutorNote("");
    setStudentLevel("");
  }, [booking.id]);

  const handleSubmit = () => {
    onSubmit({
      progress_result: progressResult,
      ...(tutorNote.trim() ? { tutor_note: tutorNote.trim() } : {}),
      student_level_after_lesson: studentLevel,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>İlerlemeyi Onayla</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Öğrenci:</span>{" "}
              {booking.student.email}
            </p>
            <p>
              <span className="text-muted-foreground">Ders:</span>{" "}
              {booking.subject.name}
            </p>
            {milestoneTitle && (
              <p>
                <span className="text-muted-foreground">Milestone:</span>{" "}
                {milestoneTitle}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>İlerleme sonucu</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "low", label: "Düşük ilerleme" },
                { value: "good", label: "İyi ilerleme" },
                { value: "completed", label: "Milestone tamamlandı" },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={progressResult === option.value ? "default" : "outline"}
                  onClick={() => setProgressResult(option.value as TutorProgressResult)}
                  disabled={isSubmitting}
                  className="h-auto min-h-10 whitespace-normal"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutor-note">Hoca notu</Label>
            <Textarea
              id="tutor-note"
              value={tutorNote}
              onChange={(event) => setTutorNote(event.target.value)}
              placeholder="Öğrencinin güçlü olduğu noktalar ve sonraki önerin..."
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Ders sonrası seviye</Label>
            <Select
              value={studentLevel || "__none__"}
              onValueChange={(value) =>
                setStudentLevel(value === "__none__" ? "" : (value as LearningLevel))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["", "beginner", "intermediate", "advanced"] as Array<
                  LearningLevel | ""
                >).map((level) => (
                  <SelectItem key={level || "__none__"} value={level || "__none__"}>
                    {formatLearningLevel(level)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Onaylanıyor..." : "Onayla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudentDetailDialog({
  entry,
  bookings,
  open,
  onOpenChange,
  onStatusUpdate,
  onConfirmLearningProgress,
  onMaterialsClick,
  updatingId,
  confirmingBookingId,
  isConfirmingLearning,
}: {
  entry: StudentRosterEntry | null;
  bookings: Booking[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => void;
  onConfirmLearningProgress: (booking: Booking) => void;
  onMaterialsClick: (booking: Booking) => void;
  updatingId: string | null;
  confirmingBookingId: string | null;
  isConfirmingLearning: boolean;
}) {
  if (!entry) return null;

  const { student, remainingCredits, totalCredits } = entry;
  const name = student.display_name || student.email;
  const [firstName, lastName] = name.trim().split(/\s+/);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(firstName, lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="truncate">{name}</DialogTitle>
              {student.display_name && (
                <p className="truncate text-sm text-muted-foreground">{student.email}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        {totalCredits > 0 && (
          <Badge variant="outline" className="w-fit">
            {remainingCredits}/{totalCredits} paket hakkı
          </Badge>
        )}

        <TutorStudentPrivateWorkspace studentId={student.id} />

        <div className="space-y-3">
          {bookings.length === 0 ? (
            <EmptyState
              title="Henüz ders yok"
              description="Bu öğrenciyle henüz bir rezervasyon bulunmuyor."
            />
          ) : (
            bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                currentUserRole="tutor"
                onStatusUpdate={onStatusUpdate}
                onConfirmLearningProgress={onConfirmLearningProgress}
                onMaterialsClick={onMaterialsClick}
                isUpdating={updatingId === b.id}
                isConfirmingLearning={isConfirmingLearning && confirmingBookingId === b.id}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TutorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() =>
    TUTOR_TABS.some((tab) => tab.value === searchParams.get("tab"))
      ? searchParams.get("tab")!
      : "overview"
  );
  // Keep the focused management view synchronized with URL-driven navigation
  // (notifications, home shortcuts and browser history all use ?tab=...).
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam && tabParam !== activeTab && TUTOR_TABS.some((tab) => tab.value === tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam && activeTab !== "overview") {
      setActiveTab("overview");
    }
  }, [tabParam, activeTab]);
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [isConfirmingLearning, setIsConfirmingLearning] = useState(false);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showAllUpcomingBookings, setShowAllUpcomingBookings] = useState(false);
  const [visiblePastCount, setVisiblePastCount] = useState(PAST_BATCH_SIZE);
  const pastLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated,
  });

  const {
    data: bookings,
    isLoading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    enabled: isAuthenticated,
  });
  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: isAuthenticated,
  });
  const highlightedBookingId = useHighlightTarget(
    !bookingsLoading && !!bookings && activeTab === "bookings"
  );
  // /api/bookings/ already returns the tutor's entire booking history
  // unfiltered (see BookingListCreateView.get_queryset) — no separate
  // by-id fetch is needed to reach a booking outside the preview slices,
  // it's already sitting in `bookings`; the sections below just need to
  // splice it in if the notification target isn't in the default slice.
  const highlightBookingId = searchParams.get(HIGHLIGHT_PARAM);
  const highlightTargetBooking = highlightBookingId
    ? bookings?.find((b) => b.id === highlightBookingId)
    : undefined;

  const { data: availability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
    enabled: isAuthenticated,
  });

  const {
    data: earnings,
    isLoading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ["tutor-earnings"],
    queryFn: fetchTutorEarnings,
    enabled: isAuthenticated,
  });

  const {
    data: packageOffers,
    isLoading: packageOffersLoading,
    error: packageOffersError,
    refetch: refetchPackageOffers,
  } = useQuery({
    queryKey: ["tutor-package-offers"],
    queryFn: fetchTutorPackageOffers,
    enabled: isAuthenticated,
  });

  // Reuses the same price-insight endpoint /dashboard/tutor/edit's pricing
  // section already calls — commission_rate_bps is single-sourced from the
  // backend's TUTOR_ESTIMATED_COMMISSION_BPS, never hardcoded here.
  const { data: priceInsight } = useQuery({
    queryKey: ["tutor-price-insight", (profile?.subjects ?? []).map((s) => s.id).sort()],
    queryFn: () => fetchTutorPriceInsight((profile?.subjects ?? []).map((s) => s.id)),
    enabled: isAuthenticated && Boolean(profile),
  });
  const [selectedPackageFrequency, setSelectedPackageFrequency] =
    useState<WeeklyLessonOption>(2);
  const packageCommissionRate = (priceInsight?.commission_rate_bps ?? 0) / 10_000;
  // Grouped by frequency, NOT filtered to is_offered — the picker below
  // renders every catalog plan and dims the ones this tutor has turned
  // off, rather than silently omitting them (that's the whole point of
  // this tab: showing what a student sees AND what you've turned off).
  // Absence of a TutorPackageOffer row still means "offered at catalog
  // discount" — effective_discount_percent already resolves that
  // server-side, never assume all 20 rows exist.
  const packagesByFrequency = useMemo(() => {
    const map = new Map<number, TutorPackageOffer[]>();
    for (const plan of packageOffers ?? []) {
      const list = map.get(plan.lessons_per_week) ?? [];
      list.push(plan);
      map.set(plan.lessons_per_week, list);
    }
    for (const list of Array.from(map.values())) {
      list.sort((a, b) => a.duration_days - b.duration_days);
    }
    return map;
  }, [packageOffers]);

  const { data: packagePurchases = [] } = useQuery({
    queryKey: ["tutor-package-purchases"],
    queryFn: fetchTutorPackagePurchases,
    enabled: isAuthenticated,
  });

  // Public review endpoints require both is_verified and is_public — an
  // unverified or currently-private tutor gets a 404 querying even their own
  // id, so we never issue the request in that case (see reviews TabsContent
  // for the corresponding empty-state copy).
  const canViewOwnReviews = isAuthenticated && !!profile?.is_verified && !!profile?.is_public;

  const {
    data: tutorReviews = [],
    isLoading: reviewsTabLoading,
    error: reviewsTabError,
    refetch: refetchTutorReviews,
  } = useQuery({
    queryKey: ["tutor-reviews", profile?.id],
    queryFn: () => fetchTutorReviews(profile!.id),
    enabled: canViewOwnReviews,
  });

  const {
    data: tutorReviewSummary,
    isLoading: reviewSummaryLoading,
    error: reviewSummaryError,
    refetch: refetchReviewSummary,
  } = useQuery({
    queryKey: ["tutor-review-summary", profile?.id],
    queryFn: () => fetchTutorReviewSummary(profile!.id),
    enabled: canViewOwnReviews,
  });

  useEffect(() => {
    if (profile && !profile.is_verified) {
      router.replace("/tutor/onboarding");
    }
  }, [profile, router]);

  const activeBookings = useMemo(
    () =>
      bookings?.filter((b) => {
        const s = (b.status || "").toLowerCase();
        const isFuture = new Date(b.start_time) > new Date();
        return (
          (s === "pending" && isFuture) ||
          s === "confirmed" ||
          s === "in_progress" ||
          s === "awaiting_confirmation"
        );
      }) ?? [],
    [bookings]
  );

  const pastBookings = useMemo(
    () =>
      bookings?.filter((b) => {
        const s = (b.status || "").toLowerCase();
        const isPastPending = s === "pending" && new Date(b.start_time) <= new Date();
        return (
          isPastPending ||
          s === "completed" ||
          s === "cancelled" ||
          s === "disputed" ||
          s === "expired"
        );
      }) ?? [],
    [bookings]
  );

  const studentRoster = useMemo(
    () => getStudentRoster(bookings ?? [], packagePurchases),
    [bookings, packagePurchases]
  );

  const selectedStudentEntry = useMemo(
    () => studentRoster.find((e) => e.student.id === selectedStudentId) ?? null,
    [studentRoster, selectedStudentId]
  );

  const selectedStudentBookings = useMemo(
    () =>
      selectedStudentId
        ? sortByStartTime((bookings ?? []).filter((b) => b.student.id === selectedStudentId))
        : [],
    [bookings, selectedStudentId]
  );

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return sortByStartTime(
      (bookings ?? []).filter((b) => {
        const s = (b.status || "").toLowerCase();
        return s === "in_progress" || (s === "confirmed" && new Date(b.start_time) > now);
      })
    );
  }, [bookings]);
  const nextBooking = upcomingBookings[0] ?? null;
  const nextBookingStudentName = nextBooking
    ? nextBooking.student.display_name || nextBooking.student.email
    : "";
  const nextBookingCountdown = nextBooking ? formatLessonCountdown(nextBooking.start_time) : "";
  const nextBookingConversationId = nextBooking
    ? nextBooking.conversation_id ??
      conversations.find(
        (conversation) => conversation.student === nextBooking.student.id
      )?.id
    : null;
  const allTodayBookings = upcomingBookings.filter((booking) =>
    isSameCalendarDay(new Date(booking.start_time), new Date())
  );
  const todayBookings = allTodayBookings.slice(0, DASHBOARD_LIST_PREVIEW_COUNT);
  const activePackageCount = packageOffers?.filter((offer) => offer.is_offered).length ?? 0;

  const pendingActionBookings = useMemo(
    () =>
      (bookings ?? []).filter((b) => {
        const s = (b.status || "").toLowerCase();
        if (
          (s === "pending" && new Date(b.start_time) > new Date()) ||
          s === "disputed" ||
          s === "awaiting_confirmation"
        ) return true;
        return (
          s === "completed" &&
          Boolean(b.learning_context?.activity_id) &&
          b.learning_context?.status === "pending_confirmation"
        );
      }),
    [bookings]
  );

  const completedBookings = pastBookings.filter((b) => b.status === "completed");

  const availabilityDays = useMemo(
    () => Array.from(new Set(availability.map((r) => r.day_of_week))).sort((a, b) => a - b),
    [availability]
  );
  const sortedUpcomingBookings = useMemo(() => sortByStartTime(activeBookings), [activeBookings]);
  const sortedPastBookings = useMemo(
    () => [...pastBookings].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()),
    [pastBookings]
  );
  const baseVisibleUpcomingBookings = showAllUpcomingBookings
    ? sortedUpcomingBookings
    : sortedUpcomingBookings.slice(0, DASHBOARD_LIST_PREVIEW_COUNT);
  // If the notification's target booking belongs to this bucket but fell
  // outside the default preview slice, splice it back in (keeping its
  // natural chronological position) so useHighlightTarget can find and
  // flash it — without touching the slice when there's no highlight param.
  const visibleUpcomingBookings =
    highlightTargetBooking &&
    sortedUpcomingBookings.some((b) => b.id === highlightTargetBooking.id) &&
    !baseVisibleUpcomingBookings.some((b) => b.id === highlightTargetBooking.id)
      ? sortedUpcomingBookings.filter(
          (b, index) => index < baseVisibleUpcomingBookings.length || b.id === highlightTargetBooking.id
        )
      : baseVisibleUpcomingBookings;

  const basePastVisibleBookings = sortedPastBookings.slice(0, visiblePastCount);
  const visiblePastBookings =
    highlightTargetBooking &&
    sortedPastBookings.some((b) => b.id === highlightTargetBooking.id) &&
    !basePastVisibleBookings.some((b) => b.id === highlightTargetBooking.id)
      ? sortedPastBookings.filter(
          (b, index) => index < basePastVisibleBookings.length || b.id === highlightTargetBooking.id
        )
      : basePastVisibleBookings;
  const visibleReviews = showAllReviews
    ? tutorReviews
    : tutorReviews.slice(0, DASHBOARD_LIST_PREVIEW_COUNT);

  useEffect(() => {
    const target = pastLoadMoreRef.current;
    if (!target || visiblePastCount >= sortedPastBookings.length) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisiblePastCount((count) => Math.min(count + PAST_BATCH_SIZE, sortedPastBookings.length));
    }, { rootMargin: "240px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [visiblePastCount, sortedPastBookings.length]);

  const handleStatusUpdate = async (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      refetchBookings();
      toast.success("Rezervasyon güncellendi.");
    } catch (error) {
      toast.error(getBookingErrorMessage(error, "Rezervasyon güncellenemedi."));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmLearningProgress = async (
    payload: ConfirmLearningActivityPayload
  ) => {
    const activityId = confirmingBooking?.learning_context?.activity_id;
    if (!activityId) {
      toast.error("İlerleme onaylanamadı.");
      return;
    }

    setIsConfirmingLearning(true);
    try {
      await confirmLearningActivity(activityId, payload);
      toast.success("İlerleme onaylandı.");
      setConfirmingBooking(null);
      await refetchBookings();
      await queryClient.invalidateQueries({ queryKey: ["learning-dashboard"] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "İlerleme onaylanamadı."));
    } finally {
      setIsConfirmingLearning(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          title="Hoca profilin hazır değil"
          description="Panosunu kullanmak için önce hoca profilini oluştur."
          action={
            <Button asChild>
              <Link href="/tutor/onboarding">Kuruluma Başla</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!profile.is_verified) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-80 w-full" /></div>;
  }

  return (
    <div className="w-full py-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4">
        <TutorialNudgeBanner />
      </div>
      <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border border-border/70">
            {profile.profile_picture ? (
              <AvatarImage
                src={profile.profile_picture}
                alt={`${profile.name} ${profile.surname}`}
              />
            ) : null}
            <AvatarFallback className="bg-muted text-base font-semibold text-foreground">
              {getInitials(profile.name, profile.surname)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{getGreeting()}, {profile.name} 👋</h1>
              <VerifiedTutorMark verified={profile.is_verified} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {allTodayBookings.length > 0
                ? `Bugün ${allTodayBookings.length} dersin var${nextBooking ? ` · İlki ${new Date(nextBooking.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}’da` : ""}.`
                : "Bugün planlanmış dersin yok. Programını ve öğrencilerini buradan yönetebilirsin."}
            </p>
          </div>
        </div>
      </header>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4">
      {activeTab === "overview" ? (
        <div className="space-y-6">
      {nextBooking ? (
        <Card className="overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 items-center gap-4">
                <ParticipantAvatar
                  name={nextBookingStudentName}
                  avatarUrl={nextBooking.student.avatar_url}
                  className="h-16 w-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">
                    Sıradaki dersin
                  </p>
                  <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{nextBooking.subject.name}</p>
                  <p className="mt-1 truncate text-base text-muted-foreground">{nextBookingStudentName} · {nextBooking.duration_minutes} dk</p>
                </div>
              </div>
              <div className="flex min-w-[150px] flex-col rounded-xl border bg-muted/20 px-5 py-4 md:items-end">
                <span className="text-sm font-medium text-muted-foreground">{nextBookingCountdown}</span>
                <span className="mt-1 text-3xl font-semibold tracking-tight">
                  {new Date(nextBooking.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">{formatDate(nextBooking.start_time)}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
              {nextBooking.room_url &&
              canJoinLesson(
                nextBooking.start_time,
                nextBooking.duration_minutes,
                nextBooking.status
              ) ? (
                <Button asChild size="lg">
                  <a href={`/session/${nextBooking.id}`}>
                    <Video className="mr-2 h-4 w-4" />
                    Derse Katıl
                  </a>
                </Button>
              ) : nextBooking.room_url ? (
                <Button size="lg" variant="outline" className="h-auto max-w-full whitespace-normal text-center" disabled>
                  Derse katılım başlangıçtan 15 dakika önce açılır
                </Button>
              ) : (
                <Badge variant="outline">Oda onaydan sonra oluşur</Badge>
              )}
              <Button asChild variant="outline">
                <Link href={nextBookingConversationId ? `/messages/${nextBookingConversationId}` : "/messages"}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Öğrenciye Mesaj
                </Link>
              </Button>
              <div className="ml-auto hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <StatusBadge status={nextBooking.status} type="booking" />
                <span>{paymentLabel(nextBooking)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sıradaki dersin</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Takvimin şu anda sakin</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">Müsaitlik saatlerini güncel tutarak öğrencilerin sana uygun zamanlardan rezervasyon yapmasını sağlayabilirsin.</p>
            </div>
            <Button onClick={() => router.push("/dashboard/tutor?tab=availability")}>Müsaitliği düzenle</Button>
          </CardContent>
        </Card>
      )}

      {pendingActionBookings.length > 0 && (
        <button type="button" onClick={() => router.push("/dashboard/tutor?tab=bookings")} className="flex w-full items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-left transition-colors hover:bg-amber-50">
          <span className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-amber-700" /><span><strong className="block text-sm">{pendingActionBookings.length} işlem seni bekliyor</strong><span className="text-sm text-muted-foreground">Onay, itiraz veya ders ilerlemesi gerektiren kayıtlarını kontrol et.</span></span></span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-3">
            <div><CardTitle className="text-xl">Bugünkü programın</CardTitle><p className="mt-1 text-sm text-muted-foreground">Sıradaki derslerine hızlıca göz at.</p></div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/tutor?tab=bookings")}>Tüm dersler <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {bookingsLoading ? <Skeleton className="h-48 w-full" /> : todayBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed px-5 py-10 text-center"><CalendarDays className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 font-medium">Bugün dersin yok</p><p className="mt-1 text-sm text-muted-foreground">Yaklaşan tüm derslerini takvimden görebilirsin.</p></div>
            ) : (
              <div className="divide-y">
                {todayBookings.map((booking) => {
                  const studentName = booking.student.display_name || booking.student.email;
                  return <button key={booking.id} type="button" onClick={() => router.push(`/dashboard/tutor?tab=bookings&${HIGHLIGHT_PARAM}=${booking.id}`)} className="flex w-full items-center gap-4 py-4 text-left first:pt-2 last:pb-0">
                    <ParticipantAvatar name={studentName} avatarUrl={booking.student.avatar_url} className="h-11 w-11 shrink-0 rounded-lg" />
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{booking.subject.name}</strong><span className="mt-0.5 block truncate text-sm text-muted-foreground">{studentName}</span></span>
                    <span className="text-right"><strong className="block text-sm">{new Date(booking.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</strong><span className="text-xs text-muted-foreground">{booking.duration_minutes} dk</span></span>
                  </button>;
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-3">
            <div><CardTitle className="text-xl">Öğrencilerin</CardTitle><p className="mt-1 text-sm text-muted-foreground">{studentRoster.length} aktif öğrenci</p></div>
            <Button variant="ghost" size="icon" aria-label="Tüm öğrenciler" onClick={() => router.push("/dashboard/tutor?tab=students")}><ArrowRight className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {bookingsLoading ? <Skeleton className="h-48 w-full" /> : studentRoster.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center"><Users className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 font-medium">Henüz öğrencin yok</p><p className="mt-1 text-sm text-muted-foreground">İlk rezervasyonun geldiğinde burada göreceksin.</p></div>
            ) : (
              <div className="divide-y">
                {studentRoster.slice(0, 3).map((entry) => {
                  const name = entry.student.display_name || entry.student.email;
                  return <button key={entry.student.id} type="button" onClick={() => setSelectedStudentId(entry.student.id)} className="flex w-full items-center gap-3 py-4 text-left first:pt-2 last:pb-0">
                    <ParticipantAvatar name={name} avatarUrl={entry.student.avatar_url} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{name}</strong><span className="mt-0.5 block text-xs text-muted-foreground">{entry.upcomingLessons > 0 ? `${entry.upcomingLessons} yaklaşan ders` : `${entry.totalLessons} toplam ders`}</span></span>
                    {entry.totalCredits > 0 && <Badge variant="secondary" className="shrink-0">{entry.remainingCredits}/{entry.totalCredits}</Badge>}
                  </button>;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="grid gap-0 p-0 sm:grid-cols-3">
          <button type="button" onClick={() => router.push("/dashboard/tutor?tab=earnings")} className="flex items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/30 sm:border-r">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><BookOpen className="h-5 w-5" /></span><span><span className="block text-2xl font-semibold">{earnings?.last_30_days.lesson_count ?? 0}</span><span className="text-sm text-muted-foreground">Bu ay tamamlanan ders</span></span>
          </button>
          <button type="button" onClick={() => router.push("/dashboard/tutor?tab=students")} className="flex items-center gap-4 border-t px-6 py-5 text-left transition-colors hover:bg-muted/30 sm:border-r sm:border-t-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Users className="h-5 w-5" /></span><span><span className="block text-2xl font-semibold">{studentRoster.length}</span><span className="text-sm text-muted-foreground">Aktif öğrenci</span></span>
          </button>
          <button type="button" onClick={() => router.push("/dashboard/tutor?tab=reviews")} className="flex items-center gap-4 border-t px-6 py-5 text-left transition-colors hover:bg-muted/30 sm:border-t-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Star className="h-5 w-5" /></span><span><span className="block text-2xl font-semibold">{tutorReviewSummary ? formatRating(tutorReviewSummary.overall_rating) : "—"}</span><span className="text-sm text-muted-foreground">{tutorReviewSummary?.review_count ?? 0} değerlendirme</span></span>
          </button>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-semibold">Ayarlar ve görünürlük</h2><p className="mt-1 text-sm text-muted-foreground">Sık değişmeyen işletme ayarların.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Müsaitlik", detail: availabilityLoading ? "Yükleniyor" : availability.length ? `${availabilityDays.length} gün · ${availability.length} zaman aralığı` : "Henüz eklenmedi", icon: CalendarDays, href: "/dashboard/tutor?tab=availability" },
            { title: "Paketlerim", detail: packageOffersLoading ? "Yükleniyor" : `${activePackageCount} aktif paket`, icon: Wallet, href: "/dashboard/tutor?tab=packages" },
            { title: "Değerlendirmeler", detail: `${tutorReviewSummary?.review_count ?? 0} öğrenci yorumu`, icon: Star, href: "/dashboard/tutor?tab=reviews" },
            { title: "Public profil", detail: "Öğrencilerin gördüğü sayfa", icon: ExternalLink, href: `/tutors/${profile.id}` },
          ].map((item) => <Link key={item.title} href={item.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"><item.icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{item.title}</strong><span className="block truncate text-xs text-muted-foreground">{item.detail}</span></span><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></Link>)}
        </div>
        <div className="mt-3 text-right"><Button variant="ghost" size="sm" asChild><Link href="/dashboard/tutor/edit"><Pencil className="mr-2 h-4 w-4" />Profili düzenle</Link></Button></div>
      </section>
        </div>
      ) : (
        <div>
          <Button variant="ghost" className="mb-5 -ml-3" onClick={() => router.push("/dashboard/tutor")}><ArrowLeft className="mr-2 h-4 w-4" />Panoya dön</Button>
          <div className="mb-5"><h2 className="text-2xl font-semibold tracking-tight">Hoca yönetim merkezi</h2><p className="mt-1 text-sm text-muted-foreground">Derslerini, öğrencilerini ve profil ayarlarını ayrıntılı yönet.</p></div>
      <Tabs value={activeTab} onValueChange={(value) => router.push(`/dashboard/tutor?tab=${value}`)}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-x-auto pb-1">
          <AnimatedTabs
            tabs={TUTOR_TABS}
            value={activeTab}
            onValueChange={(value) => router.push(`/dashboard/tutor?tab=${value}`)}
            idPrefix="tutor"
          />
        </div>

        <TabsContent value="bookings" id="tutor-tabpanel-bookings" aria-labelledby="tutor-tab-bookings" className="mt-6">
          {bookingsError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Rezervasyonlar yüklenemedi.</p>
              <Button variant="outline" size="sm" onClick={() => refetchBookings()}>
                Tekrar Dene
              </Button>
            </div>
          )}
          {!bookingsError && bookingsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!bookingsError && !bookingsLoading && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Aktif Rezervasyonlar</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {activeBookings.length}
                </span>
              </div>
              {activeBookings.length === 0 ? (
                <EmptyState
                  title="Yaklaşan ders yok"
                  description="Onay bekleyen rezervasyonlar ve yaklaşan dersler burada görünür."
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/dashboard/tutor?tab=availability")}
                    >
                      Müsaitliği Düzenle
                    </Button>
                  }
                />
              ) : (
                <div className="mb-6 space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
                  {visibleUpcomingBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      id={`booking-${b.id}`}
                      className={highlightedBookingId === b.id ? HIGHLIGHT_CLASSNAME : undefined}
                      booking={b}
                      currentUserRole="tutor"
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updatingId === b.id}
                    />
                  ))}
                  {activeBookings.length > visibleUpcomingBookings.length && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllUpcomingBookings((value) => !value)}
                    >
                      {showAllUpcomingBookings
                        ? "Daha az göster"
                        : `${activeBookings.length - visibleUpcomingBookings.length} rezervasyon daha göster`}
                    </Button>
                  )}
                </div>
              )}

              <div className="mb-2 mt-6 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Geçmiş Dersler</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {pastBookings.length}
                </span>
              </div>
              {pastBookings.length === 0 ? (
                <EmptyState
                  title="Geçmiş ders yok"
                  description="Tamamlanan ve iptal edilen rezervasyonların burada arşivlenir."
                />
              ) : (
                <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
                  {visiblePastBookings.map((b, index) => (
                    <div
                      key={b.id}
                      id={`booking-${b.id}`}
                      className={cn(
                        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2",
                        highlightedBookingId === b.id && HIGHLIGHT_CLASSNAME
                      )}
                      style={{ animationDelay: `${Math.min(index % PAST_BATCH_SIZE, 4) * 45}ms` }}
                    >
                      <BookingCard
                        booking={b}
                        currentUserRole="tutor"
                        onStatusUpdate={handleStatusUpdate}
                        onConfirmLearningProgress={setConfirmingBooking}
                        onMaterialsClick={setMaterialsBooking}
                        isUpdating={updatingId === b.id}
                        isConfirmingLearning={
                          isConfirmingLearning && confirmingBooking?.id === b.id
                        }
                      />
                    </div>
                  ))}
                  {visiblePastCount < sortedPastBookings.length && (
                    <div ref={pastLoadMoreRef} className="h-1" aria-label="Daha fazla geçmiş ders yükleniyor" />
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="students" id="tutor-tabpanel-students" aria-labelledby="tutor-tab-students" className="mt-6">
          {bookingsError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Öğrenciler yüklenemedi.</p>
              <Button variant="outline" size="sm" onClick={() => refetchBookings()}>
                Tekrar Dene
              </Button>
            </div>
          )}
          {!bookingsError && bookingsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!bookingsError && !bookingsLoading && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold">Öğrencilerim</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {studentRoster.length}
                </span>
              </div>
              {studentRoster.length === 0 ? (
                <EmptyState
                  title="Henüz öğrenciniz yok"
                  description="Rezervasyonlar onaylandıkça öğrencileriniz burada listelenir."
                />
              ) : (
                <div className="space-y-3">
                  {studentRoster.map((entry) => (
                    <StudentRosterCard
                      key={entry.student.id}
                      entry={entry}
                      onSelect={setSelectedStudentId}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="earnings" id="tutor-tabpanel-earnings" aria-labelledby="tutor-tab-earnings" className="mt-6">
          {earningsError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Kazançlar yüklenemedi.</p>
              <Button variant="outline" size="sm" onClick={() => refetchEarnings()}>
                Tekrar Dene
              </Button>
            </div>
          )}
          {!earningsError && earningsLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!earningsError && !earningsLoading && earnings && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatTile
                  icon={<Wallet className="h-5 w-5" />}
                  label="Son 7 Gün"
                  value={earnings.last_7_days.lesson_count}
                  detail="tamamlanan ders"
                />
                <StatTile
                  icon={<Wallet className="h-5 w-5" />}
                  label="Son 30 Gün"
                  value={earnings.last_30_days.lesson_count}
                  detail="tamamlanan ders"
                />
                <StatTile
                  icon={<Wallet className="h-5 w-5" />}
                  label="Toplam"
                  value={earnings.lifetime.lesson_count}
                  detail="tamamlanan ders"
                />
              </div>
              <div className="mt-4 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                Bu sekme yalnızca tamamladığın ders sayısını gösterir. Platform henüz bir ödeme
                sağlayıcısına bağlı olmadığı için burada gerçek bir kazanç/ödeme bakiyesi
                görüntülenmiyor.
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="reviews" id="tutor-tabpanel-reviews" aria-labelledby="tutor-tab-reviews" className="mt-6">
          {!profile.is_verified ? (
            <EmptyState
              title="Henüz doğrulanmadın"
              description="Profilin doğrulandıktan sonra değerlendirmelerin burada görünecek."
            />
          ) : !profile.is_public ? (
            <EmptyState
              title="Profilin şu anda gizli"
              description="Profilini herkese açık yaptığında değerlendirmelerin burada görünecek."
            />
          ) : reviewsTabError || reviewSummaryError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Değerlendirmeler yüklenemedi.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchTutorReviews();
                  refetchReviewSummary();
                }}
              >
                Tekrar Dene
              </Button>
            </div>
          ) : reviewsTabLoading || reviewSummaryLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ) : (
            tutorReviewSummary && (
              <div className="space-y-6">
                <SubjectRatingBreakdown subjectRatings={tutorReviewSummary.subject_ratings} />
                {tutorReviews.length === 0 ? (
                  <EmptyState
                    title="Henüz değerlendirme yok"
                    description="Tamamlanan derslerden gelen değerlendirmeler burada listelenir."
                  />
                ) : (
                  <div className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
                    {visibleReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                    {tutorReviews.length > DASHBOARD_LIST_PREVIEW_COUNT && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAllReviews((value) => !value)}
                      >
                        {showAllReviews
                          ? "Daha az göster"
                          : `${tutorReviews.length - DASHBOARD_LIST_PREVIEW_COUNT} değerlendirme daha göster`}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="availability" id="tutor-tabpanel-availability" aria-labelledby="tutor-tab-availability" className="mt-6 space-y-6">
          {process.env.NEXT_PUBLIC_NEW_TUTOR_LAUNCH_PROGRAM_ENABLED === "true" && (
            <TutorLaunchProgramCard />
          )}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Önümüzdeki 14 Gün</h3>
            {availabilityLoading || bookingsLoading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-7">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <AvailabilityCalendar availability={availability} bookings={activeBookings} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="packages" id="tutor-tabpanel-packages" aria-labelledby="tutor-tab-packages" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Sunduğun Paketler</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Öğrencilerin gördüğü paketler ve tahmini net kazancın. Düzenlemek için
                paket editörünü kullan.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/tutor/packages">
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Paketleri düzenle
              </Link>
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              Buradaki komisyon ve net kazanç rakamları tahminidir. Hocam şu anda hiçbir
              ödemeden komisyon kesmiyor — gösterilen tutarlar gerçek bir ödeme taahhüdü ya
              da kesin hak ediş değildir.
            </p>
          </div>

          {packageOffersError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Paketler yüklenemedi.</p>
              <Button variant="outline" size="sm" onClick={() => refetchPackageOffers()}>
                Tekrar Dene
              </Button>
            </div>
          )}
          {!packageOffersError && packageOffersLoading && (
            <div className="space-y-4">
              <Skeleton className="h-9 w-full max-w-md rounded-full" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          )}
          {!packageOffersError && !packageOffersLoading && packageOffers && (
            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-sm font-medium">Haftada ders sayısı</p>
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Haftada ders sayısı"
                >
                  {WEEKLY_LESSON_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      aria-pressed={selectedPackageFrequency === count}
                      onClick={() => setSelectedPackageFrequency(count)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selectedPackageFrequency === count &&
                          "border-primary bg-primary text-primary-foreground hover:bg-primary"
                      )}
                    >
                      {count} ders
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium">Paket süresi</p>
                <div
                  className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
                  role="group"
                  aria-label="Paket süresi"
                >
                  {PLAN_DURATION_DAYS.map((days) => {
                    const plan = (packagesByFrequency.get(selectedPackageFrequency) ?? []).find(
                      (p) => p.duration_days === days
                    );
                    const notOffered = !plan || !plan.is_offered;
                    const pricing = plan
                      ? calculatePackagePricing(
                          profile.hourly_price,
                          plan.lesson_count,
                          plan.effective_discount_percent
                        )
                      : null;
                    const commission = pricing
                      ? Math.round(pricing.total * packageCommissionRate)
                      : 0;
                    const net = pricing ? pricing.total - commission : 0;
                    return (
                      <div
                        key={days}
                        className={cn(
                          "relative rounded-lg border p-3 pt-4 text-left",
                          notOffered && "opacity-50"
                        )}
                      >
                        {days === MOST_POPULAR_DURATION_DAYS && !notOffered && (
                          <Badge className="absolute -top-2.5 right-3">En popüler</Badge>
                        )}
                        <p className="font-medium">{formatPlanDuration(days)}</p>
                        {notOffered ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Bu paketi sunmuyorsun.
                          </p>
                        ) : (
                          <>
                            {pricing!.discountPercent > 0 && (
                              <Badge variant="secondary" className="mt-1">
                                %{pricing!.discountPercent} avantaj
                              </Badge>
                            )}
                            <p className="mt-2 text-sm font-semibold">
                              {formatPrice(pricing!.discountedPerLesson)}
                              <span className="font-normal text-muted-foreground"> / ders</span>
                              {pricing!.discountPercent > 0 && (
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground line-through">
                                  {formatPrice(pricing!.basePerLesson)}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pricing!.lessonCount} ders
                            </p>
                            <dl className="mt-3 space-y-1 border-t pt-2 text-xs">
                              <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">
                                  Tahmini komisyon (%{packageCommissionRate * 100})
                                </dt>
                                <dd className="text-rose-700 dark:text-rose-300">
                                  -{formatPrice(commission)}
                                </dd>
                              </div>
                              <div className="flex justify-between gap-3 font-semibold">
                                <dt>Tahmini net kazancın</dt>
                                <dd className="text-emerald-700 dark:text-emerald-300">
                                  {formatPrice(net)}
                                </dd>
                              </div>
                            </dl>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </TabsContent>
      </Tabs>
        </div>
      )}

      {confirmingBooking && (
        <LearningProgressConfirmModal
          booking={confirmingBooking}
          isSubmitting={isConfirmingLearning}
          onClose={() => {
            if (!isConfirmingLearning) {
              setConfirmingBooking(null);
            }
          }}
          onSubmit={handleConfirmLearningProgress}
        />
      )}

      <LessonMaterialsDialog
        booking={materialsBooking}
        open={!!materialsBooking}
        onOpenChange={(open) => {
          if (!open) setMaterialsBooking(null);
        }}
      />

      <StudentDetailDialog
        entry={selectedStudentEntry}
        bookings={selectedStudentBookings}
        open={!!selectedStudentId}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        onConfirmLearningProgress={setConfirmingBooking}
        onMaterialsClick={setMaterialsBooking}
        updatingId={updatingId}
        confirmingBookingId={confirmingBooking?.id ?? null}
        isConfirmingLearning={isConfirmingLearning}
      />
      </div>
    </div>
  );
}

export default function TutorDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <>
        <TutorDashboardContent />
        <AISupportChatWidget
          title={TUTOR_DASHBOARD_ASSISTANT.title}
          welcomeMessage={TUTOR_DASHBOARD_ASSISTANT.welcomeMessage}
          attentionMessages={TUTOR_DASHBOARD_ASSISTANT.attentionMessages}
          starterPrompts={TUTOR_DASHBOARD_ASSISTANT.starterPrompts}
        />
      </>
    </RouteGuard>
  );
}

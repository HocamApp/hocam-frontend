"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  MessageCircle,
  PlayCircle,
  Star,
  Video,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchBookings, updateBookingStatus } from "@/lib/lessonsApi";
import {
  fetchMyTutorProfile,
  fetchTutorReviewSummary,
  fetchTutorReviews,
  updateMyTutorProfile,
  uploadTutorProfilePicture,
} from "@/lib/tutorsApi";
import { fetchAvailability } from "@/lib/dashboardApi";
import { completeTutorReminder, createTutorReminder, deleteTutorReminder, fetchTutorReminders } from "@/lib/notificationsApi";
import { confirmLearningActivity } from "@/lib/learningApi";
import { fetchTutorEarnings, fetchTutorPackagePurchases } from "@/lib/paymentsApi";
import {
  PROFILE_PHOTO_ACCEPT,
  PROFILE_PHOTO_RULE_TEXT,
  TUTOR_REAL_PHOTO_RULE_TEXT,
  validateProfilePhotoFile,
} from "@/lib/profilePhoto";
import { formatDate, formatPrice, formatRating } from "@/lib/utils";
import type {
  AvailabilityRule,
  Booking,
  ConfirmLearningActivityPayload,
  LearningLevel,
  PackagePurchase,
  TutorProfile,
  TutorProgressResult,
} from "@/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import StatusBadge from "@/components/shared/StatusBadge";
import { BookingCard, paymentLabel } from "@/components/lessons/BookingCard";
import { LessonMaterialsDialog } from "@/components/lessons/LessonMaterialsDialog";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { AvailabilityCalendar } from "@/components/tutors/AvailabilityCalendar";
import { ReviewCard } from "@/components/tutors/ReviewCard";
import { ReviewSummary } from "@/components/tutors/ReviewSummary";
import { SubjectRatingBreakdown } from "@/components/tutors/SubjectRatingBreakdown";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  { value: "profile", label: "Profil" },
  { value: "bookings", label: "Rezervasyonlar" },
  { value: "students", label: "Öğrencilerim" },
  { value: "earnings", label: "Kazançlar" },
  { value: "reviews", label: "Değerlendirmeler" },
  { value: "availability", label: "Müsaitlik" },
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

function getInitials(name?: string, surname?: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0] || "")) {
          videoId = parts[1] || "";
        }
      }
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
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

function canJoinLesson(startTime: string): boolean {
  return Date.now() >= new Date(startTime).getTime() - 15 * 60 * 1000;
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
    if (status === "pending" || status === "confirmed") {
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
      <div className="grid gap-4 md:grid-cols-4">
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

function ProfileStudio({
  profile,
  introVideoInput,
  isSavingVideo,
  videoError,
  isUploadingPhoto,
  photoError,
  onIntroVideoChange,
  onSaveVideo,
  onClearVideo,
  onPhotoSelected,
}: {
  profile: TutorProfile;
  introVideoInput: string;
  isSavingVideo: boolean;
  videoError: string | null;
  isUploadingPhoto: boolean;
  photoError: string | null;
  onIntroVideoChange: (value: string) => void;
  onSaveVideo: () => void;
  onClearVideo: () => void;
  onPhotoSelected: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const embedUrl = getYouTubeEmbedUrl(introVideoInput || profile.intro_video_url);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hoca Profilin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 shrink-0">
                {profile.profile_picture ? (
                  <AvatarImage
                    src={profile.profile_picture}
                    alt={`${profile.name} ${profile.surname}`}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                  {getInitials(profile.name, profile.surname)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">
                    {profile.name} {profile.surname}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {profile.university} · {profile.department}
                  </p>
                </div>
                <input
                  id="profile-picture-input"
                  type="file"
                  accept={PROFILE_PHOTO_ACCEPT}
                  className="sr-only"
                  onChange={onPhotoSelected}
                />
                <Accordion type="single" collapsible>
                  <AccordionItem value="photo-editor" className="border-none">
                    <AccordionTrigger className="justify-start gap-2 rounded-md py-1 text-sm font-medium text-foreground hover:no-underline">
                      Fotoğrafı değiştir
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <Button asChild variant="outline" disabled={isUploadingPhoto}>
                          <label htmlFor="profile-picture-input" className="cursor-pointer">
                            <Camera className="mr-2 h-4 w-4" />
                            {isUploadingPhoto ? "Yükleniyor" : "Fotoğraf Yükle"}
                          </label>
                        </Button>
                        {photoError && (
                          <p className="text-sm text-destructive" role="alert">
                            {photoError}
                          </p>
                        )}
                        <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
                          <p>{PROFILE_PHOTO_RULE_TEXT}</p>
                          <p className="mt-1">{TUTOR_REAL_PHOTO_RULE_TEXT}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="intro-video-url">YouTube Tanıtım Videosu</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="intro-video-url"
                  value={introVideoInput}
                  onChange={(event) => onIntroVideoChange(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <Button onClick={onSaveVideo} disabled={isSavingVideo}>
                  <Video className="mr-2 h-4 w-4" />
                  {isSavingVideo ? "Kaydediliyor" : "Kaydet"}
                </Button>
              </div>
              {videoError && (
                <p className="text-sm text-destructive" role="alert">
                  {videoError}
                </p>
              )}
              {profile.intro_video_url && (
                <Button type="button" variant="ghost" size="sm" onClick={onClearVideo}>
                  Videoyu kaldır
                </Button>
              )}
            </div>

            {embedUrl ? (
              <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                <iframe
                  className="h-full w-full"
                  src={embedUrl}
                  title="Tutor intro video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                <PlayCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Tanıtım videosu eklenmedi</p>
                <p className="text-sm text-muted-foreground">
                  YouTube bağlantısı kaydedildiğinde burada önizleme görünür.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profil Tamamlanma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Profilinin görünürlüğünü ve tamamlanma durumunu buradan takip edebilirsin.
            </p>
            <ul className="space-y-2">
              {[
                { label: "Profil fotoğrafı", done: Boolean(profile.profile_picture) },
                { label: "Tanıtım videosu", done: Boolean(profile.intro_video_url) },
                { label: "Biyografi", done: profile.bio.trim().length > 0 },
                { label: "Ders alanları", done: profile.subjects.length > 0 },
                { label: "Ders ücreti", done: profile.hourly_price > 0 },
                { label: "Herkese açık profil", done: profile.is_public },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={item.done ? "" : "text-muted-foreground"}>{item.label}</span>
                </li>
              ))}
            </ul>
            {Boolean(profile.no_show_count) && (
              <p className="text-xs text-muted-foreground">
                Devamsızlık sayısı: {profile.no_show_count}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ders Alanları</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.subjects.map((subject) => (
              <Badge key={subject.id} variant="secondary">
                {subject.exam_type} {subject.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
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

        <TutorReminderForm studentId={student.id} studentName={name} />

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

function TutorReminderForm({ studentId, studentName }: { studentId: string; studentName: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [dueAt, setDueAt] = useState("");
  const reminderMutation = useMutation({
    mutationFn: createTutorReminder,
    onSuccess: () => {
      setNote("");
      setDueAt("");
      queryClient.invalidateQueries({ queryKey: ["tutor-reminders"] });
      toast.success(`${studentName} için hatırlatıcı eklendi.`);
    },
    onError: () => toast.error("Hatırlatıcı eklenemedi."),
  });

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <p className="text-sm font-semibold">Kendine hatırlatıcı koy</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Örn. Deneme sonuçlarını sor" />
        <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
      </div>
      <Button
        type="button"
        size="sm"
        disabled={!note.trim() || !dueAt || reminderMutation.isPending}
        onClick={() => reminderMutation.mutate({ student: studentId, note: note.trim(), due_at: new Date(dueAt).toISOString() })}
      >
        Hatırlatıcı ekle
      </Button>
    </div>
  );
}

function TutorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [introVideoInput, setIntroVideoInput] = useState("");
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() =>
    TUTOR_TABS.some((tab) => tab.value === searchParams.get("tab"))
      ? searchParams.get("tab")!
      : "bookings"
  );
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [isConfirmingLearning, setIsConfirmingLearning] = useState(false);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showAllUpcomingBookings, setShowAllUpcomingBookings] = useState(false);
  const [showAllPastBookings, setShowAllPastBookings] = useState(false);
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

  const { data: packagePurchases = [] } = useQuery({
    queryKey: ["tutor-package-purchases"],
    queryFn: fetchTutorPackagePurchases,
    enabled: isAuthenticated,
  });
  const { data: tutorReminders = [] } = useQuery({
    queryKey: ["tutor-reminders"],
    queryFn: fetchTutorReminders,
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
    if (profile) {
      setIntroVideoInput(profile.intro_video_url ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (profile && !profile.is_verified) {
      router.replace("/tutor/onboarding");
    }
  }, [profile, router]);

  const activeBookings = useMemo(
    () =>
      bookings?.filter((b) => {
        const s = (b.status || "").toLowerCase();
        return s === "pending" || s === "confirmed";
      }) ?? [],
    [bookings]
  );

  const pastBookings = useMemo(
    () =>
      bookings?.filter((b) => {
        const s = (b.status || "").toLowerCase();
        return s === "completed" || s === "cancelled" || s === "disputed";
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

  const pendingActionBookings = useMemo(
    () =>
      (bookings ?? []).filter((b) => {
        const s = (b.status || "").toLowerCase();
        if (s === "pending" || s === "disputed" || s === "awaiting_confirmation") return true;
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
  const sortedPastBookings = useMemo(() => sortByStartTime(pastBookings), [pastBookings]);
  const visibleUpcomingBookings = showAllUpcomingBookings
    ? sortedUpcomingBookings
    : sortedUpcomingBookings.slice(0, DASHBOARD_LIST_PREVIEW_COUNT);
  const visiblePastBookings = showAllPastBookings
    ? sortedPastBookings
    : sortedPastBookings.slice(0, DASHBOARD_LIST_PREVIEW_COUNT);
  const visibleReviews = showAllReviews
    ? tutorReviews
    : tutorReviews.slice(0, DASHBOARD_LIST_PREVIEW_COUNT);

  const handleStatusUpdate = async (
    bookingId: string,
    status: "confirmed" | "completed" | "cancelled"
  ) => {
    setUpdatingId(bookingId);
    try {
      await updateBookingStatus(bookingId, status);
      refetchBookings();
      toast.success("Rezervasyon güncellendi.");
    } catch {
      toast.error("Rezervasyon güncellenemedi.");
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

  const handlePhotoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      setPhotoError(validationError);
      event.target.value = "";
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadTutorProfilePicture(file);
      await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      if (profile?.id) {
        await queryClient.invalidateQueries({ queryKey: ["tutor", profile.id] });
      }
      await queryClient.invalidateQueries({ queryKey: ["tutors"] });
      toast.success("Profil fotoğrafı güncellendi.");
    } catch {
      setPhotoError("Profil fotoğrafı yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const handleSaveVideo = async () => {
    setVideoError(null);
    setIsSavingVideo(true);
    try {
      await updateMyTutorProfile({ intro_video_url: introVideoInput.trim() });
      await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      if (profile?.id) {
        await queryClient.invalidateQueries({ queryKey: ["tutor", profile.id] });
      }
      toast.success("Tanıtım videosu güncellendi.");
    } catch {
      setVideoError("YouTube bağlantısı kaydedilemedi. Bağlantıyı kontrol edip tekrar deneyin.");
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleClearVideo = async () => {
    setIntroVideoInput("");
    setIsSavingVideo(true);
    try {
      await updateMyTutorProfile({ intro_video_url: "" });
      await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      if (profile?.id) {
        await queryClient.invalidateQueries({ queryKey: ["tutor", profile.id] });
      }
      toast.success("Tanıtım videosu kaldırıldı.");
    } catch {
      toast.error("Video kaldırılırken hata oluştu.");
    } finally {
      setIsSavingVideo(false);
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {profile.profile_picture ? (
              <AvatarImage
                src={profile.profile_picture}
                alt={`${profile.name} ${profile.surname}`}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {getInitials(profile.name, profile.surname)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Merhaba {profile.name} 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bugünkü derslerini, öğrencilerini, müsaitliğini ve kazançlarını buradan
              yönetebilirsin.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>
                {profile.name} {profile.surname} · {user?.email}
              </span>
              {profile.is_verified && (
                <Badge variant="outline" className="border-green-500 text-green-700 dark:border-green-400 dark:text-green-300">
                  Doğrulanmış
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/tutors/${profile.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Public Profil
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/tutor/edit">Profili Düzenle</Link>
          </Button>
        </div>
      </header>

      {nextBooking ? (
        <Card className="mb-6 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <ParticipantAvatar name={nextBookingStudentName} className="h-12 w-12 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Sıradaki dersin
                  </p>
                  <p className="truncate text-lg font-semibold">{nextBooking.subject.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {nextBookingStudentName}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge status={nextBooking.status} type="booking" />
                {nextBookingCountdown && (
                  <span className="text-xs font-medium text-primary">
                    {nextBookingCountdown}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {formatDate(nextBooking.start_time)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {new Date(nextBooking.start_time).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {nextBooking.duration_minutes} dk
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                {paymentLabel(nextBooking)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
              {nextBooking.room_url && canJoinLesson(nextBooking.start_time) ? (
                <Button asChild size="lg">
                  <a href={`/session/${nextBooking.id}`}>
                    <Video className="mr-2 h-4 w-4" />
                    Derse Katıl
                  </a>
                </Button>
              ) : nextBooking.room_url ? (
                <Button size="lg" variant="outline" disabled>
                  Derse katılım başlangıçtan 15 dakika önce açılır
                </Button>
              ) : (
                <Badge variant="outline">Oda onaydan sonra oluşur</Badge>
              )}
              <Button asChild variant="outline">
                <Link href={nextBooking.conversation_id ? `/messages/${nextBooking.conversation_id}` : "/messages"}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Öğrenciye Mesaj
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6">
          <EmptyState
            title="Planlanmış yaklaşan dersin yok."
            description="Müsaitlik takvimini güncel tutarak öğrencilerin sana uygun saatlerden rezervasyon oluşturmasını sağlayabilirsin."
            action={
              <Button onClick={() => setActiveTab("availability")}>Müsaitliği Düzenle</Button>
            }
          />
        </div>
      )}

      {tutorReminders.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">Yaklaşan hatırlatıcılar</CardTitle></CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {tutorReminders.slice(0, 5).map((reminder) => (
              <div key={reminder.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div><p className="text-sm font-medium">{reminder.student_summary.name} {reminder.student_summary.surname}</p><p className="text-sm text-muted-foreground">{reminder.note} · {formatDate(reminder.due_at)}</p></div>
                <div className="flex gap-2"><Button size="sm" variant="outline" onClick={async () => { await completeTutorReminder(reminder.id); queryClient.invalidateQueries({ queryKey: ["tutor-reminders"] }); }}>Tamamla</Button><Button size="sm" variant="ghost" onClick={async () => { await deleteTutorReminder(reminder.id); queryClient.invalidateQueries({ queryKey: ["tutor-reminders"] }); }}>Sil</Button></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Müsaitlik
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("availability")}
            >
              {availability.length === 0 ? "Ekle" : "Düzenle"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {availabilityLoading ? (
            <Skeleton className="h-6 w-48" />
          ) : availability.length === 0 ? (
            <p className="text-sm text-muted-foreground">Müsaitlik eklenmemiş.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">{availabilityDays.length} gün aktif</span>
                <span className="ml-2 text-muted-foreground">
                  · {availability.length} zaman aralığı
                </span>
              </p>
              <div className="flex flex-wrap gap-1">
                {availabilityDays.map((day) => (
                  <Badge key={day} variant="secondary">
                    {DAY_NAMES[day]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <AnimatedTabs
            tabs={TUTOR_TABS}
            value={activeTab}
            onValueChange={setActiveTab}
            idPrefix="tutor"
          />
        </div>

        <TabsContent value="profile" id="tutor-tabpanel-profile" aria-labelledby="tutor-tab-profile" className="mt-6">
          <ProfileStudio
            profile={profile}
            introVideoInput={introVideoInput}
            isSavingVideo={isSavingVideo}
            videoError={videoError}
            isUploadingPhoto={isUploadingPhoto}
            photoError={photoError}
            onIntroVideoChange={(value) => {
              setIntroVideoInput(value);
              setVideoError(null);
            }}
            onSaveVideo={handleSaveVideo}
            onClearVideo={handleClearVideo}
            onPhotoSelected={handlePhotoSelected}
          />
        </TabsContent>

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
                <h3 className="text-sm font-semibold">Yaklaşan Dersler</h3>
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
                      onClick={() => setActiveTab("availability")}
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
                      booking={b}
                      currentUserRole="tutor"
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updatingId === b.id}
                    />
                  ))}
                  {activeBookings.length > DASHBOARD_LIST_PREVIEW_COUNT && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllUpcomingBookings((value) => !value)}
                    >
                      {showAllUpcomingBookings
                        ? "Daha az göster"
                        : `${activeBookings.length - DASHBOARD_LIST_PREVIEW_COUNT} rezervasyon daha göster`}
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
                  {visiblePastBookings.map((b) => (
                    <BookingCard
                      key={b.id}
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
                  ))}
                  {pastBookings.length > DASHBOARD_LIST_PREVIEW_COUNT && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllPastBookings((value) => !value)}
                    >
                      {showAllPastBookings
                        ? "Daha az göster"
                        : `${pastBookings.length - DASHBOARD_LIST_PREVIEW_COUNT} geçmiş rezervasyon daha göster`}
                    </Button>
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
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!earningsError && !earningsLoading && earnings && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
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
                <ReviewSummary summary={tutorReviewSummary} />
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
          <div>
            <h3 className="mb-2 text-sm font-semibold">Önümüzdeki 14 Gün</h3>
            {availabilityLoading || bookingsLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <AvailabilityCalendar availability={availability} bookings={activeBookings} />
            )}
          </div>
        </TabsContent>
      </Tabs>

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
  );
}

export default function TutorDashboardPage() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <TutorDashboardContent />
    </RouteGuard>
  );
}

"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  PlayCircle,
  Star,
  Video,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLessonRequests,
  fetchBookings,
  updateBookingStatus,
  updateLessonRequestStatus,
} from "@/lib/lessonsApi";
import {
  fetchMyTutorProfile,
  updateMyTutorProfile,
  uploadTutorProfilePicture,
} from "@/lib/tutorsApi";
import { fetchAvailability } from "@/lib/dashboardApi";
import { confirmLearningActivity } from "@/lib/learningApi";
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
  TutorProfile,
  TutorProgressResult,
} from "@/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { BookingCard } from "@/components/lessons/BookingCard";
import { LessonRequestCard } from "@/components/lessons/LessonRequestCard";
import { AvailabilityEditor } from "@/components/tutors/AvailabilityEditor";
import { VerificationForm } from "@/components/tutors/VerificationForm";
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
  { value: "profile", label: "Profil" },
  { value: "requests", label: "Mesaj İstekleri" },
  { value: "bookings", label: "Rezervasyonlar" },
  { value: "availability", label: "Müsaitlik" },
  { value: "verification", label: "Doğrulama" },
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

function getProfileCompletion(profile: TutorProfile | undefined, availabilityCount: number) {
  if (!profile) return 0;

  const checks = [
    Boolean(profile.profile_picture),
    Boolean(profile.bio && profile.bio.trim().length >= 80),
    Boolean(profile.intro_video_url),
    Boolean(profile.subjects.length > 0),
    availabilityCount > 0,
    profile.is_verified,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function sortByStartTime(bookings: Booking[]) {
  return [...bookings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}

function StatTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
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
  availability,
  profileCompletion,
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
  availability: AvailabilityRule[];
  profileCompletion: number;
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
  const completedItems = [
    Boolean(profile.profile_picture),
    Boolean(profile.bio && profile.bio.trim().length >= 80),
    Boolean(profile.intro_video_url),
    profile.subjects.length > 0,
    availability.length > 0,
    profile.is_verified,
  ].filter(Boolean).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Profil Stüdyosu</CardTitle>
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
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">
                    {profile.name} {profile.surname}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                  <p>{PROFILE_PHOTO_RULE_TEXT}</p>
                  <p className="mt-1">{TUTOR_REAL_PHOTO_RULE_TEXT}</p>
                </div>
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
          <CardHeader>
            <CardTitle className="text-xl">Profil Gücü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{completedItems}/6 tamamlandı</span>
                <span className="font-medium">{profileCompletion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Fotoğraf", Boolean(profile.profile_picture)],
                ["Hakkımda", Boolean(profile.bio && profile.bio.trim().length >= 80)],
                ["Video", Boolean(profile.intro_video_url)],
                ["Dersler", profile.subjects.length > 0],
                ["Müsaitlik", availability.length > 0],
                ["Doğrulama", profile.is_verified],
              ].map(([label, done]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <span>{label}</span>
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/tutors/${profile.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Public Profili Gör
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ders Alanları</CardTitle>
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

function TutorDashboardContent() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [introVideoInput, setIntroVideoInput] = useState("");
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [isConfirmingLearning, setIsConfirmingLearning] = useState(false);

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
    data: lessonRequests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ["lesson-requests"],
    queryFn: fetchLessonRequests,
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

  useEffect(() => {
    if (profile) {
      setIntroVideoInput(profile.intro_video_url ?? "");
    }
  }, [profile]);

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
        return s === "completed" || s === "cancelled";
      }) ?? [],
    [bookings]
  );

  const pendingRequests = lessonRequests.filter((lr) => lr.status === "pending");
  const confirmedBookings = activeBookings.filter((b) => b.status === "confirmed");
  const nextBooking = sortByStartTime(confirmedBookings)[0] ?? sortByStartTime(activeBookings)[0];
  const completedBookings = pastBookings.filter((b) => b.status === "completed");
  const estimatedCompletedRevenue = completedBookings.reduce(
    (sum, booking) => sum + Number(booking.price || 0),
    0
  );
  const profileCompletion = getProfileCompletion(profile, availability.length);

  const availabilityDays = useMemo(
    () => Array.from(new Set(availability.map((r) => r.day_of_week))).sort((a, b) => a - b),
    [availability]
  );

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

  const handleAcceptRequest = async (lessonRequestId: string) => {
    setUpdatingRequestId(lessonRequestId);
    try {
      const updated = await updateLessonRequestStatus(lessonRequestId, "accepted");
      await queryClient.invalidateQueries({ queryKey: ["lesson-requests"] });
      if (updated.conversation_id) {
        window.location.href = `/messages/${updated.conversation_id}`;
      }
    } catch {
      toast.error("Ders talebi güncellenemedi.");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const handleDeclineRequest = async (lessonRequestId: string) => {
    setUpdatingRequestId(lessonRequestId);
    try {
      await updateLessonRequestStatus(lessonRequestId, "declined");
      await queryClient.invalidateQueries({ queryKey: ["lesson-requests"] });
      toast.success("Ders talebi reddedildi.");
    } catch {
      toast.error("Ders talebi güncellenemedi.");
    } finally {
      setUpdatingRequestId(null);
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
              <Link href="/tutor/setup">Profil Oluştur</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {profile.profile_picture ? (
              <AvatarImage
                src={profile.profile_picture}
                alt={`${profile.name} ${profile.surname}`}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
              {getInitials(profile.name, profile.surname)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Hoca Panosu</h1>
            <p className="text-muted-foreground">
              {profile.name} {profile.surname} · {user?.email}
            </p>
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<MessageSquare className="h-5 w-5" />}
          label="Bekleyen İstek"
          value={pendingRequests.length}
          detail="Yanıt bekleyen mesaj talebi"
        />
        <StatTile
          icon={<Calendar className="h-5 w-5" />}
          label="Yaklaşan Ders"
          value={activeBookings.length}
          detail={nextBooking ? formatDate(nextBooking.start_time) : "Takvim boş"}
        />
        <StatTile
          icon={<Star className="h-5 w-5" />}
          label="Puan"
          value={profile.total_reviews > 0 ? formatRating(profile.rating) : "-"}
          detail={`${profile.total_reviews} değerlendirme`}
        />
        <StatTile
          icon={<Wallet className="h-5 w-5" />}
          label="Tamamlanan Gelir"
          value={formatPrice(estimatedCompletedRevenue)}
          detail={`${completedBookings.length} tamamlanan ders`}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5 text-primary" />
              Sıradaki Ders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextBooking ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">
                    {formatDate(nextBooking.start_time)} ·{" "}
                    {new Date(nextBooking.start_time).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextBooking.duration_minutes} dakika · {formatPrice(nextBooking.price)}
                  </p>
                </div>
                {nextBooking.room_url ? (
                  <Button asChild>
                    <a href={nextBooking.room_url} target="_blank" rel="noreferrer">
                      <Video className="mr-2 h-4 w-4" />
                      Derse Katıl
                    </a>
                  </Button>
                ) : (
                  <Badge variant="outline">Oda onaydan sonra oluşur</Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Yaklaşan ders bulunmuyor.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Profil Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tamamlanma</span>
              <span className="font-medium">{profileCompletion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {availability.length} müsaitlik penceresi · {profile.subjects.length} ders
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
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
        <CardContent>
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
          <AnimatedTabs tabs={TUTOR_TABS} value={activeTab} onValueChange={setActiveTab} />
        </div>

        <TabsContent value="profile" className="mt-6">
          <ProfileStudio
            profile={profile}
            availability={availability}
            profileCompletion={profileCompletion}
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

        <TabsContent value="requests" className="mt-6">
          {requestsError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Ders talepleri yüklenemedi.</p>
              <Button variant="outline" size="sm" onClick={() => refetchRequests()}>
                Tekrar Dene
              </Button>
            </div>
          )}
          {!requestsError && requestsLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          )}
          {!requestsError && !requestsLoading && lessonRequests.length === 0 && (
            <EmptyState
              title="Henüz mesaj isteğiniz yok"
              description="Öğrenciler profilinizi ziyaret ederek mesaj isteği gönderebilir"
            />
          )}
          {!requestsError && !requestsLoading && lessonRequests.length > 0 && (
            <div className="space-y-3">
              {lessonRequests.map((lr) => (
                <LessonRequestCard
                  key={lr.id}
                  lessonRequest={lr}
                  currentUserRole="tutor"
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                  isUpdating={updatingRequestId === lr.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
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
              <h3 className="mb-2 text-sm font-medium">Yaklaşan Dersler</h3>
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
                <div className="mb-6 space-y-3">
                  {sortByStartTime(activeBookings).map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      currentUserRole="tutor"
                      onStatusUpdate={handleStatusUpdate}
                      isUpdating={updatingId === b.id}
                    />
                  ))}
                </div>
              )}

              <h3 className="mb-2 text-sm font-medium">Geçmiş Dersler</h3>
              {pastBookings.length === 0 ? (
                <EmptyState
                  title="Geçmiş ders yok"
                  description="Tamamlanan ve iptal edilen rezervasyonların burada arşivlenir."
                />
              ) : (
                <div className="space-y-3">
                  {sortByStartTime(pastBookings).map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      currentUserRole="tutor"
                      onStatusUpdate={handleStatusUpdate}
                      onConfirmLearningProgress={setConfirmingBooking}
                      isUpdating={updatingId === b.id}
                      isConfirmingLearning={
                        isConfirmingLearning && confirmingBooking?.id === b.id
                      }
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <AvailabilityEditor />
        </TabsContent>

        <TabsContent value="verification" className="mt-6">
          <VerificationForm />
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

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, MessageCircle, MessageSquare, PlayCircle, Share2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/tutors/FavoriteButton";
import { fetchTutorById, fetchTutorReviews, fetchTutorSubjectRatings } from "@/lib/tutorsApi";
import { fetchTutorAvailability } from "@/lib/dashboardApi";
import { useAuth } from "@/hooks/useAuth";
import { formatLessonCount, formatPrice, formatRating } from "@/lib/utils";
import { ReviewCard } from "@/components/tutors/ReviewCard";
import { TutorPresenceBadge } from "@/components/tutors/TutorPresenceBadge";
import { MessageRequestModal } from "@/components/tutors/MessageRequestModal";
import { PackageOfferPanel } from "@/components/tutors/PackageOfferPanel";
import { BookingModal } from "@/components/lessons/BookingModal";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubjectRating } from "@/types";

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
}

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

function learningContextFromSearchParams(
  searchParams: URLSearchParams
): LearningContextQuery | null {
  const learning_goal_id = searchParams.get("learning_goal_id");
  const learning_milestone_id = searchParams.get("learning_milestone_id");
  const learning_topic_id = searchParams.get("learning_topic_id");

  if (!learning_goal_id || !learning_milestone_id) {
    return null;
  }

  return {
    learning_goal_id,
    learning_milestone_id,
    ...(learning_topic_id ? { learning_topic_id } : {}),
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating) ? (
          <span key={i} className="text-amber-500">★</span>
        ) : (
          <span key={i} className="text-muted-foreground/60">☆</span>
        )
      )}
    </span>
  );
}

function RatingSummaryPopover({
  rating,
  totalReviews,
  subjectRatings,
}: {
  rating: number;
  totalReviews: number;
  subjectRatings: SubjectRating[];
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPopover = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const closePopover = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`${formatRating(rating)} yıldız puan detayları`}
          onFocus={openPopover}
          onBlur={closePopover}
          onMouseEnter={openPopover}
          onMouseLeave={closePopover}
        >
          <Stars rating={rating} />
          <span className="font-medium">{formatRating(rating)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        collisionPadding={16}
        className="w-[calc(100vw-2rem)] p-0 sm:w-80"
        onFocus={openPopover}
        onBlur={closePopover}
        onMouseEnter={openPopover}
        onMouseLeave={closePopover}
      >
        <div className="p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Genel puan
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Stars rating={rating} />
                <span className="text-lg font-semibold">{formatRating(rating)}</span>
              </div>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              {totalReviews} değerlendirme
            </span>
          </div>

          <div className="mt-4 border-t pt-4">
            <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">
              Derslere göre puan
            </p>
            {subjectRatings.length > 0 ? (
              <div className="space-y-3">
                {subjectRatings.map((sr) => (
                  <div
                    key={sr.subject.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {sr.subject.name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {sr.subject.exam_type}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Stars rating={sr.average} />
                        <span className="font-medium">{formatRating(sr.average)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sr.count} değerlendirme
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ders bazlı puan henüz yok.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
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

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy failed");
  }
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="hidden w-72 shrink-0 lg:block">
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
      <div>
        <Skeleton className="mb-2 h-6 w-32" />
        <Separator />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <div>
        <Skeleton className="mb-2 h-6 w-24" />
        <Separator />
        <Skeleton className="mt-4 h-20 w-full rounded-lg" />
      </div>
      <div>
        <Skeleton className="mb-2 h-6 w-36" />
        <Separator />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ReviewSkeletonCard() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-2 h-4 w-16" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-3/4" />
    </div>
  );
}

export default function TutorProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isStudent, user } = useAuth();
  const { favoriteIds, toggle, isFavoritePending } = useFavorites();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestConversationId, setRequestConversationId] = useState<string | null>(null);
  const [bookingModalMode, setBookingModalMode] = useState<"normal" | "trial" | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [isSharePreviewOpen, setIsSharePreviewOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const learningContext = learningContextFromSearchParams(
    new URLSearchParams(searchParams.toString())
  );

  const {
    data: tutor,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tutor", id],
    queryFn: () => fetchTutorById(id),
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["tutor-reviews", id],
    queryFn: () => fetchTutorReviews(id),
    enabled: !!tutor,
  });

  const { data: subjectRatings = [] } = useQuery({
    queryKey: ["tutor-subject-ratings", id],
    queryFn: () => fetchTutorSubjectRatings(id),
    enabled: !!tutor,
  });

  const { data: availability = [], isLoading: availabilityLoading } = useQuery({
    queryKey: ["tutor-availability", id],
    queryFn: () => fetchTutorAvailability(id),
    enabled: !!tutor,
  });

  const isOwnProfile = !!tutor && !!user && user.id === tutor.user;
  const trialLessonsRemaining = tutor?.trial_lessons_remaining ?? 0;
  const canBookFreeTrial =
    isAuthenticated &&
    isStudent &&
    !isOwnProfile &&
    tutor?.trial_lesson_eligible === true &&
    trialLessonsRemaining > 0;
  const EXAM_ORDER = ["TYT", "AYT", "DGS", "KPSS"] as const;
  const subjectGroups = EXAM_ORDER.map((exam) => ({
    exam,
    items: (tutor?.subjects ?? []).filter((s) => s.exam_type === exam),
  })).filter((group) => group.items.length > 0);
  const introVideoEmbedUrl = getYouTubeEmbedUrl(tutor?.intro_video_url);
  const displayReviews = Array.isArray(reviews)
    ? reviewsExpanded ? reviews : reviews.slice(0, 5)
    : [];
  const hasMoreReviews = Array.isArray(reviews) && reviews.length > 5 && !reviewsExpanded;
  const completedLessonsLabel = `${formatLessonCount(tutor?.completed_lessons_count ?? 0)} ders`;
  const shareTitle = tutor
    ? `${tutor.name} ${tutor.surname} · Hocam`
    : "Hocam";
  const whatsappShareUrl = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`
    : "";

  useEffect(() => {
    if (!shareCopied) return;
    const timer = window.setTimeout(() => setShareCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [shareCopied]);

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    setShareUrl(url);
    setIsSharePreviewOpen(true);
    try {
      await copyTextToClipboard(url);
      setShareCopied(true);
      toast.success("Profil bağlantısı kopyalandı.");
    } catch {
      toast.error("Bağlantı kopyalanamadı.");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ProfileSkeleton />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ErrorMessage message="Hoca profili yüklenemedi." />
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/tutors">Geri Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Section 1 — Profile header */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-4">
            <Avatar className="h-24 w-24 shrink-0">
              <AvatarImage
                src={tutor.profile_picture || '/images/demo-teacher.jpg'}
                alt={`${tutor.name} ${tutor.surname}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                {getInitials(tutor.name, tutor.surname)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold leading-tight">
                {tutor.name} {tutor.surname}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {tutor.university} · {tutor.department}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TutorPresenceBadge
                  isOnline={tutor.is_online}
                  lastSeenAt={tutor.last_seen_at}
                />
              </div>
              {tutor.total_reviews > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                  <RatingSummaryPopover
                    rating={tutor.rating}
                    totalReviews={tutor.total_reviews}
                    subjectRatings={subjectRatings}
                  />
                  <span className="text-muted-foreground">
                    ({tutor.total_reviews} değerlendirme)
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{completedLessonsLabel}</span>
                </div>
              )}
              {tutor.yks_rank > 0 && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  YKS Sıralaması: {tutor.yks_rank.toLocaleString("tr-TR")}
                </p>
              )}
              {subjectGroups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {subjectGroups.map((g) => (
                    <Badge key={g.exam} variant="outline" className="text-xs">
                      {g.exam}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {tutor.bio && <p className="mt-4 text-base">{tutor.bio}</p>}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-4">
              {/* Price + lesson duration */}
              <div>
                <p className="text-3xl font-bold">
                  {formatPrice(tutor.hourly_price)}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}/ 40 dk
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  40 dakikalık ders. Daha uzun dersler orantılı ücretlendirilir.
                </p>
              </div>

              {/* Rating / reviews */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {tutor.total_reviews > 0 ? (
                  <>
                    <RatingSummaryPopover
                      rating={tutor.rating}
                      totalReviews={tutor.total_reviews}
                      subjectRatings={subjectRatings}
                    />
                    <span className="text-muted-foreground">
                      {tutor.total_reviews} değerlendirme
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Henüz değerlendirme yok</span>
                )}
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{completedLessonsLabel}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {tutor.subjects.map((s) => (
                  <Badge key={s.id} variant="secondary" className="py-1">
                    {s.name}
                  </Badge>
                ))}
              </div>

              {learningContext && (
                <div className="rounded-lg border bg-primary/5 p-3 text-sm text-muted-foreground">
                  Bu ders seçtiğin öğrenme hedefiyle ilişkilendirilecek.
                </div>
              )}

              {/* Primary CTA (book a lesson) */}
              <div className="space-y-3 pt-1">
                {!isAuthenticated && (
                  <Button className="w-full" onClick={() => router.push("/login")}>
                    Ders ayırtmak için giriş yap
                  </Button>
                )}
                {isAuthenticated && (isOwnProfile || !isStudent) && (
                  <p className="text-sm text-muted-foreground">
                    Ders ayırtmak için öğrenci hesabı gereklidir.
                  </p>
                )}
                {isAuthenticated && isStudent && !isOwnProfile && (
                  <>
                    {bookingComplete ? (
                      <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-center">
                        <div className="flex justify-center">
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium">Rezervasyonunuz oluşturuldu!</p>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href="/dashboard/student">Rezervasyonlarımı gör</Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        {canBookFreeTrial ? (
                          <div className="space-y-2">
                            <Button
                              className="w-full"
                              onClick={() => setBookingModalMode("trial")}
                            >
                              Ücretsiz deneme dersi ayırt
                            </Button>
                            <div className="space-y-1 text-center text-xs text-muted-foreground">
                              <p>Uygun değilse sorun yok.</p>
                              <p>
                                Bu ay {trialLessonsRemaining} ücretsiz deneme hakkın kaldı.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => setBookingModalMode("normal")}
                          >
                            Ders Rezervasyonu Yap
                          </Button>
                        )}
                      </>
                    )}
                    {requestSent && !bookingComplete && (
                      <div className="rounded-lg border bg-muted/40 p-2 text-center text-sm">
                        <p className="text-muted-foreground">
                          Mesaj isteğin gönderildi. Hoca kabul ederse konuşma başlayacak.
                        </p>
                        {requestConversationId && (
                          <Link
                            href={`/messages/${requestConversationId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            Mesajlara git
                          </Link>
                        )}
                      </div>
                    )}
                  </>
                )}

                {isAuthenticated && isStudent && !isOwnProfile && (
                  <PackageOfferPanel tutor={tutor} />
                )}

                {/* Secondary icon actions: message, favorite, share */}
                <div className="flex items-center justify-center gap-1">
                  {isAuthenticated && isStudent && !isOwnProfile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Hocaya mesaj gönder"
                      title="Hocaya mesaj gönder"
                      onClick={() => setIsRequestModalOpen(true)}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  )}
                  <FavoriteButton
                    tutorId={tutor.id}
                    isFavorite={favoriteIds.has(tutor.id)}
                    isPending={isFavoritePending(tutor.id)}
                    onToggle={toggle}
                  />
                  <Popover open={isSharePreviewOpen} onOpenChange={setIsSharePreviewOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={shareCopied ? "Profil bağlantısı kopyalandı" : "Profili paylaş"}
                        title={shareCopied ? "Kopyalandı" : "Profili paylaş"}
                        onClick={handleShare}
                      >
                        {shareCopied ? (
                          <Check className="h-5 w-5 motion-safe:animate-message-pop" />
                        ) : (
                          <Share2 className="h-5 w-5 transition-transform duration-200" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-64 p-3">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Check className="h-4 w-4 motion-safe:animate-message-pop" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">Link kopyalandı</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Şimdi yapıştırabilir veya hızlıca paylaşabilirsin.
                            </p>
                          </div>
                        </div>
                        <div className="rounded-md border bg-muted/40 px-2.5 py-2">
                          <p className="truncate text-xs text-muted-foreground">
                            {shareUrl || "Profil bağlantısı hazırlanıyor"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!shareUrl) return;
                              copyTextToClipboard(shareUrl)
                                .then(() => {
                                  setShareCopied(true);
                                  toast.success("Profil bağlantısı kopyalandı.");
                                })
                                .catch(() => toast.error("Bağlantı kopyalanamadı."));
                            }}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Linki kopyala
                          </Button>
                          {whatsappShareUrl ? (
                            <Button type="button" variant="outline" size="sm" asChild>
                              <a
                                href={whatsappShareUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                                WhatsApp
                              </a>
                            </Button>
                          ) : (
                            <Button type="button" variant="outline" size="sm" disabled>
                              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {introVideoEmbedUrl && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <PlayCircle className="h-5 w-5 text-primary" />
            Tanıtım Videosu
          </h2>
          <Separator className="mt-2" />
          <div className="mt-4 aspect-video overflow-hidden rounded-lg border bg-muted">
            <iframe
              className="h-full w-full"
              src={introVideoEmbedUrl}
              title={`${tutor.name} ${tutor.surname} tanıtım videosu`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Section 2 — Subjects */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Verdiği Dersler</h2>
        <Separator className="mt-2" />
        {tutor.subjects.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Henüz ders eklenmemiş</p>
        ) : (
          <div className="mt-4 space-y-4">
            {subjectGroups.map((group) => (
              <div key={group.exam}>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {group.exam} Dersleri
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.items.map((s) => (
                    <Badge key={s.id} variant="secondary" className="py-1.5 px-3">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 — Availability */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Müsaitlik</h2>
        <Separator className="mt-2" />
        <div className="mt-4">
          {availabilityLoading ? (
            <Card>
              <CardContent className="py-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-44" />
              </CardContent>
            </Card>
          ) : availability.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                Müsaitlik bilgisi henüz eklenmemiş
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-4">
                <ul className="space-y-2">
                  {[...availability]
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((rule) => (
                      <li key={rule.id} className="flex gap-2 text-sm">
                        <span className="w-24 font-medium">
                          {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][rule.day_of_week]}:
                        </span>
                        <span className="text-muted-foreground">
                          {rule.start_time.slice(0, 5)} – {rule.end_time.slice(0, 5)}
                        </span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Section 4 — Reviews */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Değerlendirmeler</h2>
        <Separator className="mt-2" />
        <div className="mt-4 space-y-6">
          {reviewsLoading && (
            <div className="space-y-3">
              <ReviewSkeletonCard />
              <ReviewSkeletonCard />
              <ReviewSkeletonCard />
            </div>
          )}
          {!reviewsLoading && Array.isArray(reviews) && reviews.length === 0 && (
            <p className="text-muted-foreground">Henüz değerlendirme yok</p>
          )}
          {!reviewsLoading && Array.isArray(reviews) && reviews.length > 0 && (
            <>
              <div className="mb-6 flex items-baseline gap-4">
                <span className="text-4xl font-bold">{formatRating(tutor.rating)}</span>
                <div>
                  <Stars rating={tutor.rating} />
                  <p className="text-sm text-muted-foreground">
                    {reviews.length} değerlendirme
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {displayReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              {hasMoreReviews && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setReviewsExpanded(true)}
                >
                  Tüm değerlendirmeleri gör ({reviews.length})
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      <MessageRequestModal
        tutor={tutor}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={(messageRequest) => {
          setRequestConversationId(messageRequest.conversation_id ?? null);
          setRequestSent(true);
          setIsRequestModalOpen(false);
          toast.success(
            "Mesaj isteğin hocaya gönderildi. Hoca kabul ederse konuşma başlayacak."
          );
        }}
      />
      <BookingModal
        tutor={tutor}
        isOpen={bookingModalMode !== null}
        isTrial={bookingModalMode === "trial"}
        onClose={() => setBookingModalMode(null)}
        learningContext={learningContext}
        onSuccess={(booking) => {
          const wasTrial = bookingModalMode === "trial";
          setBookingComplete(true);
          setBookingModalMode(null);
          queryClient.invalidateQueries({ queryKey: ["tutor", id] });
          toast.success(
            wasTrial
              ? "Ücretsiz deneme dersi isteğin gönderildi."
              : "Ders rezervasyonu oluşturuldu."
          );
        }}
      />
    </div>
  );
}

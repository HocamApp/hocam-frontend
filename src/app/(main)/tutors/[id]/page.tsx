"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Check, MessageSquare, PlayCircle } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { FavoriteButton } from "@/components/tutors/FavoriteButton";
import { fetchTutorById, fetchTutorReviews, fetchTutorSubjectRatings } from "@/lib/tutorsApi";
import { fetchTutorAvailability } from "@/lib/dashboardApi";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, formatRating } from "@/lib/utils";
import { ReviewCard } from "@/components/tutors/ReviewCard";
import { TutorPresenceBadge } from "@/components/tutors/TutorPresenceBadge";
import { LessonRequestModal } from "@/components/tutors/LessonRequestModal";
import { BookingModal } from "@/components/lessons/BookingModal";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { OriginButton } from "@/components/ui/origin-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase() || "?";
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
  const { isAuthenticated, isStudent, user } = useAuth();
  const { favoriteIds, toggle, isFavoritePending } = useFavorites();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestConversationId, setRequestConversationId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

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
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-3xl font-bold leading-tight">
                  {tutor.name} {tutor.surname}
                </h1>
                <FavoriteButton
                  tutorId={tutor.id}
                  isFavorite={favoriteIds.has(tutor.id)}
                  isPending={isFavoritePending(tutor.id)}
                  onToggle={toggle}
                  className="mt-1 shrink-0"
                />
              </div>
              <p className="mt-1 text-muted-foreground">
                {tutor.university} · {tutor.department}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TutorPresenceBadge isOnline={tutor.is_online} />
              </div>
              {tutor.total_reviews > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <Stars rating={tutor.rating} />
                  <span className="font-medium">{formatRating(tutor.rating)}</span>
                  <span className="text-muted-foreground">
                    ({tutor.total_reviews} değerlendirme)
                  </span>
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
              <p className="text-3xl font-bold">
                {formatPrice(tutor.hourly_price)}
                <span className="text-lg font-normal text-muted-foreground">/saat</span>
              </p>
              <div>
                {tutor.total_reviews > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Stars rating={tutor.rating} />
                      <span className="font-medium">{formatRating(tutor.rating)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ({tutor.total_reviews} değerlendirme)
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Henüz değerlendirme yok</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {tutor.subjects.map((s) => (
                  <Badge key={s.id} variant="secondary" className="py-1">
                    {s.name}
                  </Badge>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-2 space-y-2">
                {!isAuthenticated && (
                  <Button className="w-full" onClick={() => router.push("/login")}>
                    Ders İstemek İçin Giriş Yap
                  </Button>
                )}
                {isAuthenticated && (isOwnProfile || !isStudent) && (
                  <p className="text-sm text-muted-foreground">
                    Ders talep etmek için öğrenci hesabı gereklidir
                  </p>
                )}
                {isAuthenticated && isStudent && !isOwnProfile && !requestSent && !bookingComplete && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsRequestModalOpen(true)}
                    >
                      Ders Talebi Gönder
                    </Button>
                    <OriginButton
                      className="w-full"
                      onClick={() => setIsBookingModalOpen(true)}
                    >
                      Rezervasyon Yap
                    </OriginButton>
                  </>
                )}
                {isAuthenticated && isStudent && !isOwnProfile && requestSent && !bookingComplete && (
                  <div className="space-y-2 text-center">
                    <div className="flex justify-center">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="font-medium">Talebiniz gönderildi!</p>
                    <p className="text-sm text-muted-foreground">
                      Mesajlar bölümünden takip edebilirsiniz
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={requestConversationId ? `/messages/${requestConversationId}` : "/messages"}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Mesajlar
                      </Link>
                    </Button>
                    <OriginButton
                      className="w-full mt-2"
                      onClick={() => setIsBookingModalOpen(true)}
                    >
                      Rezervasyon Yap
                    </OriginButton>
                  </div>
                )}
                {isAuthenticated && isStudent && !isOwnProfile && bookingComplete && (
                  <div className="space-y-2 text-center">
                    <div className="flex justify-center">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="font-medium">Rezervasyonunuz oluşturuldu!</p>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard/student">
                        Rezervasyonlarımı Gör
                      </Link>
                    </Button>
                  </div>
                )}
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
          {subjectRatings.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Derslere göre puan
              </h3>
              <div className="space-y-2">
                {subjectRatings.map((sr) => (
                  <div key={sr.subject.id} className="flex items-center gap-3 text-sm">
                    <span className="w-40 shrink-0 truncate font-medium">
                      {sr.subject.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {sr.subject.exam_type}
                      </span>
                    </span>
                    <Stars rating={sr.average} />
                    <span className="text-muted-foreground">
                      {formatRating(sr.average)} ({sr.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      <LessonRequestModal
        tutor={tutor}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={(lessonRequest) => {
          setRequestConversationId(lessonRequest.conversation_id ?? null);
          setRequestSent(true);
          setIsRequestModalOpen(false);
          toast.success("Ders talebin gönderildi.");
        }}
      />
      <BookingModal
        tutor={tutor}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={(booking) => {
          setBookingComplete(true);
          setIsBookingModalOpen(false);
          toast.success("Ders rezervasyonu oluşturuldu.");
        }}
      />
    </div>
  );
}

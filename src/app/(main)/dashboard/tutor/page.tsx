"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, ChatCircle, VideoCamera, WarningCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { TUTOR_DASHBOARD_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { BookingCard, paymentLabel } from "@/components/lessons/BookingCard";
import { LessonMaterialsDialog } from "@/components/lessons/LessonMaterialsDialog";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { RouteGuard } from "@/components/shared/RouteGuard";
import StatusBadge from "@/components/shared/StatusBadge";
import { TutorialNudgeBanner } from "@/components/shared/TutorialNudgeBanner";
import { TutorPerformanceSection } from "@/components/tutors/TutorPerformanceSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { HIGHLIGHT_CLASSNAME, HIGHLIGHT_PARAM, useHighlightTarget } from "@/hooks/useHighlightTarget";
import { fetchAvailability } from "@/lib/dashboardApi";
import { confirmLearningActivity } from "@/lib/learningApi";
import { fetchBookings, getBookingErrorMessage, updateBookingStatus } from "@/lib/lessonsApi";
import { fetchConversations } from "@/lib/messagingApi";
import { dashboardBookingGroups, dashboardCountdown, dashboardGreeting, resolveTutorDashboardRoute } from "@/lib/tutorDashboard";
import { bookingDateLabel, bookingInstant, bookingTimeLabel } from "@/lib/tutorClassroom";
import { bookingJoinWindowOpen } from "@/lib/bookingTime";
import { serverNow } from "@/lib/serverClock";
import { fetchMyTutorProfile, fetchTutorPriceInsight } from "@/lib/tutorsApi";
import { cn } from "@/lib/utils";
import type { Booking, ConfirmLearningActivityPayload, LearningLevel, TutorProgressResult } from "@/types";

const PAST_BATCH_SIZE = 5;

function getInitials(name?: string, surname?: string): string {
  return `${name?.trim()[0] ?? ""}${surname?.trim()[0] ?? ""}`.toUpperCase() || "?";
}

function canJoinBooking(booking: Booking, now = serverNow()): boolean {
  return Boolean(booking.room_url)
    && (booking.status === "confirmed" || booking.status === "in_progress")
    && bookingJoinWindowOpen(booking.start_time, booking.duration_minutes, now);
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return fallback;
  const body = data as Record<string, unknown>;
  if (typeof body.detail === "string") return body.detail;
  for (const value of Object.values(body)) {
    if (Array.isArray(value) && value[0]) return String(value[0]);
    if (typeof value === "string") return value;
  }
  return fallback;
}

function formatLearningLevel(level: LearningLevel | "") {
  const labels: Record<LearningLevel | "", string> = {
    "": "Seçme", beginner: "Başlangıç", intermediate: "Orta", advanced: "İleri",
  };
  return labels[level] ?? level;
}

function LearningProgressConfirmModal({ booking, isSubmitting, onClose, onSubmit }: {
  booking: Booking;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ConfirmLearningActivityPayload) => void;
}) {
  const [progressResult, setProgressResult] = useState<TutorProgressResult>("good");
  const [tutorNote, setTutorNote] = useState("");
  const [studentLevel, setStudentLevel] = useState<LearningLevel | "">("");
  useEffect(() => {
    setProgressResult("good"); setTutorNote(""); setStudentLevel("");
  }, [booking.id]);
  return <Dialog open onOpenChange={open => !open && onClose()}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>İlerlemeyi Onayla</DialogTitle></DialogHeader>
      <div className="space-y-5">
        <div className="rounded-input border border-line bg-paper p-3 text-small">
          <p><span className="text-ink-mid">Öğrenci:</span> {booking.student.email}</p>
          <p><span className="text-ink-mid">Ders:</span> {booking.subject.name}</p>
          {booking.learning_context?.milestone?.title && <p><span className="text-ink-mid">Aşama:</span> {booking.learning_context.milestone.title}</p>}
        </div>
        <div className="space-y-2"><Label>İlerleme sonucu</Label><div className="grid gap-2 sm:grid-cols-3">{[
          { value: "low", label: "Düşük ilerleme" },
          { value: "good", label: "İyi ilerleme" },
          { value: "completed", label: "Aşama tamamlandı" },
        ].map(option => <Button key={option.value} type="button" variant={progressResult === option.value ? "default" : "outline"} onClick={() => setProgressResult(option.value as TutorProgressResult)} disabled={isSubmitting} className="h-auto min-h-10 whitespace-normal">{option.label}</Button>)}</div></div>
        <div className="space-y-2"><Label htmlFor="tutor-note">Hoca notu</Label><Textarea id="tutor-note" value={tutorNote} onChange={event => setTutorNote(event.target.value)} placeholder="Öğrencinin güçlü olduğu noktalar ve sonraki önerin..." rows={4} disabled={isSubmitting} /></div>
        <div className="space-y-2"><Label>Ders sonrası seviye</Label><Select value={studentLevel || "__none__"} onValueChange={value => setStudentLevel(value === "__none__" ? "" : value as LearningLevel)} disabled={isSubmitting}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["", "beginner", "intermediate", "advanced"] as Array<LearningLevel | "">).map(level => <SelectItem key={level || "__none__"} value={level || "__none__"}>{formatLearningLevel(level)}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0"><Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>İptal</Button><Button type="button" disabled={isSubmitting} onClick={() => onSubmit({ progress_result: progressResult, ...(tutorNote.trim() ? { tutor_note: tutorNote.trim() } : {}), student_level_after_lesson: studentLevel })}>{isSubmitting ? "Onaylanıyor..." : "Onayla"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function DashboardSkeleton() {
  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-8"><Skeleton className="h-20 w-full rounded-card" /><Skeleton className="h-64 w-full rounded-card" /><Skeleton className="h-80 w-full rounded-card" /></div>;
}

function TutorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const route = useMemo(() => resolveTutorDashboardRoute(new URLSearchParams(searchParams.toString())), [searchParams]);
  const isRedirecting = route.mode === "redirect";
  const isBookings = route.mode === "bookings";
  useEffect(() => { if (route.mode === "redirect") router.replace(route.href); }, [route, router]);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [isConfirmingLearning, setIsConfirmingLearning] = useState(false);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);
  const [visiblePastCount, setVisiblePastCount] = useState(PAST_BATCH_SIZE);
  const pastLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const profile = useQuery({ queryKey: ["tutor-me"], queryFn: fetchMyTutorProfile, enabled: isAuthenticated && !isRedirecting });
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: fetchBookings, enabled: isAuthenticated && !isRedirecting });
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations, enabled: isAuthenticated && !isRedirecting && !isBookings });
  const availability = useQuery({ queryKey: ["availability"], queryFn: fetchAvailability, enabled: isAuthenticated && !isRedirecting && !isBookings });
  const priceInsight = useQuery({
    queryKey: ["tutor-price-insight", (profile.data?.subjects ?? []).map(subject => subject.id).sort()],
    queryFn: () => fetchTutorPriceInsight((profile.data?.subjects ?? []).map(subject => subject.id)),
    enabled: isAuthenticated && !isRedirecting && !isBookings && Boolean(profile.data),
  });

  useEffect(() => { if (profile.data && !profile.data.is_verified) router.replace("/tutor/onboarding"); }, [profile.data, router]);
  const groups = useMemo(() => dashboardBookingGroups(bookings.data ?? []), [bookings.data]);
  const highlightedBookingId = useHighlightTarget(!bookings.isLoading && Boolean(bookings.data) && isBookings);
  const highlightId = searchParams.get(HIGHLIGHT_PARAM);
  const highlightedBooking = highlightId ? bookings.data?.find(booking => booking.id === highlightId) : undefined;
  const visiblePast = groups.past.slice(0, visiblePastCount);
  const displayedPast = highlightedBooking && groups.past.some(booking => booking.id === highlightedBooking.id) && !visiblePast.some(booking => booking.id === highlightedBooking.id)
    ? groups.past.filter((booking, index) => index < visiblePastCount || booking.id === highlightedBooking.id)
    : visiblePast;

  useEffect(() => {
    const target = pastLoadMoreRef.current;
    if (!target || visiblePastCount >= groups.past.length) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisiblePastCount(count => Math.min(count + PAST_BATCH_SIZE, groups.past.length)); }, { rootMargin: "240px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [groups.past.length, visiblePastCount]);

  const handleStatusUpdate = async (bookingId: string, status: "confirmed" | "completed" | "cancelled") => {
    setUpdatingId(bookingId);
    try { await updateBookingStatus(bookingId, status); await bookings.refetch(); toast.success("Rezervasyon güncellendi."); }
    catch (error) { toast.error(getBookingErrorMessage(error, "Rezervasyon güncellenemedi.")); }
    finally { setUpdatingId(null); }
  };
  const handleConfirmLearningProgress = async (payload: ConfirmLearningActivityPayload) => {
    const activityId = confirmingBooking?.learning_context?.activity_id;
    if (!activityId) return void toast.error("İlerleme onaylanamadı.");
    setIsConfirmingLearning(true);
    try { await confirmLearningActivity(activityId, payload); toast.success("İlerleme onaylandı."); setConfirmingBooking(null); await bookings.refetch(); await queryClient.invalidateQueries({ queryKey: ["learning-dashboard"] }); }
    catch (error) { toast.error(getApiErrorMessage(error, "İlerleme onaylanamadı.")); }
    finally { setIsConfirmingLearning(false); }
  };

  if (isRedirecting) return null;
  if (profile.isLoading) return <DashboardSkeleton />;
  if (profile.isError || !profile.data) return <div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="Hoca profilin hazır değil" description="Panonu kullanmak için önce hoca profilini oluştur." action={<Button asChild><Link href="/tutor/onboarding">Kuruluma başla</Link></Button>} /></div>;
  if (!profile.data.is_verified) return <DashboardSkeleton />;

  const profileData = profile.data;
  const nextBooking = groups.next;
  const nextStudentName = nextBooking ? nextBooking.student.display_name || nextBooking.student.email : "";
  const conversationId = nextBooking ? nextBooking.conversation_id ?? conversations.data?.find(conversation => conversation.student === nextBooking.student.id)?.id : null;
  const dialogs = <>{confirmingBooking && <LearningProgressConfirmModal booking={confirmingBooking} isSubmitting={isConfirmingLearning} onClose={() => !isConfirmingLearning && setConfirmingBooking(null)} onSubmit={handleConfirmLearningProgress} />}<LessonMaterialsDialog booking={materialsBooking} open={Boolean(materialsBooking)} onOpenChange={open => !open && setMaterialsBooking(null)} /></>;

  if (isBookings) return <>
    <WorkspacePageShell title="Rezervasyonlar" width="default" actions={<Button asChild variant="outline"><Link href="/dashboard/tutor"><ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />Panoma dön</Link></Button>}>
      <p className="max-w-2xl text-small text-ink-mid">Onay bekleyen, yaklaşan ve geçmiş ders kayıtlarını buradan yönet.</p>
      {bookings.isError ? <div role="alert" className="rounded-card border border-line bg-surface p-6"><p>Rezervasyonlar yüklenemedi.</p><Button variant="outline" className="mt-3" onClick={() => void bookings.refetch()}>Yeniden dene</Button></div> : bookings.isLoading ? <div role="status" className="space-y-3">{[1, 2, 3].map(item => <Skeleton key={item} className="h-40 w-full rounded-card" />)}</div> : <>
        <section aria-labelledby="active-bookings-title" className="space-y-3"><div className="flex items-center gap-2"><h2 id="active-bookings-title" className="text-h3 font-medium">Aktif rezervasyonlar</h2><span className="rounded-pill border border-line px-2.5 py-0.5 text-label text-ink-mid tabular-nums">{groups.active.length}</span></div>{groups.active.length ? groups.active.map(booking => <BookingCard key={booking.id} id={`booking-${booking.id}`} className={highlightedBookingId === booking.id ? HIGHLIGHT_CLASSNAME : undefined} booking={booking} currentUserRole="tutor" onStatusUpdate={handleStatusUpdate} isUpdating={updatingId === booking.id} />) : <EmptyState title="Yaklaşan ders yok" description="Onay bekleyen rezervasyonlar ve yaklaşan dersler burada görünür." action={<Button asChild variant="outline"><Link href="/dashboard/tutor/calendar">Takvimini aç</Link></Button>} />}</section>
        <section aria-labelledby="past-bookings-title" className="space-y-3"><div className="flex items-center gap-2"><h2 id="past-bookings-title" className="text-h3 font-medium">Geçmiş dersler</h2><span className="rounded-pill border border-line px-2.5 py-0.5 text-label text-ink-mid tabular-nums">{groups.past.length}</span></div>{groups.past.length ? displayedPast.map(booking => <div key={booking.id} id={`booking-${booking.id}`} className={cn(highlightedBookingId === booking.id && HIGHLIGHT_CLASSNAME)}><BookingCard booking={booking} currentUserRole="tutor" onStatusUpdate={handleStatusUpdate} onConfirmLearningProgress={setConfirmingBooking} onMaterialsClick={setMaterialsBooking} isUpdating={updatingId === booking.id} isConfirmingLearning={isConfirmingLearning && confirmingBooking?.id === booking.id} /></div>) : <EmptyState title="Geçmiş ders yok" description="Tamamlanan ve iptal edilen rezervasyonların burada arşivlenir." />}{visiblePastCount < groups.past.length && <div ref={pastLoadMoreRef} className="h-1" aria-label="Daha fazla geçmiş ders yükleniyor" />}</section>
      </>}
    </WorkspacePageShell>{dialogs}
  </>;

  return <>
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-20 pt-8 sm:pb-24">
      <TutorialNudgeBanner />
      <header className="mt-8 flex min-w-0 items-start gap-4 sm:items-center"><Avatar className="h-12 w-12 shrink-0 border border-line">{profileData.profile_picture && <AvatarImage src={profileData.profile_picture} alt={`${profileData.name} ${profileData.surname}`} />}<AvatarFallback className="bg-ink text-body font-medium text-paper">{getInitials(profileData.name, profileData.surname)}</AvatarFallback></Avatar><div className="min-w-0"><h1 className="text-h2-m font-bold sm:text-h2">{dashboardGreeting()}, {profileData.name}</h1><p className="mt-1 text-small text-ink-mid">{bookings.isError ? "Ders programını şu anda yenileyemiyoruz." : groups.today.length ? `Bugün ${groups.today.length} dersin var${nextBooking ? ` · İlki ${bookingTimeLabel(nextBooking.start_time).split(" – ")[0]}’da` : ""}.` : "Bugün planlanmış dersin yok. Takvimini ve bekleyen işlerini buradan takip edebilirsin."}</p></div></header>
      <div className="mt-8 space-y-8 sm:mt-12">
        {bookings.isError ? <div role="alert" className="rounded-card border border-line bg-surface p-6 sm:p-8"><h2 className="text-h2-m font-bold sm:text-h2">Ders programın yüklenemedi.</h2><p className="mt-2 max-w-xl text-small text-ink-mid">Sıradaki dersini ve bekleyen işlemlerini göstermek için program verisine ulaşmamız gerekiyor.</p><Button type="button" variant="outline" className="mt-5" onClick={() => void bookings.refetch()}>Yeniden dene</Button></div> : nextBooking ? <Card className="overflow-hidden"><CardContent className="p-6 sm:p-8"><div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]"><div className="flex min-w-0 items-center gap-4"><ParticipantAvatar name={nextStudentName} avatarUrl={nextBooking.student.avatar_url} className="h-16 w-16 shrink-0 rounded-input" /><div className="min-w-0"><p className="truncate text-h3 font-medium">{nextBooking.subject.name}</p><p className="mt-1 truncate text-body text-ink-mid">{nextStudentName} · {nextBooking.duration_minutes} dk</p></div></div><div className="flex min-w-[150px] flex-col rounded-input border border-line bg-paper px-5 py-4 md:items-end"><span className="text-label text-ink-mid">{dashboardCountdown(nextBooking.start_time)}</span><span className="mt-1 text-h2-m font-bold tabular-nums">{bookingTimeLabel(nextBooking.start_time).split(" – ")[0]}</span><span className="mt-1 text-label text-ink-mid">{bookingDateLabel(nextBooking.start_time)}</span></div></div><div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">{canJoinBooking(nextBooking) ? <Button asChild size="lg"><a href={`/session/${nextBooking.id}`}><VideoCamera className="mr-2 h-5 w-5" aria-hidden="true" />Derse katıl</a></Button> : nextBooking.room_url ? <Button size="lg" variant="outline" disabled className="h-auto max-w-full whitespace-normal text-center">Derse katılım başlangıçtan 15 dakika önce açılır</Button> : <Badge variant="outline">Oda onaydan sonra oluşur</Badge>}<Button asChild variant="outline"><Link href={conversationId ? `/messages/${conversationId}` : "/messages"}><ChatCircle className="mr-2 h-5 w-5" aria-hidden="true" />Öğrenciye mesaj</Link></Button><div className="ml-auto hidden items-center gap-2 text-small text-ink-mid sm:flex"><StatusBadge status={nextBooking.status} type="booking" /><span>{paymentLabel(nextBooking)}</span></div></div></CardContent></Card> : <Card><CardContent className="flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8"><div><h2 className="text-h2-m font-bold sm:text-h2">Takvimin şu anda sakin</h2><p className="mt-2 max-w-xl text-small text-ink-mid">Müsaitlik saatlerini güncel tutarak yeni rezervasyonlara hazır olabilirsin.</p></div><Button asChild><Link href="/dashboard/tutor/calendar">Takvimi aç</Link></Button></CardContent></Card>}
        {groups.pendingActions.length > 0 && <Link href="/dashboard/tutor?tab=bookings" className="flex w-full items-center justify-between gap-4 rounded-card border border-ink bg-surface px-5 py-4 text-left transition-colors duration-[var(--duration-state)] hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"><span className="flex min-w-0 items-start gap-3"><WarningCircle className="mt-0.5 h-5 w-5 shrink-0" weight="fill" aria-hidden="true" /><span><strong className="block text-small font-medium">{groups.pendingActions.length} işlem seni bekliyor</strong><span className="text-small text-ink-mid">Onay, itiraz veya ders ilerlemesi gerektiren kayıtlarını kontrol et.</span></span></span><ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" /></Link>}
        <TutorPerformanceSection profile={profileData} availability={availability.data ?? []} priceInsight={priceInsight.data ?? null} />
      </div>
    </div>{dialogs}
  </>;
}

export default function TutorDashboardPage() {
  return <RouteGuard requireAuth requireRole="tutor"><><TutorDashboardContent /><AISupportChatWidget title={TUTOR_DASHBOARD_ASSISTANT.title} welcomeMessage={TUTOR_DASHBOARD_ASSISTANT.welcomeMessage} attentionMessages={TUTOR_DASHBOARD_ASSISTANT.attentionMessages} starterPrompts={TUTOR_DASHBOARD_ASSISTANT.starterPrompts} /></></RouteGuard>;
}

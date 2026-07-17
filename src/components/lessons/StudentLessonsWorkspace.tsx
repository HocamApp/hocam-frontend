"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  History,
  LayoutList,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { BookingCard } from "@/components/lessons/BookingCard";
import { DisputeDialog } from "@/components/lessons/DisputeDialog";
import { actionableConfirmDisputeBookings } from "@/components/lessons/LessonConfirmDisputeCard";
import { LessonMaterialsDialog } from "@/components/lessons/LessonMaterialsDialog";
import { LessonJoinButton } from "@/components/lessons/LessonJoinButton";
import { ReviewModal } from "@/components/lessons/ReviewModal";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { confirmBooking, fetchBookings, getBookingErrorMessage, updateBookingStatus } from "@/lib/lessonsApi";
import { fetchPendingReviews } from "@/lib/profileLessonsApi";
import { cn, formatDate } from "@/lib/utils";
import type { Booking, PendingReviewItem } from "@/types";

type LessonTab = "upcoming" | "actions" | "history" | "issues";
type LessonView = "list" | "calendar";

const PAGE_SIZE = 5;

const TAB_LABELS: Record<LessonTab, string> = {
  upcoming: "Yaklaşan",
  actions: "İşlem gereken",
  history: "Geçmiş",
  issues: "İptal ve sorunlar",
};

function startOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function tutorName(booking: Booking): string {
  return booking.tutor.name
    ? `${booking.tutor.name} ${booking.tutor.surname}`.trim()
    : "Eğitmen bilgisi bekleniyor";
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function monthLabel(value: string): string {
  return new Date(value).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

function statusExplanation(status: Booking["status"]): string {
  const labels: Record<Booking["status"], string> = {
    pending: "Talebin hocaya iletildi. Yanıt geldiğinde bildirim alacaksın.",
    confirmed: "Ders kesinleşti. Ders odası zamanı geldiğinde buradan açılır.",
    in_progress: "Ders başladı; şimdi ders odasına katılabilirsin.",
    awaiting_confirmation: "Ders bitti. Tamamlandığını onaylaman bekleniyor.",
    completed: "Ders başarıyla tamamlandı.",
    disputed: "Bildirdiğin sorun ekip tarafından inceleniyor.",
    cancelled: "Bu rezervasyon iptal edildi.",
    expired: "Geçmişte yanıtlanmayan bu rezervasyon otomatik iptal edildi.",
  };
  return labels[status];
}

function SummaryCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-muted", tone)}>{icon}</span>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function StudentLessonsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const requestedTab = searchParams.get("tab") as LessonTab | null;
  const activeTab: LessonTab = requestedTab && requestedTab in TAB_LABELS ? requestedTab : "upcoming";
  const [view, setView] = useState<LessonView>(
    searchParams.get("view") === "calendar" ? "calendar" : "list"
  );
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedReview, setSelectedReview] = useState<PendingReviewItem | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Booking | null>(null);
  const [materialsBooking, setMaterialsBooking] = useState<Booking | null>(null);

  const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: fetchBookings });
  const reviewsQuery = useQuery({ queryKey: ["profile-pending-reviews"], queryFn: fetchPendingReviews });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["bookings"] }),
      queryClient.invalidateQueries({ queryKey: ["profile-pending-reviews"] }),
      queryClient.invalidateQueries({ queryKey: ["profile-me"] }),
    ]);
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "cancelled" }) => updateBookingStatus(id, status),
    onSuccess: async () => {
      toast.success("Rezervasyon iptal edildi.");
      await refresh();
    },
    onError: (error) => toast.error(getBookingErrorMessage(error, "İşlem gerçekleştirilemedi.")),
  });

  const confirmMutation = useMutation({
    mutationFn: confirmBooking,
    onSuccess: async () => {
      toast.success("Ders tamamlandı olarak onaylandı.");
      await refresh();
    },
    onError: (error) => toast.error(getBookingErrorMessage(error, "Ders onaylanamadı.")),
  });

  const allBookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const pendingReviews = useMemo(() => reviewsQuery.data ?? [], [reviewsQuery.data]);
  const reviewByBooking = useMemo(
    () => new Map(pendingReviews.map((item) => [item.id, item])),
    [pendingReviews]
  );
  const actionableIds = useMemo(
    () => new Set(actionableConfirmDisputeBookings(allBookings).map((item) => item.id)),
    [allBookings]
  );
  const now = Date.now();

  const groups = useMemo(() => {
    const asc = (a: Booking, b: Booking) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    const desc = (a: Booking, b: Booking) => -asc(a, b);
    return {
      upcoming: allBookings
        .filter((item) => ["pending", "confirmed", "in_progress"].includes(item.status) && new Date(item.start_time).getTime() > now - 60 * 60 * 1000)
        .sort(asc),
      actions: allBookings
        .filter((item) => actionableIds.has(item.id) || reviewByBooking.has(item.id))
        .sort(desc),
      history: allBookings
        .filter((item) => item.status === "completed" && !reviewByBooking.has(item.id))
        .sort(desc),
      issues: allBookings
        .filter((item) => ["cancelled", "expired", "disputed"].includes(item.status))
        .sort(desc),
    };
  }, [actionableIds, allBookings, now, reviewByBooking]);

  const nextLesson = groups.upcoming.find((item) => ["confirmed", "in_progress"].includes(item.status)) ?? null;
  const monthNow = new Date();
  const completedThisMonth = groups.history.filter((item) => {
    const date = new Date(item.start_time);
    return date.getMonth() === monthNow.getMonth() && date.getFullYear() === monthNow.getFullYear();
  }).length;
  const subjects = Array.from(new Map(allBookings.map((item) => [item.subject.id, item.subject])).values());
  const source = groups[activeTab];
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const calendarBookings = source.filter((item) => {
    const matchesSubject = subject === "all" || item.subject.id === subject;
    const haystack = `${item.subject.name} ${tutorName(item)}`.toLocaleLowerCase("tr-TR");
    return matchesSubject && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const lessonDates = Array.from(
    new Map(
      calendarBookings.map((item) => {
        const date = new Date(item.start_time);
        return [startOfDay(date), date];
      })
    ).values()
  );
  const filtered = calendarBookings.filter(
    (item) =>
      view === "list" ||
      !selectedDate ||
      startOfDay(new Date(item.start_time)) === startOfDay(selectedDate)
  );
  const visible = filtered.slice(0, visibleCount);
  const remainingCount = Math.max(0, filtered.length - visibleCount);
  const nextBatchCount = Math.min(PAGE_SIZE, remainingCount);

  const setTab = (value: string) => {
    setVisibleCount(PAGE_SIZE);
    setSelectedDate(undefined);
    router.replace(`/profile/lessons?tab=${value}`, { scroll: false });
  };

  if (bookingsQuery.isLoading) {
    return <div className="py-24"><LoadingSpinner /></div>;
  }

  if (bookingsQuery.isError) {
    return <ErrorMessage message="Derslerin yüklenemedi. Lütfen tekrar dene." />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Ders yönetimi</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Derslerim</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Yaklaşan derslerini takip et, bekleyen işlemleri tamamla ve geçmişine hızlıca ulaş.</p>
        </div>
        <Button asChild size="lg"><Link href="/tutors"><CalendarDays className="mr-2 h-4 w-4" />Yeni ders planla</Link></Button>
      </header>

      <section aria-label="Ders özeti" className="mt-7 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={<CalendarDays className="h-5 w-5" />} value={groups.upcoming.length} label="Yaklaşan ders" tone="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" />
        <SummaryCard icon={<AlertCircle className="h-5 w-5" />} value={groups.actions.length} label="İşlem gerekiyor" tone="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5" />} value={completedThisMonth} label="Bu ay tamamlanan" tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" />
      </section>

      {nextLesson && (
        <section className="mt-6 overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Sıradaki dersin</p>
              <div className="mt-4 flex items-center gap-4">
                <ParticipantAvatar name={tutorName(nextLesson)} avatarUrl={nextLesson.tutor.profile_picture} className="h-14 w-14 border-2 border-white/20" />
                <div><h2 className="text-xl font-semibold sm:text-2xl">{nextLesson.subject.name}</h2><p className="mt-1 text-slate-300">{tutorName(nextLesson)}</p></div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-center">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur"><p className="font-medium">{formatDate(nextLesson.start_time)}</p><p className="mt-1 text-slate-300">{formatTime(nextLesson.start_time)} · {nextLesson.duration_minutes} dakika</p></div>
              <LessonJoinButton
                bookingId={nextLesson.id}
                startTime={nextLesson.start_time}
                durationMinutes={nextLesson.duration_minutes}
                status={nextLesson.status}
                roomUrl={nextLesson.room_url}
                variant="secondary"
              />
            </div>
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={activeTab} onValueChange={setTab} className="overflow-x-auto">
            <TabsList className="h-auto w-max justify-start">
              {(Object.keys(TAB_LABELS) as LessonTab[]).map((tab) => <TabsTrigger key={tab} value={tab}>{TAB_LABELS[tab]} <span className="ml-1.5 rounded-full bg-background/70 px-1.5 text-xs">{groups[tab].length}</span></TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="flex rounded-lg border bg-muted/40 p-1" aria-label="Görünüm seçimi">
            <Button size="sm" variant={view === "list" ? "secondary" : "ghost"} onClick={() => { setView("list"); setVisibleCount(PAGE_SIZE); }}><LayoutList className="mr-1.5 h-4 w-4" />Liste</Button>
            <Button size="sm" variant={view === "calendar" ? "secondary" : "ghost"} onClick={() => { setView("calendar"); setVisibleCount(PAGE_SIZE); }}><CalendarDays className="mr-1.5 h-4 w-4" />Takvim</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="Ders veya hoca ara" className="pl-9" /></div>
          <Select value={subject} onValueChange={(value) => { setSubject(value); setVisibleCount(PAGE_SIZE); }}><SelectTrigger><SelectValue placeholder="Tüm dersler" /></SelectTrigger><SelectContent><SelectItem value="all">Tüm dersler</SelectItem>{subjects.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
        </div>

        <div className={cn("mt-6 grid gap-6", view === "calendar" && "lg:grid-cols-[320px_minmax(0,1fr)]")}>
          {view === "calendar" && <div className="h-fit rounded-2xl border bg-card p-3 shadow-sm"><Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); setVisibleCount(PAGE_SIZE); }} modifiers={{ hasLesson: lessonDates }} modifiersClassNames={{ hasLesson: "[&>button]:font-semibold [&>button]:text-primary [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:h-1 [&>button]:after:w-1 [&>button]:after:rounded-full [&>button]:after:bg-primary" }} className="mx-auto" /><Button variant="ghost" className="mt-2 w-full" disabled={!selectedDate} onClick={() => { setSelectedDate(undefined); setVisibleCount(PAGE_SIZE); }}>{selectedDate ? "Tüm tarihleri göster" : `${calendarBookings.length} dersi gösteriyor`}</Button></div>}
          <div>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-6 py-14 text-center"><History className="mx-auto h-9 w-9 text-muted-foreground/60" /><h2 className="mt-4 font-semibold">Bu görünümde ders yok</h2><p className="mt-1 text-sm text-muted-foreground">Arama veya filtreleri temizleyebilir, yeni bir ders planlayabilirsin.</p><Button asChild variant="outline" className="mt-5"><Link href="/tutors">Hoca bul<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
            ) : (
              <div className="space-y-6">
                {visible.map((booking, index) => {
                  const previous = visible[index - 1];
                  const showMonth = activeTab === "history" && (!previous || monthLabel(previous.start_time) !== monthLabel(booking.start_time));
                  const reviewItem = reviewByBooking.get(booking.id);
                  return <div key={booking.id}>{showMonth && <h2 className="mb-3 text-sm font-semibold capitalize text-muted-foreground">{monthLabel(booking.start_time)}</h2>}<BookingCard booking={booking} currentUserRole="student" onStatusUpdate={(id, status) => { if (status === "cancelled") statusMutation.mutate({ id, status }); }} onReviewClick={reviewItem ? () => setSelectedReview(reviewItem) : undefined} reviewDisabledReason={booking.status === "completed" && !reviewItem ? "Değerlendirildi" : undefined} onMaterialsClick={booking.status === "completed" ? setMaterialsBooking : undefined} isUpdating={statusMutation.isPending || confirmMutation.isPending} /><div className="-mt-1 flex flex-wrap items-center gap-2 rounded-b-xl border border-t-0 bg-muted/30 px-4 py-2 text-xs text-muted-foreground"><span>{statusExplanation(booking.status)}</span>{booking.status === "awaiting_confirmation" && <Button size="sm" className="h-7" onClick={() => confirmMutation.mutate(booking.id)}>Dersi onayla</Button>}{actionableIds.has(booking.id) && <Button size="sm" variant="ghost" className="h-7" onClick={() => setSelectedDispute(booking)}>Sorun bildir</Button>}</div></div>;
                })}
              </div>
            )}
            {remainingCount > 0 && <Button variant="outline" className="mt-6 w-full" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>{nextBatchCount} ders daha göster</Button>}
          </div>
        </div>
      </section>

      {selectedReview && <ReviewModal booking={selectedReview} isOpen onClose={() => setSelectedReview(null)} onSuccess={() => { toast.success("Değerlendirmen gönderildi."); setSelectedReview(null); void refresh(); }} />}
      {selectedDispute && <DisputeDialog booking={selectedDispute} isOpen onClose={() => setSelectedDispute(null)} onSuccess={() => { toast.success("İtirazın alındı. Ekibimiz inceleyecek."); setSelectedDispute(null); void refresh(); }} />}
      <LessonMaterialsDialog booking={materialsBooking} open={Boolean(materialsBooking)} onOpenChange={(open) => { if (!open) setMaterialsBooking(null); }} />
    </div>
  );
}

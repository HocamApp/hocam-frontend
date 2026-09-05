"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChatCircle, ArrowUpRight } from "@phosphor-icons/react";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonItemCard } from "@/components/profile/LessonItemCard";
import { TutorLearningPlans } from "@/components/learning/TutorLearningPlans";
import { useTutorClassroom } from "@/hooks/useTutorClassroom";
import { fetchConversations } from "@/lib/messagingApi";
import { fetchCoachingStudents } from "@/lib/coachingApi";
import { bookingDateLabel, bookingInstant, bookingTimeLabel, studentCoaching, studentConversation, studentName, type StudentRosterEntry } from "@/lib/tutorClassroom";
import type { Booking } from "@/types";
import { TutorStudentContextCard } from "./TutorStudentContextCard";
import { TutorStudentNotes } from "./TutorStudentNotes";
import { TutorStudentMaterials } from "./TutorStudentMaterials";
import { ClassroomError, ClassroomLoading, StudentAvatar } from "./TutorClassroomShared";

export function TutorClassroomStudent({ studentId }: { studentId: string }) {
  const data = useTutorClassroom();
  const entry = data.roster.find(row => row.student.id === studentId);
  const back = <Button variant="outline" asChild><Link href="/dashboard/tutor/classroom"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Sınıfıma dön</Link></Button>;
  if (data.isLoading || data.isError || !entry) return <WorkspacePageShell title="Öğrenci" width="wide" actions={back}>
    {data.isLoading ? <ClassroomLoading /> : data.isError ? <ClassroomError message="Öğrenci bilgileri yüklenemedi. Yeniden deneyebilirsin." onRetry={data.retry} /> : <p role="status" className="rounded-card border border-line bg-surface p-6">Bu öğrenciye erişemiyorsun veya ders ilişkin bulunmuyor.</p>}
  </WorkspacePageShell>;
  return <StudentWorkspace key={`${data.profile.data!.id}:${studentId}`} entry={entry} tutorId={data.profile.data!.id} tutorUserId={data.user?.id ?? ""} bookings={(data.bookings.data ?? []).filter(booking => booking.tutor.id === data.profile.data!.id && booking.student.id === studentId)} packagesState={data.packages.isSuccess ? "ready" : data.packages.isError ? "error" : "loading"} retryPackages={() => void data.packages.refetch()} />;
}

function StudentWorkspace({ entry, tutorId, tutorUserId, bookings, packagesState, retryPackages }: {
  entry: StudentRosterEntry; tutorId: string; tutorUserId: string; bookings: Booking[];
  packagesState: "ready" | "loading" | "error"; retryPackages: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const studentId = entry.student.id;
  const tabs = [{ value: "information", label: "Öğrenci bilgileri" }, { value: "materials", label: "Materyaller" }, { value: "lessons", label: "Dersler" }];
  const tab = tabs.some(item => item.value === params.get("tab")) ? params.get("tab")! : "information";
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations });
  const coachingEnabled = process.env.NEXT_PUBLIC_COACHING_ENABLED === "true";
  const coaching = useQuery({ queryKey: ["coaching-tutor-students"], queryFn: fetchCoachingStudents, enabled: coachingEnabled });
  const conversation = studentConversation(conversations.data ?? [], studentId, tutorUserId);
  const services = studentCoaching(coaching.data ?? [], studentId);
  const now = Date.now();
  const isUpcoming = (booking: Booking) => booking.status === "in_progress" || (booking.status === "confirmed" && bookingInstant(booking.start_time) > now);
  const upcoming = bookings.filter(isUpcoming).sort((a, b) => bookingInstant(a.start_time) - bookingInstant(b.start_time));
  const history = bookings.filter(booking => !isUpcoming(booking)).sort((a, b) => bookingInstant(b.start_time) - bookingInstant(a.start_time));
  const lesson = (booking: Booking) => <LessonItemCard key={booking.id} subject={booking.subject} participantName={studentName(entry.student)} participantRole="student" startTime={booking.start_time} status={booking.status} dateTimeLabels={{ date: bookingDateLabel(booking.start_time), time: bookingTimeLabel(booking.start_time, booking.duration_minutes) }} actions={<Button variant="outline" size="sm" asChild><Link href={`/dashboard/tutor?tab=bookings&highlightBooking=${booking.id}`}>Dersi aç</Link></Button>} />;

  return <WorkspacePageShell title={studentName(entry.student)} width="wide" actions={<Button variant="outline" asChild><Link href="/dashboard/tutor/classroom"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Sınıfıma dön</Link></Button>}>
    <section aria-label="Öğrenci özeti" className="space-y-4 rounded-card border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><StudentAvatar student={entry.student} /><p className="min-w-0 break-all text-small text-ink-mid">{entry.student.email}</p></div>
        {conversations.isPending ? <p role="status" className="text-small text-ink-mid">Mesajlar yükleniyor…</p> : conversations.isError ? <Button variant="outline" size="sm" className="h-auto whitespace-normal py-2" onClick={() => void conversations.refetch()}>Mesajlar yüklenemedi, yeniden dene</Button> : conversation ? <Button variant="outline" asChild><Link href={`/messages/${conversation.id}`}><ChatCircle className="mr-2 h-5 w-5" aria-hidden="true" />Mesajlar</Link></Button> : <p className="text-small text-ink-mid">Bu öğrenciyle henüz mesajlaşma yok.</p>}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-small tabular-nums">
        <p>{entry.totalLessons} tamamlanan ders</p><p>{entry.upcomingLessons} yaklaşan ders</p><p>{packagesState === "ready" ? `${entry.remainingCredits}/${entry.totalCredits} paket hakkı` : packagesState === "error" ? "Paket hakkı alınamadı" : "Paket hakkı yükleniyor…"}</p>{entry.currentLesson && <p className="font-medium">Ders devam ediyor</p>}
      </div>
      {entry.nextLesson && <p className="text-small tabular-nums text-ink-mid">Sonraki ders: {bookingDateLabel(entry.nextLesson.start_time)}, {bookingTimeLabel(entry.nextLesson.start_time)}</p>}
      {packagesState === "error" && <Button variant="outline" size="sm" onClick={retryPackages}>Paket haklarını yeniden yükle</Button>}
      {coachingEnabled && coaching.isError && <Button variant="outline" size="sm" className="h-auto whitespace-normal py-2" onClick={() => void coaching.refetch()}>Koçluk bilgileri yüklenemedi, yeniden dene</Button>}
      {services.length > 0 && <div className="flex flex-wrap gap-2 border-t border-line pt-4">{services.map((service, index) => <Button key={service.purchase_id} variant="outline" size="sm" asChild><Link href={service.service_period_id ? `/dashboard/tutor/coaching/service-periods/${service.service_period_id}/program` : "/dashboard/tutor/coaching/students"}>{services.length > 1 ? `Koçluk programı ${index + 1}` : service.service_period_id ? "Koçluk programı" : "Koçluk öğrencilerim"}<ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>)}</div>}
    </section>
    <Tabs value={tab} onValueChange={value => { const next = new URLSearchParams(params.toString()); next.set("tab", value); router.push(`/dashboard/tutor/classroom/${studentId}?${next.toString()}`, { scroll: false }); }}>
      <div className="max-w-full overflow-x-auto pb-2"><TabsList aria-label="Öğrenci çalışma alanı" className="h-auto justify-start gap-1 rounded-full bg-transparent p-0">{tabs.map(item => <TabsTrigger key={item.value} value={item.value} className="rounded-full border border-line px-4 py-2 text-small text-ink transition-colors duration-[120ms] data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none">{item.label}</TabsTrigger>)}</TabsList></div>
      <TabsContent value="information" className="mt-4 space-y-6">
        <TutorStudentContextCard studentId={studentId} tutorId={tutorId} />
        {process.env.NEXT_PUBLIC_LEARNING_PLANS_ENABLED === "true" && <TutorLearningPlans studentId={studentId} />}
        <TutorStudentNotes studentId={studentId} />
      </TabsContent>
      <TabsContent value="materials" className="mt-4"><TutorStudentMaterials studentId={studentId} /></TabsContent>
      <TabsContent value="lessons" className="mt-4 space-y-6"><p className="text-small text-ink-mid">Saatler İstanbul saatine göre gösterilir.</p>
        <section className="space-y-3"><h2 className="text-h3 font-medium">Yaklaşan dersler</h2>{upcoming.length ? upcoming.map(lesson) : <p className="rounded-card border border-line bg-surface p-4 text-small text-ink-mid">Planlanmış ders yok.</p>}</section>
        <section className="space-y-3"><h2 className="text-h3 font-medium">Ders geçmişi ve diğer kayıtlar</h2>{history.length ? history.map(lesson) : <p className="rounded-card border border-line bg-surface p-4 text-small text-ink-mid">Henüz başka ders kaydı yok.</p>}</section>
      </TabsContent>
    </Tabs>
  </WorkspacePageShell>;
}

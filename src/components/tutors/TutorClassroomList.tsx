"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass, Users } from "@phosphor-icons/react";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { PageIntroHint } from "@/components/shared/PageIntroHint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTutorClassroom } from "@/hooks/useTutorClassroom";
import { formatDate } from "@/lib/utils";
import { bookingDateLabel, bookingTimeLabel, filterStudentRoster, studentName, type ClassroomFilter, type StudentRosterEntry } from "@/lib/tutorClassroom";
import { ClassroomError, ClassroomLoading, StudentAvatar, packageSummary, type PackagesState } from "./TutorClassroomShared";

const filters: Array<{ value: ClassroomFilter; label: string }> = [
  { value: "all", label: "Tümü" }, { value: "upcoming", label: "Yaklaşan dersi olanlar" }, { value: "unscheduled", label: "Planlanmış dersi olmayanlar" },
];

const ROW_GRID = "grid min-w-0 gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,.7fr)_auto] lg:items-center";

/** One student. A student who has paid for a package but has no lesson yet has
 * nothing to open (the notes, materials and context belong to a lesson
 * relationship), so the row says so instead of linking to an empty page. */
function RosterRow({ entry, packages }: { entry: StudentRosterEntry; packages: PackagesState }) {
  const summary = packageSummary(entry, packages);
  const body = <>
    <div className="flex min-w-0 items-center gap-3"><StudentAvatar student={entry.student} /><div className="min-w-0"><h2 className="break-words font-medium">{studentName(entry.student)}</h2>{entry.currentLesson && <p className="mt-1 text-small font-medium">Ders devam ediyor</p>}{!entry.hasLessons && <p className="mt-1 text-small text-ink-mid">{entry.packagePaidAt ? `Paketini ${formatDate(entry.packagePaidAt)} tarihinde aldı, henüz ders planlamadı` : "Paketini aldı, henüz ders planlamadı"}</p>}</div></div>
    <div className="space-y-1 text-small tabular-nums"><p className="text-label text-ink-mid">Sonraki ders</p><p>{entry.nextLesson ? `${bookingDateLabel(entry.nextLesson.start_time)}, ${bookingTimeLabel(entry.nextLesson.start_time)}` : "Planlanmış ders yok"}</p><p className="text-ink-mid">{entry.lastCompletedAt ? `Son ders: ${bookingDateLabel(entry.lastCompletedAt)}` : "Henüz tamamlanan ders yok"}</p></div>
    <div className="space-y-1 text-small tabular-nums"><p>{entry.totalLessons} tamamlanan ders</p>{summary && <p className="text-ink-mid">{summary}</p>}</div>
  </>;
  return entry.hasLessons
    ? <Link href={`/dashboard/tutor/classroom/${entry.student.id}`} className={`${ROW_GRID} transition-colors duration-[120ms] hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink`}>{body}<ArrowRight className="hidden h-5 w-5 lg:block" aria-hidden="true" /></Link>
    : <div className={ROW_GRID}>{body}<span className="hidden lg:block" aria-hidden="true" /></div>;
}

export function TutorClassroomList() {
  const data = useTutorClassroom();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClassroomFilter>("all");
  const rows = filterStudentRoster(data.roster, search, filter);
  const packagesState: PackagesState = data.packages.isSuccess ? "ready" : data.packages.isError ? "error" : "loading";
  const titleRef = useRef<HTMLSpanElement>(null);
  return <WorkspacePageShell title="Sınıfım" width="wide" titleRef={titleRef}>
    <PageIntroHint hintKey="tutor_intro_classroom" anchorRef={titleRef} title="Öğrencilerin burada">Ders aldığın öğrencileri, son ve sıradaki derslerini ve paketlerini tek listede görürsün. Bir öğrenciyi açınca notlarını ve ders materyallerini bulursun.</PageIntroHint>
    <p className="max-w-[60ch] text-ink-mid">Öğrencilerini, derslerini ve bir sonraki derse hazırlıklarını buradan takip et.</p>
    {data.isLoading ? <ClassroomLoading /> : data.isError ? <ClassroomError message="Öğrencilerin yüklenemedi. Yeniden deneyebilirsin." onRetry={data.retry} /> : !data.profile.data?.is_verified ? <p>Öğrenci alanına erişmek için hoca doğrulamanı tamamlamalısın.</p> : <>
      <div className="space-y-4">
        <div className="relative max-w-md"><label htmlFor="classroom-search" className="sr-only">Öğrenci ara</label><MagnifyingGlass className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-ink-mid" aria-hidden="true" /><Input id="classroom-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Öğrenci adıyla ara" className="h-11 rounded-input border-line bg-surface pl-10 text-base" /></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Öğrenci filtreleri">{filters.map(item => <Button key={item.value} size="sm" variant="outline" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={filter === item.value ? "border-ink bg-ink text-paper hover:bg-ink hover:text-paper" : "border-line"}>{item.label}</Button>)}</div>
        <p role="status" className="text-small tabular-nums text-ink-mid">{rows.length} öğrenci</p>
      </div>
      {data.packages.isError && <ClassroomError message="Paket hakları yüklenemedi. Öğrenci ve ders bilgilerini kullanmaya devam edebilirsin." onRetry={() => void data.packages.refetch()} />}
      {rows.length ? <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">{rows.map(entry => <li key={entry.student.id}><RosterRow entry={entry} packages={packagesState} /></li>)}</ul> : <div className="space-y-3 rounded-card border border-line bg-surface p-6"><Users className="h-8 w-8" aria-hidden="true" /><h2 className="text-h3 font-medium">{data.roster.length ? "Aramana uygun öğrenci bulunamadı" : "Henüz ders ilişkin olan bir öğrenci yok"}</h2><p className="text-small text-ink-mid">{data.roster.length ? "Başka bir ad deneyebilir veya filtreleri temizleyebilirsin." : "Onaylanmış dersin bulunan öğrenciler burada görünecek."}</p>{data.roster.length ? <Button variant="outline" onClick={() => { setSearch(""); setFilter("all"); }}>Filtreleri temizle</Button> : <Button variant="outline" asChild><Link href="/dashboard/tutor">Panoma dön</Link></Button>}</div>}
    </>}
  </WorkspacePageShell>;
}

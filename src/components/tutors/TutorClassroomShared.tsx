"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import { studentName, type StudentRosterEntry } from "@/lib/tutorClassroom";

export function StudentAvatar({ student }: { student: Booking["student"] }) {
  const name = studentName(student);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("tr");
  return <Avatar className="h-12 w-12 shrink-0 rounded-full">
    {student.avatar_url && <AvatarImage src={student.avatar_url} alt={name} />}
    <AvatarFallback className="bg-ink text-paper">{initials}</AvatarFallback>
  </Avatar>;
}

export function ClassroomError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div role="alert" className="space-y-3 rounded-card border border-line bg-surface p-6">
    <p>{message}</p><Button variant="outline" onClick={onRetry}><ArrowClockwise className="mr-2 h-5 w-5" aria-hidden="true" />Yeniden dene</Button>
  </div>;
}

export function ClassroomLoading() {
  return <div role="status" aria-label="Öğrenciler yükleniyor" className="space-y-4 rounded-card border border-line bg-surface p-6">
    <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-6 w-40" /></div>
    <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" />
  </div>;
}

export type PackagesState = "ready" | "loading" | "error";

/** What is left of the student's running packages, for the tutor: lessons to take
 * or to place, and how many of them have no day yet. Nothing for a student with
 * no running package (a trial lesson only). */
export function packageSummary(entry: StudentRosterEntry, state: PackagesState): string | null {
  if (state === "error") return "Paket hakkı alınamadı";
  if (state === "loading") return "Paket hakkı yükleniyor…";
  if (entry.packageRemaining === 0) return null;
  return entry.packageUnscheduled > 0
    ? `Pakette ${entry.packageRemaining} ders kaldı, ${entry.packageUnscheduled} tanesi planlanmadı`
    : `Pakette ${entry.packageRemaining} ders kaldı`;
}

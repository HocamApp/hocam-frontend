"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking } from "@/types";
import { studentName } from "@/lib/tutorClassroom";

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

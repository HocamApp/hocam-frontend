"use client";

import { ReactNode } from "react";
import { CalendarDays, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatPrice, formatBookingDate, formatBookingTime } from "@/lib/utils";
import type { ParticipantRole, Subject } from "@/types";

function formatTime(iso: string): string {
  return formatBookingTime(iso);
}

interface LessonItemCardProps {
  subject: Subject;
  participantName: string;
  participantRole: ParticipantRole;
  startTime: string;
  endTime?: string;
  status?: string;
  price?: number;
  actions?: ReactNode;
  meta?: ReactNode;
}

/** Shared presentational row for booking-based profile screens. */
export function LessonItemCard({
  subject,
  participantName,
  participantRole,
  startTime,
  endTime,
  status,
  price,
  actions,
  meta,
}: LessonItemCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{subject.name}</span>
            <Badge variant="secondary" className="text-xs">
              {subject.exam_type}
            </Badge>
            {status && <StatusBadge status={status} type="booking" />}
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            {participantRole === "tutor" ? "Hoca" : "Öğrenci"}: {participantName}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatBookingDate(startTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {formatTime(startTime)}
              {endTime ? ` – ${formatTime(endTime)}` : ""}
            </span>
            {typeof price === "number" && (
              <span className="font-medium text-foreground">{formatPrice(price)}</span>
            )}
          </div>
          {meta}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div>
        )}
      </CardContent>
    </Card>
  );
}

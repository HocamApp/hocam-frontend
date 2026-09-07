"use client";

import { ReactNode } from "react";
import { CalendarBlank, Clock, User } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { bookingDateLabel, bookingTimeRangeLabel } from "@/lib/bookingTime";
import type { ParticipantRole, Subject } from "@/types";

interface LessonItemCardProps {
  subject: Subject;
  participantName: string;
  participantRole: ParticipantRole;
  startTime: string;
  endTime?: string;
  status?: string;
  price?: number;
  dateTimeLabels?: { date: string; time: string };
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
  dateTimeLabels,
  meta,
}: LessonItemCardProps) {
  return (
    <Card>
      <CardContent className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{subject.name}</span>
            <Badge variant="outline" className="text-xs">
              {subject.exam_type}
            </Badge>
            {status && <StatusBadge status={status} type="booking" />}
          </div>
          <p className="flex items-center gap-1.5 text-sm text-ink-mid">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {participantRole === "tutor" ? "Hoca" : "Öğrenci"}: {participantName}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-ink-mid">
            <span className="flex items-center gap-1.5">
              <CalendarBlank className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {dateTimeLabels?.date ?? bookingDateLabel(startTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {dateTimeLabels?.time ?? bookingTimeRangeLabel(startTime, endTime)}
            </span>
            {typeof price === "number" && (
              <span className="font-medium text-ink">{formatPrice(price)}</span>
            )}
          </div>
          {meta}
        </div>
        {actions && (
          <div className="flex w-full min-w-0 flex-col gap-2 [&>*]:w-full sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap sm:justify-end sm:[&>*]:w-auto">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

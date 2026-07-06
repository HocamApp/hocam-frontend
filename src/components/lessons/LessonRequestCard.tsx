"use client";

import Link from "next/link";
import { CalendarDays, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { LessonRequest } from "@/types";

interface LessonRequestCardProps {
  lessonRequest: LessonRequest;
  currentUserRole: "student" | "tutor";
  onWithdraw?: (lessonRequestId: string) => void;
  isWithdrawing?: boolean;
  onAccept?: (lessonRequestId: string) => void;
  onDecline?: (lessonRequestId: string) => void;
  isUpdating?: boolean;
}

export function LessonRequestCard({
  lessonRequest,
  currentUserRole,
  onWithdraw,
  isWithdrawing = false,
  onAccept,
  onDecline,
  isUpdating = false,
}: LessonRequestCardProps) {
  const preview =
    lessonRequest.message.length > 100
      ? lessonRequest.message.slice(0, 100) + "..."
      : lessonRequest.message;
  const status = (lessonRequest.status || "").toLowerCase();
  const isPending = status === "pending";
  const conversationHref = lessonRequest.conversation_id
    ? `/messages/${lessonRequest.conversation_id}`
    : "/messages";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{lessonRequest.subject.name}</p>
            {currentUserRole === "tutor" && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {lessonRequest.student.email}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <StatusBadge status={lessonRequest.status} type="lessonRequest" />
          </div>
        </div>

        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
          <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{preview}</span>
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formatDate(lessonRequest.created_at)}
        </p>

        {currentUserRole === "student" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <Button size="sm" variant="outline" asChild>
              <Link href={conversationHref}>Mesajı Gör</Link>
            </Button>
            {isPending && onWithdraw && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onWithdraw(lessonRequest.id)}
                disabled={isWithdrawing}
              >
                İptal Et
              </Button>
            )}
          </div>
        )}

        {currentUserRole === "tutor" && isPending && (onAccept || onDecline) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <Button size="sm" variant="outline" asChild>
              <Link href={conversationHref}>Mesajı Gör</Link>
            </Button>
            {onAccept && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onAccept(lessonRequest.id)}
                disabled={isUpdating}
              >
                Onayla
              </Button>
            )}
            {onDecline && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDecline(lessonRequest.id)}
                disabled={isUpdating}
              >
                Reddet
              </Button>
            )}
          </div>
        )}

        {currentUserRole === "tutor" && !isPending && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <p className="text-xs text-muted-foreground">Talep alındı</p>
            <Button size="sm" variant="outline" asChild>
              <Link href={conversationHref}>Mesajı Gör</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

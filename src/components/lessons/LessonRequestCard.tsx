"use client";

import Link from "next/link";
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

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold">{lessonRequest.subject.name}</span>
          <StatusBadge status={lessonRequest.status} type="lessonRequest" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{preview}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDate(lessonRequest.created_at)}
        </p>

        {currentUserRole === "student" && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/messages">Mesajı Gör</Link>
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
          <div className="mt-3 flex flex-wrap gap-2">
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
          <p className="mt-2 text-xs text-muted-foreground">Talep alındı</p>
        )}
      </CardContent>
    </Card>
  );
}

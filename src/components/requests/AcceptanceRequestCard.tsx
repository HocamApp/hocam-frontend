"use client";

import { useState } from "react";
import { BookOpen, GraduationCap } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatTryMinor } from "@/lib/money";
import {
  acceptanceStatusCopy,
  coachingFrequencyLabel,
  type AcceptanceRequest,
} from "@/lib/coachingApi";
import { formatPlanDuration } from "@/lib/lessonPricing";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "default",
  accepted: "secondary",
  rejected: "destructive",
  expired: "secondary",
  withdrawn: "secondary",
};

/**
 * One package request, lesson-only or combined with coaching.
 *
 * The tutor answers the WHOLE request — there is no "take the lessons but
 * not the coaching". Status copy comes from acceptanceStatusCopy() so no
 * screen can invent a payment claim: accepting is consent, not payment.
 */
export function AcceptanceRequestCard({
  request,
  onRespond,
  isPending,
}: {
  request: AcceptanceRequest;
  onRespond: (decision: "accept" | "reject", note?: string) => void;
  isPending: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const studentName =
    `${request.student.name} ${request.student.surname}`.trim() || "Öğrenci";
  const isOpen = request.status === "pending";

  return (
    <Card className="overflow-hidden border-line">
      <CardContent className="space-y-5 p-0">
        <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold">{studentName}</p>
            <p className="text-sm text-muted-foreground">
              {request.package.plan_name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={STATUS_VARIANT[request.status] ?? "secondary"}>
              {acceptanceStatusCopy(request.status)}
            </Badge>
          </div>
        </div>

        <dl className="divide-y divide-line overflow-hidden rounded-input border border-line text-small">
          <div className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <dt className="flex items-center gap-2 font-medium"><BookOpen className="h-4 w-4 text-pink" aria-hidden="true" weight="regular" />Ders paketi</dt>
            <dd className="flex flex-wrap gap-x-3 gap-y-1 text-ink-mid sm:justify-end">
              {request.package.lessons_per_week !== null &&
              request.package.duration_days !== null ? (
                <span>
                  Haftada {request.package.lessons_per_week} ders ·{" "}
                  {formatPlanDuration(request.package.duration_days)}
                </span>
              ) : null}
              <span>
                {request.package.total_credits} ders ·{" "}
                <strong className="font-medium text-ink">
                  {formatTryMinor(request.package.total_price * 100)}
                </strong>
              </span>
            </dd>
          </div>
          {request.coaching ? (
            <div className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <dt className="flex items-center gap-2 font-medium"><GraduationCap className="h-4 w-4 text-pink" aria-hidden="true" weight="regular" />Çalışma koçluğu</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1 text-ink-mid sm:justify-end">
                <span>{coachingFrequencyLabel(request.coaching.frequency)}</span>
                <span>
                  {request.coaching.total_sessions} görüşme ·{" "}
                  <strong className="font-medium text-ink">
                    {formatTryMinor(request.coaching.total_price_minor)}
                  </strong>
                </span>
              </dd>
            </div>
          ) : null}
        </dl>

        {isOpen ? (
          <time className="block text-caption text-ink-mid" dateTime={request.expires_at}>
            {new Date(request.expires_at).toLocaleString("tr-TR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            &apos;e kadar yanıtla
          </time>
        ) : null}

        {isOpen ? (
          rejecting ? (
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Reddetme sebebin (isteğe bağlı)"
                aria-label="Reddetme notu"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onRespond("reject", note)}
                >
                  Reddet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setRejecting(false)}
                >
                  Vazgeç
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => onRespond("accept")}
              >
                {request.includes_coaching
                  ? "Ders + koçluğu kabul et"
                  : "Paketi kabul et"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setRejecting(true)}
              >
                Reddet
              </Button>
            </div>
          )
        ) : null}

        {request.status === "rejected" && request.rejection_note ? (
          <p className="rounded-input border border-line p-3 text-caption text-ink-mid">
            Notun: {request.rejection_note}
          </p>
        ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

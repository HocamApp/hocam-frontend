"use client";

import { useState } from "react";
import { BookOpen, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatTryMinor } from "@/lib/money";
import { formatPrice } from "@/lib/utils";
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
    <Card className="overflow-hidden rounded-[1.35rem] border-border/70 shadow-[0_18px_48px_-38px_hsl(var(--foreground)/0.4)]">
      <CardContent className="space-y-5 p-0">
        {request.includes_coaching ? (
          <div className="border-b border-primary/10 bg-primary/[0.055] px-5 py-4 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Tek karar · iki hizmet</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">Birlikte değerlendirilecek talep</h3>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Ders paketi ve çalışma koçluğu tek talebin parçalarıdır. Kabul veya red kararı tamamına uygulanır.</p>
          </div>
        ) : null}
        <div className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold">{studentName}</p>
            <p className="text-sm text-muted-foreground">
              {request.package.plan_name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {request.includes_coaching ? (
              <Badge>Çalışma koçluğu dahil</Badge>
            ) : null}
            <Badge variant={STATUS_VARIANT[request.status] ?? "secondary"}>
              {acceptanceStatusCopy(request.status)}
            </Badge>
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-[1.1rem] border bg-muted/20 p-4">
            <dt className="flex items-center gap-2 font-medium"><BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />Ders paketi</dt>
            <dd className="mt-1 space-y-1 text-muted-foreground">
              {request.package.lessons_per_week !== null &&
              request.package.duration_days !== null ? (
                <p>
                  Haftada {request.package.lessons_per_week} ders ·{" "}
                  {formatPlanDuration(request.package.duration_days)}
                </p>
              ) : null}
              <p>
                {request.package.total_credits} ders ·{" "}
                <span className="font-medium text-foreground">
                  {formatPrice(request.package.total_price)}
                </span>
              </p>
            </dd>
          </div>
          {request.coaching ? (
            <div className="rounded-[1.1rem] border border-primary/15 bg-primary/[0.045] p-4">
              <dt className="flex items-center gap-2 font-medium"><GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />Çalışma koçluğu ek hizmeti</dt>
              <dd className="mt-1 space-y-1 text-muted-foreground">
                <p>{coachingFrequencyLabel(request.coaching.frequency)}</p>
                <p>
                  {request.coaching.total_sessions} görüşme ·{" "}
                  <span className="font-medium text-foreground">
                    {formatTryMinor(request.coaching.total_price_minor)}
                  </span>
                </p>
              </dd>
            </div>
          ) : null}
        </dl>

        {isOpen ? (
          <p className="text-xs text-muted-foreground">
            Yanıt süresi:{" "}
            {new Date(request.expires_at).toLocaleString("tr-TR", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            &apos;e kadar. Kabul etmen ödeme almaz; talep ödeme aktivasyonunu
            bekler.
          </p>
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
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Notun: {request.rejection_note}
          </p>
        ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

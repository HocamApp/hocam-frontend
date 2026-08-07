"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatTryMinor } from "@/lib/money";
import { formatPrice } from "@/lib/utils";
import { acceptanceStatusCopy, type AcceptanceRequest } from "@/lib/coachingApi";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "default",
  accepted: "secondary",
  rejected: "destructive",
  expired: "secondary",
  withdrawn: "secondary",
};

/**
 * One package request, lesson-only or bundled with coaching.
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
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{studentName}</h3>
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

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3 sm:block">
            <dt className="text-muted-foreground">Ders paketi</dt>
            <dd className="font-medium">
              {request.package.total_credits} ders ·{" "}
              {formatPrice(request.package.total_price)}
            </dd>
          </div>
          {request.coaching ? (
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Çalışma koçluğu</dt>
              <dd className="font-medium">
                {request.coaching.total_sessions} görüşme ·{" "}
                {formatTryMinor(request.coaching.total_price_minor)}
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
      </CardContent>
    </Card>
  );
}

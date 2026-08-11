"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  COACHING_DAY_LABEL,
  TIME_REQUEST_STATUS_COPY,
  acceptCoachingTimeProposal,
  createCoachingTimeRequest,
  declineCoachingTimeProposal,
  extractCoachingErrorMessage,
  fetchCoachingTimeRequests,
  withdrawCoachingTimeRequest,
} from "@/lib/coachingApi";

/**
 * The 48h tutor-proposal fallback (master spec §16.5).
 *
 * The student never proposes a time here — only the tutor does, from
 * their own dashboard. This panel opens the request for one missing slot
 * index, shows whatever the tutor proposes, and lets the student accept
 * or decline. Accepting does NOT create a recurring slot by itself — the
 * accepted time only becomes choosable in the slot picker's `confirm`
 * step (see the page component), same "confirm is the only finalize
 * path" rule the backend enforces.
 */
export function TimeRequestPanel({ slotIndex }: { slotIndex: number }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data: requests = [] } = useQuery({
    queryKey: ["coaching-time-requests"],
    queryFn: fetchCoachingTimeRequests,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["coaching-time-requests"] });
    queryClient.invalidateQueries({ queryKey: ["coaching-scheduling-slots"] });
  };

  const create = useMutation({
    mutationFn: () => createCoachingTimeRequest({ slotIndex, note }),
    onSuccess: () => {
      setError(null);
      setNote("");
      invalidate();
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => withdrawCoachingTimeRequest(id),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const accept = useMutation({
    mutationFn: (id: string) => acceptCoachingTimeProposal(id),
    onSuccess: () => {
      setError(null);
      toast.success("Öneriyi kabul ettin. Şimdi bu saati aşağıdan onaylayabilirsin.");
      invalidate();
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const decline = useMutation({
    mutationFn: (id: string) => declineCoachingTimeProposal(id),
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const request = requests.find((r) => r.slot_index === slotIndex);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <p className="text-sm font-medium">Uygun saat bulamadın mı?</p>
        {error ? <ErrorMessage message={error} /> : null}

        {!request || request.status === "withdrawn" || request.status === "unresolved" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Öğretmenine saat talebi gönder; 48 saat içinde sana uygun bir saat önermesi
              gerekir. Ortak bir saat bulunamazsa bu koçluk iptal edilir ve ücreti iade
              edilir — ders paketin etkilenmez.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örnek: Hafta içi akşamları uygunum (opsiyonel)"
              className="w-full rounded-md border bg-background p-2 text-sm"
              rows={2}
            />
            <Button
              size="sm"
              onClick={() => create.mutate()}
              disabled={create.isPending}
            >
              {create.isPending ? "Gönderiliyor..." : "Saat talep et"}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={request.status === "matched" ? "default" : "secondary"}>
                {TIME_REQUEST_STATUS_COPY[request.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Son yanıt: {new Date(request.expires_at).toLocaleString("tr-TR")}
              </span>
            </div>

            {request.proposals
              .filter((p) => p.status === "pending")
              .map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-primary/40 bg-primary/5 p-3"
                >
                  <p className="text-sm font-medium">
                    Öğretmenin önerdiği özel saat: {COACHING_DAY_LABEL[p.day_of_week]}{" "}
                    {p.start_time.slice(0, 5)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bu saat öğretmenin yayınladığı olağan koçluk saatlerinin dışında,
                    senin için özel olarak önerildi.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => accept.mutate(p.id)} disabled={accept.isPending}>
                      Kabul et
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decline.mutate(p.id)}
                      disabled={decline.isPending}
                    >
                      Reddet
                    </Button>
                  </div>
                </div>
              ))}

            {request.status === "pending" &&
              request.proposals.every((p) => p.status !== "pending") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => withdraw.mutate(request.id)}
                  disabled={withdraw.isPending}
                >
                  Talebi geri çek
                </Button>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

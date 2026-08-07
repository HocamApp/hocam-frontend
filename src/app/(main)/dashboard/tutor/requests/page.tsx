"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AcceptanceRequestCard } from "@/components/requests/AcceptanceRequestCard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Skeleton } from "@/components/ui/skeleton";
import {
  extractCoachingErrorMessage,
  fetchAcceptanceRequests,
  respondToAcceptanceRequest,
} from "@/lib/coachingApi";

/**
 * Package requests — lesson-only and lesson+coaching in one list.
 *
 * Lives under the general tutor dashboard rather than the coaching area on
 * purpose: a tutor with no coaching plan still gets ordinary package
 * requests here.
 */
function RequestsContent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["tutor-acceptance-requests"],
    queryFn: fetchAcceptanceRequests,
  });

  const respond = useMutation({
    mutationFn: respondToAcceptanceRequest,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["tutor-acceptance-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-acceptance-config"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-capacity"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const open = requests.filter((request) => request.status === "pending");
  const settled = requests.filter((request) => request.status !== "pending");

  if (requests.length === 0) {
    return (
      <EmptyState
        title="Bekleyen paket talebin yok"
        description="Bir öğrenci senden ders paketi (veya ders + çalışma koçluğu) talep ettiğinde burada görünür."
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorMessage message={error} /> : null}

      {open.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Yanıt bekleyenler ({open.length})
          </h2>
          {open.map((request) => (
            <AcceptanceRequestCard
              key={request.id}
              request={request}
              isPending={respond.isPending}
              onRespond={(decision, note) =>
                respond.mutate({ id: request.id, decision, note })
              }
            />
          ))}
        </section>
      ) : null}

      {settled.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Geçmiş</h2>
          {settled.map((request) => (
            <AcceptanceRequestCard
              key={request.id}
              request={request}
              isPending={false}
              onRespond={() => undefined}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export default function TutorRequestsPage() {
  return (
    <RouteGuard requireRole="tutor">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Paket Talepleri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Öğrencilerinin ders paketi ve çalışma koçluğu taleplerini buradan
          yanıtla. Kabul etmen ödeme almaz — talep ödeme aktivasyonunu bekler.
        </p>
        <div className="mt-6">
          <RequestsContent />
        </div>
      </div>
    </RouteGuard>
  );
}

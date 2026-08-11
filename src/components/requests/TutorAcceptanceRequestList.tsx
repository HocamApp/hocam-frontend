"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";

import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { AcceptanceRequestCard } from "@/components/requests/AcceptanceRequestCard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Skeleton } from "@/components/ui/skeleton";
import {
  extractCoachingErrorMessage,
  fetchAcceptanceRequests,
  respondToAcceptanceRequest,
} from "@/lib/coachingApi";
import { partitionAcceptanceRequests } from "@/lib/coachingPresentation";

export function TutorAcceptanceRequestList({ surface }: { surface: "coaching" | "lessonOnly" }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
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
    onError: (mutationError) => setError(extractCoachingErrorMessage(mutationError)),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (query.isError) return <ErrorMessage message={extractCoachingErrorMessage(query.error)} />;

  const requests = partitionAcceptanceRequests(query.data ?? [])[surface];
  const open = requests.filter((request) => request.status === "pending");
  const settled = requests.filter((request) => request.status !== "pending");

  if (requests.length === 0) {
    return (
      <CoachingEmptyState
        icon={Inbox}
        title={surface === "coaching" ? "Yeni koçluk talebin yok" : "Bekleyen ders paketi talebin yok"}
        description={
          surface === "coaching"
            ? "Bir öğrenci ders paketine çalışma koçluğu ekleyerek seni seçtiğinde bundle talebi burada görünür."
            : "Bir öğrenci yalnızca ders paketi için seni seçtiğinde talep burada görünür."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? <ErrorMessage message={error} /> : null}
      {open.length > 0 ? (
        <RequestSection
          title={`Yanıt bekleyenler (${open.length})`}
          requests={open}
          isPending={respond.isPending}
          onRespond={(id, decision, note) => respond.mutate({ id, decision, note })}
        />
      ) : null}
      {settled.length > 0 ? (
        <RequestSection title="Geçmiş" requests={settled} isPending={false} />
      ) : null}
    </div>
  );
}

function RequestSection({
  title,
  requests,
  isPending,
  onRespond,
}: {
  title: string;
  requests: ReturnType<typeof partitionAcceptanceRequests>["coaching"];
  isPending: boolean;
  onRespond?: (id: string, decision: "accept" | "reject", note?: string) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {requests.map((request) => (
        <AcceptanceRequestCard
          key={request.id}
          request={request}
          isPending={isPending}
          onRespond={(decision, note) => onRespond?.(request.id, decision, note)}
        />
      ))}
    </section>
  );
}

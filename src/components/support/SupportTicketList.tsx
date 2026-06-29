"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { fetchSupportTickets } from "@/lib/supportApi";
import { formatDate } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_VARIANTS,
} from "./supportContent";

export function SupportTicketList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: fetchSupportTickets,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Destek talepleriniz yüklenemedi." />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Henüz destek talebiniz yok"
        description="Bir sorunla karşılaşırsanız yukarıdaki formdan talep oluşturabilirsiniz."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((ticket) => (
        <Card key={ticket.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-foreground">{ticket.subject}</p>
              <Badge variant={STATUS_VARIANTS[ticket.status]}>
                {STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {ticket.message}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{CATEGORY_LABELS[ticket.category]}</span>
              <span aria-hidden>•</span>
              <span>{formatDate(ticket.created_at)}</span>
            </div>
            {ticket.admin_note && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Destek ekibi notu
                </p>
                <p className="whitespace-pre-wrap text-foreground">
                  {ticket.admin_note}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

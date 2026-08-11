"use client";

import { useQuery } from "@tanstack/react-query";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { COACHING_FAZ8_QUERY_KEYS, coachingEarningStatusCopy, fetchTutorCoachingEarnings } from "@/lib/coachingApi";

function Earnings() {
  const query = useQuery({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorEarnings(), queryFn: fetchTutorCoachingEarnings });
  if (query.isLoading) return <div className="flex min-h-[12rem] items-center justify-center"><LoadingSpinner /></div>;
  if (!query.data) return <p>Hakediş özeti yüklenemedi.</p>;
  const rows = [["eligible_unfunded", query.data.eligible_unfunded_minor], ["pending", query.data.pending_minor], ["on_hold", query.data.on_hold_minor], ["reversed", query.data.reversed_minor]] as const;
  return <div className="space-y-4"><Card><CardContent className="space-y-3 py-5"><h1 className="text-xl font-semibold">Koçluk hakedişleri</h1>{rows.map(([status, amount]) => <div className="flex justify-between gap-3 text-sm" key={status}><span>{coachingEarningStatusCopy(status)}</span><span>{amount} kuruş</span></div>)}</CardContent></Card>
    <Card><CardContent className="space-y-3 py-5"><h2 className="font-semibold">Aylık ödeme hazırlığı</h2>{query.data.payout_batches.length ? query.data.payout_batches.map((batch) => <div key={batch.local_month} className="rounded border p-3 text-sm"><p>{batch.local_month} · {coachingEarningStatusCopy(batch.status)}</p><p className="text-muted-foreground">Sunucu kaydı: {batch.total_amount_minor} kuruş{batch.paid_at ? ` · ödeme kaydı ${new Date(batch.paid_at).toLocaleString("tr-TR")}` : ""}</p></div>) : <p className="text-sm text-muted-foreground">Henüz aylık ödeme hazırlık kaydı yok.</p>}</CardContent></Card></div>;
}

export default function TutorCoachingEarningsPage() { return <CoachingRecordGuard><main className="mx-auto max-w-3xl px-4 py-8"><Earnings /></main></CoachingRecordGuard>; }

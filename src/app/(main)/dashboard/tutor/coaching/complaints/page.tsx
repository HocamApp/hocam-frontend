"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COACHING_FAZ8_QUERY_KEYS, fetchTutorCoachingDisputes } from "@/lib/coachingApi";

function Complaints() {
  const query = useQuery({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDisputes(), queryFn: fetchTutorCoachingDisputes });
  if (query.isLoading) return <div className="flex min-h-[12rem] items-center justify-center"><LoadingSpinner /></div>;
  if (!query.data?.length) return <EmptyState title="Koçluk başvurusu yok" description="Sana ait bir başvuru olduğunda, yalnız paylaşılması uygun katılımcı bilgileri burada görünür." />;
  return <div className="space-y-3">{query.data.map((item) => <Link key={item.id} href={`/dashboard/tutor/coaching/complaints/${item.id}`}><Card className="transition-colors hover:bg-muted/50"><CardContent className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">{item.category}</p><p className="text-sm text-muted-foreground">Öğrenci açıklaması ve iç inceleme notları burada paylaşılmaz.</p></div><Badge>{item.status}</Badge></CardContent></Card></Link>)}</div>;
}

export default function TutorCoachingComplaintsPage() { return <CoachingRecordGuard><main className="mx-auto max-w-3xl px-4 py-8"><h1 className="mb-6 text-2xl font-semibold">Koçluk başvuruları</h1><Complaints /></main></CoachingRecordGuard>; }

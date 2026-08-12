"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COACHING_FAZ8_QUERY_KEYS, fetchTutorCoachingDisputes } from "@/lib/coachingApi";

function Complaints() {
  const query = useQuery({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDisputes(), queryFn: fetchTutorCoachingDisputes });
  if (query.isLoading) return <div className="flex min-h-[12rem] items-center justify-center"><LoadingSpinner /></div>;
  if (!query.data?.length) return <EmptyState title="Koçluk başvurusu yok" description="Sana ait bir başvuru olduğunda, yalnız paylaşılması uygun katılımcı bilgileri burada görünür." steps={["Başvuru incelemeye alınır", "Paylaşılabilir durum burada görünür"]} />;
  return <div className="space-y-3">{query.data.map((item) => <Link key={item.id} href={`/dashboard/tutor/coaching/complaints/${item.id}`}><Card className="transition-colors hover:bg-muted/50"><CardContent className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">{item.category}</p><p className="text-sm text-muted-foreground">Öğrenci açıklaması ve iç inceleme notları burada paylaşılmaz.</p></div><Badge>{item.status}</Badge></CardContent></Card></Link>)}</div>;
}

export default function TutorCoachingComplaintsPage() { return <CoachingRecordGuard><CoachingPageShell title="Koçluk başvuruları" description="Sana açıklanmış öğrenci başvurularını ve paylaşılması uygun kanıtları incele." parentHref="/dashboard/tutor/coaching" parentLabel="Koçluk ana sayfası" eyebrow="Başvurular" width="narrow" currentHref="/dashboard/tutor/coaching/complaints" audience="tutor"><Complaints /></CoachingPageShell></CoachingRecordGuard>; }

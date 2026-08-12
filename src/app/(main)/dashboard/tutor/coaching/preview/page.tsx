"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";

import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { StudentPreviewCard } from "@/components/coaching/StudentPreviewCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCoachingPlanPreview } from "@/lib/coachingApi";

function PreviewContent() {
  const { data: preview, isLoading } = useQuery({
    queryKey: ["coaching-plan-preview"],
    queryFn: fetchCoachingPlanPreview,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!preview) {
    return (
      <CoachingEmptyState
        icon={Eye}
        title="Önizlenecek plan yok"
        description="Koçluk planını oluşturduğunda öğrencilerin ne göreceğini buradan kontrol edebilirsin."
        actions={
          <Button asChild>
            <Link href="/dashboard/tutor/coaching/plan">Plan oluştur</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
        Bu, öğrencilerin koçluk teklifini nasıl gördüğünün önizlemesidir.
        Sayfada yaptığın hiçbir işlem öğrencilere gitmez.
      </p>
      <StudentPreviewCard preview={preview} />
    </div>
  );
}

export default function CoachingPreviewPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell
        title="Öğrenci görünümü"
        description="Koçluk teklifinin öğrenci profilinde nasıl anlatıldığını kontrol et. Bu sayfa salt okunurdur."
        parentHref="/dashboard/tutor/coaching"
        parentLabel="Koçluk ana sayfası"
        eyebrow="Önizleme"
        width="narrow"
        currentHref="/dashboard/tutor/coaching/preview"
        audience="tutor"
      >
        <PreviewContent />
      </CoachingPageShell>
    </CoachingGuard>
  );
}

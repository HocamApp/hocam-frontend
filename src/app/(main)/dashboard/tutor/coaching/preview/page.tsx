"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { StudentPreviewCard } from "@/components/coaching/StudentPreviewCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { fetchCoachingPlanPreview } from "@/lib/coachingApi";

function PreviewContent() {
  const { data: preview, isLoading } = useQuery({
    queryKey: ["coaching-plan-preview"],
    queryFn: fetchCoachingPlanPreview,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!preview) {
    return (
      <EmptyState
        title="Önizlenecek plan yok"
        description="Koçluk planını oluşturduğunda öğrencilerin ne göreceğini buradan kontrol edebilirsin."
        action={
          <Button asChild>
            <Link href="/dashboard/tutor/coaching/plan">Plan oluştur</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
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
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="text-2xl font-bold">Öğrenci görünümü</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Koçluk teklifin öğrenciye böyle görünür.
        </p>
        <div className="mt-6">
          <PreviewContent />
        </div>
      </div>
    </CoachingGuard>
  );
}

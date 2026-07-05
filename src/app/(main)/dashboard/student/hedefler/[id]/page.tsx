"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Flag, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createStudentGoal, fetchLearningDashboard } from "@/lib/learningApi";
import {
  buildMilestonePath,
  formatGoalStatus,
  formatLevel,
  getGoalLessonCount,
  getPackageLessonCount,
} from "@/lib/learning";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MilestonePath } from "@/components/learning/MilestonePath";
import { PackageCover } from "@/components/learning/PackageCover";
import { ProgressBar } from "@/components/learning/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function GoalPackageDetailContent() {
  const params = useParams<{ id: string }>();
  const packageId = params?.id ?? "";
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const {
    data: learningDashboard,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });

  const startGoalMutation = useMutation({
    mutationFn: (templateId: string) =>
      createStudentGoal({ template: templateId }),
    onSuccess: async () => {
      toast.success("Paket hedeflerine eklendi.");
      await queryClient.invalidateQueries({ queryKey: ["learning-dashboard"] });
    },
    onError: () => {
      toast.error("Paket hedeflerine eklenemedi.");
    },
  });

  const goals = learningDashboard?.goals ?? [];
  const templates = learningDashboard?.templates ?? [];

  const goal =
    goals.find((item) => item.id === packageId) ??
    goals.find((item) => item.template === packageId) ??
    null;
  const template =
    templates.find((item) => item.id === (goal?.template ?? packageId)) ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="mt-8 space-y-6">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="mx-auto h-16 w-16 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || (!goal && !template)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Paket bulunamadı"
          description="Aradığın hedef paketi kaldırılmış veya bağlantı hatalı olabilir."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/student/learning">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Öğrenmeye dön
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isPreview = goal === null;
  const title = goal?.title ?? template?.title ?? "";
  const description = goal?.description ?? template?.description ?? "";
  const lessonCount = goal
    ? getGoalLessonCount(goal)
    : template
      ? getPackageLessonCount(template)
      : 0;
  const milestoneCount = goal
    ? goal.milestones.length
    : template?.milestone_templates.length ?? 0;
  const pathNodes = buildMilestonePath(template, goal);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard/student/learning">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Öğrenmeye dön
        </Link>
      </Button>

      <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <PackageCover
          examType={template?.exam_type}
          subjectName={template?.subject_name}
          isFeatured={template?.is_featured}
          className="h-32 w-full sm:h-40"
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {template && (
              <>
                <Badge variant="secondary" className="font-medium">
                  {template.exam_type} · {template.subject_name}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/5 font-medium text-primary"
                >
                  {formatLevel(template.level)}
                </Badge>
              </>
            )}
            {goal && (
              <Badge variant="secondary" className="font-medium">
                {formatGoalStatus(goal.status)}
              </Badge>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-normal sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              {lessonCount} ders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flag className="h-4 w-4" aria-hidden="true" />
              {milestoneCount} aşama
            </span>
          </div>

          {goal ? (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Genel ilerleme</span>
                <span className="font-semibold">%{goal.progress}</span>
              </div>
              <ProgressBar value={goal.progress} />
            </div>
          ) : (
            template && (
              <Button
                type="button"
                size="lg"
                className="mt-6 w-full sm:w-auto"
                disabled={startGoalMutation.isPending}
                onClick={() => startGoalMutation.mutate(template.id)}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                {startGoalMutation.isPending
                  ? "Ekleniyor..."
                  : "Hedefe ekle"}
              </Button>
            )
          )}
        </div>
      </header>

      <div className="mt-6 pb-16">
        <MilestonePath
          nodes={pathNodes}
          isPreview={isPreview}
          onActivate={
            template ? () => startGoalMutation.mutate(template.id) : undefined
          }
          isActivating={startGoalMutation.isPending}
        />
      </div>
    </div>
  );
}

export default function GoalPackageDetailPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <GoalPackageDetailContent />
    </RouteGuard>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Flag,
  ListChecks,
  Plus,
  Target,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  createStudentGoal,
  fetchLearningDashboard,
  fetchLearningGoalTemplates,
} from "@/lib/learningApi";
import {
  buildMilestonePath,
  formatGoalStatus,
  formatLevel,
  getGoalLessonCount,
  getPackageLessonCount,
} from "@/lib/learning";
import { getRelatedTemplates } from "@/lib/learningCatalog";
import {
  getGoalOutcomes,
  getLearningOutcomes,
  getPrerequisites,
  getWhyChooseCopy,
} from "@/lib/learningCopy";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MilestonePath } from "@/components/learning/MilestonePath";
import { PackageCover } from "@/components/learning/PackageCover";
import { PackageTutorsSection } from "@/components/learning/PackageTutorsSection";
import { ProgressBar } from "@/components/learning/ProgressBar";
import { RelatedPackageCard } from "@/components/learning/RelatedPackageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LearningGoalTemplate, StudentGoal } from "@/types";

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function PackageSummaryCards({
  template,
  goal,
  lessonCount,
  milestoneCount,
  onAdd,
  isAdding,
}: {
  template: LearningGoalTemplate;
  goal: StudentGoal | null;
  lessonCount: number;
  milestoneCount: number;
  onAdd: () => void;
  isAdding: boolean;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Sınav", value: template.exam_type },
    { label: "Seviye", value: formatLevel(template.level) },
    { label: "Ders sayısı", value: `${lessonCount} onaylı ders` },
    { label: "Aşama sayısı", value: `${milestoneCount} aşama` },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold">Paket ayrıntıları</h3>
        <dl className="mt-3 space-y-2.5">
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {goal ? (
          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Genel ilerleme</span>
              <span className="font-semibold">%{goal.progress}</span>
            </div>
            <ProgressBar value={goal.progress} />
          </div>
        ) : (
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={isAdding}
            onClick={onAdd}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {isAdding ? "Ekleniyor..." : "Hedefe ekle"}
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-semibold">Ön koşullar</h3>
        <ul className="mt-3 space-y-2">
          {getPrerequisites(template.level).map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GoalPackageDetailContent() {
  const params = useParams<{ id: string }>();
  const packageId = params?.id ?? "";
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const {
    data: learningDashboard,
    isLoading: dashboardLoading,
    isError,
  } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });

  // The dashboard payload caps templates at 6; resolve packages against the
  // full catalog so every template's detail page works.
  const { data: allTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ["learning-goal-templates"],
    queryFn: fetchLearningGoalTemplates,
    enabled: isAuthenticated,
    retry: false,
  });

  const isLoading = dashboardLoading || templatesLoading;

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
  const templates = allTemplates ?? learningDashboard?.templates ?? [];

  const goal =
    goals.find((item) => item.id === packageId) ??
    goals.find((item) => item.template === packageId) ??
    null;
  const template =
    templates.find((item) => item.id === (goal?.template ?? packageId)) ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
              <Link href="/dashboard/student">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Panelime dön
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
  const relatedTemplates = template
    ? getRelatedTemplates(template, templates)
    : [];
  const contentMilestones = template
    ? [...template.milestone_templates].sort((a, b) => a.order - b.order)
    : [];

  const handleAdd = () => {
    if (template) startGoalMutation.mutate(template.id);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard/student">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Panelime dön
        </Link>
      </Button>

      <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <PackageCover
          examType={template?.exam_type}
          subjectName={template?.subject_name}
          slug={template?.slug}
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
                onClick={handleAdd}
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

      {template && (
        <div className="mt-6 lg:hidden">
          <PackageSummaryCards
            template={template}
            goal={goal}
            lessonCount={lessonCount}
            milestoneCount={milestoneCount}
            onAdd={handleAdd}
            isAdding={startGoalMutation.isPending}
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-10 pb-16">
          {template && (
            <DetailSection title="Bu hedef paketini neden seçmelisin?">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {getWhyChooseCopy(template)}
              </p>
            </DetailSection>
          )}

          {template && (
            <DetailSection title="Bu pakette neler öğreneceksin?">
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {getLearningOutcomes(template).map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {template && (
            <DetailSection title="Hedef kazanımlar">
              <ul className="space-y-2.5">
                {getGoalOutcomes(template).map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-sm">
                    <Target
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{outcome}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {template && contentMilestones.length > 0 && (
            <DetailSection title="Paket içeriği">
              <ol className="space-y-2">
                {contentMilestones.map((milestone, index) => (
                  <li
                    key={milestone.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {milestone.title}
                    </span>
                    <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                      <ListChecks className="h-3 w-3" aria-hidden="true" />
                      {milestone.required_confirmed_lessons} onaylı ders
                    </Badge>
                  </li>
                ))}
              </ol>
            </DetailSection>
          )}

          <DetailSection title="Başarı yolu">
            <MilestonePath
              nodes={pathNodes}
              isPreview={isPreview}
              onActivate={template ? handleAdd : undefined}
              isActivating={startGoalMutation.isPending}
            />
          </DetailSection>

          {template && (
            <DetailSection title="Bu hedef paketini veren hocalar">
              <PackageTutorsSection template={template} />
            </DetailSection>
          )}

          {relatedTemplates.length > 0 && (
            <DetailSection title="Diğer hedef paketleri">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {relatedTemplates.map((related) => (
                  <RelatedPackageCard key={related.id} template={related} />
                ))}
              </div>
            </DetailSection>
          )}
        </main>

        {template && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <PackageSummaryCards
                template={template}
                goal={goal}
                lessonCount={lessonCount}
                milestoneCount={milestoneCount}
                onAdd={handleAdd}
                isAdding={startGoalMutation.isPending}
              />
            </div>
          </aside>
        )}
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

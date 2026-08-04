import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatLevel,
  getPackageLessonCount,
  goalPackageHref,
} from "@/lib/learning";
import { PackageCover } from "@/components/learning/PackageCover";
import type { LearningGoalTemplate } from "@/types";

interface GoalPackageCardProps {
  template: LearningGoalTemplate;
  isAdded: boolean;
}

export function GoalPackageCard({ template, isAdded }: GoalPackageCardProps) {
  const lessonCount = getPackageLessonCount(template);
  const milestoneCount =
    template.milestone_templates.length || template.estimated_milestones;
  const href = goalPackageHref(template.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${template.title} paket detayları`}
      >
        <div className="overflow-hidden">
          <PackageCover
            examType={template.exam_type}
            subjectName={template.subject_name}
            isFeatured={template.is_featured}
            className="h-36 w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {template.exam_type} · {template.subject_name}
          </Badge>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 font-medium text-primary"
          >
            {formatLevel(template.level)}
          </Badge>
          {isAdded && (
            <Badge className="gap-1 bg-emerald-600 font-medium text-white hover:bg-emerald-600">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Aktif hedefinde
            </Badge>
          )}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug tracking-normal">
          <Link href={href} className="hover:underline">
            {template.title}
          </Link>
        </h3>

        {template.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {template.description}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {lessonCount} ders
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            {milestoneCount} aşama
          </span>
        </div>

        <div className="mt-auto pt-5">
          <Button asChild variant={isAdded ? "outline" : "default"} className="w-full">
            <Link href={href}>
              {isAdded ? "Yola devam et" : "Detaylar"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

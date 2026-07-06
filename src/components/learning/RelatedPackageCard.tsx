import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPackageLessonCount, goalPackageHref } from "@/lib/learning";
import { PackageCover } from "@/components/learning/PackageCover";
import type { LearningGoalTemplate } from "@/types";

interface RelatedPackageCardProps {
  template: LearningGoalTemplate;
}

/** Compact horizontal card for the "Diğer hedef paketleri" section. */
export function RelatedPackageCard({ template }: RelatedPackageCardProps) {
  const milestoneCount =
    template.milestone_templates.length || template.estimated_milestones;

  return (
    <Link
      href={goalPackageHref(template.id)}
      className="group flex gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <PackageCover
        examType={template.exam_type}
        subjectName={template.subject_name}
        slug={template.slug}
        className="h-20 w-24 shrink-0 rounded-lg"
      />
      <div className="min-w-0">
        <Badge variant="secondary" className="text-xs font-medium">
          {template.exam_type} · {template.subject_name}
        </Badge>
        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
          {template.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {getPackageLessonCount(template)} ders · {milestoneCount} aşama
        </p>
      </div>
    </Link>
  );
}

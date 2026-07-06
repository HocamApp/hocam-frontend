import Link from "next/link";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/learning/ProgressBar";
import {
  formatGoalStatus,
  getNextMilestone,
  goalPackageHref,
} from "@/lib/learning";
import type { StudentGoal } from "@/types";

interface ActiveGoalCardProps {
  goal: StudentGoal;
}

export function ActiveGoalCard({ goal }: ActiveGoalCardProps) {
  const nextMilestone = getNextMilestone(goal);
  const completedCount = goal.milestones.filter(
    (m) => m.status === "completed" || m.progress >= 100
  ).length;
  const href = goalPackageHref(goal.id);

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-normal">
              <Link href={href} className="hover:underline">
                {goal.title}
              </Link>
            </h3>
            <Badge variant="secondary" className="font-medium">
              {formatGoalStatus(goal.status)}
            </Badge>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <ProgressBar value={goal.progress} className="max-w-56" />
            <span className="shrink-0 text-sm font-semibold">
              %{goal.progress}
            </span>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            {nextMilestone ? (
              <>
                <Target
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="truncate">
                  Sıradaki aşama: {nextMilestone.title}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                {goal.milestones.length > 0
                  ? `Tüm aşamalar tamamlandı (${completedCount}/${goal.milestones.length})`
                  : "Bu hedefte henüz aşama yok"}
              </>
            )}
          </p>
        </div>

        <Button asChild variant="outline" className="shrink-0">
          <Link href={href}>
            Yola devam et
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

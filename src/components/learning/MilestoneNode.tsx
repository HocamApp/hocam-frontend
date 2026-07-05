"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Flag,
  Gift,
  Lock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProgressBar } from "@/components/learning/ProgressBar";
import {
  buildMilestoneTutorSearchHref,
  type MilestonePathNode,
} from "@/lib/learning";
import { cn } from "@/lib/utils";

interface MilestoneNodeProps {
  node: MilestonePathNode;
  /** Preview mode: the package is not in the student's goals yet. */
  isPreview: boolean;
  onActivate?: () => void;
  isActivating?: boolean;
}

const NODE_STYLES: Record<MilestonePathNode["state"], string> = {
  completed:
    "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25",
  active:
    "border-primary bg-card text-primary shadow-lg shadow-primary/20",
  pending_confirmation:
    "border-amber-400 bg-amber-50 text-amber-600 shadow-md shadow-amber-500/20 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-300",
  upcoming: "border-border bg-muted text-muted-foreground/70",
  reward_locked:
    "border-border bg-muted text-muted-foreground/70",
  reward_unlocked:
    "border-amber-400 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/40",
};

function NodeIcon({ node }: { node: MilestonePathNode }) {
  if (node.kind === "reward") {
    return <Gift className="h-6 w-6" aria-hidden="true" />;
  }

  switch (node.state) {
    case "completed":
      return <Check className="h-7 w-7" strokeWidth={3} aria-hidden="true" />;
    case "active":
      return <Star className="h-6 w-6 fill-current" aria-hidden="true" />;
    case "pending_confirmation":
      return <Clock3 className="h-6 w-6" aria-hidden="true" />;
    default:
      return node.kind === "start" ? (
        <Flag className="h-6 w-6" aria-hidden="true" />
      ) : (
        <Lock className="h-5 w-5" aria-hidden="true" />
      );
  }
}

function ActiveProgressRing({ progress }: { progress: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <svg
      className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90"
      viewBox="0 0 80 80"
      aria-hidden="true"
    >
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        strokeWidth="5"
        className="stroke-muted"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped / 100)}
        className="stroke-primary transition-all"
      />
    </svg>
  );
}

export function MilestoneNode({
  node,
  isPreview,
  onActivate,
  isActivating = false,
}: MilestoneNodeProps) {
  const isActive = node.state === "active";
  const completedLessons =
    node.requiredLessons > 0
      ? Math.min(
          node.requiredLessons,
          Math.round((node.progress / 100) * node.requiredLessons)
        )
      : 0;

  const showFindTutorCta =
    !isPreview &&
    node.kind === "milestone" &&
    node.state !== "completed" &&
    node.cta !== null;

  const showActivateCta = isPreview && node.kind === "start" && onActivate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          aria-label={`${node.title} — detayları gör`}
        >
          {isActive && (
            <span className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-xl border-2 border-primary/30 bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary shadow-md">
              {node.kind === "start"
                ? "BAŞLA"
                : node.progress > 0
                  ? "DEVAM ET"
                  : "SIRADAKİ"}
              <span
                className="absolute -bottom-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-primary/30 bg-card"
                aria-hidden="true"
              />
            </span>
          )}

          <span
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform duration-200 group-hover:scale-105 group-active:scale-95",
              NODE_STYLES[node.state]
            )}
          >
            {isActive && node.kind === "milestone" && (
              <ActiveProgressRing progress={node.progress} />
            )}
            <NodeIcon node={node} />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 rounded-2xl" collisionPadding={16}>
        <div className="space-y-3">
          <div>
            <p className="font-semibold leading-snug">{node.title}</p>
            {node.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {node.description}
              </p>
            )}
          </div>

          {node.kind === "milestone" && node.requiredLessons > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  {completedLessons}/{node.requiredLessons} onaylı ders
                </span>
                <span>%{node.progress}</span>
              </div>
              <ProgressBar value={node.progress} />
            </div>
          )}

          {node.state === "pending_confirmation" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
              Ders sonrası ilerlemen hoca onayı bekliyor.
            </p>
          )}

          {showFindTutorCta && node.cta && (
            <Button asChild size="sm" className="w-full">
              <Link
                href={buildMilestoneTutorSearchHref(
                  node.cta.goalId,
                  node.cta.milestoneId,
                  node.cta.topicId
                )}
              >
                Bu konu için hoca bul
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}

          {showActivateCta && (
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={isActivating}
              onClick={onActivate}
            >
              {isActivating ? "Ekleniyor..." : "Paketi hedefine ekle"}
            </Button>
          )}

          {isPreview && node.kind === "milestone" && (
            <p className="text-xs text-muted-foreground">
              Paketi hedefine ekledikten sonra bu aşamada ilerleme
              kazanabilirsin.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

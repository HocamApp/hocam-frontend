"use client";

import { useRef } from "react";

import { PageIntroHint } from "@/components/shared/PageIntroHint";
import type { CoachingTodo, CoachingWeekDay } from "@/lib/coachingOverview";
import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";
import { CoachingPageShell } from "./CoachingPageShell";
import { CoachingPlatformNotice } from "./CoachingPlatformNotice";
import { CoachingStatusCard } from "./CoachingStatusCard";
import { CoachingTodoCard } from "./CoachingTodoCard";
import { CoachingWeekCard, type CoachingOfferGlance } from "./CoachingWeekCard";

export interface TutorCoachingLists {
  todos: readonly CoachingTodo[];
  todoState: "loading" | "error" | "ready";
  week: { days: CoachingWeekDay[]; total: number };
  weekState: "loading" | "error" | "ready";
  offer: CoachingOfferGlance | null;
  onRetryTodos: () => void;
  onRetryWeek: () => void;
  isRetrying: boolean;
}

/**
 * Genel bakış: what to do next, and the week. A tutor whose setup is finished
 * sees those two cards and nothing else; one who is not sees the next-step
 * panel first, since there is nothing to list yet. `lists` is null until a plan
 * exists.
 */
export function TutorCoachingDashboard({
  status,
  lists,
}: {
  status: CoachingDerivedStatus;
  lists: TutorCoachingLists | null;
}) {
  const titleRef = useRef<HTMLSpanElement>(null);
  return (
    <CoachingPageShell
      title="Çalışma koçluğu"
      titleRef={titleRef}
      width="wide"
      currentHref="/dashboard/tutor/coaching"
      audience="tutor"
    >
      <PageIntroHint hintKey="tutor_intro_coaching" anchorRef={titleRef} title="Koçluk teklifin burada">
        Öğrencilere ders paketine ek olarak çalışma koçluğu sunabilirsin. Kurulumu, gelen talepleri ve görüşmeleri bu sayfadan yönetirsin.
      </PageIntroHint>

      {status.readiness !== "complete" ? (
        <CoachingStatusCard status={status} />
      ) : status.platformMessage ? (
        <CoachingPlatformNotice message={status.platformMessage} />
      ) : null}

      {lists ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <CoachingTodoCard
            todos={lists.todos}
            state={lists.todoState}
            onRetry={lists.onRetryTodos}
            isRetrying={lists.isRetrying}
          />
          <CoachingWeekCard
            week={lists.week}
            state={lists.weekState}
            offer={lists.offer}
            onRetry={lists.onRetryWeek}
            isRetrying={lists.isRetrying}
          />
        </div>
      ) : null}
    </CoachingPageShell>
  );
}

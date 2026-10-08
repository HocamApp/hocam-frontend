"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { studentSteps } from "./YsHowItWorks";
import { YsStepTabs, type YsTabStep } from "./YsStepTabs";
import { useTutorSteps } from "./YsTutorBand";
import { pages, students, tutors } from "./ysHomeCopy";

type Audience = "student" | "tutor";

/**
 * /nasil-calisir with NEXT_PUBLIC_HOME_V2: the homepage's student steps and
 * tutor steps behind an Öğrenciyim / Hocayım toggle.
 *
 * Both lists are in the server HTML; the toggle only flips `hidden`, so the
 * student steps read without JavaScript. Pills as in the FAQ tabs.
 *
 * Inside each track the steps switch like the homepage's: clicking one makes
 * it active. The student track shows the homepage's screenshots beside it;
 * there are no tutor screenshots, so that track switches the marker alone.
 */
export function YsStepsToggle({ lessonRoomShot = false }: { lessonRoomShot?: boolean }) {
  const [active, setActive] = useState<Audience>("student");
  const lists: Record<Audience, { label: string; steps: YsTabStep[] }> = {
    student: { label: students.stepsLabel, steps: studentSteps(lessonRoomShot) },
    tutor: { label: tutors.stepsLabel, steps: useTutorSteps() },
  };
  const copy = pages.nasilCalisir;

  return (
    <div>
      <div role="tablist" aria-label={copy.toggleLabel} className="flex flex-wrap gap-2">
        {(["student", "tutor"] as const).map((audience) => {
          const selected = audience === active;
          return (
            <button
              key={audience}
              type="button"
              role="tab"
              id={`ys-steps-tab-${audience}`}
              aria-selected={selected}
              aria-controls={`ys-steps-panel-${audience}`}
              onClick={() => setActive(audience)}
              className={cn(
                "inline-flex h-9 items-center rounded-pill border border-ink px-[22px] text-[0.875rem] font-medium transition-colors duration-[--duration-state]",
                selected ? "bg-ink text-paper" : "text-ink hover:bg-ink hover:text-paper",
              )}
            >
              {copy[audience]}
            </button>
          );
        })}
      </div>

      {(["student", "tutor"] as const).map((audience) => (
        <div
          key={audience}
          role="tabpanel"
          id={`ys-steps-panel-${audience}`}
          aria-labelledby={`ys-steps-tab-${audience}`}
          hidden={audience !== active}
          className={cn("mt-8", audience === "tutor" && "max-w-3xl")}
        >
          <YsStepTabs label={lists[audience].label} steps={lists[audience].steps} />
        </div>
      ))}
    </div>
  );
}

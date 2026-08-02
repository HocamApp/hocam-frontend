"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { goalPackageHref } from "@/lib/learning";
import { HomeRail } from "@/components/home/HomeRail";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { HOME_GOAL_CARDS } from "@/components/home/homeShowcaseContent";
import { Card } from "@/components/ui/card";
import type { LearningGoalTemplate, StudentGoal } from "@/types";

/**
 * Goal-led storytelling row. Cards use the same photography system as the
 * explore rail; each card links into the matching milestone package supplied
 * by the learning backend.
 * Card sizing mirrors the explore rail: three large cards on desktop, one
 * card plus a next-card peek on mobile.
 */
export function HomeGoalCards({
  templates = [],
  goals = [],
}: {
  templates?: LearningGoalTemplate[];
  goals?: StudentGoal[];
}) {
  return (
    <section aria-labelledby="home-goals-title" className="space-y-7">
      <HomeSectionHeader
        headingId="home-goals-title"
        title="Hedefine göre ilerle"
        description="Bölüm hedefine uygun aşamalı paketleri ve kilometre taşlarını incele."
      />

      <HomeRail
        label="Hedef kartları"
        onScrollAction={(direction) =>
          trackHomeEvent("home_teacher_rail_scrolled", { rail: "goals", direction })
        }
      >
        {HOME_GOAL_CARDS.map((goal) => {
          const template = templates.find(({ slug }) => slug === goal.templateSlug);
          const activeGoal = template
            ? goals.find(
                (studentGoal) =>
                  studentGoal.template === template.id && studentGoal.status === "active"
              )
            : undefined;
          const href = activeGoal
            ? goalPackageHref(activeGoal.id)
            : template
              ? goalPackageHref(template.id)
              : goal.href;

          return (
            <Link
              key={goal.id}
              href={href}
              onClick={() => trackHomeEvent("home_goal_card_clicked", { goal_id: goal.id })}
              className="w-[82vw] shrink-0 snap-start rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[calc((100%-2rem)/3)]"
            >
              <Card className="group flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
                  <Image
                    src={goal.image.src}
                    alt={goal.image.alt}
                    fill
                    sizes="(min-width: 1280px) 395px, (min-width: 640px) 31vw, 82vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col bg-card p-5">
                  <h3 className="text-lg font-semibold tracking-tight">{goal.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {goal.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {goal.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="mt-auto inline-flex items-center pt-5 text-sm font-medium text-primary">
                    {activeGoal ? "Hedefe devam et" : "Hedef paketini incele"}
                    <ArrowRight
                      className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </HomeRail>
    </section>
  );
}

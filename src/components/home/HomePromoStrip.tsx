"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { HOME_PROMO_STRIP } from "@/components/home/homeShowcaseContent";
import { Button } from "@/components/ui/button";

/** Restrained closing band. Deliberately smaller than the hero. */
export function HomePromoStrip() {
  return (
    <section className="rounded-3xl bg-primary px-6 py-9 text-primary-foreground sm:px-10 sm:py-11">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="flex min-w-0 items-start gap-5">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 sm:flex">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {HOME_PROMO_STRIP.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
              {HOME_PROMO_STRIP.description}
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          variant="secondary"
          className="w-full shrink-0 rounded-xl sm:w-auto sm:self-start lg:self-auto"
        >
          <Link
            href={HOME_PROMO_STRIP.ctaHref}
            onClick={() =>
              trackHomeEvent("home_all_tutors_clicked", { placement: "closing_cta" })
            }
          >
            {HOME_PROMO_STRIP.ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

"use client";

import { RefreshCw } from "lucide-react";
import type { TutorProfile } from "@/types";
import { trackHomeEvent } from "@/lib/homeAnalytics";
import { HomeRail } from "@/components/home/HomeRail";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HomeTeacherCard,
  HomeTeacherCardSkeleton,
  mockToTeacherCard,
  tutorToTeacherCard,
} from "@/components/home/HomeTeacherCard";
import { HOME_MOCK_TEACHERS } from "@/components/home/homeShowcaseContent";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";

const MIN_RAIL_CARDS = 4;

/**
 * Builds the rail from real tutors, topping up with placeholder cards so the
 * rail keeps its shape on a sparse or brand-new environment.
 */
export function buildTeacherRail(tutors: TutorProfile[], minCards = MIN_RAIL_CARDS) {
  const real = tutors.map(tutorToTeacherCard);
  if (real.length >= minCards) return real;
  const fillCount = minCards - real.length;
  return [...real, ...HOME_MOCK_TEACHERS.slice(0, fillCount).map(mockToTeacherCard)];
}

interface HomeTeacherRailProps {
  tutors: TutorProfile[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function HomeTeacherRail({ tutors, isLoading, isError, onRetry }: HomeTeacherRailProps) {
  const cards = buildTeacherRail(tutors);

  return (
    <section aria-labelledby="home-teachers-title" className="space-y-7">
      <HomeSectionHeader
        headingId="home-teachers-title"
        title="Öne çıkan hocalar"
        description="Yüksek puanlı doğrulanmış hocalar."
        href="/tutors"
        action="Tüm hocaları gör"
        onAction={() =>
          trackHomeEvent("home_all_tutors_clicked", { placement: "teacher_rail" })
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(0,1fr))] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <HomeTeacherCardSkeleton key={item} />
          ))}
        </div>
      ) : isError ? (
        <div className="space-y-3">
          <ErrorMessage message="Hoca önerileri şu anda yüklenemedi. Tüm hocaları görüntülemeye devam edebilirsin." />
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tekrar dene
          </Button>
        </div>
      ) : (
        <HomeRail
          label="Öne çıkan hocalar"
          onScrollAction={(direction) =>
            trackHomeEvent("home_teacher_rail_scrolled", { rail: "popular", direction })
          }
        >
          {cards.map((teacher, index) => (
            <div
              key={teacher.id}
              className="w-[82vw] shrink-0 snap-start sm:w-[268px]"
            >
              <HomeTeacherCard
                teacher={teacher}
                index={index}
                onOpen={() =>
                  trackHomeEvent("home_tutor_profile_opened", {
                    tutor_id: teacher.id,
                    placement: "teacher_rail",
                    position: index + 1,
                  })
                }
              />
            </div>
          ))}
        </HomeRail>
      )}
    </section>
  );
}

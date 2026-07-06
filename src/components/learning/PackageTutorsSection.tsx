"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTutors } from "@/lib/tutorsApi";
import {
  getPackageTutorFilters,
  getPackageTutorSearchHref,
} from "@/lib/learningCatalog";
import { TutorCard } from "@/components/tutors/TutorCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LearningGoalTemplate } from "@/types";

interface PackageTutorsSectionProps {
  template: LearningGoalTemplate;
}

/**
 * Real tutors matching the package's exam/subject, via the existing tutor
 * search API. Falls back to a pre-filtered marketplace link when the query
 * fails or matches no one — never renders placeholder tutors.
 */
export function PackageTutorsSection({ template }: PackageTutorsSectionProps) {
  const searchHref = getPackageTutorSearchHref(template);

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["package-tutors", template.id],
    queryFn: () => fetchTutors(getPackageTutorFilters(template), 1, 4),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((item) => (
          <Skeleton key={item} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  const tutors = data?.results ?? [];

  if (isError || tutors.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed bg-card/50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Users className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            Bu pakete uygun hocaları hoca arama sayfasından bulabilirsin.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={searchHref}>
            Tüm uygun hocaları gör
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {tutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
      <Button asChild variant="outline">
        <Link href={searchHref}>
          Tüm uygun hocaları gör
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

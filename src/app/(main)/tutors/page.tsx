"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  fetchTutors,
  fetchSubjects,
  type TutorFilters as TutorFiltersType,
} from "@/lib/tutorsApi";
import { TutorCard } from "@/components/tutors/TutorCard";
import { TutorFilters } from "@/components/tutors/TutorFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function filtersFromSearchParams(searchParams: URLSearchParams): TutorFiltersType {
  const subject = searchParams.get("subject");
  const exam_type = searchParams.get("exam_type");
  const min_rating = searchParams.get("min_rating");
  const max_price = searchParams.get("max_price");
  const is_verified = searchParams.get("is_verified");
  const ordering = searchParams.get("ordering") || "rating";
  return {
    ...(subject != null && subject !== "" && { subject }),
    ...(exam_type != null && exam_type !== "" && { exam_type }),
    ...(min_rating != null && min_rating !== "" && { min_rating }),
    ...(max_price != null && max_price !== "" && { max_price }),
    ...(is_verified != null && is_verified !== "" && { is_verified }),
    ordering: ordering || "rating",
  };
}

function searchParamsFromFilters(filters: TutorFiltersType): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.subject) p.set("subject", filters.subject);
  if (filters.exam_type) p.set("exam_type", filters.exam_type);
  if (filters.min_rating) p.set("min_rating", filters.min_rating);
  if (filters.max_price) p.set("max_price", filters.max_price);
  if (filters.is_verified) p.set("is_verified", filters.is_verified);
  if (filters.ordering && filters.ordering !== "rating") p.set("ordering", filters.ordering);
  return p;
}

function TutorCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-4 flex justify-between border-t pt-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

function TutorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFiltersState] = useState<TutorFiltersType>(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    return { ...fromUrl, ordering: fromUrl.ordering || "rating" };
  });

  const setFilters = useCallback(
    (newFilters: TutorFiltersType) => {
      const merged = { ...newFilters, ordering: newFilters.ordering || "rating" };
      setFiltersState(merged);
      const params = searchParamsFromFilters(merged);
      const query = params.toString();
      const url = query ? `/tutors?${query}` : "/tutors";
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const handleFiltersChange = useCallback(
    (newFilters: TutorFiltersType) => {
      setFilters({ ...newFilters, ordering: newFilters.ordering || "rating" });
    },
    [setFilters]
  );

  const {
    data: tutors,
    isLoading: tutorsLoading,
    error: tutorsError,
  } = useQuery({
    queryKey: ["tutors", filters],
    queryFn: () => fetchTutors(filters),
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: Infinity,
  });

  const hasActiveFilters =
    (filters.subject ?? "") !== "" ||
    (filters.exam_type ?? "") !== "" ||
    (filters.min_rating ?? "") !== "" ||
    (filters.max_price ?? "") !== "" ||
    (filters.is_verified ?? "") !== "" ||
    (filters.ordering ?? "rating") !== "rating";
  const isEmpty = Array.isArray(tutors) && tutors.length === 0;
  const showEmptyState = isEmpty && hasActiveFilters;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Hoca Bul</h1>
        <p className="text-muted-foreground">
          YKS&apos;de başarılı olmuş, üniversiteli hocalardan ders al
        </p>
        {!tutorsLoading && Array.isArray(tutors) && (
          <p className="mt-1 text-sm text-muted-foreground">{tutors.length} hoca bulundu</p>
        )}
      </div>

      {/* Mobile filter button row */}
      <div className="mb-4 flex md:hidden">
        <TutorFilters
          filters={filters}
          subjects={subjects ?? []}
          onFiltersChange={handleFiltersChange}
          isLoading={subjectsLoading}
        />
      </div>

      {/* Two-column layout */}
      <div className="flex gap-8">
        {/* Left: filters (desktop) */}
        <TutorFilters
          filters={filters}
          subjects={subjects ?? []}
          onFiltersChange={handleFiltersChange}
          isLoading={subjectsLoading}
        />

        {/* Right: tutor grid */}
        <div className="min-w-0 flex-1">
          {tutorsError && (
            <ErrorMessage
              message={
                tutorsError instanceof Error ? tutorsError.message : "Hocalar yüklenirken bir hata oluştu."
              }
            />
          )}

          {tutorsLoading && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TutorCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!tutorsLoading && !tutorsError && showEmptyState && (
            <EmptyState
              title="Hoca bulunamadı"
              description="Filtrelerinizi değiştirmeyi deneyin"
              action={
                <Button variant="outline" onClick={() => handleFiltersChange({})}>
                  Filtreleri Temizle
                </Button>
              }
            />
          )}

          {!tutorsLoading && !tutorsError && !showEmptyState && Array.isArray(tutors) && tutors.length > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          )}

          {!tutorsLoading && !tutorsError && Array.isArray(tutors) && tutors.length === 0 && !hasActiveFilters && (
            <EmptyState
              title="Henüz hoca yok"
              description="Yakında burada hocalar listelenecek."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TutorsPageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-96" />
      </div>
      <div className="flex gap-8">
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TutorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TutorsPage() {
  return (
    <Suspense fallback={<TutorsPageFallback />}>
      <TutorsPageContent />
    </Suspense>
  );
}

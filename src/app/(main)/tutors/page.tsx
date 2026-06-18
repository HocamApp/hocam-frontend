"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fetchTutors, fetchSubjects, type TutorFilters as TutorFiltersType } from "@/lib/tutorsApi";
import { TutorCard } from "@/components/tutors/TutorCard";
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
  const [maxPriceLocal, setMaxPriceLocal] = useState(filters.max_price ?? "");

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

  const content = (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Hocanu Bul</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Türkiye&apos;nin en iyi YKS hocaları, seni bekliyor.
          </p>
          {!tutorsLoading && Array.isArray(tutors) && (
            <p className="mt-1 text-xs text-muted-foreground">{tutors.length} hoca bulundu</p>
          )}
        </div>

        {/* Horizontal filter bar */}
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Sıralama */}
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Sıralama
              </Label>
              <Select
                value={filters.ordering ?? "rating"}
                onValueChange={(v) => handleFiltersChange({ ...filters, ordering: v || "rating" })}
                disabled={subjectsLoading || tutorsLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">En yüksek puan</SelectItem>
                  <SelectItem value="price">En uygun fiyat</SelectItem>
                  <SelectItem value="yks_rank">En iyi YKS sıralaması</SelectItem>
                  <SelectItem value="newest">En yeni</SelectItem>
                </SelectContent>
              </Select>
            </div>

          {/* Sınav */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Sınav
            </Label>
            <Select
              value={(filters.exam_type ?? "") || "__all__"}
              onValueChange={(v) =>
                handleFiltersChange({ ...filters, exam_type: v === "__all__" ? "" : v })
              }
              disabled={subjectsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm sınavlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tüm sınavlar</SelectItem>
                <SelectItem value="TYT">TYT</SelectItem>
                <SelectItem value="AYT">AYT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ders */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Ders
            </Label>
            <Select
              value={(filters.subject ?? "") || "__all__"}
              onValueChange={(v) =>
                handleFiltersChange({ ...filters, subject: v === "__all__" ? "" : v })
              }
              disabled={subjectsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm dersler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tüm dersler</SelectItem>
                {(subjects ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fiyat */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Fiyat
            </Label>
            <Select
              value={maxPriceLocal || "__all__"}
              onValueChange={(v) => {
                const value = v === "__all__" ? "" : v;
                setMaxPriceLocal(value);
                handleFiltersChange({ ...filters, max_price: value });
              }}
              disabled={subjectsLoading || tutorsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tümü</SelectItem>
                <SelectItem value="250">250 TL&apos;ye kadar</SelectItem>
                <SelectItem value="500">500 TL&apos;ye kadar</SelectItem>
                <SelectItem value="750">750 TL&apos;ye kadar</SelectItem>
                <SelectItem value="1000">1000 TL&apos;ye kadar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        </div>

        {/* Tutor grid and states */}
        <div className="min-w-0 flex-1">
          {tutorsError && (
            <ErrorMessage
              message={
                tutorsError instanceof Error ? tutorsError.message : "Hocalar yüklenirken bir hata oluştu."
              }
            />
          )}

          {tutorsLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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

          {!tutorsLoading && !tutorsError && !showEmptyState && Array.isArray(tutors) && (tutors.length > 0) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
  return content;
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

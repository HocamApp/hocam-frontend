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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PriceRangeSlider,
  priceRangeLabel,
  priceTupleToFilters,
  filtersToPriceTuple,
} from "@/components/tutors/PriceRangeSlider";
import { TutorCard } from "@/components/tutors/TutorCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function filtersFromSearchParams(searchParams: URLSearchParams): TutorFiltersType {
  const search = searchParams.get("search");
  const subject = searchParams.get("subject");
  const exam_type = searchParams.get("exam_type");
  const min_rating = searchParams.get("min_rating");
  const min_price = searchParams.get("min_price");
  const max_price = searchParams.get("max_price");
  const university = searchParams.get("university");
  const yks_rank_max = searchParams.get("yks_rank_max");
  const ordering = searchParams.get("ordering") || "rating";
  return {
    ...(search != null && search !== "" && { search }),
    ...(subject != null && subject !== "" && { subject }),
    ...(exam_type != null && exam_type !== "" && { exam_type }),
    ...(min_rating != null && min_rating !== "" && { min_rating }),
    ...(min_price != null && min_price !== "" && { min_price }),
    ...(max_price != null && max_price !== "" && { max_price }),
    ...(university != null && university !== "" && { university }),
    ...(yks_rank_max != null && yks_rank_max !== "" && { yks_rank_max }),
    ordering: ordering || "rating",
  };
}

function searchParamsFromFilters(filters: TutorFiltersType): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.search) p.set("search", filters.search);
  if (filters.subject) p.set("subject", filters.subject);
  if (filters.exam_type) p.set("exam_type", filters.exam_type);
  if (filters.min_rating) p.set("min_rating", filters.min_rating);
  if (filters.min_price) p.set("min_price", filters.min_price);
  if (filters.max_price) p.set("max_price", filters.max_price);
  if (filters.university) p.set("university", filters.university);
  if (filters.yks_rank_max) p.set("yks_rank_max", filters.yks_rank_max);
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
  const [searchLocal, setSearchLocal] = useState(filters.search ?? "");
  const [universityLocal, setUniversityLocal] = useState(filters.university ?? "");

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

  const handleClearFilters = useCallback(() => {
    setSearchLocal("");
    setUniversityLocal("");
    handleFiltersChange({});
  }, [handleFiltersChange]);

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
    (filters.search ?? "") !== "" ||
    (filters.subject ?? "") !== "" ||
    (filters.exam_type ?? "") !== "" ||
    (filters.min_rating ?? "") !== "" ||
    (filters.min_price ?? "") !== "" ||
    (filters.max_price ?? "") !== "" ||
    (filters.university ?? "") !== "" ||
    (filters.yks_rank_max ?? "") !== "" ||
    (filters.ordering ?? "rating") !== "rating";
  const isEmpty = Array.isArray(tutors) && tutors.length === 0;
  const showEmptyState = isEmpty && hasActiveFilters;

  const content = (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Hocanı Bul</h1>
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
            {/* Arama */}
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Arama
              </Label>
              <div className="flex gap-1">
                <Input
                  value={searchLocal}
                  onChange={(e) => setSearchLocal(e.target.value)}
                  onBlur={() => handleFiltersChange({ ...filters, search: searchLocal || undefined })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleFiltersChange({ ...filters, search: searchLocal || undefined });
                  }}
                  placeholder="Hoca veya üniversite ara..."
                  disabled={tutorsLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Ara"
                  disabled={tutorsLoading}
                  onClick={() => handleFiltersChange({ ...filters, search: searchLocal || undefined })}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

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
                <SelectItem value="YDT">YDT</SelectItem>
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
                {Array.from(new Map((subjects ?? []).map((s) => [s.name, s])).values()).map((s) => (
                  <SelectItem key={s.name} value={s.name}>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start font-normal"
                  disabled={subjectsLoading || tutorsLoading}
                >
                  {priceRangeLabel(
                    filtersToPriceTuple(filters.min_price, filters.max_price),
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-4" align="start">
                <PriceRangeSlider
                  value={filtersToPriceTuple(filters.min_price, filters.max_price)}
                  onValueCommit={(t) =>
                    handleFiltersChange({ ...filters, ...priceTupleToFilters(t) })
                  }
                  disabled={tutorsLoading}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Puan */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Min. Puan
            </Label>
            <Select
              value={(filters.min_rating ?? "") || "__all__"}
              onValueChange={(v) =>
                handleFiltersChange({ ...filters, min_rating: v === "__all__" ? "" : v })
              }
              disabled={tutorsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tümü</SelectItem>
                <SelectItem value="1">1+ puan</SelectItem>
                <SelectItem value="2">2+ puan</SelectItem>
                <SelectItem value="3">3+ puan</SelectItem>
                <SelectItem value="4">4+ puan</SelectItem>
                <SelectItem value="5">5 puan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* YKS Sıralaması */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              YKS Sıralaması
            </Label>
            <Select
              value={(filters.yks_rank_max ?? "") || "__all__"}
              onValueChange={(v) =>
                handleFiltersChange({ ...filters, yks_rank_max: v === "__all__" ? "" : v })
              }
              disabled={tutorsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tümü" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tümü</SelectItem>
                <SelectItem value="1000">İlk 1.000</SelectItem>
                <SelectItem value="5000">İlk 5.000</SelectItem>
                <SelectItem value="10000">İlk 10.000</SelectItem>
                <SelectItem value="15000">İlk 15.000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Üniversite */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Üniversite
            </Label>
            <Input
              value={universityLocal}
              onChange={(e) => setUniversityLocal(e.target.value)}
              onBlur={() => handleFiltersChange({ ...filters, university: universityLocal || undefined })}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  handleFiltersChange({ ...filters, university: universityLocal || undefined });
              }}
              placeholder="Üniversite ara..."
              disabled={tutorsLoading}
            />
          </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs text-muted-foreground">
                Filtreleri Temizle
              </Button>
            </div>
          )}
        </div>

        {/* Active search chip */}
        {filters.search && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Arama:</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              &quot;{filters.search}&quot;
            </span>
          </div>
        )}

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
              description={
                filters.search
                  ? `"${filters.search}" aramasıyla eşleşen hoca bulunamadı. Filtrelerinizi veya arama teriminizi değiştirmeyi deneyin.`
                  : "Filtrelerinizi değiştirmeyi deneyin."
              }
              action={
                <Button variant="outline" onClick={handleClearFilters}>
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

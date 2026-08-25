"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { fetchSubjects, fetchTutors, type TutorFilters as TutorFiltersType } from "@/lib/tutorsApi";
import { defaultTutorOrdering } from "@/lib/tutorDirectory";
import { useDelayedVisible } from "@/hooks/useDelayedVisible";
import { useFavorites } from "@/hooks/useFavorites";
import { TutorCard } from "@/components/tutors/TutorCard";
import { TutorFilters } from "@/components/tutors/TutorFilters";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SlidingPagination from "@/components/ui/sliding-pagination";

/**
 * The homepage's tutor directory.
 *
 * `TutorFilters` and `TutorCard` are imported unchanged — this component only
 * owns the state around them. It deliberately carries *less* than
 * `TutorsPageClient`:
 *
 * - **No URL sync.** `TutorsPageClient` hardcodes `/tutors` in every
 *   `router.replace`, so reusing it here would navigate the visitor off the
 *   homepage on the first filter change. Dropping the sync also keeps `/`
 *   statically prerenderable (no `useSearchParams` -> no `force-dynamic`).
 * - **No discovery telemetry.** The directory-impression payload has no
 *   surface field, so homepage impressions would silently contaminate
 *   `/tutors` ranking measurement.
 * - **No favourites mode / saved searches.** Both are entered from `/tutors`
 *   and the second one only renders for signed-in students.
 *
 * Query keys match `/tutors` exactly, so the two pages share one react-query
 * cache and navigating between them arrives warm.
 */

const PAGE_SIZE = 12;

/* A loading placeholder shaped like the `size="lg"` card: portrait on the
   left, text column beside it, stats/CTA rail on the right. Kept local so
   `/tutors` stays byte-identical to origin/main. */
function TutorCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm sm:min-h-[320px] sm:flex-row sm:gap-5 sm:p-6">
      <div className="flex flex-1 gap-4">
        <Skeleton className="h-28 w-28 shrink-0 rounded-xl sm:h-32 sm:w-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t pt-4 sm:w-48 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

export function YsTutorDirectory({ search }: { search?: string }) {
  const [filters, setFilters] = useState<TutorFiltersType>({});
  const [page, setPage] = useState(1);
  /* Starts closed on purpose, and deliberately does NOT read
     `hocam:tutor-filters-open` — inheriting the visitor's `/tutors`
     preference would defeat that. No hydration effect, so no open/close
     flash on first paint either. */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* The navbar owns the search term, so it is merged in here rather than
     living in `filters`. Feeding it through `defaultTutorOrdering` is what
     makes the "En alakalı" chip appear once there is something to be
     relevant to. */
  const effectiveFilters = useMemo<TutorFiltersType>(
    () => (search ? { ...filters, search } : filters),
    [filters, search],
  );

  // A new term should land the reader on the first page of its own results.
  useEffect(() => {
    setPage(1);
  }, [search]);

  const {
    data: tutors,
    isLoading,
    isPlaceholderData,
    error,
  } = useQuery({
    queryKey: ["tutors", effectiveFilters, page],
    queryFn: () => fetchTutors(effectiveFilters, page, PAGE_SIZE),
    placeholderData: (previousData) => previousData,
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: Infinity,
  });

  const { favoriteIds, toggle, isFavoritePending } = useFavorites();

  /* `isLoading` alone only covers the very first fetch — `placeholderData`
     keeps the previous page on screen for every filter change after that, so
     the list would sit on stale results with no sign anything was happening.
     `isPlaceholderData` is what says "these rows no longer match the
     controls", which is exactly when the placeholder belongs.
     Held back 200ms either way: a cached turn resolves faster than that, and
     a one-frame flash reads as a glitch rather than as progress. */
  const isResolving = isLoading || isPlaceholderData;
  const showSkeleton = useDelayedVisible(isResolving);

  const defaultOrdering = defaultTutorOrdering(effectiveFilters);
  const results = tutors?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((tutors?.count ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const hasActiveFilters = Object.values(effectiveFilters).some((value) => (value ?? "") !== "");
  // Suppressed for the whole resolve, not just while the skeleton is up,
  // so "not found" cannot flash during the 200ms grace window.
  const showEmptyState = !isResolving && !error && results.length === 0;

  const handleFiltersChange = (next: TutorFiltersType) => {
    setFilters(next);
    setPage(1);
  };

  const handleClear = () => {
    setFilters({});
    setPage(1);
  };

  /* Same chip vocabulary as `/tutors`: the three ordering chips behave like
     radios, "Çevrim içi" is a toggle, and nothing here is separate state —
     selection is derived from `filters`. */
  const chips = [
    ...(defaultOrdering === "relevance"
      ? [
          {
            label: "◎ En alakalı",
            active: (filters.ordering ?? defaultOrdering) === "relevance",
            next: { ordering: "relevance" },
          },
        ]
      : []),
    {
      label: "En yüksek puan",
      active: (filters.ordering ?? defaultOrdering) === "rating",
      next: { ordering: "rating" },
    },
    { label: "En uygun fiyat", active: filters.ordering === "price", next: { ordering: "price" } },
    {
      label: "En iyi YKS sıralaması",
      active: filters.ordering === "yks_rank",
      next: { ordering: "yks_rank" },
    },
    {
      label: "Çevrim içi",
      active: filters.online === "true",
      next: { online: filters.online === "true" ? "" : "true" },
    },
  ];

  return (
    <section className="mt-16 md:mt-24" aria-labelledby="ys-tutor-list-title">
      <h2
        id="ys-tutor-list-title"
        className="mb-4 text-2xl font-semibold leading-[1.3125] md:text-[2rem]"
      >
        Hocalar
      </h2>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="hidden shrink-0 rounded-full lg:inline-flex"
          aria-expanded={filtersOpen}
          aria-controls="ys-tutor-filter-panel"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {filtersOpen ? (
            <PanelLeftClose className="mr-1.5 h-4 w-4" />
          ) : (
            <PanelLeftOpen className="mr-1.5 h-4 w-4" />
          )}
          {filtersOpen ? "Filtreleri gizle" : "Filtreleri göster"}
        </Button>

        {chips.map((chip) => (
          <Button
            key={chip.label}
            type="button"
            size="sm"
            /* Solid ink when selected, not pink: pink marks the one primary
               action in a region, and a sort toggle is not it. */
            variant="outline"
            data-selected={chip.active || undefined}
            className="shrink-0 data-[selected]:border-ink data-[selected]:bg-ink data-[selected]:text-white"
            onClick={() => handleFiltersChange({ ...filters, ...chip.next })}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      {/* The sidebar column animates from 0 to 16rem. That 16rem is coupled to
          `TutorFilters`' own fixed `w-64` desktop wrapper — change one and the
          panel either clips or leaves a gap. */}
      <div
        className={`flex flex-col gap-6 lg:grid lg:items-start lg:transition-[grid-template-columns,gap] lg:duration-300 lg:ease-out ${
          filtersOpen
            ? "lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-6"
            : "lg:grid-cols-[0_minmax(0,1fr)] lg:gap-0"
        }`}
      >
        <aside
          id="ys-tutor-filter-panel"
          className={`min-w-0 overflow-hidden lg:self-start lg:transition-[opacity,transform,visibility] lg:duration-300 lg:ease-out ${
            filtersOpen
              ? "lg:visible lg:translate-x-0 lg:opacity-100"
              : "lg:invisible lg:pointer-events-none lg:-translate-x-3 lg:opacity-0"
          }`}
        >
          <TutorFilters
            filters={filters}
            subjects={subjects ?? []}
            onFiltersChange={handleFiltersChange}
            onClear={handleClear}
            isLoading={subjectsLoading || isLoading}
            defaultOrdering={defaultOrdering}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {error && (
            <ErrorMessage
              message={
                error instanceof Error ? error.message : "Hocalar yüklenirken bir hata oluştu."
              }
            />
          )}

          {showSkeleton && (
            <div
              aria-busy
              aria-label="Hocalar yükleniyor"
              role="status"
              className={`grid grid-cols-1 gap-6 ${filtersOpen ? "" : "md:grid-cols-2"}`}
            >
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <TutorCardSkeleton key={index} />
              ))}
            </div>
          )}

          {showEmptyState &&
            (hasActiveFilters ? (
              <EmptyState
                title="Hoca bulunamadı"
                description="En kısıtlayıcı filtreleri tek tek kaldırabilirsin."
                action={
                  <Button variant="outline" onClick={handleClear}>
                    Filtreleri Temizle
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="Henüz hoca yok"
                description="Yakında burada hocalar listelenecek."
              />
            ))}

          {!showSkeleton && !error && results.length > 0 && (
            <>
              <div className={`grid grid-cols-1 gap-6 ${filtersOpen ? "" : "md:grid-cols-2"}`}>
                {results.map((tutor) => (
                  <TutorCard
                    key={tutor.id}
                    tutor={tutor}
                    size="lg"
                    isFavorite={favoriteIds.has(tutor.id)}
                    onToggleFavorite={toggle}
                    favoritePending={isFavoritePending(tutor.id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center overflow-x-auto">
                  <SlidingPagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    maxVisiblePages={5}
                    onPageChange={(nextPage) => {
                      setPage(nextPage);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

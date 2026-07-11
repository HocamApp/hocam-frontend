"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { fetchTutors, fetchSubjects, type TutorFilters as TutorFiltersType } from "@/lib/tutorsApi";
import { AnimatedSearchBar } from "@/components/tutors/AnimatedSearchBar";
import { TutorCard } from "@/components/tutors/TutorCard";
import { TutorFilters } from "@/components/tutors/TutorFilters";
import { useFavorites } from "@/hooks/useFavorites";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SlidingPagination from "@/components/ui/sliding-pagination";
import { isSubjectValidForExam } from "@/lib/subjects";

const PAGE_SIZE = 12;
const FILTER_PANEL_PREFERENCE_KEY = "hocam:tutor-filters-open";
const LEARNING_CONTEXT_KEYS = [
  "learning_goal_id",
  "learning_milestone_id",
  "learning_topic_id",
] as const;

const DAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const ORDERING_LABELS: Record<string, string> = {
  price: "En uygun fiyat",
  yks_rank: "En iyi YKS sıralaması",
  newest: "En yeni hocalar",
};

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

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
  const availability_day = searchParams.get("availability_day");
  const availability_time = searchParams.get("availability_time");
  const online = searchParams.get("online");
  return {
    ...(search != null && search !== "" && { search }),
    ...(subject != null && subject !== "" && { subject }),
    ...(exam_type != null && exam_type !== "" && { exam_type }),
    ...(min_rating != null && min_rating !== "" && { min_rating }),
    ...(min_price != null && min_price !== "" && { min_price }),
    ...(max_price != null && max_price !== "" && { max_price }),
    ...(university != null && university !== "" && { university }),
    ...(yks_rank_max != null && yks_rank_max !== "" && { yks_rank_max }),
    ...(availability_day != null && availability_day !== "" && { availability_day }),
    ...(availability_time != null && availability_time !== "" && { availability_time }),
    ...(online != null && online !== "" && { online }),
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
  if (filters.availability_day) p.set("availability_day", filters.availability_day);
  if (filters.availability_time) p.set("availability_time", filters.availability_time);
  if (filters.online) p.set("online", filters.online);
  if (filters.ordering && filters.ordering !== "rating") p.set("ordering", filters.ordering);
  return p;
}

function learningContextFromSearchParams(
  searchParams: URLSearchParams
): LearningContextQuery | null {
  const learning_goal_id = searchParams.get("learning_goal_id");
  const learning_milestone_id = searchParams.get("learning_milestone_id");
  const learning_topic_id = searchParams.get("learning_topic_id");

  if (!learning_goal_id || !learning_milestone_id) {
    return null;
  }

  return {
    learning_goal_id,
    learning_milestone_id,
    ...(learning_topic_id ? { learning_topic_id } : {}),
  };
}

function appendLearningContextParams(
  params: URLSearchParams,
  learningContext?: LearningContextQuery | null
) {
  if (!learningContext) return params;

  params.set("learning_goal_id", learningContext.learning_goal_id);
  params.set("learning_milestone_id", learningContext.learning_milestone_id);
  if (learningContext.learning_topic_id) {
    params.set("learning_topic_id", learningContext.learning_topic_id);
  }

  return params;
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
      aria-label={`${label} filtresini kaldır`}
    >
      {label}<span aria-hidden="true">×</span>
    </button>
  );
}

function formatPriceFilter(minPrice?: string, maxPrice?: string) {
  const min = minPrice ? `${Number(minPrice).toLocaleString("tr-TR")} TL` : null;
  const max = maxPrice ? `${Number(maxPrice).toLocaleString("tr-TR")} TL` : null;
  if (min && max) return `${min}–${max}`;
  if (min) return `${min} ve üzeri`;
  return `${max} ve altı`;
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
  const [page, setPage] = useState(1);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);

  // Favorites toggle is URL-synced but not a backend filter (client-side only).
  const showFavorites = searchParams.get("favorites") === "1";
  const learningContext = learningContextFromSearchParams(
    new URLSearchParams(searchParams.toString())
  );

  const setFilters = useCallback(
    (newFilters: TutorFiltersType) => {
      const merged = { ...newFilters, ordering: newFilters.ordering || "rating" };
      setFiltersState(merged);
      setPage(1);
      const params = appendLearningContextParams(
        searchParamsFromFilters(merged),
        learningContext
      );
      const query = params.toString();
      const url = query ? `/tutors?${query}` : "/tutors";
      router.replace(url, { scroll: false });
    },
    [learningContext, router]
  );

  const handleFiltersChange = useCallback(
    (newFilters: TutorFiltersType) => {
      setFilters({ ...newFilters, ordering: newFilters.ordering || "rating" });
    },
    [setFilters]
  );

  const handleClearFilters = useCallback(() => {
    setSearchLocal("");
    setFiltersState({});
    setPage(1);
    const params = appendLearningContextParams(new URLSearchParams(), learningContext);
    const query = params.toString();
    router.replace(query ? `/tutors?${query}` : "/tutors", { scroll: false });
  }, [learningContext, router]);

  const clearLearningContext = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    LEARNING_CONTEXT_KEYS.forEach((key) => params.delete(key));
    const query = params.toString();
    router.replace(query ? `/tutors?${query}` : "/tutors", { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(new URLSearchParams(searchParams.toString()));
    setFiltersState(fromUrl);
    setSearchLocal(fromUrl.search ?? "");
  }, [searchParams]);

  useEffect(() => {
    setDesktopFiltersOpen(window.localStorage.getItem(FILTER_PANEL_PREFERENCE_KEY) === "true");
  }, []);

  const toggleDesktopFilters = () => {
    setDesktopFiltersOpen((current) => {
      const next = !current;
      window.localStorage.setItem(FILTER_PANEL_PREFERENCE_KEY, String(next));
      return next;
    });
  };

  const {
    data: tutors,
    isLoading: tutorsLoading,
    error: tutorsError,
  } = useQuery({
    queryKey: ["tutors", filters, page],
    queryFn: () => fetchTutors(filters, page, PAGE_SIZE),
    enabled: !showFavorites,
    placeholderData: (previousData) => previousData,
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    staleTime: Infinity,
  });
  useEffect(() => {
    if (!subjects || subjectsLoading) return;
    if (isSubjectValidForExam(subjects, filters.subject, filters.exam_type)) return;
    handleFiltersChange({ ...filters, subject: "" });
  }, [subjects, subjectsLoading, filters, handleFiltersChange]);

  const {
    favorites,
    favoriteIds,
    isLoading: favoritesLoading,
    toggle,
    isFavoritePending,
  } = useFavorites();
  const isListLoading = showFavorites ? favoritesLoading : tutorsLoading;
  const listError = showFavorites ? null : tutorsError;

  const hasActiveFilters =
    (filters.search ?? "") !== "" ||
    (filters.subject ?? "") !== "" ||
    (filters.exam_type ?? "") !== "" ||
    (filters.min_rating ?? "") !== "" ||
    (filters.min_price ?? "") !== "" ||
    (filters.max_price ?? "") !== "" ||
    (filters.university ?? "") !== "" ||
    (filters.yks_rank_max ?? "") !== "" ||
    (filters.availability_day ?? "") !== "" ||
    (filters.availability_time ?? "") !== "" ||
    (filters.online ?? "") !== "" ||
    (filters.ordering ?? "rating") !== "rating";

  const tutorList = showFavorites
    ? favorites.map((favorite) => favorite.tutor)
    : tutors?.results ?? [];
  const filteredTutors = tutorList;

  // showEmptyState: user applied filters/favorites and got 0 results.
  const apiEmpty = !showFavorites && tutors?.count === 0;
  const showFavoritesEmptyState =
    showFavorites && !isListLoading && !listError && filteredTutors.length === 0;
  const showEmptyState =
    !showFavorites &&
    !isListLoading &&
    !listError &&
    filteredTutors.length === 0 &&
    hasActiveFilters;

  const totalItems = showFavorites ? filteredTutors.length : tutors?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages); // clamp if list shrank
  const pageTutors = showFavorites
    ? filteredTutors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : filteredTutors;

  const content = (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        {!showFavorites && (
          <>
            <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-background to-violet-500/10 px-5 py-7 shadow-sm sm:px-8 sm:py-9">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm font-semibold text-primary">DOĞRULANMIŞ YKS HOCALARI</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Sana uygun hocayı bul
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Dersine, hedeflerine ve uygun saatlerine göre hoca ara; profilleri karşılaştırıp güvenle rezervasyon yap.
                </p>
                <div className="mt-6 text-left">
                  <AnimatedSearchBar
                    value={searchLocal}
                    onChange={setSearchLocal}
                    onCommit={(search) => handleFiltersChange({ ...filters, search })}
                    disabled={isListLoading}
                  />
                </div>
                {!isListLoading && tutors && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{tutors.count ?? 0}</span> doğrulanmış hoca bulundu
                  </p>
                )}
              </div>
            </div>

            {learningContext && (
              <div className="flex flex-col gap-3 rounded-lg border bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                  Seçtiğin öğrenme konusu için hoca arıyorsun. Mesaj veya rezervasyon bu hedefe bağlanacak.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit shrink-0"
                  onClick={clearLearningContext}
                >
                  Bağlamı temizle
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="hidden shrink-0 rounded-full lg:inline-flex"
                  aria-expanded={desktopFiltersOpen}
                  aria-controls="tutor-filter-panel"
                  onClick={toggleDesktopFilters}
                >
                  {desktopFiltersOpen ? <PanelLeftClose className="mr-1.5 h-4 w-4" /> : <PanelLeftOpen className="mr-1.5 h-4 w-4" />}
                  {desktopFiltersOpen ? "Filtreleri gizle" : "Filtreleri göster"}
                </Button>
                {[
                  { label: "★ En yüksek puan", active: (filters.ordering ?? "rating") === "rating", next: { ordering: "rating" } },
                  { label: "₺ En uygun fiyat", active: filters.ordering === "price", next: { ordering: "price" } },
                  { label: "🏆 En iyi YKS sıralaması", active: filters.ordering === "yks_rank", next: { ordering: "yks_rank" } },
                  { label: "● Çevrim içi", active: filters.online === "true", next: { online: filters.online === "true" ? "" : "true" } },
                ].map((chip) => (
                  <Button
                    key={chip.label}
                    type="button"
                    size="sm"
                    variant={chip.active ? "default" : "outline"}
                    className="shrink-0 rounded-full"
                    onClick={() => handleFiltersChange({ ...filters, ...chip.next })}
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Aktif filtreler:</span>
                  {filters.search && <FilterPill label={`Arama: ${filters.search}`} onRemove={() => { setSearchLocal(""); handleFiltersChange({ ...filters, search: "" }); }} />}
                  {filters.subject && <FilterPill label={filters.subject} onRemove={() => handleFiltersChange({ ...filters, subject: "" })} />}
                  {filters.exam_type && <FilterPill label={filters.exam_type} onRemove={() => handleFiltersChange({ ...filters, exam_type: "", subject: "" })} />}
                  {filters.min_price || filters.max_price ? <FilterPill label={formatPriceFilter(filters.min_price, filters.max_price)} onRemove={() => handleFiltersChange({ ...filters, min_price: "", max_price: "" })} /> : null}
                  {filters.min_rating && <FilterPill label={`${filters.min_rating}+ puan`} onRemove={() => handleFiltersChange({ ...filters, min_rating: "" })} />}
                  {filters.yks_rank_max && <FilterPill label={`İlk ${Number(filters.yks_rank_max).toLocaleString("tr-TR")}`} onRemove={() => handleFiltersChange({ ...filters, yks_rank_max: "" })} />}
                  {filters.university && <FilterPill label={filters.university} onRemove={() => handleFiltersChange({ ...filters, university: "" })} />}
                  {filters.availability_day && <FilterPill label={DAY_LABELS[Number(filters.availability_day)] ?? "Uygunluk günü"} onRemove={() => handleFiltersChange({ ...filters, availability_day: "", availability_time: "" })} />}
                  {filters.availability_time && <FilterPill label={`${filters.availability_time} uygunluğu`} onRemove={() => handleFiltersChange({ ...filters, availability_time: "" })} />}
                  {filters.online === "true" && <FilterPill label="Çevrim içi" onRemove={() => handleFiltersChange({ ...filters, online: "" })} />}
                  {(filters.ordering ?? "rating") !== "rating" && <FilterPill label={ORDERING_LABELS[filters.ordering ?? ""] ?? "Sıralama"} onRemove={() => handleFiltersChange({ ...filters, ordering: "rating" })} />}
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>Temizle</Button>
                </div>
              )}
            </div>
          </>
        )}

        <div
          className={`flex flex-col gap-6 lg:grid lg:items-start lg:transition-[grid-template-columns,gap] lg:duration-300 lg:ease-out ${
            desktopFiltersOpen
              ? "lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-6"
              : "lg:grid-cols-[0_minmax(0,1fr)] lg:gap-0"
          }`}
        >
          {!showFavorites && (
            <aside
              id="tutor-filter-panel"
              className={`min-w-0 overflow-hidden lg:sticky lg:top-24 lg:transition-[opacity,transform,visibility] lg:duration-300 lg:ease-out ${
                desktopFiltersOpen
                  ? "lg:visible lg:translate-x-0 lg:opacity-100"
                  : "lg:invisible lg:pointer-events-none lg:-translate-x-3 lg:opacity-0"
              }`}
            >
              <TutorFilters
                filters={filters}
                subjects={subjects ?? []}
                onFiltersChange={handleFiltersChange}
                onClear={handleClearFilters}
                isLoading={subjectsLoading || isListLoading}
              />
            </aside>
          )}

          {/* Tutor grid and states */}
          <div className="min-w-0 flex-1">
            {listError && (
            <ErrorMessage
              message={
                listError instanceof Error ? listError.message : "Hocalar yüklenirken bir hata oluştu."
              }
            />
            )}

            {isListLoading && (
            <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${desktopFiltersOpen ? "" : "xl:grid-cols-3"}`}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <TutorCardSkeleton key={i} />
              ))}
            </div>
            )}

          {showFavoritesEmptyState ? (
            <EmptyState
              title="Henüz favori hocan yok."
              description="Hoca profillerindeki kalp ikonuna tıklayarak favorilerine ekleyebilirsin."
            />
          ) : showEmptyState ? (
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
          ) : null}

          {!isListLoading && !listError && !showEmptyState && filteredTutors.length > 0 && (
            <>
              <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${desktopFiltersOpen ? "" : "xl:grid-cols-3"}`}>
                {pageTutors.map((tutor) => (
                  <TutorCard
                    key={tutor.id}
                    tutor={tutor}
                    isFavorite={favoriteIds.has(tutor.id)}
                    onToggleFavorite={toggle}
                    favoritePending={isFavoritePending(tutor.id)}
                    learningContext={learningContext}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <SlidingPagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={(p) => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </>
          )}

          {!showFavorites && !isListLoading && !listError && apiEmpty && !hasActiveFilters && (
            <EmptyState
              title="Henüz hoca yok"
              description="Yakında burada hocalar listelenecek."
            />
          )}
          </div>
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

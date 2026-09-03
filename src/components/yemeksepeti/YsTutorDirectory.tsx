"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SidebarSimple } from "@phosphor-icons/react";

import { YsFavouritesBanner } from "./YsPromoBanners";

import {
  fetchSubjects,
  fetchTutors,
  type TutorFilters as TutorFiltersType,
} from "@/lib/tutorsApi";
import {
  ANONYMOUS_PAGE_LIMIT,
  isGatedPage,
  signupUrlForGatedPage,
} from "@/lib/anonymousBrowsing";
import { directoryFilterQuery, readDirectoryFilters, TUTOR_LIST_ID } from "@/lib/tutorDirectoryLinks";
import { defaultTutorOrdering } from "@/lib/tutorDirectory";
import {
  filterFavoriteTutors,
  sortFavoriteTutors,
} from "@/lib/favoriteTutorFiltering";
import { useAuth } from "@/hooks/useAuth";
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
 * - **URL-backed filters.** Footer shortcuts and browser history share the
 *   same filter state as the controls, without leaving the current route.
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

/**
 * Suspense boundary, and it has to be here rather than at the call site.
 *
 * The body reads `useSearchParams`, which opts its whole route into dynamic
 * rendering unless it is suspended — the production build fails outright with
 * `missing-suspense-with-csr-bailout` rather than degrading. Putting the
 * boundary beside the hook keeps the rest of the homepage prerenderable
 * instead of taking the hero, band and FAQ down with it.
 *
 * The fallback is the heading plus a grid of the real card skeletons, so the
 * prerendered shell has the same shape as the resolved page.
 */
export function YsTutorDirectory({ favoritesOnly = false }: DirectoryProps = {}) {
  return (
    <Suspense fallback={<DirectoryFallback favoritesOnly={favoritesOnly} />}>
      <DirectoryBody favoritesOnly={favoritesOnly} />
    </Suspense>
  );
}

type DirectoryProps = {
  /**
   * The favourites route. Same list, same controls, but the saved tutors are
   * the whole population rather than a view of it — so there is no promo for
   * a feature the reader is already using, and no search box in the header
   * pointing at a different page's results.
   */
  favoritesOnly?: boolean;
};

function DirectoryFallback({ favoritesOnly }: DirectoryProps) {
  return (
    <section className="mt-16 md:mt-24" aria-labelledby="ys-tutor-list-title">
      <h2
        id={TUTOR_LIST_ID}
        className="mb-6 scroll-mt-[calc(var(--app-header-h)+2rem)] text-2xl font-semibold leading-[1.3125] md:text-[2rem]"
      >
        {favoritesOnly ? "Favori Hocalarım" : "Hocalar"}
      </h2>
      <div
        aria-busy
        aria-label="Hocalar yükleniyor"
        role="status"
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {Array.from({ length: PAGE_SIZE }).map((_, index) => (
          <TutorCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

function DirectoryBody({ favoritesOnly = false }: DirectoryProps) {
  /* Read rather than received. The search box lives in the header, which is
     rendered by a layout and has no path down to this component — so the URL
     carries the term between them. It also survives a reload and a back
     button, which the old prop never did. */
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  /* Back to the directory with the reader's filters intact, not to a bare
     "/". Register already knows how to honour returnUrl. */
  const returnUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/?${query}` : "/";
  }, [searchParams]);
  const search = searchParams.get("search") ?? undefined;
  /* Favourites is a view of this same list rather than a page of its own, and
     it is client-side: the favourites endpoint returns the tutors directly, so
     there is nothing to page or filter server-side. Same URL contract the old
     /tutors screen used, so an existing `?favorites=1` link still means what
     it meant. */
  const showFavorites = favoritesOnly || searchParams.get("favorites") === "1";

  const filters = useMemo(() => readDirectoryFilters(searchParams), [searchParams]);
  const [page, setPage] = useState(1);
  /* Starts closed on purpose, and deliberately does NOT read
     `hocam:tutor-filters-open` — inheriting the visitor's `/tutors`
     preference would defeat that. No hydration effect, so no open/close
     flash on first paint either. */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Paging used to jump to the top of the document, which on the homepage is
     the hero — three sections above the list the reader was actually working
     in, so every page turn cost them a scroll back down. It lands on the
     heading instead, just under the sticky header, and only when the reader
     asked for a new page. Scrolling stays free in both directions from
     there. */
  const listRef = useRef<HTMLElement>(null);
  const scrollListIntoView = useCallback(() => {
    const section = listRef.current;
    if (!section) return;
    const header =
      document.querySelector<HTMLElement>("[data-app-header]")?.offsetHeight ?? 0;
    // 32px of air under the sticky header, not 12. At 12 the heading landed
    // almost touching the header and the first row of cards read as if it
    // were part of the chrome.
    const top = section.getBoundingClientRect().top + window.scrollY - header - 32;
    window.scrollTo({
      top: Math.max(0, top),
      // A page turn is a jump the reader asked for; smoothing it means the
      // new rows arrive before the scroll does.
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  // Direct footer links land on the existing list, below the sticky header.
  // Wait for font metrics before the initial jump; never animate a long trip
  // through the hero just to reach the results the visitor requested.
  useEffect(() => {
    if (window.location.hash !== `#${TUTOR_LIST_ID}`) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        const heading = document.getElementById(TUTOR_LIST_ID);
        heading?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    });
    return () => { cancelled = true; };
  }, [searchParams]);

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
  }, [search, filters]);

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

  const {
    favorites,
    favoriteIds,
    toggle,
    isFavoritePending,
    isLoading: favoritesLoading,
  } = useFavorites();

  /* `isLoading` alone only covers the very first fetch — `placeholderData`
     keeps the previous page on screen for every filter change after that, so
     the list would sit on stale results with no sign anything was happening.
     `isPlaceholderData` is what says "these rows no longer match the
     controls", which is exactly when the placeholder belongs.
     Held back 200ms either way: a cached turn resolves faster than that, and
     a one-frame flash reads as a glitch rather than as progress. */
  const isResolving = showFavorites
    ? favoritesLoading
    : isLoading || isPlaceholderData;
  const showSkeleton = useDelayedVisible(isResolving);

  const defaultOrdering = defaultTutorOrdering(effectiveFilters);

  /* The favourites endpoint takes no filters and no page — it returns the
     saved tutors whole. So the filter panel and the sort chips are answered
     here rather than by the server, and the list is paged locally once it is
     longer than a screenful. */
  const favoriteResults = useMemo(() => {
    if (!showFavorites) return [];
    const tutorsOnly = favorites.map((favorite) => favorite.tutor);
    return sortFavoriteTutors(
      filterFavoriteTutors(tutorsOnly, effectiveFilters),
      effectiveFilters.ordering,
    );
  }, [showFavorites, favorites, effectiveFilters]);

  const totalPages = showFavorites
    ? Math.max(1, Math.ceil(favoriteResults.length / PAGE_SIZE))
    : Math.max(1, Math.ceil((tutors?.count ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const results = showFavorites
    ? favoriteResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : (tutors?.results ?? []);
  const hasActiveFilters = Object.values(effectiveFilters).some(
    (value) => (value ?? "") !== "",
  );
  // Suppressed for the whole resolve, not just while the skeleton is up,
  // so "not found" cannot flash during the 200ms grace window.
  const showEmptyState = !isResolving && !error && results.length === 0;

  const handleFiltersChange = (next: TutorFiltersType) => {
    const query = directoryFilterQuery(searchParams.toString(), next);
    router.replace(`${pathname}${query ? `?${query}` : ""}#${TUTOR_LIST_ID}`, { scroll: false });
    setPage(1);
  };

  const handleClear = () => handleFiltersChange({});

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
    {
      label: "En uygun fiyat",
      active: filters.ordering === "price",
      next: { ordering: "price" },
    },
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
    <section
      ref={listRef}
      /* The top margin separates the list from the university strip above it
         on the homepage. The favourites page has nothing above it and sets
         its own rhythm, so it opts out rather than cancelling this with a
         negative margin — two margins that collapse into each other, which is
         how the heading ended up flush against the header. */
      className={`${favoritesOnly ? "" : "mt-16 md:mt-24"} scroll-mt-[calc(var(--app-header-h)+2rem)]`}
      aria-labelledby="ys-tutor-list-title"
    >
      {/* Heading and sort controls on the left, the favourites promo taking
          the room they leave on the right. The promo used to be a full-width
          band of its own between two other bands, which gave the page three
          stacked promos in a row before any tutor appeared. */}
      {/* `items-stretch` so the promo ends exactly where the chips do, top and
          bottom. It is a fixed 340px and only shares the row from xl up: the
          five chips need 811px, and anything narrower than that on the left
          clipped "Çevrim içi" mid-word. */}
      <div className="mb-6 flex flex-col gap-6 min-[1400px]:flex-row min-[1400px]:items-stretch min-[1400px]:justify-between">
        <div className="min-w-0 min-[1400px]:flex-1">
          <h2
            id={TUTOR_LIST_ID}
            className="mb-4 scroll-mt-[calc(var(--app-header-h)+2rem)] text-2xl font-semibold leading-[1.3125] md:text-[2rem]"
          >
            {favoritesOnly ? "Favori Hocalarım" : "Hocalar"}
          </h2>

          {(filters.exam_type || filters.subject) && (
            <p className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-ink-mid" aria-live="polite">
              <span>{filters.exam_type === "YKS" ? "YKS · TYT ve AYT" : filters.exam_type}{filters.subject ? ` · ${filters.subject}` : ""} hocaları</span>
              <button type="button" onClick={handleClear} className="min-h-11 underline underline-offset-4 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Filtreleri temizle</button>
            </p>
          )}

          {/* No bottom padding: it was 4px of scrollbar room, and it put the
              promo's lower edge 4px past the chips it is meant to line up
              with. Above 1400 the chips do not overflow, and below it the
              promo stacks anyway. */}
          <div className="flex gap-2 overflow-x-auto">
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
                <SidebarSimple className="mr-1.5 h-4 w-4" />
              ) : (
                <SidebarSimple className="mr-1.5 h-4 w-4" />
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
                className="shrink-0 data-[selected]:border-ink data-[selected]:bg-ink data-[selected]:text-paper"
                onClick={() =>
                  handleFiltersChange({ ...filters, ...chip.next })
                }
              >
                {chip.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Nothing to sell on the favourites page: the reader is already
            using the feature the banner explains. */}
        {!favoritesOnly && (
          <div className="min-[1400px]:w-[340px] min-[1400px]:shrink-0">
            <YsFavouritesBanner />
          </div>
        )}
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
                error instanceof Error
                  ? error.message
                  : "Hocalar yüklenirken bir hata oluştu."
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

          {showEmptyState && showFavorites && (
            favorites.length > 0 ? (
              <EmptyState
                title="Bu filtrelere uyan favorin yok"
                description="Favorilerin duruyor, sadece bu filtrelerin hiçbiriyle eşleşmiyor."
                action={
                  <Button variant="outline" onClick={handleClear}>
                    Filtreleri Temizle
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="Henüz favori hocan yok"
                description="Beğendiğin hocaları kartlarındaki kalbe dokunarak buraya kaydedebilirsin."
                action={
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Hocaları keşfet
                  </Button>
                }
              />
            )
          )}

          {showEmptyState &&
            !showFavorites &&
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
              <div
                className={`grid grid-cols-1 gap-6 ${filtersOpen ? "" : "md:grid-cols-2"}`}
              >
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

              {/* Said before it is enforced. A meter that only announces
                  itself at the moment it blocks you reads as a trap; this
                  line appears on the last free page, while the reader still
                  has somewhere to go. */}
              {!isAuthenticated && totalPages > ANONYMOUS_PAGE_LIMIT &&
                currentPage === ANONYMOUS_PAGE_LIMIT && (
                  <div className="mt-8 flex flex-col items-center gap-3 text-center">
                    <p className="text-body text-ink-mid">
                      İlk {ANONYMOUS_PAGE_LIMIT} sayfayı hesapsız görebiliyorsun.
                      Kalan hocalar için ücretsiz hesap aç.
                    </p>
                    <Link
                      href={signupUrlForGatedPage(returnUrl)}
                      className="ys-btn ys-btn--primary ys-btn--regular"
                    >
                      Ücretsiz hesap aç
                    </Link>
                  </div>
                )}

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center overflow-x-auto">
                  <SlidingPagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    maxVisiblePages={5}
                    onPageChange={(nextPage) => {
                      // The meter: a signed-out visitor gets two pages, then
                      // the third page turn is the ask. Routing rather than
                      // opening a dialog, because what they are being sent to
                      // is a real page with its own URL and back button.
                      if (isGatedPage(nextPage, isAuthenticated)) {
                        router.push(signupUrlForGatedPage(returnUrl));
                        return;
                      }
                      setPage(nextPage);
                      scrollListIntoView();
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

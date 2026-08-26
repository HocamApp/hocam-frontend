"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AnimatedSearchBar } from "@/components/tutors/AnimatedSearchBar";
import { BrandMark } from "@/components/brand/BrandMark";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { useAuth } from "@/hooks/useAuth";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { useScheduleFlag } from "@/hooks/useScheduleFlag";
import { useTutorAcceptanceConfig } from "@/hooks/useTutorAcceptanceConfig";

import { YsNavIcons } from "./YsNavIcons";
import {
  YS_PUBLIC_TABS,
  getActiveYsNavItem,
  getYsAppTabs,
  type YsNavItem,
} from "./ysAppNav";

/*
 * When the hint appears, how long it stays, and how long its exit lasts.
 *
 * 6s of dwell is the Material snackbar band (4s short / 10s long) applied to
 * this sentence: ~11 Turkish words is roughly 3.5s of reading at 200wpm, and
 * the rest is the buffer for noticing it in the first place.
 */
const NUDGE_DELAY_MS = 900;
const NUDGE_VISIBLE_MS = 6000;
const NUDGE_EXIT_MS = 200;

type Props = {
  /**
   * Held false while the entry promo is on screen — the coachmark would
   * otherwise live and die underneath its overlay. Only the homepage has a
   * promo to wait for; everywhere else the default is fine.
   */
  startCoachmark?: boolean;
};

function TabStrip({
  items,
  active,
}: {
  items: YsNavItem[];
  active: YsNavItem | null;
}) {
  return (
    <div className="scrollbar-none flex min-w-0 flex-1 overflow-x-auto">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item;
        return (
          /* Link, not a button with router.push: middle-click, cmd-click and
             hover preview come free, and none of them do with a handler. */
          <Link
            key={item.href}
            href={item.href}
            className="ys-tab"
            data-selected={isActive}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Outline by default, filled when active. The weight change is
                what carries the state, which is why the tab needs no accent
                bar to say it a second time. */}
            <Icon
              className="ys-tab__icon h-5 w-5"
              weight={isActive ? "fill" : "regular"}
              aria-hidden
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-6 py-4" aria-hidden>
      {[72, 88, 64].map((width) => (
        <span
          key={width}
          className="h-4 animate-skeleton-pulse rounded-input bg-[#EDE6E6]"
          style={{ width }}
        />
      ))}
    </div>
  );
}

/**
 * The application shell's header.
 *
 * Takes no data props. Everything it renders is derived from the route, the
 * session and the feature flags, which is what lets a single instance sit in
 * the layout and survive every navigation underneath it.
 *
 * The second row renders in all four states, including the ones where it is
 * empty. Its height is part of `--app-header-h`, and pages subtract that
 * constant; a row that disappeared on some routes would leave those pages
 * short by exactly its height.
 */
export function YsNavbar({ startCoachmark = true }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoading, isAuthenticated, isTutor, isAdmin, isImpersonating } =
    useAuth();
  const { enabled: coachingEnabled } = useCoachingFlag();
  const scheduleEnabled = useScheduleFlag();
  const { showPackageRequests } = useTutorAcceptanceConfig();

  const [nudge, setNudge] = useState<"hidden" | "visible" | "leaving">(
    "hidden",
  );
  const [searchDraft, setSearchDraft] = useState("");

  const isHome = pathname === "/";
  // An admin is not a student with extra powers: handing them the student tab
  // strip points at /dashboard/student, which RouteGuard bounces straight back
  // to /admin-control. Impersonation is the exception — that is precisely when
  // they are meant to see the impersonated role's app.
  const isAdminChrome = isAdmin && !isImpersonating;
  const mode = isLoading
    ? "loading"
    : !isAuthenticated
      ? "anon"
      : isAdminChrome
        ? "admin"
        : "app";

  /* The URL is the source of truth for the search, so the box reflects it
     after a back/forward. Only seeds when the URL actually carries a term:
     otherwise navigating to a page without one would wipe a draft mid-typing. */
  const committedSearch = searchParams.get("search");
  useEffect(() => {
    if (committedSearch) setSearchDraft(committedSearch);
  }, [committedSearch]);

  useEffect(() => {
    // The coachmark sells signing up, so it has nothing to say to someone who
    // already has. It is also a homepage device: the promo it follows only
    // runs there, and on any other route it would be an interruption.
    if (!startCoachmark || isLoading || isAuthenticated || !isHome) return;
    const show = window.setTimeout(() => setNudge("visible"), NUDGE_DELAY_MS);
    const leave = window.setTimeout(
      () => setNudge("leaving"),
      NUDGE_DELAY_MS + NUDGE_VISIBLE_MS,
    );
    const hide = window.setTimeout(
      () => setNudge("hidden"),
      NUDGE_DELAY_MS + NUDGE_VISIBLE_MS + NUDGE_EXIT_MS,
    );
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(leave);
      window.clearTimeout(hide);
    };
  }, [startCoachmark, isLoading, isAuthenticated, isHome]);

  const tabs =
    mode === "app"
      ? getYsAppTabs(isTutor ? "tutor" : "student", {
          coachingEnabled,
          scheduleEnabled,
          packageRequestsEnabled: showPackageRequests,
        })
      : mode === "anon"
        ? YS_PUBLIC_TABS
        : [];
  const activeTab = getActiveYsNavItem(tabs, pathname, searchParams);

  const commitSearch = (value: string | undefined) => {
    // Cloned rather than rebuilt: a bare `/?search=x` would silently drop the
    // favourites view and every filter the directory reads from the URL.
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("search", value);
    else next.delete("search");
    const query = next.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return (
    <section
      data-app-header
      className="sticky top-0 z-50 flex w-full flex-col bg-white"
      style={{ boxShadow: "var(--ys-elevation-low)" }}
    >
      <a
        href="#ys-main-content"
        className="ys-btn ys-btn--primary ys-btn--regular sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50"
      >
        Ana içeriğe geç
      </a>

      {/* Top row — brand on the left, account actions on the right. */}
      <header
        className="ys-shell flex items-center gap-2"
        style={{ height: "var(--app-header-row-1-h)" }}
      >
        <Link
          href={isAdminChrome ? "/admin-control" : "/"}
          aria-label="Hocam ana sayfa"
          className="shrink-0"
        >
          <BrandMark priority />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
          {mode === "loading" && (
            <span
              className="size-9 animate-skeleton-pulse rounded-pill bg-[#EDE6E6]"
              aria-hidden
            />
          )}

          {mode === "anon" && (
            <>
              <Link
                href="/login"
                className="ys-btn ys-btn--secondary ys-btn--small"
              >
                Giriş Yap
              </Link>
              <div className="relative">
                <Link
                  href="/register"
                  className="ys-btn ys-btn--primary ys-btn--small ys-from-md"
                >
                  Ücretsiz deneme dersi için kaydolun
                </Link>

                {nudge !== "hidden" && (
                  <div
                    className="ys-coachmark"
                    data-leaving={nudge === "leaving"}
                    aria-hidden
                    onClick={() => setNudge("leaving")}
                  >
                    İstediğin hocayla 20 dakikalık ilk görüşmeni ücret ödemeden
                    yapabilirsin. <strong>Kaydol</strong>
                  </div>
                )}
              </div>
            </>
          )}

          {mode === "admin" && (
            <Link
              href="/admin-control"
              className="ys-btn ys-btn--secondary ys-btn--small"
            >
              Admin Merkezi
            </Link>
          )}

          {/* Renders null when signed out, so it needs no guard of its own.
              It stays in row 1 because row 2 is hidden on phones and the
              account has to remain reachable there. */}
          {mode !== "loading" && <ProfileMenu />}
        </div>
      </header>

      <div
        className="ys-shell flex items-center gap-4 border-t"
        style={{
          height: "var(--app-header-row-2-h)",
          borderColor: "var(--ys-neutral-divider)",
        }}
      >
        {mode === "loading" ? (
          <TabSkeleton />
        ) : (
          <TabStrip items={tabs} active={activeTab} />
        )}

        {/* The directory's search, promoted to the header. It sits left of the
            icons rather than centred: the icons anchor the row's right edge,
            and splitting them apart reads worse than letting search lean on
            them. Commits to the URL, so it works from any page. */}
        <AnimatedSearchBar
          className="hidden shrink-0 py-2 md:block"
          tone="neutral"
          value={searchDraft}
          onChange={setSearchDraft}
          onCommit={commitSearch}
        />

        {mode === "app" && (
          <YsNavIcons pathname={pathname} searchParams={searchParams} />
        )}
      </div>
    </section>
  );
}

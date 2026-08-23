# Component Mapping

Reference pattern → Hocam product meaning → the actual component that will
render it. Every path and prop signature below was read from source.

Verdict legend: **REUSE** (use unchanged) · **EXTEND** (small additive change,
backward compatible) · **NEW** (does not exist) · **AVOID** (exists but is the
wrong tool here).

---

## 1. Existing components, audited

### 1.1 Tutor surface — `src/components/tutors/`

| Component | Props | Used by | Verdict | Notes |
| --- | --- | --- | --- | --- |
| `TutorCard.tsx` | `{ tutor: TutorProfile; isFavorite?: boolean; onToggleFavorite?: (id) => void; favoritePending?: boolean; learningContext?: LearningContextQuery \| null }` | `/tutors`, `AuthenticatedHome`, learning package pages | **REUSE** | The homepage's discovery card. Already handles subject ordering + dedupe, exam priority `TYT→AYT→YDT→DGS→KPSS`, 4-subject cap with `+N daha`, verified mark, presence dot, YKS-rank pill, rating/review/lesson-count line, price `/40 dk`, and an internal `Profili Gör` CTA. Renders `h-full min-w-0` so it already survives a grid or a scroll row. **Do not rebuild.** |
| `TutorCard.tsx` (favorites) | via `onToggleFavorite` | `/tutors` only | **EXTEND (usage, not code)** | The homepage currently passes no favorite props, so the heart is hidden there. Wiring `useFavorites()` in is a *call-site* change; the component needs nothing. |
| `FavoriteButton.tsx` | `{ tutorId; isFavorite; isPending; onToggle; className? }` | `TutorCard` | **REUSE** | — |
| `TutorPresenceBadge.tsx` | `{ isOnline; lastSeenAt }` | `TutorCard` | **REUSE** | Live-availability signal — the thing a tutor marketplace has and a course catalog does not. |
| `VerifiedTutorMark.tsx` | `{ verified; className? }` | `TutorCard` | **REUSE** | Hocam's honest answer to the reference's `Bestseller` badge. |
| `AnimatedSearchBar.tsx` | `{ value; onChange; onCommit; disabled?; className? }` | `/tutors` | **AVOID on home** | Free-text tutor search. The homepage's search is subject-first (`HomeSubjectSearch`), which routes into `/tutors` with structured filters — a better funnel. Two search inputs on one page would compete. |
| `TutorFilters.tsx` | filter object + setters | `/tutors` | **AVOID** | Full filter panel belongs to the marketplace, not the home. |
| `RatingStars.tsx`, `AnimatedRatingRing.tsx` | — | tutor detail | **AVOID** | `TutorCard` renders `★ {rating}` inline; adding a second rating treatment fragments the language. |
| `AvailabilityCalendar.tsx`, `TutorWeeklySchedule.tsx` | — | tutor detail, dashboards | **AVOID** | Too heavy for a home row; `TutorWeeklySchedule` is however a good in-repo precedent for horizontal-scroll mechanics. |

### 1.2 Learning surface — `src/components/learning/`

| Component | Props | Verdict | Notes |
| --- | --- | --- | --- |
| `GoalPackageCard.tsx` | `{ template: LearningGoalTemplate; isAdded: boolean }` | **REUSE** | Already the homepage's package card. `article` + `rounded-2xl border bg-card shadow-sm` + hover lift — matches the target card grammar exactly. |
| `RelatedPackageCard.tsx` | `{ template: LearningGoalTemplate }` | **REUSE (candidate)** | Compact horizontal card, `rounded-xl … p-3`. Better than `GoalPackageCard` if the packages module becomes a dense list rather than a 3-up row. Decide at implementation. |
| `PackageCover.tsx` | template-derived cover | **REUSE** | Gives package cards their media slot without stock photography. |
| `ProgressBar.tsx` | progress value | **REUSE** | Replaces the hand-rolled progress bar currently inlined in `ContinueCard` (`AuthenticatedHome.tsx:158–164`). |
| `ActiveGoalCard.tsx` | active goal | **EXTEND (evaluate)** | Richer than `ContinueCard`'s goal variant. Worth checking whether the home can drop its private goal card in favor of this one — fewer parallel representations of the same object. |
| `CategoryNav.tsx` | `{ items: CategoryNavItem[]; activeId; onSelect }` where `CategoryNavItem = { id; title; icon: LucideIcon; count }` | **EXTEND** | Exports a desktop sidebar variant today. It is the nearest existing thing to the reference's tab strip, and it already carries a `count` per item. Either extend it with a horizontal variant or build the strip on `ui/animated-tabs`. |
| `MilestonePath.tsx` | — | **AVOID (reference only)** | Uses `overflow-x-auto` + `useMediaQuery`; read it for scroll-row technique. |

### 1.3 Lessons surface — `src/components/lessons/`

| Component | Props | Verdict | Notes |
| --- | --- | --- | --- |
| `BookingCard.tsx` | `{ booking; currentUserRole; onStatusUpdate; onReviewClick?; reviewDisabledReason?; onMaterialsClick?; onConfirmLearningProgress?; isUpdating?; isConfirmingLearning?; id?; className? }` | **AVOID on home** | Full operational card with status mutations. Requiring the homepage to supply `onStatusUpdate` drags booking-lifecycle logic onto a discovery page. The home should show a **read-only** next-lesson summary that links to `/profile/lessons/upcoming`. |
| `LessonJoinButton.tsx` | booking | **REUSE** | The single correct way to enter a lesson. **Binding rule (`CLAUDE.md`, Video Sessions):** every join link must point at `/session/{bookingId}` — never at `booking.room_url` in a new tab. If the redesigned next-lesson module offers a join action, it must use this component. |
| `StudentLessonsWorkspace.tsx` | — | **AVOID** | Whole-page workspace. |

### 1.4 Home surface — `src/components/home/`

| Component | Props | Verdict | Notes |
| --- | --- | --- | --- |
| `RoleAwareHome.tsx` | none | **REUSE** | 11 lines, `isTutor ? Tutor… : Student…`. The role split stays. |
| `HomeSubjectSearch.tsx` | `{ subjects?: Subject[]; isLoading; isError; onSelectedSubjectChange? }` | **REUSE** | A real combobox: `useId`-generated `labelId`/`listboxId`, arrow-key `activeIndex`, outside-pointer close, TR-aware normalization incl. `ı → i`, exam-ordered options, commits to `/tutors?…`. Rebuilding this would lose accessibility work. Visual restyling is fine; the logic must survive. |
| `HomeTutorPreview.tsx` | `{ tutor?: TutorProfile; selectedSubject: Subject \| null; isLoading; isError }` | **EXTEND or RETIRE** | The hero's right-rail tutor card, reacting to the subject selection. Its fate depends on the hero decision in `product-home-spec.md` §3. If the hero becomes single-column, this retires (as a *cleanup candidate*, not a deletion in slice 1). |
| `AuthenticatedHome.tsx` | none | **REPLACE (composition)** | The student home. Its private helpers `HomeSectionHeader`, `TutorCardSkeleton`, `ContinueCard`, `PracticeCard` are used nowhere else and are free to move/rewrite. Its **data selectors** (`firstUpcomingBooking`, `firstActiveGoal`, `firstActivePackage`, `prioritizedTemplates`) are real product logic and must be preserved — ideally extracted to `src/lib/homeContent.ts` so they become unit-testable. |
| `TutorAuthenticatedHome.tsx` | none | **PRESERVE in slice 1** | ~1030 lines, and bound by `AI_AGENT_RULES.md` §2 (never render `TutorEarningsSummary.total` as ₺). Out of scope for the first slice; rhythm alignment only, later. |

### 1.5 Shared and primitives

| Component | Verdict | Notes |
| --- | --- | --- |
| `shared/EmptyState.tsx` (`{ title; description; action? }`) | **REUSE** | Dashed border + `FileQuestion` + title/description/action. |
| `shared/ErrorMessage.tsx` | **REUSE** | Already the homepage's per-section error surface. |
| `shared/StatCard.tsx` | **REUSE (candidate)** | For a compact status strip, if that module ships. |
| `ui/button`, `ui/card`, `ui/badge`, `ui/avatar`, `ui/skeleton`, `ui/separator`, `ui/tooltip` | **REUSE** | — |
| `ui/animated-tabs`, `ui/expandable-tabs`, `ui/tabs` | **REUSE (pick one)** | For the exam/subject tab strip. Choosing an existing one avoids a fourth tab treatment in the codebase. |
| `ui/sliding-pagination` | **AVOID on home** | Page-number pagination belongs to `/tutors`. A home row wants chevrons, not page numbers. |
| `shared/HorizontalDayPicker.tsx` | **REFERENCE** | Existing horizontal-scroll implementation to copy technique from. |

## 2. Reference pattern → Hocam module → components

| # | Reference pattern (screenshot) | Hocam product meaning | Reuse as-is | Extend | New | Real data source | Fallback when data is absent |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Pill search in header (1) | Subject-first tutor search | `HomeSubjectSearch` | — | — | `GET /subjects/` (`["subjects"]`, `staleTime: Infinity`) | Input renders disabled with its existing `isLoading`/`isError` props; hero copy and CTAs still work |
| 2 | — *(no reference analogue)* | **Next lesson / resume** | `LessonJoinButton` | `ProgressBar`, possibly `ActiveGoalCard` | `HomeResumeRow` (thin) | `GET /bookings/`, `GET /learning/dashboard/`, `GET /payments/package-purchases/` | Entire module **unmounts** — a new student has nothing to resume |
| 3 | "Trending Courses" row (2) | Tutor discovery row | `TutorCard` | — | `HomeCardRow` (scroll/grid + chevrons + peek) | `GET /tutors/?ordering=rating&page_size=N` | Skeleton row → `EmptyState` with a `/tutors` link (existing behavior at `AuthenticatedHome.tsx:562`) |
| 4 | Tab strip swapping the row (3) | Exam-type / subject filter over the tutor row | `ui/animated-tabs` | `CategoryNav` (horizontal variant) | `HomeTutorTabs` (thin wrapper) | Same `fetchTutors` call with `exam_type` / `subject` params (`TutorFilters`, `lib/tutorsApi.ts:49`) | Fewer than 2 non-empty tabs → render the row untabbed |
| 5 | Card metric pills (2, 6) | Rating · review count · completed lessons · YKS rank · online | already inside `TutorCard` | — | — | `TutorProfile` fields | `TutorCard` already degrades ("Henüz değerlendirme yok") |
| 6 | Second card row / "Career Accelerators" (6) | Learning packages | `GoalPackageCard`, `PackageCover` | `RelatedPackageCard` as the compact alternative | — | `GET /learning/goal-templates/`, `GET /learning/dashboard/` | Existing dashed empty card, or unmount |
| 7 | "Popular Skills" link block (7) | Subject / exam discovery links | `Badge`, `Button variant="link"` | — | `HomeSubjectLinks` | `GET /subjects/` (already cached) | Unmount if fewer than ~6 subjects. **No fabricated "N learners" counts.** |
| 8 | Dark inverted band (2, 5) | Closing CTA | current `bg-primary` band in `AuthenticatedHome.tsx:675` | — | — | static | always renders |
| 9 | Testimonial grid (4) | — | — | — | — | — | **REJECTED** (`reference-analysis.md` §3) |
| 10 | Company-logo trust bar (4) | — | — | — | — | — | **REJECTED** |
| 11 | SEO footer link farm (7, 8) | — | existing `Footer` | — | — | — | **REJECTED** |
| 12 | Hero carousel (1) | — | — | — | — | — | **REJECTED** — post-login page |
| 13 | — *(no analogue)* | **Favorites row** | `TutorCard`, `useFavorites` | — | reuses `HomeCardRow` | `GET /favorites/tutors/` (`["favorites", user.id]`) | Unmount when the list is empty |
| 14 | — *(no analogue)* | **Match-based personalization** | — | — | reuses `HomeCardRow` | `GET /matching/preferences/` + `POST /matching/preview/` | Unmount when no saved preference exists; the `/match` CTA already covers that case |

## 3. Genuinely new components proposed

Three, deliberately kept to a minimum. Every other row is composition.

| Component | Path | Responsibility | Why it must be new |
| --- | --- | --- | --- |
| `HomeSectionHeader` | `src/components/home/HomeSectionHeader.tsx` | `h2` + description + optional "see all" link, with `headingId` for `aria-labelledby` | Already exists as a **private** function inside `AuthenticatedHome.tsx:56`. Promoting it to a real module is what lets every section share one heading grammar (reference §2.1). Pure move + export; no behavior change. |
| `HomeCardRow` | `src/components/home/HomeCardRow.tsx` | One responsive card row: grid at `md+`, `overflow-x-auto snap-x` with ~88% card width and peek on mobile, chevron controls at `md+`, `min-w-0`/`minmax(0,1fr)` guards, skeleton and empty slots | Nothing in the repo does this. Existing scroll rows (`HorizontalDayPicker`, `CategoryNav`, `MilestonePath`) are bespoke to their content. This is the single highest-value borrowing from the reference, and it is why the other rows need no new components. |
| `HomeSubjectLinks` | `src/components/home/HomeSubjectLinks.tsx` | Multi-column list of subject links → `/tutors?subject=…&exam_type=…` | Reference pattern 7 with counters removed. Small; may be deferred out of slice 1. |

Deliberately **not** created: a new card, a new button, a new badge, a new
skeleton, a new empty state, a new tab primitive, a new pagination control. All
exist.

## 4. Logic to extract (not new UI, but new files)

| From | To | Why |
| --- | --- | --- |
| `firstUpcomingBooking`, `firstActiveGoal`, `firstActivePackage`, `prioritizedTemplates` (private in `AuthenticatedHome.tsx:199–251`) | `src/lib/homeContent.ts` (+ `.test.ts`) | These are real product rules (which lesson counts as "next", how templates are prioritized by `target_exam_type` then `is_featured`). Today they are untestable because they are private to a 715-line client component. Extracting them makes the resume-priority rule verifiable in `npm run test:unit` and is the only way the redesign can safely reorder sections without changing behavior. |

## 5. Components that must not change

- `src/app/(main)/dashboard/tutor/page.tsx`, `…/dashboard/student/page.tsx` —
  shared large files with a documented history of real merge conflicts
  (`AI_AGENT_RULES.md` §5).
- `src/components/layout/*` (`Navbar`, `Footer`, `MobileTabBar`, `navItems.ts`)
  — the nav map is fixed by `docs/authenticated-home-wireframe-spec.md` §1 and
  covered by `navItems.test.ts`.
- `src/components/shared/RouteGuard.tsx`, `TutorActivationGate.tsx`,
  `MainLayoutShell.tsx` — auth and gating. Changing these to make a screenshot
  or a demo easier is out of bounds.
- `src/lib/api.ts`, `src/providers/AuthProvider.tsx`.
- `src/components/tutors/TutorCard.tsx` — reused by `/tutors` and the learning
  pages; a homepage-driven restyle would silently change three other surfaces.
  If the home needs a variant, add an opt-in prop rather than editing defaults.

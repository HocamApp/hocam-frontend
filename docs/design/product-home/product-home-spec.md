# Product Home Specification

Proposed composition for Hocam's real homepage, **`/home`**, derived from the
audits in this folder rather than from any predetermined order — including the
order suggested earlier in chat and the order currently shipped.

Scope: the **student** composition is specified in full. The **tutor**
composition (`TutorAuthenticatedHome`) is preserved in slice 1 and addressed in
§5.

---

## 1. Ordering principle

Three rules decided the order. Each is falsifiable against the audits:

1. **State before catalog.** Hocam's returning user has a scheduled obligation
   (a lesson, a goal, package credits). Udemy's returning user does not — its
   inventory is always-on. So Hocam's resume module outranks discovery for
   anyone who has state, while the reference has no analogue at all
   (`reference-analysis.md` §5).
2. **A section that cannot fill does not exist.** Every conditional module
   unmounts rather than rendering an empty shell — the anti-scaffolding rule
   from `reference-analysis.md` §4. This is what makes a state-first order safe:
   a brand-new student simply sees discovery first, with no gap.
3. **Only real data may occupy space.** No fabricated badge, count, or
   "personalized" label without a personalization signal
   (`data-requirements.md` §4).

Consequence: the page has **eight** slots, of which a new student sees five and
an active student sees seven or eight. The reference's own page has fourteen
bands; matching that count on Hocam's current catalog would produce a page of
skeletons.

## 2. Full order at a glance

| # | Section | Audience | Conditional? |
| --- | --- | --- | --- |
| 1 | Hero — greeting, value line, subject search, primary actions | all | no |
| 2 | Kaldığın yerden devam et — resume | returning | **yes** (unmounts) |
| 3 | Hoca keşfi — tab strip + tutor row | all | no |
| 4 | Favorilerin — favorite tutors row | has favorites | **yes** |
| 5 | Hedefine göre çalışma paketleri | all | degrades to empty card |
| 6 | Bugün biraz pratik yap | all | **yes** (server flag) |
| 7 | Derse göre keşfet — subject links | all | **yes** (optional, may defer) |
| 8 | Closing CTA band | all | no |

Removed from the current page: the hero's right-rail tutor preview (§3.1).
Not added, despite being in the references: hero carousel, logo bar,
testimonials, certification bands, SEO footer farm (`reference-analysis.md` §3).

---

## 3. Section specifications

### 3.1 Hero

| Aspect | Decision |
| --- | --- |
| **Product purpose** | Orient the user by name, state what Hocam is for, and expose the single most useful control: subject-first tutor search. |
| **User priority** | High for new students, low for returning ones — hence *compressed*, not removed. |
| **Why here** | It is the only section that must render for every state, and the search input is the page's highest-frequency control. |
| **Visible content** | Greeting (`Merhaba {ad}, bugün neye odaklanmak istersin?`) when a name exists · eyebrow `Doğrulanmış YKS hocaları` · `h1` · one-sentence lede · `HomeSubjectSearch` · trust row (verified tutor count · şeffaf değerlendirmeler · esnek ders saatleri). |
| **Primary action** | Subject search → `/tutors?subject=…&exam_type=…` |
| **Secondary actions** | `Sana uygun hocayı bulalım` → `/match` · `Çıkmış sorulara göz at` → `/cikmis-sorular` |
| **Existing component** | `HomeSubjectSearch` (unchanged logic) |
| **Required extension** | None |
| **New component** | None |
| **Real data** | `["profile-me"]`, `["subjects"]`, tutor `count` from `["home-tutors"]` |
| **Anonymous** | Unreachable — `RouteGuard` redirects to `/login` |
| **Authenticated** | As above; tutors get the tutor hero instead (§5) |
| **Loading** | Search input disabled via its existing `isLoading`; greeting absent; trust row falls back to "Doğrulanmış bilgiler" (existing) |
| **Empty** | No subjects → search disabled, CTAs still work |
| **Error** | Never blocks; subject error degrades the input only |
| **Desktop** | Single column, max width ~`max-w-3xl` for the text stack inside `max-w-7xl`; vertical padding reduced from today's `py-14 sm:py-16 lg:py-[72px]` to roughly `py-10 sm:py-12 lg:py-16` |
| **Tablet** | Same, single column |
| **Mobile** | Same; search is full width and the first interactive element after the nav |
| **Accessibility** | One `h1` per page; combobox keeps its `useId` label/listbox wiring, arrow-key `activeIndex`, and outside-click close; CTA links keep `min-h-11` |
| **Animation** | None beyond existing hover transitions. No entrance animation on the primary control. |
| **Analytics** | Existing `home_subject_search_opened`, `home_subject_selected`, `home_tutor_search_submitted`, `home_matching_started`, `home_question_link_clicked` |

**Change from today, and why:** the hero is currently a two-column band
(`min-[880px]:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]`) with
`HomeTutorPreview` in the right rail, plus a decorative blur orb and a violet
gradient. Two problems: (a) the right rail shows *one* tutor card directly above
a row of tutor cards, so the page's first two visual units say the same thing;
(b) on a post-login page, a ~500 px marketing hero pushes the user's actual next
lesson below the fold. Compressing to a single column and retiring the preview
resolves both. `HomeTutorPreview` becomes a **cleanup candidate**, not a
slice-1 deletion (`implementation-plan.md` §6).

### 3.2 Kaldığın yerden devam et *(conditional)*

| Aspect | Decision |
| --- | --- |
| **Product purpose** | Return the user to the thing they already committed to: an upcoming lesson, an active goal, or unused package credits. |
| **User priority** | Highest of any section — for users who have state. |
| **Why here** | Directly under the hero. This is the state-before-catalog rule (§1.1) and the single biggest ordering change versus the shipped page, where it sits *below* tutor discovery. A student with a lesson in two hours should not scroll past a discovery row to find it. |
| **Visible content** | Up to 2 cards, priority **upcoming lesson → active goal → active package**. Lesson: subject, tutor name, duration, formatted date/time. Goal: title, next milestone, progress %. Package: tutor name, remaining credits, expiry date. |
| **Primary action** | Lesson → `/profile/lessons/upcoming` (or `LessonJoinButton` → `/session/{id}` when joinable). Goal → `goalPackageHref(goalId)`. Package → `/dashboard/student`. |
| **Secondary action** | None — one action per card keeps the module scannable. |
| **Existing component** | `ProgressBar` (`components/learning/`), `LessonJoinButton` |
| **Required extension** | Evaluate replacing the private `ContinueCard` with `ActiveGoalCard` for the goal variant, so the goal object has one representation across the app |
| **New component** | Optional thin `HomeResumeRow`; may just be a grid |
| **Real data** | `["bookings"]`, `["learning-dashboard"]`, `["package-purchases"]` with the selection logic extracted to `src/lib/homeContent.ts` |
| **Anonymous** | N/A |
| **Authenticated** | Renders only when at least one card qualifies |
| **Loading** | One skeleton card while `bookings` **or** `learning-dashboard` is pending — prevents the layout jump the current unconditional-hide causes |
| **Empty** | **Section unmounts entirely.** No heading, no placeholder. |
| **Error** | Per-card degradation; a failed query drops its card, never the section |
| **Desktop** | `grid gap-5 md:grid-cols-2` |
| **Tablet** | Two columns from `md` |
| **Mobile** | Single column, stacked; no horizontal scroll (these are actions, not browsing) |
| **Accessibility** | `<section aria-labelledby="home-continue-title">`; time rendered with `tr-TR` locale formatting and also exposed as a machine-readable `<time dateTime>` |
| **Animation** | None. Time-critical information should not animate in. |
| **Analytics** | `home_continue_clicked` with `content_type` / `content_id` (existing) |

⚠️ **Binding rules:** join links go to `/session/{bookingId}` only, never
`room_url` (`CLAUDE.md`); package credits are never formatted as currency
(`AI_AGENT_RULES.md` §2).

### 3.3 Hoca keşfi — tab strip + tutor row

| Aspect | Decision |
| --- | --- |
| **Product purpose** | Turn a static "top 3 rated" grid into an actual discovery instrument the user can steer. |
| **User priority** | Highest for new students; high for everyone (tutor discovery is the page's stated primary conversion). |
| **Why here** | First catalog module. For a user with no state, §3.2 unmounts and this becomes the first thing under the hero — exactly right. |
| **Visible content** | `HomeSectionHeader` (`Sana uygun hocaları keşfet` + one-line description + `Tüm hocaları gör →`), a tab strip (`Tümü` · `TYT` · `AYT` · `YDT`), then a row of `TutorCard`s. |
| **Primary action** | Card → `/tutors/{id}` |
| **Secondary actions** | `Tüm hocaları gör` → `/tutors` · favorite toggle on each card |
| **Existing component** | `TutorCard` (unchanged), `ui/animated-tabs`, `useFavorites` |
| **Required extension** | Raise `fetchTutors` `page_size` from 4 to ~6–8; key per tab (`["home-tutors", examType]`); pass favorite props into `TutorCard` |
| **New component** | **`HomeCardRow`** — the one genuinely new piece (`component-mapping.md` §3) |
| **Real data** | `GET /tutors/?ordering=rating&exam_type=…` — server-filtered to verified + public + tutorial-complete tutors |
| **Anonymous** | N/A |
| **Authenticated** | Identical for all students; tutors do not see this section |
| **Loading** | Row of 3 `TutorCardSkeleton`s at the row's real height |
| **Empty** | Per tab: if a tab returns nothing, show a one-line inline note and keep the other tabs usable. If **all** tabs are empty, fall back to today's dashed card with a `/tutors` link. If fewer than 2 tabs would be non-empty, render the row untabbed. |
| **Error** | `ErrorMessage` + `Tekrar dene` calling `refetch()` (existing behavior) |
| **Desktop** | 3-up grid inside `max-w-7xl` (not 4-up: tutor cards carry more text per card than a course thumbnail and 4-up truncates names) |
| **Tablet** | 2-up |
| **Mobile** | **Horizontal scroll row**, card width ~88 vw so the next card peeks, `snap-x snap-mandatory`, `overflow-x-auto` on the row only, `min-w-0` children. Because scrollbars are hidden globally (`globals.css:52`), the peek **is** the affordance on mobile; desktop adds chevron buttons. |
| **Accessibility** | `<section aria-labelledby="home-tutors-title">`; tab strip is a real tablist with arrow-key navigation and `aria-selected`; the scroll row is focusable and keyboard-scrollable; chevrons are `aria-label`led and hidden from AT when the row does not overflow |
| **Animation** | CSS scroll behavior + existing card hover lift. Use `tailwindcss-animate` / CSS, not framer-motion primitives, per the inventory's motion note. `motion-reduce:` disables smooth scrolling. |
| **Analytics** | Existing `home_tutor_profile_opened` (with `position`), `home_all_tutors_clicked`; **add** `home_tutor_tab_changed { exam_type }` |

### 3.4 Favorilerin *(conditional, new module)*

| Aspect | Decision |
| --- | --- |
| **Product purpose** | Bring back tutors the student already signalled interest in — the cheapest real personalization in the product. |
| **User priority** | High when non-empty; zero otherwise. |
| **Why here** | Immediately after generic discovery: "here are tutors you already liked" is a stronger next step than "here are more strangers", but it must not outrank the hero for the majority who have no favorites. |
| **Visible content** | `HomeSectionHeader` (`Favorilerin`, `Tümünü gör →` → `/tutors?favorites=1`) + `HomeCardRow` of `TutorCard`s |
| **Primary action** | Card → `/tutors/{id}` |
| **Secondary action** | Un-favorite in place (existing `FavoriteButton` optimistic mutation) |
| **Existing component** | `TutorCard`, `FavoriteButton`, `useFavorites` |
| **Required extension** | None |
| **New component** | Reuses `HomeCardRow` |
| **Real data** | `GET /favorites/tutors/` via `useFavorites()`, key `["favorites", user.id]` |
| **Loading** | Row skeleton |
| **Empty** | **Unmount.** `/tutors?favorites=1` already exists in the nav; an empty-state block here would be pure scaffolding. |
| **Error** | Unmount |
| **Desktop / tablet / mobile** | Same as §3.3 |
| **Accessibility** | Same as §3.3; un-favoriting must announce via the existing toast, and removal must not steal focus |
| **Animation** | None beyond the existing optimistic removal |
| **Analytics** | Reuse `home_tutor_profile_opened` with `placement: "favorites"` |

### 3.5 Hedefine göre çalışma paketleri

| Aspect | Decision |
| --- | --- |
| **Product purpose** | Self-paced learning as the alternative to booking a person. |
| **User priority** | Medium. Real product surface, but secondary to tutor discovery (the page's stated primary conversion). |
| **Why here** | After both tutor modules, before the lighter practice module. |
| **Visible content** | `HomeSectionHeader` (`Hedefine göre çalışma paketleri` + `Panelime git →`) + up to 3 `GoalPackageCard`s |
| **Primary action** | Card → `goalPackageHref(template.id)` |
| **Secondary action** | `Panelime git` → `/dashboard/student` |
| **Existing component** | `GoalPackageCard`, `PackageCover`; `RelatedPackageCard` if a denser variant is preferred |
| **Required extension** | None |
| **New component** | Reuses `HomeCardRow` |
| **Real data** | `["learning-goal-templates"]` with `["learning-dashboard"]` fallback; ordering by `prioritizedTemplates(templates, target_exam_type)`; `isAdded` derived from real goals |
| **Loading** | 3× `Skeleton h-[390px] rounded-2xl` (existing) |
| **Empty** | Dashed card, `Hazır paketler yakında burada` (existing) — this is the one section allowed a non-actionable empty state, because emptiness is temporary catalog state the student can revisit |
| **Error** | Only when both queries fail → `ErrorMessage` + `/dashboard/student` link (existing) |
| **Desktop** | 3-up |
| **Tablet** | 2-up (`sm:grid-cols-2`) |
| **Mobile** | Horizontal scroll row, same rules as §3.3 |
| **Accessibility** | `<section aria-labelledby="home-packages-title">`; `isAdded` state must be conveyed textually, not by color alone |
| **Animation** | Existing card hover lift only |
| **Analytics** | Existing `home_package_opened { template_id, position, is_active }` |

### 3.6 Bugün biraz pratik yap *(conditional on server flag)*

| Aspect | Decision |
| --- | --- |
| **Product purpose** | A zero-commitment action for a student not ready to book. |
| **User priority** | Medium-low, but very high conversion-to-action for browsing users. |
| **Why here** | Light module after the two heavy card sections. |
| **Visible content** | Two cards: `Çıkmış Sorular` and `Yanlış Sorularım` |
| **Primary action** | `/cikmis-sorular` · `/dashboard/student/learning/yanlis-sorular` |
| **Secondary action** | None |
| **Existing component** | Current private `PracticeCard` (promote or keep private) |
| **Required extension** | None |
| **New component** | None |
| **Real data** | `["question-metadata"]` → `QuestionMetadata.enabled` |
| **Loading** | 2× `Skeleton h-56` |
| **Empty** | N/A — static destinations |
| **Error** | `retry: false`; treated as enabled (`data?.enabled !== false`) so a transient failure does not hide a working feature |
| **Feature flag** | `enabled === false` hides the whole section. **Preserve** — server-controlled kill switch. |
| **Desktop / tablet** | `md:grid-cols-2` |
| **Mobile** | Stacked (only two cards; a scroll row would be over-engineering) |
| **Accessibility** | `<section aria-labelledby="home-practice-title">` |
| **Animation** | Existing hover lift |
| **Analytics** | Existing `home_practice_opened { resource }` |

### 3.7 Derse göre keşfet *(optional, may defer)*

| Aspect | Decision |
| --- | --- |
| **Product purpose** | Long-tail entry into the marketplace by subject — the reference's "Popular Skills" block, minus its fabricated counters. |
| **User priority** | Low individually; useful as a dense, image-free discovery surface near the page end. |
| **Why here** | Between the light practice module and the closing CTA, where the reference also puts its link block. |
| **Visible content** | Subjects grouped by exam type, rendered as links. **No counts.** |
| **Primary action** | `/tutors?subject={id}&exam_type={type}` — a shape `/tutors` already parses |
| **Existing component** | `Button variant="link"`, `Badge` |
| **New component** | `HomeSubjectLinks` |
| **Real data** | The already-cached `["subjects"]` query — **zero additional requests** |
| **Empty / Loading** | Unmount below ~6 subjects; no skeleton (it is not above the fold) |
| **Error** | Unmount |
| **Desktop** | 3–4 columns · **Tablet** 2 · **Mobile** 1–2 columns |
| **Accessibility** | A real `<nav aria-label="Derse göre keşfet">` with grouped lists |
| **Animation** | None |
| **Analytics** | `home_subject_link_clicked { subject_id, exam_type }` (new) |
| **Note** | Lowest-priority section. Cut first if slice 1 runs long. |

### 3.8 Closing CTA band

| Aspect | Decision |
| --- | --- |
| **Product purpose** | One decisive exit into `/tutors` for a user who scrolled the whole page without acting. |
| **Why here** | Terminal. One inverted band per page (`reference-analysis.md` §2.5). |
| **Visible content** | Icon tile, `Bir hocayla başlamaya hazır mısın?`, one-line support copy, one button |
| **Primary action** | `Hocaları keşfet` → `/tutors` |
| **Existing component** | Current band in `AuthenticatedHome.tsx:675`, `bg-primary` + `blackboard.jpg` at 45 % opacity grayscale |
| **Required extension / New** | None — keep it |
| **Real data** | None |
| **Loading / Empty / Error** | N/A — always renders |
| **Desktop** | `lg:flex` two-column with the image at `48%` · **Tablet/Mobile** stacked, image hidden (`hidden lg:block`, existing) |
| **Accessibility** | Background image `alt=""` + `aria-hidden`; contrast is `text-primary-foreground` on `bg-primary`, valid in both themes |
| **Animation** | None |
| **Analytics** | Existing `home_all_tutors_clicked { placement: "closing_cta" }` |

---

## 4. Cross-cutting requirements

**Anonymous behavior.** Unchanged and out of scope: `RouteGuard requireAuth`
redirects to `/login`, verified live (`current-homepage-audit.md` §9). Building
an anonymous variant of `/home` would be a **new marketing landing page**, a
separate project — and the parts of the references best suited to it (hero,
testimonials, logo bar) should be saved for it rather than spent here.

**Responsive contract.** Every row: `minmax(0,1fr)` tracks, `min-w-0` children,
`overflow-x-auto` only on the row element, and `scripts/responsive-check.ts`
must still report `scrollWidth <= innerWidth` at 375/768/1280.

**Accessibility contract.** One `h1`; every section `aria-labelledby` its `h2`;
decorative visuals `aria-hidden` with `alt=""`; interactive targets `min-h-11`
on touch; visible focus from the existing `focus-visible:ring-2 ring-ring
ring-offset-2` recipe; tab strip is a real tablist; scroll rows are keyboard
reachable; `prefers-reduced-motion` disables smooth scrolling and any entrance
animation.

**Motion contract.** CSS and `tailwindcss-animate` only. No framer-motion
primitives for homepage entrance/scroll animation
(`hocam-design-inventory.md` §7). Nothing above the fold animates in.

**Analytics contract.** All 12 existing student `HomeAnalyticsEvent` names keep
firing with the same property shapes. New events are **added** to the union in
`src/lib/homeAnalytics.ts`, never renamed: `home_tutor_tab_changed`,
`home_subject_link_clicked`, and optionally `home_favorite_opened`. Removing an
existing event is a breaking change for any `hocam:analytics` listener.

**Theme contract.** Light and dark both verified. No hex literal enters the
homepage that is not already precedented (`emerald-500` dot, `amber-500` rank
pill, and each with its `dark:` pair).

**Copy contract.** Turkish only. No reference copy translated verbatim.

## 5. Tutor homepage

Preserved unchanged in slice 1 and specified only at the level of intent:

- The tutor home is an **operational** surface (next lesson, upcoming lessons,
  students, profile completeness, tools). Almost nothing in the references
  applies — they document a consumer acquisition page.
- It is bound by `AI_AGENT_RULES.md` §2: `TutorEarningsSummary.total` is always
  `0` and must never be rendered as ₺; `lesson_count` is shown instead. This is
  a deliberate decision, not a missing feature, and it has already been
  regressed once in this repo's history.
- The only worthwhile later alignment is **rhythm**: adopt `HomeSectionHeader`
  and the shared section spacing so the two homes feel like one product. That is
  a slice-3 concern at the earliest, and it touches a ~1030-line file that has
  caused merge conflicts before.

## 5b. Implementation status (student home)

Implemented on `feature/udemy-inspired-product-home`:

| Section | Status |
| --- | --- |
| §3.1 Compact hero | **Shipped.** Single column, right-rail preview removed from the render tree, decorative gradient/blur orb and promotional trust row dropped. `HomeSubjectSearch` reused unchanged. |
| §3.2 Resume | **Shipped**, moved directly below the hero. Priority and unmount behavior are enforced by `selectResumeEntries` in `src/lib/homeContent.ts` and covered by tests. |
| §3.3 Tutor discovery | **Shipped** with exam tabs (`CategoryNavPills`) and `HOME_TUTOR_PAGE_SIZE = 8`. Tabs are derived from the subjects the API returns, so a tab can only exist with real subjects behind it. |
| §3.4 Favorites | **Shipped.** Renders only when the student has at least one real favorite. |
| §3.5 Goal packages | **Shipped**, unchanged data rules, now rendered through `HomeCardRow`. |
| §3.6 Practice | **Shipped**, unchanged, still gated by `QuestionMetadata.enabled`. |
| §3.7 Subject links | **Not built — deliberately omitted.** `HomeSubjectSearch` already enumerates every subject in an accessible listbox with keyboard navigation, and the new exam tabs already cover exam intent. A third subject-navigation surface on the same page would duplicate both without adding a destination, and would push the closing CTA further down. Revisit only if the subject catalog grows large enough that search-plus-tabs stops covering it. |
| §3.8 Closing CTA | **Shipped**, unchanged, still points at `/tutors`. |

Not called: `POST /matching/preview/`. Match-based personalization stays
deferred pending the backend confirmation in `data-requirements.md` §5.1.

## 6. Explicitly deferred

| Module | Why deferred |
| --- | --- |
| Recently viewed tutors | No API, no client tracking (`data-requirements.md` §4) |
| "Sana özel" recommendation row | Only `/matching/preview/` is genuinely personalized, and its `POST`-as-read semantics need backend confirmation → slice 2 |
| Activity/stats strip | Real data exists, but risks duplicating `/dashboard/student` |
| AI study planning | Only `POST /ai/chat/` exists; there is no plan object to render |
| Anonymous/marketing homepage | Separate project; would be the right home for the rejected reference sections |
| Tutor-home redesign | Slice 3+, file-contention risk |

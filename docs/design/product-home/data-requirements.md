# Data Requirements

What data actually exists for a redesigned `/home`, per candidate module.
Every endpoint below was read from `src/lib/*Api.ts`; every type from
`src/types/api.ts`. **No endpoint in this document is invented.** Anything not
found in source is listed in §4 as missing.

Availability classes used throughout:

1. **Already available and already connected** — fetched by the homepage today
2. **Available through an existing frontend hook/service** — shipped code, not yet called from `/home`
3. **Endpoint exists, no frontend hook** — backend confirmed via an existing service call elsewhere
4. **Partially available** — real data, but not the shape the module wants
5. **Completely missing** — no endpoint, no field
6. **Uncertain — needs backend confirmation**

All authenticated calls go through `src/lib/api.ts`, which attaches
`Authorization: Token <auth_token>` from the cookie and redirects to `/login`
on 401 via `SESSION_EXPIRED_EVENT`.

---

## 1. Module-by-module

### 1.1 Greeting and student identity

| Field | Value |
| --- | --- |
| Class | **1 — connected** |
| Hook | `useQuery({ queryKey: ["profile-me"], queryFn: fetchProfileMe })`, `staleTime: 60_000`, `retry: false` |
| Service | `fetchProfileMe` — `src/lib/profileApi.ts:15` |
| Endpoint | `GET /profile/me/` |
| Type | `ProfileMeResponse { user: {id, role}; profile: ProfileTutor \| ProfileStudent \| null; preferences; stats }` |
| Auth | Required |
| Loading | Greeting line simply absent until resolved (current behavior, `AuthenticatedHome.tsx:446`) |
| Empty | `profile === null` or no `name` → omit the greeting; never render "Merhaba ," |
| Error | `retry: false`, silent — greeting is decorative and must never block the page |
| Note | `ProfileStudent.target_exam_type` also drives package prioritization (`prioritizedTemplates`). Student-vs-tutor discrimination is done by `"target_exam_type" in profile`. |

### 1.2 Subject search (hero)

| Field | Value |
| --- | --- |
| Class | **1 — connected** |
| Hook | `["subjects"]`, `staleTime: Infinity` |
| Service | `fetchSubjects` — `src/lib/tutorsApi.ts:95` |
| Endpoint | `GET /subjects/` |
| Type | `Subject { id; name; exam_type: "TYT" \| "AYT" \| "YDT" \| … }` |
| Auth | Required as called today |
| Loading / Error | `HomeSubjectSearch` already takes `isLoading` / `isError` props and degrades to a disabled input |
| Empty | Combobox renders with no options; hero CTAs (`/match`, `/cikmis-sorular`) remain usable |
| Recommendation | Keep exactly as is. It is the only fully accessible combobox on the page. |

### 1.3 Tutor discovery row

| Field | Value |
| --- | --- |
| Class | **1 — connected** (untabbed) / **2 — available** (tabbed by exam type) |
| Hook | `["home-tutors"]` → `fetchTutors({ ordering: "rating" }, 1, 4)` |
| Service | `fetchTutors` — `src/lib/tutorsApi.ts:76` |
| Endpoint | `GET /tutors/?ordering=…&page=…&page_size=…` (+ filters) |
| Type | `PaginatedResponse<TutorProfile>`; response is normalized because the backend may still return a bare array during a deploy (`normalizeTutorsResponse`, `tutorsApi.ts:67`) |
| Filters available | `search, subject, exam_type, university, min_rating, min_price, max_price, is_verified, yks_rank_max, ordering, availability_day, availability_time, online` (`TutorFilters`, `tutorsApi.ts:49`) |
| Auth | Required as called today |
| Loading | 3× `TutorCardSkeleton` (existing) |
| Empty | Dashed card + link to `/tutors` (existing, `AuthenticatedHome.tsx:562`) |
| Error | `ErrorMessage` + a "Tekrar dene" button calling `refetch()` (existing, `:533`) |
| Tabs | **No new endpoint needed.** One `fetchTutors` call per selected `exam_type`, keyed `["home-tutors", examType]`. Backend already filters. |
| Caution | Only 4 tutors are fetched today (`[0]` hero preview, `[1..3]` grid). A row that shows 6–8 needs `page_size` raised — a parameter change, not a new API. Server-side visibility filtering already excludes unverified/non-public/tutorial-incomplete tutors. |

### 1.4 Resume / next-action module

| Sub-item | Class | Hook / service | Endpoint | Type |
| --- | --- | --- | --- | --- |
| Next lesson | **1** | `["bookings"]` → `fetchBookings` | `GET /bookings/` | `Booking[]` |
| Active goal | **1** | `["learning-dashboard"]` → `fetchLearningDashboard` | `GET /learning/dashboard/` | `LearningDashboardResponse { templates, goals, notes, stats, recent_progress, next_milestones, pending_confirmations }` |
| Active package | **1** | `["package-purchases"]` → `fetchPackagePurchases` | `GET /payments/package-purchases/` | `PackagePurchase[]` |
| Leaner alternative for lessons | **2** | `fetchUpcomingLessons` — `src/lib/profileLessonsApi.ts:9` | `GET /profile/lessons/upcoming/` | `UpcomingLesson { id, subject, start_time, end_time, duration_minutes, status, participant_name, participant_role, price, room_url, can_join }` |

Selection logic today (private to `AuthenticatedHome.tsx`, proposed for
extraction to `src/lib/homeContent.ts`):

- `firstUpcomingBooking` — `status === "in_progress"`, or `confirmed` with
  `start_time > now`; earliest first.
- `firstActiveGoal` — first goal with `status === "active"`.
- `firstActivePackage` — `status === "paid"` **and** `remaining_credits > 0`
  **and** not past expiry (`computePackageExpiry` / `isPastPackage` from
  `components/payments/PackagePurchaseCard`).
- Priority: lesson → goal → package, capped at 2 cards.

| State | Behavior |
| --- | --- |
| Loading | Currently the section is simply absent until data arrives (`continuationCards.length > 0` gate). Recommendation: reserve one skeleton card while `bookings` **or** `learning-dashboard` is loading, so the page does not jump. |
| Empty | **Unmount the whole section.** A new student has nothing to resume; an empty "continue" block is worse than no block. |
| Error | `retry: false` on learning/packages. Degrade per-card: if bookings fail but the goal resolves, render the goal card. Never fail the page. |

**Binding rule:** `UpcomingLesson.room_url` must **not** be linked directly.
Any join affordance uses `LessonJoinButton` → `/session/{bookingId}`
(`CLAUDE.md`, Video Sessions).

**Binding rule:** `PackagePurchase` credit counts are not currency. Do not
render them with `formatPrice` (`AI_AGENT_RULES.md` §1–2).

### 1.5 Learning packages row

| Field | Value |
| --- | --- |
| Class | **1 — connected** |
| Hooks | `["learning-goal-templates"]` → `fetchLearningGoalTemplates`; falls back to `learningQuery.data?.templates` |
| Endpoint | `GET /learning/goal-templates/` (and `GET /learning/dashboard/`) |
| Type | `LearningGoalTemplate { id, title, slug, exam_type, subject_name, level, description, estimated_milestones, is_featured, is_active, milestone_templates[] }` |
| Personalization | `prioritizedTemplates(templates, studentProfile?.target_exam_type)` — exam match, then `is_featured`, then original order; top 3 |
| `isAdded` | Derived from `learningQuery.data.goals.some(g => g.template === template.id)` — real, not faked |
| Loading | 3× `Skeleton h-[390px] rounded-2xl` |
| Empty | Dashed card, "Hazır paketler yakında burada" |
| Error | Only when **both** queries error; then `ErrorMessage` + link to `/dashboard/student` |

### 1.6 Practice / questions

| Field | Value |
| --- | --- |
| Class | **1 — connected** |
| Hook | `["question-metadata"]` → `fetchQuestionMetadata`, `retry: false` |
| Endpoint | `GET /questions/meta/` |
| Type | `QuestionMetadata { enabled, mebi_enabled, exam_types, years, difficulties, subjects, topics }` |
| Feature flag | **`enabled === false` hides the entire section** (`questionResourcesEnabled`, `AuthenticatedHome.tsx:437`). Preserve this — it is a server-controlled kill switch. |
| Loading | 2× `Skeleton h-56` |
| Error | `retry: false`; treated as enabled (`data?.enabled !== false`) so a transient failure does not hide a working feature |
| Targets | `/cikmis-sorular`, `/dashboard/student/learning/yanlis-sorular` |

### 1.7 Favorites row *(new module, real data)*

| Field | Value |
| --- | --- |
| Class | **2 — available, not yet used on `/home`** |
| Hook | `useFavorites()` — `src/hooks/useFavorites.ts`, `queryKey: ["favorites", user.id]` |
| Service | `fetchFavoriteTutors` — `src/lib/favoritesApi.ts:4` |
| Endpoint | `GET /favorites/tutors/` (+ `POST` / `DELETE /favorites/tutors/{id}/`) |
| Type | `FavoriteTutor { tutor: TutorProfile, … }` |
| Auth | Required; hook is `enabled: isAuthenticated && !!user?.id` |
| Loading | Row skeleton |
| Empty | **Unmount.** Never render "no favorites yet" scaffolding on the home; `/tutors?favorites=1` already exists in the nav. |
| Error | Hook toasts on mutation failure; read failure → unmount the row |
| Cost | Zero new backend work. Highest-value/lowest-cost new module on the page. |

### 1.8 Match-based personalization *(new module, real data)*

| Field | Value |
| --- | --- |
| Class | **2/3 — services exist, no homepage hook** |
| Services | `fetchMatchingPreferences` → `GET /matching/preferences/` returning `{ preference: SavedMatchingPreference \| null }`; `previewTutorMatches(answers)` → `POST /matching/preview/` returning `MatchingPreview { matches: TutorMatchResult[]; candidate_count }` (`src/lib/matchingApi.ts`) |
| Auth | Required |
| Product meaning | The **only genuine personalization signal in the product.** A student who completed `/match` has stored preferences; replaying them yields a real "sana uygun hocalar" row — not a re-labelled "top rated" row. |
| Loading | Row skeleton |
| Empty | `preference === null` → unmount the row. The hero's existing `/match` CTA already handles that audience. |
| Error | Unmount; the generic tutor row remains |
| Open question | `POST` for a read-shaped homepage query is unusual: it is uncacheable by HTTP semantics and may be rate-limited or side-effecting. **Needs backend confirmation** before shipping (listed in §5). Fallback: `fetchTutors` with the saved preference mapped onto `TutorFilters`. |

### 1.9 Subject / exam discovery links

| Field | Value |
| --- | --- |
| Class | **1 — data already cached** |
| Source | The same `["subjects"]` query as the hero (`staleTime: Infinity`) — zero additional requests |
| Targets | `/tutors?subject={id}&exam_type={type}` — a shape `/tutors` already parses from search params |
| Empty | Unmount below ~6 subjects |
| **Not available** | Per-subject tutor counts or "N learners" figures. `Subject` carries no count field. Do **not** render counts. |

### 1.10 Notifications, messages, support

| Field | Value |
| --- | --- |
| Class | **2 — available** |
| Services | `fetchNotificationSummary` → `GET /notifications/summary/`; `fetchNotifications` → `GET /notifications/`; `fetchConversations` (messaging); `fetchSupportTickets` → `GET /support/tickets/` |
| Recommendation | **Do not surface on `/home`.** All three already have permanent navbar/tab-bar entry points, and `CLAUDE.md`'s notification rules (unread-only popover, message bodies never shown) are implemented in `NotificationPopoverContent`. Duplicating them on the home would fork that privacy logic. |

### 1.11 Student activity / study stats

| Field | Value |
| --- | --- |
| Class | **2 — available, unused on `/home`** |
| Services | `fetchStudentLearningProfile` → `GET /profile/learning-profile/` → `StudentLearningProfileSummary { completed_lessons, active_packages, most_studied_tutor, top_subjects[] }`; `fetchStudentQuestionPerformance` → `GET /profile/question-performance/` → `StudentQuestionPerformance { total_attempts, correct_attempts, incorrect_attempts, accuracy_percent, top_subject }` |
| Product meaning | Genuine material for a compact status strip (the wireframe spec's §11), and `top_subjects` could seed the tutor-row tab defaults |
| Empty | Zero attempts / zero lessons → unmount; showing "%0 doğruluk" to a new student is discouraging and uninformative |
| Recommendation | Real but **not** slice-1 material. `/dashboard/student` is the operational home for stats; adding them to `/home` risks the dashboard-duplication failure mode. Revisit after the row grammar ships. |

### 1.12 AI assistant

| Field | Value |
| --- | --- |
| Class | **4 — partially available** |
| Service | `sendAIChatMessage` → `POST /ai/chat/` (`src/lib/aiAssistantApi.ts:35`) — the **only** AI endpoint |
| Route | `/ai` exists (`src/app/(main)/ai/page.tsx`) |
| Missing | Any read endpoint: no conversation history, no suggested prompts, no "study plan" generation, no per-student AI state |
| Recommendation | At most a static entry-point card linking to `/ai`. **An "AI study planning" module is not implementable** — there is no plan object to render. |

### 1.13 Tutor homepage data (unchanged)

`["tutor-me"]` `fetchMyTutorProfile` `GET /tutors/me/` · `["bookings"]` ·
`["availability"]` `fetchAvailability` · `["conversations"]` ·
`["tutor-earnings"]` `fetchTutorEarnings` `GET /payments/tutor/earnings/`.

⚠️ `TutorEarningsSummary.total` is always `0` for package lessons and must never
be rendered as ₺ (`AI_AGENT_RULES.md` §2). The tutor home deliberately shows
`lesson_count`.

## 2. Summary table

| Module | Class | New backend work? | Slice-1 candidate |
| --- | --- | --- | --- |
| Greeting | 1 | No | Yes |
| Subject search | 1 | No | Yes (unchanged) |
| Tutor row | 1 | No | Yes |
| Tutor row tabs (exam type) | 2 | No | Yes |
| Resume module | 1 | No | Yes (moved up) |
| Packages row | 1 | No | Yes |
| Practice | 1 | No | Yes (unchanged) |
| Favorites row | 2 | No | Yes |
| Closing CTA | static | No | Yes |
| Subject links | 1 | No | Optional |
| Match personalization | 2/3 | No — but needs confirmation | Slice 2 |
| Activity stats strip | 2 | No | Slice 2+ |
| Recently viewed tutors | **5** | **Yes** | No |
| AI study plan | **5** | **Yes** | No |
| Per-subject counts | **5** | **Yes** | No |

## 3. Cache and performance notes

- `/home` fires **8 parallel queries** on mount today, all `enabled: isAuthenticated`,
  none prefetched or deferred. Adding favorites and matching would make 10.
  Recommendation: keep above-the-fold queries (`profile-me`, `subjects`,
  `home-tutors`, `bookings`) eager and defer below-the-fold rows.
- Query keys are **shared across pages**: `["bookings"]`, `["subjects"]`,
  `["profile-me"]`, `["tutor-me"]`, `["favorites", userId]`. Changing a key on
  the homepage silently doubles fetches elsewhere. Any new homepage-specific
  call must use a distinct key (e.g. `["home-tutors", examType]`).
- `staleTime`: `subjects` = `Infinity`, `profile-me` = 60 s, everything else
  default. `retry: false` on `profile-me`, `learning-dashboard`,
  `learning-goal-templates`, `package-purchases`, `question-metadata` — a
  deliberate choice so optional sections fail fast instead of stalling the page.
- `/tutors` list responses are server-cached; the backend visibility filter
  (verified + public + tutorial-complete) is applied server-side, so the
  homepage cannot leak a hidden tutor.

## 4. Completely missing (must not be faked)

| Wanted | Status | Consequence |
| --- | --- | --- |
| Recently viewed tutors | **Missing.** No endpoint, no field, no local tracking (`grep -ri "recently"` → no matches) | Would require a backend view-event model, or client-side `localStorage` tracking. Neither exists. **Do not ship the module.** |
| Recommendation engine ("because you studied X") | **Missing.** `ordering=rating` is a global sort, not personalization | Only `/matching/preview/` is genuinely personalized. Labelling a rating-sorted row "sana özel" is a lie. |
| Per-subject / per-category tutor counts | **Missing** on `Subject` | No "N hoca" chips |
| Trending / popularity signal | **Missing** | No "Bestseller"-style badge |
| Continue-watching progress on content | **N/A by product design** | Hocam's resume unit is a scheduled lesson or a goal milestone |
| AI-generated study plan | **Missing** (only `POST /ai/chat/`) | Static entry point only |
| Homepage-specific banner/announcement CMS | **Missing** | No editorial hero slot |

## 5. Requires backend confirmation before implementation

1. **`POST /matching/preview/` used as a homepage read.** Is it idempotent,
   throttled, or side-effecting (does it write a preference or an analytics
   row)? If side-effecting, use the `fetchTutors` + saved-preference fallback.
2. **`fetchTutors` `page_size` ceiling.** The homepage currently asks for 4. Is
   6–8 acceptable, and is `GET /tutors/` server-cached per
   `(filters, page, page_size)` tuple or only for the default query? A row that
   busts the cache on every tab click would be a real regression.
3. **`exam_type` filter semantics.** Does `exam_type=AYT` return tutors who
   teach *any* AYT subject? Needed to know whether an empty tab is possible.
4. **Anonymous access to `GET /tutors/` and `GET /subjects/`.** Both are called
   with auth today. If they are publicly readable, a future anonymous landing
   page becomes cheap — worth knowing now, not needed for this slice.

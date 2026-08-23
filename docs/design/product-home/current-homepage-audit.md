# Current Homepage Audit

Result of reading the actual codebase on branch
`feature/udemy-inspired-product-home` (branched from `main` @ `9b3f1f7`).
Nothing here is inferred from filenames alone; every claim below was checked in
source or observed in a running dev server.

---

## 1. Which route is the homepage

**The real homepage is `/home`, not `/`.**

| Route | File | What it actually is |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | **Not a homepage and not a marketing landing page.** It is the integrated login/register screen: a client component holding `mode: "login" \| "register"` state and rendering `AuthSplitScreen` + `LoginForm` / `RegisterForm` + `LoginBrandAnimation`. No product content at all. |
| `/home` | `src/app/(main)/home/page.tsx` | **The product homepage.** 10 lines: `<RouteGuard requireAuth><RoleAwareHome /></RouteGuard>`. |
| `/tutors` | `src/app/(main)/tutors/page.tsx` | The marketplace/listing page. It is also the destination the logo points at for **anonymous** visitors (`Navbar.tsx:24`). |

Evidence that `/home` is canonical:

- `src/components/layout/navItems.ts:50` (student) and `:103` (tutor) — the
  nav item literally titled **"Ana Sayfa"** points at `/home` for both roles.
- `src/components/layout/Navbar.tsx:24` — logo href is
  `isAdmin && !isImpersonating ? "/admin-control" : isAuthenticated ? "/home" : "/tutors"`.
- `src/components/auth/LoginForm.tsx:79,83,132,136` and
  `src/components/auth/RegisterForm.tsx:103,105,161,163` — post-auth
  destination is `returnUrl ?? "/home"`.
- `src/components/shared/RouteGuard.tsx:35` — the non-admin fallback redirect
  is `/home`.

**There is no anonymous product homepage and no separate marketing landing
page anywhere in this repository.** An anonymous visitor to `/` gets the auth
screen; an anonymous visitor to `/home` is bounced to `/login`
(observed live — see §9).

## 2. Route groups, layouts, providers

```
src/app/layout.tsx                    ← RootLayout (server component)
  html lang="tr"
  <head> inline THEME_INIT_SCRIPT      (src/lib/theme.ts — pre-paint dark-mode class)
  body class = Inter (next/font/google) + min-h-screen flex flex-col antialiased
  <AuthProvider>                       (src/providers/AuthProvider.tsx)
    <QueryProvider>                    (@tanstack/react-query)
      <LanguageProvider>               (src/providers/LanguageProvider.tsx)
        <ImpersonationBanner />
        <div class="flex min-h-screen flex-1 flex-col">
          └── src/app/(main)/layout.tsx        ← MainLayout (server component)
                <Navbar />                      (client)
                <PresenceHeartbeat />           (client, online presence ping)
                <TutorActivationGate />         (client, tutorial hard gate)
                <MainLayoutShell>               (client, mobile tab bar + tutor onboarding redirect)
                  <main class="min-h-[calc(100vh-64px)] flex-1">
                    └── src/app/(main)/home/page.tsx
                          └── RouteGuard requireAuth
                                └── RoleAwareHome
                  </main>
                  <Footer />
                </MainLayoutShell>
        </div>
        <SessionExpiredDialog />
      </LanguageProvider>
    </QueryProvider>
  </AuthProvider>
  <Toaster />                          (sonner, richColors)
```

Route groups involved: `(main)` only. `/home` is **not** in `(auth)`, and is
unrelated to the top-level `session/` and `tutor/tutorial/` routes, which
deliberately live outside `(main)` so they render without the navbar.

Server/client boundary: `src/app/(main)/home/page.tsx` is a **server component**
that renders the client component `RoleAwareHome`. All homepage content below
that point is client-side (`"use client"`), because everything is
react-query-driven and auth-gated.

## 3. Authentication behavior

| Visitor | What happens |
| --- | --- |
| Anonymous | `RouteGuard requireAuth` sees `!isAuthenticated`, renders `null`, and `router.push("/login")`. **Verified live**: all three baseline captures of `/home` ended at `http://localhost:3000/login`. |
| Loading | `RouteGuard` renders a full-page `LoadingSpinner` (`min-h-screen`, centered). |
| Student | `RoleAwareHome` → `<AuthenticatedHome />`. |
| Tutor | `RoleAwareHome` → `<TutorAuthenticatedHome />`. |
| Tutor, unverified / no profile | Never reaches the page: `MainLayoutShell` redirects to `/tutor/onboarding` when `user.tutor_profile_id === null` or the fetched profile has `is_verified === false`. |
| Tutor, tutorial not completed | Never reaches the page: `TutorActivationGate` redirects to `/tutor/onboarding` unless the path is under `/tutor`, `/support` or `/profile`. |
| Admin (not impersonating) | Logo and `RouteGuard` steer to `/admin-control`; `/home` itself has no `requireRole`, so an admin who navigates there directly still renders the role-aware home. |

Note the important nuance: **anonymous and authenticated users do not share
the homepage route.** They share *nothing*. Anonymous users have no product
home at all. This is the single biggest structural difference from the Udemy
references (see `reference-analysis.md`).

## 4. Middleware, metadata, SEO

- **No middleware.** There is no `middleware.ts` at the repo root or in `src/`.
  All route protection is client-side (`RouteGuard`, `MainLayoutShell`,
  `TutorActivationGate`).
- **No page-level metadata for `/home`.** The only `Metadata` export is in
  `src/app/layout.tsx`: `title: "Hocam"`, `description: "YKS hazırlık için özel
  ders"`, icon `/brand/hocam-logo.png`. `viewport` sets
  `viewportFit: "cover"` for safe-area handling.
- **SEO is effectively out of scope for `/home`** because it is auth-gated and
  client-rendered. Any SEO ambition (the reference's footer link farm, category
  landing pages) would belong to a future public route, not here.

## 5. Analytics

`src/lib/homeAnalytics.ts` — a deliberately provider-neutral seam. `trackHomeEvent(event, properties)`
dispatches a `CustomEvent("hocam:analytics")` on `window`. No third-party SDK,
no PII. Existing event union:

`authenticated_home_viewed`, `home_subject_search_opened`, `home_subject_selected`,
`home_tutor_search_submitted`, `home_matching_started`, `home_learning_link_clicked`,
`home_question_link_clicked`, `home_tutor_profile_opened`, `home_all_tutors_clicked`,
`home_package_opened`, `home_continue_clicked`, `home_practice_opened`,
`tutor_home_viewed`, `tutor_home_action_clicked`, `tutor_home_lesson_opened`.

This is a **preserve** item: the redesign must keep emitting these (and may add
to the union), otherwise existing listeners silently lose the funnel.

## 6. Student homepage component tree (`AuthenticatedHome.tsx`, 715 lines)

```
AuthenticatedHome                                    src/components/home/AuthenticatedHome.tsx
├── <section> HERO  (bordered, gradient muted→background→violet/8%, decorative blur orb)
│   ├── greeting     "Merhaba {name}, bugün neye odaklanmak istersin?"   ← profileQuery
│   ├── eyebrow      "Doğrulanmış YKS hocaları"
│   ├── h1           "Hedefine uygun hocayı bul, öğrenmeye bugün başla."
│   ├── lede paragraph
│   ├── HomeSubjectSearch     src/components/home/HomeSubjectSearch.tsx   (combobox → /tutors?…)
│   ├── CTA row      primary → /match   ·  text link → /cikmis-sorular
│   ├── trust row    "{count} doğrulanmış hoca" · "Şeffaf değerlendirmeler" · "Esnek ders saatleri"
│   └── HomeTutorPreview      src/components/home/HomeTutorPreview.tsx    (hero-side tutor card)
└── <div class="max-w-7xl space-y-20 …">
    ├── §1  "Sana uygun hocaları keşfet"     → 3× TutorCard in a grid   (+ "Tüm hocaları gör")
    ├── §2  "Kaldığın yerden devam et"       → up to 2× ContinueCard (conditional)
    │        priority: upcoming booking → active goal → active package
    ├── §3  "Hedefine göre çalışma paketleri"→ 3× GoalPackageCard        (+ "Panelime git")
    ├── §4  "Bugün biraz pratik yap"         → 2× PracticeCard (conditional on questions.enabled)
    └── §5  closing CTA band (bg-primary, blackboard.jpg 45% grayscale)  → /tutors
```

Local (unexported) helpers inside the file: `HomeSectionHeader`,
`TutorCardSkeleton`, `ContinueCard`, `PracticeCard`, `formatLessonDateTime`,
`firstUpcomingBooking`, `firstActiveGoal`, `firstActivePackage`,
`prioritizedTemplates`.

### Data flow (student)

| Query key | Function | Module | Endpoint | Notes |
| --- | --- | --- | --- | --- |
| `["profile-me"]` | `fetchProfileMe` | `lib/profileApi.ts` | `GET /profile/me/` | `staleTime: 60_000`, `retry: false` |
| `["subjects"]` | `fetchSubjects` | `lib/tutorsApi.ts` | `GET /subjects/` | `staleTime: Infinity` |
| `["home-tutors"]` | `fetchTutors({ordering:"rating"},1,4)` | `lib/tutorsApi.ts` | `GET /tutors/?…` | 4 results: `[0]` = hero preview, `[1..3]` = grid |
| `["learning-dashboard"]` | `fetchLearningDashboard` | `lib/learningApi.ts` | `GET /learning/dashboard/` | `retry: false` |
| `["learning-goal-templates"]` | `fetchLearningGoalTemplates` | `lib/learningApi.ts` | `GET /learning/goal-templates/` | `retry: false` |
| `["bookings"]` | `fetchBookings` | `lib/lessonsApi.ts` | `GET /bookings/` | shared key with dashboards |
| `["package-purchases"]` | `fetchPackagePurchases` | `lib/paymentsApi.ts` | `GET /payments/package-purchases/` | `retry: false` |
| `["question-metadata"]` | `fetchQuestionMetadata` | `lib/questionsApi.ts` | `GET /questions/meta/` | `enabled` flag gates §4 |

All eight are `enabled: isAuthenticated`. Eight parallel requests fire on mount;
none is deferred, prefetched, or suspended. That is a real performance
observation for the redesign, not a styling one.

## 7. Tutor homepage component tree (`TutorAuthenticatedHome.tsx`, ~1030 lines)

```
TutorAuthenticatedHome
├── hero (h1 + primary/secondary actions)
├── NextLessonPreview            — next lesson, or "Sıradaki dersini planla" empty state
├── §  tutor-home-flow-title     — ActionCard row (how the flow works / next actions)
├── §  tutor-home-upcoming-title — UpcomingLessonCard list
├── §  tutor-home-students-title — StudentSummaryCard list (derived from bookings)
├── §  tutor-home-profile-title  — profile completeness / verification surface
├── §  tutor-home-tools-title    — tool entry points
└── closing band (blackboard.jpg background)
```

Queries: `["tutor-me"]` (`fetchMyTutorProfile`), `["bookings"]`,
`["availability"]` (`fetchAvailability`), `["conversations"]`
(`fetchConversations`), `["tutor-earnings"]` (`fetchTutorEarnings`).

⚠️ **Binding constraint from `AI_AGENT_RULES.md` §2:** `TutorEarningsSummary.total`
is always `0` for package lessons and **must never be rendered with
`formatPrice()` as ₺**. The tutor home deliberately shows `lesson_count`
instead. Any redesign of the tutor home must preserve that.

## 8. Prior art and conflict risk

`docs/authenticated-home-wireframe-spec.md` (746 lines, in `main`) is an
**already-agreed grayscale wireframe specification for this exact route**. It
fixes: page role, role behavior, the student navigation map, full-page order,
desktop/tablet/mobile wireframes, hero contents, section-by-section content and
state rules, user-state variants, a data-source map, an existing-system reuse
map, semantic/accessibility order, an analytics contract, and a low-fidelity
acceptance checklist.

The current implementation matches that spec closely, so it is best read as
**the spec the current page was built from**, not as competing future work.

**Conflict assessment:**

- There is **no separate landing-page workstream in this repository** to collide
  with. No `/landing`, no marketing route, no unmerged branch matching
  `*udemy*` (checked with `git branch -a`). `main` and `origin/main` are in sync
  at `9b3f1f7`.
- The real conflict risk is **documentation drift**: if this project changes the
  section order on `/home`, `docs/authenticated-home-wireframe-spec.md` becomes
  stale and a future agent may "restore" the old order from it. Handling for
  this is specified in `implementation-plan.md` (add a supersession note; do not
  delete the file).
- The second real risk is **file contention**, per `AI_AGENT_RULES.md` §5:
  `dashboard/tutor/page.tsx` and `dashboard/student/page.tsx` are shared large
  files that have already caused genuine merge conflicts. The homepage work
  should not touch them.

## 9. Baseline screenshots

Captured on this branch with the repo's existing Playwright dependency
(`playwright@^1.61.1`, already a devDependency — nothing new installed), against
`npm run dev` on `localhost:3000`.

Output directory (git-ignored via `screenshots/` in `.gitignore`):
`screenshots/product-home-baseline/`

| File | Route requested | Final URL | Viewport |
| --- | --- | --- | --- |
| `root-auth-entry__390.png` | `/` | `/` | 390×844 |
| `root-auth-entry__768.png` | `/` | `/` | 768×1024 |
| `root-auth-entry__1440.png` | `/` | `/` | 1440×900 |
| `home-anonymous__390.png` | `/home` | **`/login`** | 390×844 |
| `home-anonymous__768.png` | `/home` | **`/login`** | 768×1024 |
| `home-anonymous__1440.png` | `/home` | **`/login`** | 1440×900 |
| `tutors-anonymous__390.png` | `/tutors` | `/tutors` | 390×844 |
| `tutors-anonymous__768.png` | `/tutors` | `/tutors` | 768×1024 |
| `tutors-anonymous__1440.png` | `/tutors` | `/tutors` | 1440×900 |

The capture script lives in the session scratchpad
(`…/scratchpad/baseline-shots.ts`) and was run with `NODE_PATH` pointed at the
repo's `node_modules`, so no file was added to the repository for it.

### Authenticated baseline: not captured — why

Honest limitation, not an omission:

1. **No backend is running and none is configured.** There is no `.env.local`,
   so `src/lib/api.ts` falls back to `http://localhost:8000/api` in dev.
   `curl http://localhost:8000/api/subjects/` returns no response (connection
   refused). The `/tutors` captures show the page's error/empty path, and every
   authenticated query on `/home` would fail the same way.
2. **Capturing a real authenticated `/home` requires signing in**, which needs
   real credentials. Per the standing rules for this session I will not enter
   credentials, create an account, hardcode test credentials in the repo, or
   patch `RouteGuard`/`AuthProvider` to fake a session for a screenshot — all
   four are exactly the "weaken authentication for convenience" failure mode the
   task brief prohibits.
3. **The local database target is unknown.** Starting the local Django server
   without checking its `DATABASES` config risks writing to the shared Railway
   production database. Not worth it for a screenshot.

**What would unblock it** (a human decision, listed in the final report): a
running local backend with seeded data, plus either (a) the owner logging in
once in the preview browser so the session cookie exists, or (b) an explicitly
disposable local dev account whose credentials the owner enters themselves.
Baseline captures of the authenticated student and tutor homes should then be
taken before the first visual diff.

## 10. Preserve / replace / reuse summary

**Must be preserved (infrastructure, behavior, policy):**

- The route itself (`/home`) and its `RouteGuard requireAuth` wrapper.
- The role split (`RoleAwareHome`) — student and tutor homes are genuinely
  different products.
- `MainLayout` chain: Navbar, Footer, `MainLayoutShell` mobile tab bar,
  `PresenceHeartbeat`, `TutorActivationGate`.
- Every post-auth redirect target (`returnUrl ?? "/home"`) — changing the route
  would break login, register, `RouteGuard`, the logo, and both nav item sets.
- `trackHomeEvent` and the existing event names.
- Turkish copy; `formatPrice` / `formatRating` / `formatDate` from `lib/utils`.
- The `AI_AGENT_RULES.md` §2 earnings rule on the tutor home.

**Safe to replace (visible composition):**

- The hero's proportions, decorative gradient/blur, and copy blocks.
- Section order and section framing on the student home.
- The local `HomeSectionHeader` / `ContinueCard` / `PracticeCard` helpers — they
  are private to `AuthenticatedHome.tsx` and used nowhere else.
- The closing CTA band.

**Reused as-is:** `TutorCard`, `GoalPackageCard`, `Button`, `Card`, `Badge`,
`Avatar`, `Skeleton`, `EmptyState`, `ErrorMessage`, `SlidingPagination`,
`FavoriteButton`. Details in `component-mapping.md`.

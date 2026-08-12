# Coaching Visual Polish V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Coaching UX into a warmer, layered Coaching Studio across tutor setup, operations, earnings, and student offer surfaces without changing any product or backend truth.

**Architecture:** Refactor the current shared Coaching presentation components rather than introducing a parallel UI. Keep route containers, React Query sources, mutations, status derivation, request partitioning, and financial logic unchanged; add only pure presentation helpers for current-count proportions and 24-hour time options. Recompose every affected route from the same shell, progress, empty-state, money, request, and offer primitives.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript strict mode, TanStack Query, Tailwind CSS, shadcn/ui, lucide-react, Testing Library with Node test runner, Playwright.

## Global Constraints

- Work only in `/Users/ardagg/Desktop/Hocam/Hocam_frontend_coaching_ux_polish_v1` on `feature/coaching-ux-polish-v1`.
- Do not modify the backend worktree, original repositories, production data, Railway, Vercel, Django admin, or production flags.
- Do not push, merge, open a pull request, or enable Coaching checkout.
- This is a frontend-only visual and interaction pass; no API contract, lifecycle, acceptance, or settlement change is allowed.
- Coaching remains a paid lesson-package add-on; no standalone Coaching purchase is introduced.
- Canonical Coaching exams remain exactly `YKS`, `DGS`, and `KPSS`.
- The setup order remains frequency, price, exams, description, availability, capacity, preview, publish.
- Coaching availability remains separate from lesson availability and Coaching meetings remain fixed at 30 minutes.
- Price cap, commission, package durations, discounts, meeting counts, and revenue previews remain server-authoritative.
- Publication, tutor intake, capacity, readiness, and platform checkout remain independent state axes.
- Global checkout disabled is informational and never tutor-fixable.
- Never fabricate students, appointments, reports, trends, percentages, earnings, collection, payout, bank settlement, or refund truth.
- Use current dependencies only; do not add a chart, illustration, or design-system package.
- Use existing Hocam tokens and scoped Coaching classes; do not redefine global brand tokens.
- Preserve keyboard focus, semantic labels, minimum touch targets, and `prefers-reduced-motion` behavior.
- Every production-code task uses a failing focused test, minimal implementation, passing focused test, and an isolated commit.

---

## File and responsibility map

### New frontend files

- `src/lib/coachingVisuals.ts` — pure current-count proportion and 24-hour option helpers; contains no business policy.
- `src/lib/coachingVisuals.test.ts` — proves zero/unavailable metric handling, proportional display, and `HH:mm` options.
- `src/components/coaching/CoachingStudioPanel.tsx` — shared layered section island used by dashboard, setup, operational pages, and empty states.
- `src/components/coaching/CoachingSubnav.tsx` — compact location-aware Coaching navigation with mobile current-location treatment.
- `src/components/coaching/CoachingWeeklyRhythm.tsx` — real current-count dashboard visualization; never a historical chart.
- `src/components/coaching/CoachingWeeklyRhythm.test.tsx` — count, zero-state, and unavailable-state semantics.

### Existing frontend files to refactor

- `src/components/coaching/CoachingPageShell.tsx` and `.test.tsx` — warm scoped canvas, editorial header, consistent gutters, optional subnavigation.
- `src/components/coaching/CoachingStatusCard.tsx` — asymmetric service hero and independent state hierarchy.
- `src/components/coaching/CoachingMetricGrid.tsx` — current-count source adapter for the rhythm module.
- `src/components/coaching/CoachingSectionNav.tsx` — varied-width intent modules and removal of tutor-facing internal terminology.
- `src/components/coaching/TutorCoachingDashboard.tsx` and `.test.tsx` — studio home composition.
- `src/components/coaching/CoachingSetupProgress.tsx` and `.test.tsx` — connected desktop rail and non-overflowing mobile progress disclosure.
- `src/components/coaching/CoachingPlanForm.tsx` and `.test.tsx` — richer meeting, price, exam, description, and capacity decision surfaces.
- `src/components/coaching/RevenuePreviewCard.tsx` and `.test.tsx` — server-derived financial preview hierarchy.
- `src/components/coaching/CoachingAvailabilityEditor.tsx` — weekly planner and explicit 24-hour controls.
- `src/components/coaching/CoachingAvailabilitySection.tsx` and `.test.tsx` — availability/capacity composition.
- `src/components/coaching/CapacityPreviewCard.tsx` — real slot/load relationship visualization.
- `src/components/coaching/CoachingEmptyState.tsx` and `.test.tsx` — full composed, factual empty states.
- `src/components/coaching/CoachingEarningsSummary.tsx` and `.test.tsx` — truthful wallet hierarchy and real-state distribution.
- `src/components/requests/AcceptanceRequestCard.tsx` and `.test.tsx` — nested combined-request hierarchy and natural tutor copy.
- `src/components/requests/TutorAcceptanceRequestList.tsx` and `.test.tsx` — remove `bundle` wording while preserving partition.
- `src/components/coaching/CoachingOfferCard.tsx` and `.test.tsx` — shared richer student offer composition.
- `src/components/coaching/StudentPreviewCard.tsx` — continue adapting preview API truth into `CoachingOfferCard`.
- `src/components/tutors/TutorCoachingSection.tsx` — actual public profile reuse.
- `src/components/coaching/OnboardingControlQuestions.tsx` and `.test.tsx` — stronger “Hızlı kontrol” presentation without scored-test tone.
- Tutor Coaching routes under `src/app/(main)/dashboard/tutor/coaching/**/page.tsx` — shared shell, subnavigation, and composed empty states.
- Student Coaching routes under `src/app/(main)/dashboard/student/coaching/**/page.tsx` — shared location treatment and composed empty states.
- `src/app/(main)/dashboard/tutor/requests/page.tsx` — natural lesson-only partition copy.
- `src/app/(main)/dashboard/student/coaching/page.tsx` and `schedule/page.tsx` — remove internal `bundle` terminology.
- `scripts/coaching-qa.ts` — deterministic V2 screenshot and overflow coverage.
- `package.json` — include the new pure-helper and rhythm tests in `test:coaching`.

### Explicitly unchanged

- `src/lib/coachingApi.ts` response types and mutation functions.
- `src/lib/coachingPresentation.ts` status and request-partition semantics, except a copy-only label if a test proves internal wording escapes.
- Backend repositories, endpoint implementations, migrations, feature flags, checkout logic, payment logic, and acceptance logic.

---

### Task 1: Coaching Studio presentation foundation

**Files:**
- Create: `src/lib/coachingVisuals.ts`
- Create: `src/lib/coachingVisuals.test.ts`
- Create: `src/components/coaching/CoachingStudioPanel.tsx`
- Create: `src/components/coaching/CoachingSubnav.tsx`
- Modify: `src/components/coaching/CoachingPageShell.tsx`
- Modify: `src/components/coaching/CoachingPageShell.test.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces `buildMetricShare(values: Array<number | null>): Array<number | null>`, where successful zero sets produce zero shares and unavailable values remain `null`.
- Produces `COACHING_TIME_OPTIONS: readonly string[]` containing `00:00` through `23:30` at 30-minute intervals.
- Produces `CoachingStudioPanel({ tone, children, className })` with `tone: "plain" | "soft" | "accent" | "dark"`.
- Produces `CoachingSubnav({ currentHref, audience })` for tutor/student Coaching route awareness.
- Extends `CoachingPageShell` with optional `currentHref` and `audience` without changing existing required props.

- [ ] **Step 1: Write failing pure-helper tests**

```ts
assert.deepEqual(buildMetricShare([2, 1, 1, 0]), [50, 25, 25, 0]);
assert.deepEqual(buildMetricShare([0, 0, 0, 0]), [0, 0, 0, 0]);
assert.deepEqual(buildMetricShare([2, null, 2, 0]), [50, null, 50, 0]);
assert.equal(COACHING_TIME_OPTIONS[0], "00:00");
assert.equal(COACHING_TIME_OPTIONS.at(-1), "23:30");
assert.equal(COACHING_TIME_OPTIONS.length, 48);
```

- [ ] **Step 2: Run `rtk npm run test:coaching -- --test-name-pattern="coaching visuals"` and verify failure because the module does not exist.**
- [ ] **Step 3: Implement the two pure helpers with no pricing, lifecycle, or API constants.**
- [ ] **Step 4: Add shell tests proving the page has one `main`, one H1, a parent link, and current Coaching location text on mobile/desktop markup.**
- [ ] **Step 5: Refactor the shell into a scoped warm canvas and add the panel/subnavigation primitives using existing semantic tokens.**
- [ ] **Step 6: Add both new test files to `test:coaching`; run the focused helper and shell tests and verify pass.**
- [ ] **Step 7: Commit `feat: add coaching studio presentation foundation`.**

---

### Task 2: Recompose the Coaching home around service state and weekly rhythm

**Files:**
- Create: `src/components/coaching/CoachingWeeklyRhythm.tsx`
- Create: `src/components/coaching/CoachingWeeklyRhythm.test.tsx`
- Modify: `src/components/coaching/CoachingStatusCard.tsx`
- Modify: `src/components/coaching/CoachingMetricGrid.tsx`
- Modify: `src/components/coaching/CoachingSectionNav.tsx`
- Modify: `src/components/coaching/TutorCoachingDashboard.tsx`
- Modify: `src/components/coaching/TutorCoachingDashboard.test.tsx`
- Modify: `package.json`

**Interfaces:**
- `CoachingWeeklyRhythm` consumes the existing `CoachingMetricValues` object and uses `buildMetricShare` only for visual widths.
- `CoachingStatusCard` continues to consume `CoachingDerivedStatus`; it must not derive new business state.
- `TutorCoachingDashboard` keeps its current public props so `page.tsx` query composition remains unchanged.

- [ ] **Step 1: Write failing rhythm tests for successful counts, all-zero start state, and one unavailable metric.**

```tsx
render(<CoachingWeeklyRhythm metrics={{ activeStudents: 2, upcomingSessions: 1, pendingReports: 1, pendingRequests: 0 }} />);
assert.ok(screen.getByText("Haftanın ritmi"));
assert.ok(screen.getByText("2"));
assert.ok(screen.getByLabelText("Aktif öğrenci: toplamın %50'si"));
```

- [ ] **Step 2: Run the rhythm and dashboard tests; verify the new module assertions fail.**
- [ ] **Step 3: Implement the real-count rhythm with a CSS segmented track, no dates/trends, factual zero state, and unavailable copy.**
- [ ] **Step 4: Redesign `CoachingStatusCard` into an asymmetric hero: primary publication/readiness story, quieter independent state rows, deterministic action, and a separate platform message.**
- [ ] **Step 5: Rework `CoachingSectionNav` into varied-width “Koçluğu yürüt”, “Teklif ve ayarlar”, and “Kayıtlar” islands; replace “bundle” with “ders paketi ve koçluk talebi”.**
- [ ] **Step 6: Compose hero, platform strip, weekly rhythm, and intent navigation in `TutorCoachingDashboard`; keep every query error honest.**
- [ ] **Step 7: Add dashboard tests proving published-plus-platform-paused copy remains informational and has no enable-checkout action.**
- [ ] **Step 8: Run rhythm/dashboard tests and `rtk npm run test:coaching`; verify pass.**
- [ ] **Step 9: Commit `feat: recompose coaching studio home`.**

---

### Task 3: Replace the setup strip with responsive progress architecture

**Files:**
- Modify: `src/components/coaching/CoachingSetupProgress.tsx`
- Modify: `src/components/coaching/CoachingSetupProgress.test.tsx`

**Interfaces:**
- Keeps `currentStep` and `unlockedSteps` props.
- Uses existing `COACHING_SETUP_STEPS`; no route or setup-order changes.
- Mobile and desktop markup may coexist through responsive classes, but only one semantic navigation landmark is allowed.

- [ ] **Step 1: Add failing tests for `Adım 3 / 8`, current title, next-stage copy, `aria-current="step"`, and an expandable list containing only unlocked links.**
- [ ] **Step 2: Run `rtk npm run test:coaching -- --test-name-pattern="setup progress"`; verify failure against the horizontal strip.**
- [ ] **Step 3: Implement a connected desktop rail with completion connectors and a mobile summary/progress disclosure that never relies on horizontal overflow.**
- [ ] **Step 4: Preserve link query strings, locked semantics, keyboard focus, and completed check icons.**
- [ ] **Step 5: Run setup progress tests and TypeScript; verify pass.**
- [ ] **Step 6: Commit `feat: redesign coaching setup progress`.**

---

### Task 4: Productize meeting, price, exam, and description decisions

**Files:**
- Modify: `src/components/coaching/CoachingPlanForm.tsx`
- Modify: `src/components/coaching/CoachingPlanForm.test.tsx`
- Modify: `src/components/coaching/RevenuePreviewCard.tsx`
- Modify: `src/components/coaching/RevenuePreviewCard.test.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/plan/page.tsx`

**Interfaces:**
- `CoachingPlanForm` continues to emit only `CoachingPlanPayload` via existing callbacks.
- Meeting counts, cap, commission, package discounts, and preview amounts remain rendered from `CoachingSetupConfig` and revenue-preview responses.
- Exam explanation is presentation-only data keyed by the already returned `YKS`, `DGS`, and `KPSS` values.

- [ ] **Step 1: Add failing tests proving selected meeting rhythm and exam choices expose both `aria-pressed=true` and an explicit selected marker.**
- [ ] **Step 2: Add a failing exam test proving exactly YKS, DGS, and KPSS cards render with contextual copy and no TYT/AYT/YDT option.**
- [ ] **Step 3: Add failing price tests proving lesson price, price cap, commission, entered amount, and server-returned revenue rows remain visible without frontend arithmetic.**
- [ ] **Step 4: Run plan/revenue tests and verify failure on the richer semantics.**
- [ ] **Step 5: Recompose meeting rhythm into large cadence cards with nested canonical package counts and a fixed-duration anchor.**
- [ ] **Step 6: Recompose price into one decision island plus one server-owned earnings-preview island; do not add sample amounts.**
- [ ] **Step 7: Replace exam pills with three confident selection cards and refine description into a focused writing surface with practical guidance.**
- [ ] **Step 8: Strengthen the persistent primary action and mobile full-width treatment without changing save/continue behavior.**
- [ ] **Step 9: Run plan/revenue tests, `rtk npm run test:coaching`, and TypeScript; verify pass.**
- [ ] **Step 10: Commit `feat: enrich coaching setup decisions`.**

---

### Task 5: Turn availability and capacity into a coherent weekly planner

**Files:**
- Modify: `src/components/coaching/CoachingAvailabilityEditor.tsx`
- Modify: `src/components/coaching/CoachingAvailabilitySection.tsx`
- Modify: `src/components/coaching/CoachingAvailabilitySection.test.tsx`
- Modify: `src/components/coaching/CapacityPreviewCard.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/availability/page.tsx`

**Interfaces:**
- The editor still emits `CoachingAvailabilityPayload` with `day_of_week`, `start_time`, and `end_time`.
- Time values come from `COACHING_TIME_OPTIONS`; no browser-native AM/PM input remains.
- Capacity renders existing `weekly_slot_count`, `theoretical_capacity`, `max_active_students`, and `active_students` only.

- [ ] **Step 1: Add failing tests that select `18:00` and `20:00`, submit them unchanged, and assert no `AM` or `PM` text exists.**
- [ ] **Step 2: Add failing tests for seven named day surfaces, configured-window grouping, and a factual no-availability start state.**
- [ ] **Step 3: Run availability tests and verify failure against native time inputs/current sparse list.**
- [ ] **Step 4: Replace native time inputs with accessible 30-minute `HH:mm` selects and retain all mutation payload semantics.**
- [ ] **Step 5: Build the weekly planner with quiet empty days, visible configured intervals, and existing delete actions.**
- [ ] **Step 6: Recompose capacity as a real slot/load relationship; never infer automatic termination or backend downshift behavior.**
- [ ] **Step 7: Run availability tests, `rtk npm run test:coaching`, and TypeScript; verify pass.**
- [ ] **Step 8: Commit `feat: redesign coaching weekly availability`.**

---

### Task 6: Roll out composed empty states and location awareness

**Files:**
- Modify: `src/components/coaching/CoachingEmptyState.tsx`
- Modify: `src/components/coaching/CoachingEmptyState.test.tsx`
- Create: `src/components/coaching/CoachingOperationalRoutes.test.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/upcoming/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/students/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/reports/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/complaints/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/time-requests/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/reschedule-requests/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/service-periods/[servicePeriodId]/program/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/sessions/[id]/prepare/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/sessions/[id]/report/page.tsx`
- Modify: `src/app/(main)/dashboard/student/coaching/page.tsx`
- Modify: `src/app/(main)/dashboard/student/coaching/upcoming/page.tsx`
- Modify: `src/app/(main)/dashboard/student/coaching/program/page.tsx`
- Modify: `src/app/(main)/dashboard/student/coaching/reports/page.tsx`
- Modify: `src/app/(main)/dashboard/student/coaching/schedule/page.tsx`
- Modify: `src/app/(main)/dashboard/student/coaching/complaints/page.tsx`

**Interfaces:**
- `CoachingEmptyState` keeps current props and adds optional `steps?: readonly string[]` and `tone?: "soft" | "accent"`.
- Empty states must not accept fabricated row/card data.
- Routes retain existing guards, queries, mutations, and hrefs.

- [ ] **Step 1: Extend empty-state tests to require one visual anchor, bounded copy width, optional factual workflow steps, and at most one primary action container.**
- [ ] **Step 2: Create `CoachingOperationalRoutes.test.tsx` with a route-fixture table that renders each listed empty/loading-free page component with mocked query data and asserts Coaching location, page title, and route-specific empty-state explanation.**
- [ ] **Step 3: Run empty-state/route-shell tests and verify failure on current sparse composition.**
- [ ] **Step 4: Implement the larger layered empty-state composition using lucide icons and CSS shapes only.**
- [ ] **Step 5: Apply the shared shell/subnavigation and factual empty state to every listed tutor route without changing route logic.**
- [ ] **Step 6: Apply the same hierarchy to student routes and replace internal `bundle` wording with “ders paketi ve çalışma koçluğu talebi”.**
- [ ] **Step 7: Run focused empty-state, tutor-route, and student-route tests plus TypeScript; verify pass.**
- [ ] **Step 8: Commit `feat: complete coaching operational empty states`.**

---

### Task 7: Redesign Coaching earnings with financially honest visual hierarchy

**Files:**
- Modify: `src/components/coaching/CoachingEarningsSummary.tsx`
- Modify: `src/components/coaching/CoachingEarningsSummary.test.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/earnings/page.tsx`

**Interfaces:**
- Continues to consume `CoachingTutorEarningSummary` only.
- Uses `formatTryMinor` for every minor-unit amount.
- Uses `buildMetricShare` on the four returned accounting-state amounts for a proportional distribution, not a time series.

- [ ] **Step 1: Add failing tests for the large summary panel, four real accounting categories, a proportional distribution label, and Turkish currency output such as `₺1.234,56`.**
- [ ] **Step 2: Add negative assertions forbidding `bankaya yatırıldı`, `ödeme tamamlandı`, raw `kuruş`, and tutor-facing `payout batch`.**
- [ ] **Step 3: Run earnings tests and verify failure on the new hierarchy.**
- [ ] **Step 4: Implement a truthful wallet composition with returned-state distribution, supporting state cards, monthly accounting records, and plain-Turkish caveat.**
- [ ] **Step 5: Ensure zero totals remain intentional and do not imply payout eligibility or settlement.**
- [ ] **Step 6: Run earnings, money, Faz8, full Coaching tests, and TypeScript; verify pass.**
- [ ] **Step 7: Commit `feat: enrich coaching earnings presentation`.**

---

### Task 8: Refine combined Coaching requests and remove internal language

**Files:**
- Modify: `src/components/requests/AcceptanceRequestCard.tsx`
- Modify: `src/components/requests/AcceptanceRequestCard.test.tsx`
- Modify: `src/components/requests/TutorAcceptanceRequestList.tsx`
- Modify: `src/components/requests/TutorAcceptanceRequestList.test.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/requests/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/requests/page.tsx`

**Interfaces:**
- Keeps one `onRespond("accept" | "reject", note?)` callback.
- Keeps `partitionAcceptanceRequests` and exact `includes_coaching` behavior.
- Lesson package totals continue through the existing major-unit formatter; Coaching totals continue through `formatTryMinor`.

- [ ] **Step 1: Add failing tests asserting no visible text matches `/bundle/i` and that the combined-decision explanation is present.**
- [ ] **Step 2: Keep existing tests proving Coaching requests appear only on the Coaching surface and lesson-only requests only on the general surface.**
- [ ] **Step 3: Run request tests and verify failure from current copy.**
- [ ] **Step 4: Recompose the card with a student header, lesson package section, Coaching add-on section, one decision explanation, and unchanged actions.**
- [ ] **Step 5: Replace all tutor-facing route/list `bundle` language while leaving code comments and domain naming untouched where internal.**
- [ ] **Step 6: Run request tests, full Coaching tests, and TypeScript; verify pass.**
- [ ] **Step 7: Commit `feat: clarify coaching package requests`.**

---

### Task 9: Enrich the shared student-facing Coaching offer and onboarding control

**Files:**
- Modify: `src/components/coaching/CoachingOfferCard.tsx`
- Modify: `src/components/coaching/CoachingOfferCard.test.tsx`
- Modify: `src/components/coaching/StudentPreviewCard.tsx`
- Modify: `src/components/tutors/TutorCoachingSection.tsx`
- Modify: `src/components/coaching/OnboardingControlQuestions.tsx`
- Modify: `src/components/coaching/OnboardingControlQuestions.test.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/preview/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/onboarding/page.tsx`

**Interfaces:**
- `CoachingOfferCard` keeps `CoachingOfferView`, `action`, `statusMessage`, and `showHowItWorks`.
- Tutor preview and real public profile continue to share the same component.
- Onboarding questions continue to submit current server-owned answers and render server verdicts without score language.

- [ ] **Step 1: Add failing offer tests for learning-promise hierarchy, exam context, meeting rhythm, package relationship, commercial summary, and reachable action.**
- [ ] **Step 2: Add a reuse test proving preview and public adapters pass the same student-safe view shape.**
- [ ] **Step 3: Add onboarding tests requiring “Hızlı kontrol” language and forbidding score/test-result terminology.**
- [ ] **Step 4: Run offer/onboarding tests and verify failure against current restrained composition.**
- [ ] **Step 5: Recompose `CoachingOfferCard` into service-story and commercial-summary regions with responsive stacking and no tutor-only state.**
- [ ] **Step 6: Update preview/public wrappers only as needed for spacing and action placement; do not duplicate markup.**
- [ ] **Step 7: Enrich onboarding intro, progress, choice feedback, and completion surfaces while keeping one question at a time and current semantics.**
- [ ] **Step 8: Run offer/onboarding/full Coaching tests and TypeScript; verify pass.**
- [ ] **Step 9: Commit `feat: polish coaching offer and quick check`.**

---

### Task 10: Complete static validation and deterministic browser QA

**Files:**
- Modify: `scripts/coaching-qa.ts`
- Create/update screenshots under ignored `screenshots/coaching-qa/visual-polish-v2/`
- Update only if evidence changes: `docs/qa/coaching-hover-image-reproduction.md`

**Interfaces:**
- QA uses the existing deterministic/local fixture and intercept mechanism.
- It captures actual implemented routes; no mockup and no screenshot-only code path is permitted.

- [ ] **Step 1: Run `rtk npm run test:coaching` and record the exact passing test count.**
- [ ] **Step 2: Run `rtk npx tsc --noEmit` and require zero errors.**
- [ ] **Step 3: Run `rtk npm run lint`; record any pre-existing warnings separately from new warnings.**
- [ ] **Step 4: Run `rtk npm run build` and require success.**
- [ ] **Step 5: Run the complete unit suite; classify only proven unrelated pre-existing failures.**
- [ ] **Step 6: Extend `scripts/coaching-qa.ts` to assert no horizontal overflow, console errors, `AM`/`PM`, or visible tutor-facing `bundle` at 375, 768, and desktop widths.**
- [ ] **Step 7: Capture desktop 1440×900 states: published home, draft home if fixture-supported, all eight setup stages, student preview/shared offer, publish/readiness, upcoming empty, reports empty, Coaching requests, Coaching earnings, student no-active-Coaching dashboard, and actual public tutor-profile offer.**
- [ ] **Step 8: Capture 375×812 representatives: Coaching home, one setup stage with progress, one operational empty state, and CoachingOfferCard.**
- [ ] **Step 9: For each screenshot record route, viewport, fixture/state, and absolute file path.**
- [ ] **Step 10: Manually self-review blank space, hierarchy, CRUD feeling, pills/badges, alignment, copy density, primary action, selected state, money, navigation, spacing/radius/type, and mobile overflow.**
- [ ] **Step 11: Re-run the tutor-dashboard hover/image reproduction protocol. Change code only if a reproducible root cause is proven; otherwise report `NO FIX` with evidence.**
- [ ] **Step 12: Run `rtk git diff --check`, inspect `rtk git status --short`, and verify no backend/original/production changes.**
- [ ] **Step 13: Commit `test: verify coaching visual polish v2`.**

---

## Completion report requirements

The final report must include:

- implementation summary;
- confirmation of zero backend and production changes;
- exact frontend files/components changed;
- focused and full test counts;
- TypeScript, lint, and build results;
- 375/768/desktop browser QA results;
- screenshot manifest with absolute paths;
- visual self-review and any remaining issues;
- hover/image reproduction result and proven root cause or `NO FIX` evidence;
- Master Spec safety statement;
- clean/dirty git status for the isolated worktree;
- design, implementation, and QA commit hashes;
- explicit confirmation that nothing was pushed, merged, or opened as a PR.

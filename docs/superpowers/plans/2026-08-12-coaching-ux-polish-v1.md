# Coaching UX Polish V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the tutor Coaching experience as an intent-led Hocam dashboard and guided service configurator, while fixing canonical exam serialization, request partitioning, availability guidance, raw-minor-unit money display, navigation, empty states, and student add-on copy.

**Architecture:** Add one read-only backend setup-config endpoint so first-time setup consumes canonical price limits, exam groups, frequency/package meeting counts, and commission data without frontend duplication. On the frontend, keep API fetching in route containers, move state derivation into pure tested helpers, and compose the screens from shared Coaching-specific shell, status, navigation, empty-state, setup, availability, offer, and money components. Preserve all existing write endpoints and lifecycle semantics.

**Tech Stack:** Django 5.2 + DRF, Next.js 14 App Router, React 18, TypeScript strict mode, TanStack Query, Tailwind CSS, shadcn/ui, Testing Library with Node test runner, Playwright for browser QA.

## Global Constraints

- Work only in `/Users/ardagg/Desktop/Hocam/Hocam_backend_coaching_ux_polish_v1` and `/Users/ardagg/Desktop/Hocam/Hocam_frontend_coaching_ux_polish_v1` on `feature/coaching-ux-polish-v1`.
- Do not modify the original repositories, the Faz6/Faz7/Faz8 worktrees, or the dirty QA worktree.
- Do not modify Railway, Vercel, Django admin, production data, or production flags.
- Keep `COACHING_ENABLED=True`, `NEXT_PUBLIC_COACHING_ENABLED=true`, runtime `is_enabled=True`, and runtime `is_checkout_enabled=False` unchanged.
- Do not enable checkout or bypass `checkout_enabled` checks.
- Coaching remains a lesson-package add-on; no standalone Coaching purchase is introduced.
- Coaching exam groups are exactly `YKS`, `DGS`, and `KPSS`; TYT/AYT/YDT remain subject-level values only.
- Coaching availability remains separate from ordinary lesson availability.
- Meetings remain fixed at 30 minutes; tutor frequency remains biweekly, weekly, or twice weekly.
- Price may be zero and may not exceed the backend-configured percentage of the tutor's real 40-minute lesson price; the current policy is 75%.
- Commission remains backend-configured; the current policy is 15%.
- Control questions remain server-graded and required, but the tutor UI must not frame them as a scored exam.
- Never infer collection, bank transfer, payout settlement, or refund settlement from internal accounting records.
- Preserve existing bundle acceptance, capacity, publication, scheduling, report, dispute, refund, and earning lifecycles.
- Do not add a large UI dependency; use the existing motion and Tailwind animation tooling.
- Every production behaviour change follows a failing-test, minimal-fix, passing-test cycle.
- Do not push, merge, or open a pull request.

---

## File and Responsibility Map

### Backend files expected to change

- `apps/coaching/exam_groups.py` — expose one ordered canonical exam-group tuple (`YKS`, `DGS`, `KPSS`) while retaining the set used for membership checks.
- `apps/coaching/views.py` — add an authenticated, read-only tutor setup-config response assembled from current domain constants and runtime config.
- `apps/coaching/urls.py` — register `GET /api/coaching/tutor/setup-config/`.
- `apps/coaching/tests_api.py` — prove the endpoint returns canonical exam groups, 30-minute duration, actual tutor price/cap, runtime percentage/commission, and backend-derived meeting counts for the canonical duration map.

No model, migration, admin, payment, checkout-write, acceptance, capacity, or lifecycle file changes are planned.

### Frontend files to create

- `src/lib/coachingPresentation.ts` — canonical UI type guards, request partitioning, dashboard metrics, and independent Coaching status derivation.
- `src/lib/coachingPresentation.test.ts` — regression tests for exam filtering, request partitioning, metrics, and status axes.
- `src/lib/coachingSetup.ts` — setup-step IDs, URL parsing, unlocked-step rules, and safe plan payload construction.
- `src/lib/coachingSetup.test.ts` — setup order, navigation, and payload serialization tests.
- `src/components/coaching/CoachingPageShell.tsx` — shared breadcrumb/back/title/description/header-action shell for tutor and student Coaching pages.
- `src/components/coaching/CoachingPageShell.test.tsx` — semantic navigation and heading tests.
- `src/components/coaching/CoachingEmptyState.tsx` — composed Coaching empty state with meaningful icon, explanation, and bounded actions.
- `src/components/coaching/CoachingStatusCard.tsx` — independent publication/intake/capacity/platform-checkout status presentation.
- `src/components/coaching/CoachingSectionNav.tsx` — grouped intent navigation replacing the wall of pills.
- `src/components/coaching/CoachingMetricGrid.tsx` — real metric cards with loading/error unavailable states.
- `src/components/coaching/TutorCoachingDashboard.tsx` — presentational dashboard composition for deterministic component testing.
- `src/components/coaching/TutorCoachingDashboard.test.tsx` — draft/published/platform-paused/navigation/metric rendering tests.
- `src/components/coaching/CoachingSetupProgress.tsx` — eight-stage progress navigation with guided and direct-edit modes.
- `src/components/coaching/CoachingSetupProgress.test.tsx` — keyboard, current-step, and lock-state tests.
- `src/components/coaching/CoachingAvailabilitySection.tsx` — shared data-aware availability editor/weekly summary used in setup and settings.
- `src/components/coaching/CoachingAvailabilitySection.test.tsx` — separate-availability copy, empty CTA, and weekly-summary tests.
- `src/components/coaching/CoachingOfferCard.tsx` — shared tutor-preview and student-facing offer presentation.
- `src/components/coaching/CoachingOfferCard.test.tsx` — frequency, 30-minute duration, exam, services, price, and capacity tests.
- `src/components/coaching/CoachingEarningsSummary.tsx` — plain-Turkish accounting summary using formatted TL values.
- `src/components/coaching/CoachingEarningsSummary.test.tsx` — no raw kuruş, no bank-settlement claim, and small-screen structure tests.
- `src/components/requests/AcceptanceRequestCard.test.tsx` — full bundle context and unchanged accept/reject semantics tests.
- `src/components/coaching/OnboardingControlQuestions.test.tsx` — one-at-a-time lightweight control and explanatory feedback tests.
- `src/components/coaching/TutorCoachingRouteShells.test.tsx` — table-driven shell, navigation, and empty-state coverage for every remaining tutor Coaching subroute.
- `src/components/coaching/StudentCoachingRouteShells.test.tsx` — table-driven shell, navigation, add-on copy, and empty-state coverage for every student Coaching subroute.
- `src/app/(main)/dashboard/tutor/coaching/requests/page.tsx` — Coaching-only new student bundle requests.
- `scripts/coaching-qa.ts` — authenticated local/test-environment responsive, overflow, console, navigation, and screenshot checks.
- `docs/qa/coaching-hover-image-reproduction.md` — evidence record for the tutor-dashboard hover/image report.

### Frontend files to refactor or modify

- `src/lib/coachingApi.ts` and `src/lib/coachingApi.test.ts` — setup-config contract/client and safe known-error handling.
- `src/lib/coachingFaz8.test.ts` — financially honest tutor earning status expectations.
- `src/lib/money.ts` and `src/lib/money.test.ts` — retain one minor-unit-to-TRY formatter and strengthen no-precision-loss expectations; do not add pricing arithmetic.
- `src/components/coaching/CoachingPlanForm.tsx` — convert the long form into the controlled eight-stage configurator while keeping one payload boundary.
- `src/components/coaching/CoachingAvailabilityEditor.tsx` — improve weekly visual composition and accessible add/delete interactions.
- `src/components/coaching/CapacityPreviewCard.tsx` — show selected/theoretical/active capacity relationship from server data.
- `src/components/coaching/RevenuePreviewCard.tsx` — one-month primary summary plus expandable server-returned durations.
- `src/components/coaching/StudentPreviewCard.tsx` — adapt backend preview data into `CoachingOfferCard`.
- `src/components/coaching/OnboardingControlQuestions.tsx` — one lightweight control at a time; keep server verdicts.
- `src/components/tutors/TutorCoachingSection.tsx` — reuse `CoachingOfferCard` for the public student-facing offer.
- `src/components/requests/AcceptanceRequestCard.tsx` — show complete lesson-package + Coaching bundle context without changing its single accept/reject callback.
- `src/app/(main)/dashboard/tutor/coaching/page.tsx` — query container for the new dashboard.
- `src/app/(main)/dashboard/tutor/coaching/plan/page.tsx` — URL-addressable setup orchestration, draft save, publish errors, and next actions.
- `src/app/(main)/dashboard/tutor/coaching/availability/page.tsx` — shared availability section and page shell.
- `src/app/(main)/dashboard/tutor/coaching/preview/page.tsx` — realistic profile context and shared offer card.
- `src/app/(main)/dashboard/tutor/coaching/onboarding/page.tsx` — “Hızlı kontrol” and honest completion transition.
- `src/app/(main)/dashboard/tutor/coaching/earnings/page.tsx` — `CoachingEarningsSummary` and plain-Turkish status context.
- `src/app/(main)/dashboard/tutor/requests/page.tsx` — lesson-only request partition.
- `src/app/(main)/dashboard/tutor/coaching/upcoming/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/students/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/reports/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/complaints/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/complaints/[disputeId]/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/time-requests/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/reschedule-requests/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/service-periods/[servicePeriodId]/program/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/sessions/[id]/prepare/page.tsx`
- `src/app/(main)/dashboard/tutor/coaching/sessions/[id]/report/page.tsx`
- `src/app/(main)/dashboard/student/coaching/page.tsx`
- `src/app/(main)/dashboard/student/coaching/upcoming/page.tsx`
- `src/app/(main)/dashboard/student/coaching/program/page.tsx`
- `src/app/(main)/dashboard/student/coaching/reports/page.tsx`
- `src/app/(main)/dashboard/student/coaching/reports/[reportId]/page.tsx`
- `src/app/(main)/dashboard/student/coaching/schedule/page.tsx`
- `src/app/(main)/dashboard/student/coaching/complaints/page.tsx`
- `src/app/(main)/dashboard/student/coaching/complaints/[disputeId]/page.tsx`
- `package.json` — register focused Coaching tests and QA script.

The immersive live-session routes under `src/app/session/coaching/` do not receive the dashboard page shell. Their room and post-session flows remain functionally unchanged; browser QA still verifies entry and return paths.

## Existing Components and Utilities to Reuse

- Keep `CoachingGuard` and `CoachingRecordGuard` role/runtime semantics.
- Reuse shadcn `Card`, `Button`, `Badge`, `Accordion`, `Skeleton`, `Separator`, `Input`, `Textarea`, and existing focus styles.
- Reuse `OnboardingCarousel`; its server-provided educational content remains canonical.
- Refactor rather than duplicate `CoachingAvailabilityEditor`, `CapacityPreviewCard`, `RevenuePreviewCard`, and `StudentPreviewCard`.
- Reuse `AcceptanceRequestCard` in both request destinations after partitioning.
- Reuse `useCoachingFlag()` for `checkoutEnabled`; do not create a second flag query.
- Reuse `fetchMyTutorProfile()` only for non-pricing profile context; authoritative setup price constraints come from the new setup-config endpoint.
- Reuse `formatTryMinor()` for minor-unit display, `formatPrice()` for existing major-unit lesson-package totals, and `formatPlanDuration()` for duration labels.
- Reuse the existing React Query keys so mutations invalidate the same cache consumers.

## Real Metric Query Dependencies

| Metric/state | Query | Derivation |
|---|---|---|
| Onboarding readiness | `fetchCoachingOnboarding()` | `is_completed`, accepted contract state already represented by the response |
| Plan visibility/intake | `fetchCoachingPlan()` | `is_published`, `is_accepting_new_students`, price, frequency, exams |
| Capacity | `fetchCoachingCapacity()` | `weekly_slot_count`, `theoretical_capacity`, `max_active_students`, `active_students`, `can_accept_new_student` |
| Platform checkout | `useCoachingFlag()` | `checkoutEnabled`; independent of publication/intake/capacity |
| Active Coaching students | `fetchCoachingStudents()` | count only `service_status === "active"` |
| Upcoming meetings | `fetchTutorCoachingSessions()` | count server-filtered `scheduled`, `reschedule_requested`, and `in_progress`; exclude `awaiting_report` |
| Reports requiring action | `fetchTutorCoachingSessions()` | count `status === "awaiting_report"`; use `report_overdue` only for urgency copy |
| New Coaching requests | `fetchAcceptanceRequests()` | count `includes_coaching && status === "pending"` |
| Setup constraints | `fetchCoachingSetupConfig()` | server-derived exam groups, frequency/duration meeting counts, fixed duration, lesson price, cap ratio/cap, commission |
| Revenue estimate | `fetchCoachingRevenuePreview()` | render returned rows; never recalculate discount, commission, or net in React |
| Earnings accounting | `fetchTutorCoachingEarnings()` | format returned minor values and map state copy without settlement inference |

If a metric query errors, its card renders “Şu anda görüntülenemiyor” with no numeric fallback. It must not display zero unless the server successfully returned an empty set.

## Independent Coaching Status Model

| Axis | Values | Source | Tutor action |
|---|---|---|---|
| Publication | `missing`, `draft`, `published` | `CoachingPlan` | create, edit, or publish when ready |
| Intake | `not_applicable`, `open`, `closed` | plan intake flag | open/close only when existing API permits |
| Capacity | `unknown`, `missing_availability`, `available`, `full` | capacity API | add availability or adjust server-valid capacity |
| Platform checkout | `enabled`, `platform_paused` | runtime flag | none; informational only |
| Readiness | `onboarding`, `plan`, `availability`, `capacity`, `publish`, `complete` | combined real state | one deterministic next action |

When publication is `published` and platform checkout is `platform_paused`, show exactly:

> Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı.

Do not convert this into an error, checklist failure, warning CTA, or tutor-controlled switch.

## Money and Accounting Copy Map

All amounts use `formatTryMinor(minor)` and never append or display the word “kuruş”. The tutor Coaching earnings page uses these labels:

| Backend state | Tutor-facing Turkish |
|---|---|
| `eligible_unfunded` | `Kazanç hesabına uygun · kullanılabilir ödeme fonu doğrulanmadı` |
| `pending` | `Aylık değerlendirmede` |
| `on_hold` | `İnceleme nedeniyle bekliyor` |
| `reversed` | `Muhasebe kaydı geri çevrildi` |
| `ready` | `Aktarım hazırlığında · banka ödemesi doğrulanmadı` |
| `paid` | `Sistem kaydında işlendi · banka aktarımı ayrıca doğrulanmalı` |
| unknown | `Kazanç durumu inceleniyor` |

The UI labels `payout_batches` as `Aylık kazanç kayıtları`, not payout batches. It does not render `paid_at` because the current contract does not prove external bank settlement. `earning_eligible_at`, if added to a future response, is never used as a payment date.

---

### Task 1: Add the canonical read-only tutor setup-config API

**Files:**
- Modify: `apps/coaching/exam_groups.py`
- Modify: `apps/coaching/views.py`
- Modify: `apps/coaching/urls.py`
- Test: `apps/coaching/tests_api.py`

**Interfaces:**
- Consumes: `CoachingSettingsConfig.get_solo()`, ordered `CANONICAL_EXAM_GROUP_OPTIONS`, `CoachingFrequency.choices`, `DURATION_WEEKS`, `session_count()`, `max_coaching_price_minor()`, `format_minor()`, `SESSION_DURATION_MINUTES`, authenticated tutor profile.
- Produces: `GET /api/coaching/tutor/setup-config/` with the exact response shape below.

- [ ] **Step 1: Write the failing endpoint test**

```python
def test_tutor_setup_config_uses_canonical_domain_truth(self):
    config = CoachingSettingsConfig.get_solo()
    config.max_price_ratio_percent = 75
    config.commission_bps = 1500
    config.save(update_fields=["max_price_ratio_percent", "commission_bps"])
    self.tutor.hourly_price = 1070
    self.tutor.save(update_fields=["hourly_price"])

    response = self.client.get("/api/coaching/tutor/setup-config/")

    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["exam_groups"], ["YKS", "DGS", "KPSS"])
    self.assertEqual(response.data["session_duration_minutes"], 30)
    self.assertEqual(response.data["lesson_price_minor"], 107000)
    self.assertEqual(response.data["max_price_ratio_percent"], 75)
    self.assertEqual(response.data["price_cap_minor"], 80250)
    self.assertEqual(response.data["commission_bps"], 1500)
    self.assertEqual(
        [row["weeks"] for row in response.data["frequency_options"][1]["packages"]],
        [2, 4, 12, 24],
    )
    self.assertEqual(
        [row["total_sessions"] for row in response.data["frequency_options"][1]["packages"]],
        [2, 4, 12, 24],
    )
```

- [ ] **Step 2: Run the test and verify a 404 failure**

Run: `../Hocam_backend/.venv/bin/python manage.py test apps.coaching.tests_api.CoachingApiTests.test_tutor_setup_config_uses_canonical_domain_truth`

Expected: FAIL because `/api/coaching/tutor/setup-config/` is not registered.

- [ ] **Step 3: Establish one ordered canonical exam source**

In `apps/coaching/exam_groups.py`, define `CANONICAL_EXAM_GROUP_OPTIONS = ("YKS", "DGS", "KPSS")` and derive `CANONICAL_EXAM_GROUPS = frozenset(CANONICAL_EXAM_GROUP_OPTIONS)`. Existing serializer membership semantics stay unchanged, while display/API order no longer depends on set sorting.

- [ ] **Step 4: Implement the read-only view and URL**

```python
class CoachingTutorSetupConfigView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedTutor, CoachingEnabled]

    def get(self, request):
        config = CoachingSettingsConfig.get_solo()
        tutor = _tutor(request)
        frequency_options = []
        for value, label in CoachingFrequency.choices:
            frequency_options.append({
                "value": value,
                "label": label,
                "packages": [
                    {
                        "duration_days": duration_days,
                        "weeks": weeks,
                        "total_sessions": session_count(value, weeks),
                    }
                    for duration_days, weeks in sorted(DURATION_WEEKS.items())
                ],
            })
        price_cap_minor = max_coaching_price_minor(
            tutor.hourly_price,
            config.max_price_ratio_percent,
        )
        return Response({
            "exam_groups": list(CANONICAL_EXAM_GROUP_OPTIONS),
            "session_duration_minutes": SESSION_DURATION_MINUTES,
            "lesson_price_minor": tutor.hourly_price * 100,
            "lesson_price_display": format_minor(tutor.hourly_price * 100),
            "max_price_ratio_percent": config.max_price_ratio_percent,
            "price_cap_minor": price_cap_minor,
            "price_cap_display": format_minor(price_cap_minor),
            "commission_bps": config.commission_bps,
            "frequency_options": frequency_options,
        })
```

Register it under `path("tutor/setup-config/", views.CoachingTutorSetupConfigView.as_view(), name="coaching-tutor-setup-config")`.

- [ ] **Step 5: Add permission and no-write assertions**

Add tests proving a student receives 403, an unauthenticated request receives 401/403 according to current DRF settings, and a GET does not create a `CoachingPlan`.

- [ ] **Step 6: Run targeted backend tests**

Run: `../Hocam_backend/.venv/bin/python manage.py test apps.coaching.tests_api apps.coaching.tests_pricing`

Expected: all tests pass.

- [ ] **Step 7: Commit the endpoint**

```bash
git add apps/coaching/exam_groups.py apps/coaching/views.py apps/coaching/urls.py apps/coaching/tests_api.py
git commit -m "feat: expose canonical coaching setup config"
```

### Task 2: Add frontend contracts and pure Coaching presentation rules

**Files:**
- Create: `src/lib/coachingPresentation.ts`
- Create: `src/lib/coachingPresentation.test.ts`
- Create: `src/lib/coachingSetup.ts`
- Create: `src/lib/coachingSetup.test.ts`
- Modify: `src/lib/coachingApi.ts`
- Modify: `src/lib/coachingApi.test.ts`

**Interfaces:**
- Consumes: backend setup-config shape and existing `CoachingPlan`, `CoachingCapacityDetail`, `CoachingStudentRow`, `CoachingSessionItem`, and `AcceptanceRequest` types.
- Produces: `fetchCoachingSetupConfig()`, `isCoachingExamGroup()`, `partitionAcceptanceRequests()`, `deriveCoachingMetrics()`, `deriveCoachingStatus()`, `COACHING_SETUP_STEPS`, `readCoachingSetupStep()`, and `buildCoachingPlanPayload()`.

- [ ] **Step 1: Write failing setup-config and exam-source tests**

```typescript
assert.deepEqual(config.exam_groups, ["YKS", "DGS", "KPSS"]);
assert.equal(config.frequency_options[0].packages[3].weeks, 24);
assert.equal(isCoachingExamGroup("YKS"), true);
assert.equal(isCoachingExamGroup("TYT"), false);
assert.deepEqual(
  buildCoachingPlanPayload({ ...draft, examTypes: ["TYT", "YKS", "AYT"] }).target_exam_types,
  ["YKS"]
);
```

- [ ] **Step 2: Run the focused tests and verify missing-export failures**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/lib/coachingApi.test.ts src/lib/coachingPresentation.test.ts src/lib/coachingSetup.test.ts`

Expected: FAIL because the modules and exports do not exist.

- [ ] **Step 3: Add the setup-config API type/client**

```typescript
export interface CoachingSetupConfig {
  exam_groups: string[];
  session_duration_minutes: 30;
  lesson_price_minor: number;
  lesson_price_display: string;
  max_price_ratio_percent: number;
  price_cap_minor: number;
  price_cap_display: string;
  commission_bps: number;
  frequency_options: Array<{
    value: CoachingFrequency;
    label: string;
    packages: Array<{ duration_days: number; weeks: number; total_sessions: number }>;
  }>;
}

export async function fetchCoachingSetupConfig(): Promise<CoachingSetupConfig> {
  const response = await api.get<CoachingSetupConfig>("/coaching/tutor/setup-config/");
  return response.data;
}
```

- [ ] **Step 4: Implement pure partition, metrics, and status functions**

```typescript
export function partitionAcceptanceRequests(requests: AcceptanceRequest[]) {
  return {
    coaching: requests.filter((request) => request.includes_coaching),
    lessonOnly: requests.filter((request) => !request.includes_coaching),
  };
}

export function deriveCoachingMetrics(input: {
  students: CoachingStudentRow[];
  sessions: CoachingSessionItem[];
  requests: AcceptanceRequest[];
}) {
  return {
    activeStudents: input.students.filter((row) => row.service_status === "active").length,
    upcomingSessions: input.sessions.filter((row) => row.status !== "awaiting_report").length,
    pendingRequests: input.requests.filter(
      (row) => row.includes_coaching && row.status === "pending"
    ).length,
    pendingReports: input.sessions.filter((row) => row.status === "awaiting_report").length,
  };
}
```

Implement `deriveCoachingStatus()` with the five independent axes defined above. Its published/platform-paused message must be the approved exact sentence and its next action must never point to a checkout control.

- [ ] **Step 5: Implement the eight-step setup model and strict payload boundary**

```typescript
export const COACHING_SETUP_STEPS = [
  "frequency",
  "price",
  "exams",
  "description",
  "availability",
  "capacity",
  "preview",
  "publish",
] as const;

export function buildCoachingPlanPayload(draft: CoachingPlanDraft): CoachingPlanPayload {
  const targetExamTypes = draft.examTypes.filter(isCoachingExamGroup);
  if (targetExamTypes.length === 0) throw new Error("En az bir sınav seçmelisin.");
  return {
    frequency: draft.frequency,
    price_per_session_minor: draft.priceMinor,
    max_active_students: draft.maxActiveStudents,
    target_exam_types: targetExamTypes,
    description: draft.description.trim(),
  };
}
```

- [ ] **Step 6: Run focused tests and commit**

Run the Step 2 command; expected: all focused tests pass.

```bash
git add src/lib/coachingApi.ts src/lib/coachingApi.test.ts src/lib/coachingPresentation.ts src/lib/coachingPresentation.test.ts src/lib/coachingSetup.ts src/lib/coachingSetup.test.ts
git commit -m "feat: add coaching presentation state model"
```

### Task 3: Build shared Coaching page, empty-state, status, metric, and navigation primitives

**Files:**
- Create: `src/components/coaching/CoachingPageShell.tsx`
- Create: `src/components/coaching/CoachingPageShell.test.tsx`
- Create: `src/components/coaching/CoachingEmptyState.tsx`
- Create: `src/components/coaching/CoachingStatusCard.tsx`
- Create: `src/components/coaching/CoachingSectionNav.tsx`
- Create: `src/components/coaching/CoachingMetricGrid.tsx`
- Create: `src/components/coaching/TutorCoachingDashboard.tsx`
- Create: `src/components/coaching/TutorCoachingDashboard.test.tsx`

**Interfaces:**
- Consumes: pure status/metric results from Task 2 and existing shadcn primitives.
- Produces: shared visual primitives used by every later route task.

- [ ] **Step 1: Write failing semantic component tests**

Assert that `CoachingPageShell` renders a labelled breadcrumb/back link and one `h1`; `TutorCoachingDashboard` renders the exact platform-paused copy separately from draft/readiness; `CoachingSectionNav` exposes grouped link names; and metric errors render no zero.

- [ ] **Step 2: Run tests and verify missing-component failures**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/CoachingPageShell.test.tsx src/components/coaching/TutorCoachingDashboard.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement the page shell and composed empty state**

`CoachingPageShell` props are:

```typescript
type CoachingPageShellProps = {
  title: string;
  description: string;
  parentHref: string;
  parentLabel: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  width?: "narrow" | "default" | "wide";
  children: React.ReactNode;
};
```

Use a `nav aria-label="Sayfa yolu"`, a direct parent link, and a stable `main` region. `CoachingEmptyState` receives a Lucide icon component, title, description, optional context, and at most two actions.

- [ ] **Step 4: Implement dashboard primitives**

Keep `CoachingStatusCard` responsible only for the five status axes, `CoachingMetricGrid` only for four real metrics, and `CoachingSectionNav` only for grouped destinations. `TutorCoachingDashboard` composes them without fetching.

- [ ] **Step 5: Verify focus, text, and reduced-motion classes in tests**

Run the Step 2 command; expected: all tests pass and links are keyboard-focusable.

- [ ] **Step 6: Commit shared UI foundations**

```bash
git add src/components/coaching/CoachingPageShell.tsx src/components/coaching/CoachingPageShell.test.tsx src/components/coaching/CoachingEmptyState.tsx src/components/coaching/CoachingStatusCard.tsx src/components/coaching/CoachingSectionNav.tsx src/components/coaching/CoachingMetricGrid.tsx src/components/coaching/TutorCoachingDashboard.tsx src/components/coaching/TutorCoachingDashboard.test.tsx
git commit -m "feat: add coaching dashboard foundations"
```

### Task 4: Partition lesson-only and Coaching bundle requests without lifecycle duplication

**Files:**
- Create: `src/app/(main)/dashboard/tutor/coaching/requests/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/requests/page.tsx`
- Modify: `src/components/requests/AcceptanceRequestCard.tsx`
- Create: `src/components/requests/AcceptanceRequestCard.test.tsx`
- Modify: `src/lib/coachingPresentation.test.ts`

**Interfaces:**
- Consumes: `fetchAcceptanceRequests()`, `respondToAcceptanceRequest()`, `partitionAcceptanceRequests()`, `AcceptanceRequestCard`.
- Produces: mutually exclusive route lists with the same response mutation.

- [ ] **Step 1: Write failing partition and bundle-card tests**

Use three requests: one Coaching pending request, one Coaching accepted request, and one lesson-only request. Assert Coaching returns two, lesson-only returns one, and no ID occurs in both arrays. Render the Coaching card and assert student name, plan name, `lessons_per_week`, `formatPlanDuration(duration_days)`, total lesson credits, Coaching frequency, Coaching session count, and both monetary totals are present.

- [ ] **Step 2: Verify the tests fail against the unfiltered pages/current card**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/lib/coachingPresentation.test.ts src/components/requests/AcceptanceRequestCard.test.tsx`

Expected: FAIL because the page partition and complete bundle context are missing.

- [ ] **Step 3: Add the Coaching-only request route**

Use the same query key `['tutor-acceptance-requests']`, filter with `partitionAcceptanceRequests(data).coaching`, and call the existing `respondToAcceptanceRequest({ id, decision, note })`. Label the page “Yeni öğrenci talepleri” and explain that acceptance covers the lesson package and Coaching add-on together without taking payment.

- [ ] **Step 4: Filter the general package route to lesson-only**

Replace its source list with `partitionAcceptanceRequests(data).lessonOnly`. Its empty state says there are no lesson-package-only requests; it does not point to Coaching requests or duplicate them.

- [ ] **Step 5: Expand the existing shared request card without changing callbacks**

Continue using one `onRespond(decision, note)` for the entire bundle. Use `formatPlanDuration()` and `coachingFrequencyLabel()`; do not derive a second acceptance state.

- [ ] **Step 6: Run focused tests and commit**

Run the Step 2 command; expected: all tests pass.

```bash
git add 'src/app/(main)/dashboard/tutor/coaching/requests/page.tsx' 'src/app/(main)/dashboard/tutor/requests/page.tsx' src/components/requests/AcceptanceRequestCard.tsx src/components/requests/AcceptanceRequestCard.test.tsx src/lib/coachingPresentation.test.ts
git commit -m "fix: partition coaching bundle requests"
```

### Task 5: Replace the tutor Coaching home route index with the real dashboard

**Files:**
- Modify: `src/app/(main)/dashboard/tutor/coaching/page.tsx`
- Modify: `src/components/coaching/TutorCoachingDashboard.test.tsx`

**Interfaces:**
- Consumes: Task 2 pure derivations, Task 3 dashboard components, `useCoachingFlag()`, and the exact queries in the metric table.
- Produces: the new intent-led Coaching overview.

- [ ] **Step 1: Add failing dashboard state tests**

Test no-onboarding, no-plan, draft, published/open/platform-paused, published/intake-closed, capacity-full, pending-request, and awaiting-report fixtures. The platform-paused fixture must not expose “checkout aç” or another tutor action.

- [ ] **Step 2: Run the dashboard tests and verify failures**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/TutorCoachingDashboard.test.tsx`

Expected: FAIL on missing state/card content.

- [ ] **Step 3: Replace page queries and composition**

Fetch onboarding and plan first. When a plan exists, enable capacity, students, tutor sessions, and acceptance requests. Derive metrics only from successful query data and pass an explicit unavailable state for each failed query. Read `checkoutEnabled` from `useCoachingFlag()`.

- [ ] **Step 4: Implement deterministic next-action priority**

Use this order: onboarding → plan → availability → server-invalid capacity → publish → pending Coaching request → awaiting report → upcoming meeting → first-student waiting state. Global checkout disabled changes informational copy only and never displaces a tutor-fixable readiness action.

- [ ] **Step 5: Run tests and commit**

```bash
git add 'src/app/(main)/dashboard/tutor/coaching/page.tsx' src/components/coaching/TutorCoachingDashboard.test.tsx
git commit -m "feat: redesign tutor coaching overview"
```

### Task 6: Build the URL-addressable guided setup and direct-edit architecture

**Files:**
- Create: `src/components/coaching/CoachingSetupProgress.tsx`
- Create: `src/components/coaching/CoachingSetupProgress.test.tsx`
- Modify: `src/components/coaching/CoachingPlanForm.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/plan/page.tsx`
- Modify: `src/components/coaching/RevenuePreviewCard.tsx`
- Modify: `src/lib/coachingSetup.test.ts`

**Interfaces:**
- Consumes: `COACHING_SETUP_STEPS`, `buildCoachingPlanPayload()`, setup-config response, plan/capacity/availability/revenue queries, existing save/publish mutations.
- Produces: `?step=frequency|price|exams|description|availability|capacity|preview|publish` navigation with progressive first-time and direct-edit modes.

- [ ] **Step 1: Write failing setup order, URL, and form behaviour tests**

Assert the approved order, invalid-query fallback to `frequency`, direct navigation for an existing plan, locked capacity before availability for a first-time plan, only server-provided exam choices, and absence of TYT/AYT/YDT in a submitted payload.

- [ ] **Step 2: Run focused tests and verify failures**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/lib/coachingSetup.test.ts src/components/coaching/CoachingSetupProgress.test.tsx`

Expected: FAIL because the stepper and navigation rules are absent.

- [ ] **Step 3: Implement setup navigation and restrained motion**

Use URL search params as the current-step source. Existing plans unlock all steps. First-time setup unlocks frequency through description locally, saves a draft before availability, unlocks capacity only after server capacity shows at least one slot, then preview and publish. Use `motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-2 duration-200` and no transition under reduced motion.

- [ ] **Step 4: Refactor the form into controlled stage panels**

Frequency options and package meeting counts come from `setupConfig.frequency_options`. Before the first draft save, the price panel uses `lesson_price_display`, `max_price_ratio_percent`, and `price_cap_display` from setup config. The exam panel renders only `setupConfig.exam_groups` after `isCoachingExamGroup()` validation.

When leaving description for availability, call `saveCoachingPlan()` with the chosen fields and `max_active_students` equal to the existing saved value or `1` for a new draft. This value is an internal draft prerequisite only; readiness remains incomplete until the capacity step saves a server-valid tutor choice.

- [ ] **Step 5: Preserve context and make success explicit**

On successful saves, update/invalidate `coaching-plan`, `coaching-capacity`, `coaching-revenue-preview`, and `coaching-plan-preview`, keep the current step, and show `toast.success("Plan kaydedildi.")`. Do not publish automatically.

- [ ] **Step 6: Redesign server-returned revenue preview**

Select the row with `weeks === 4` as the primary one-month summary. Render all other `preview.rows` inside an accessible accordion labelled “Diğer paketlerde kazancını gör”. Use returned `total_sessions`, discount, platform fee, and net display values only.

- [ ] **Step 7: Route known publish errors to the correct stage**

`availability_required` selects `availability` and displays the direct editor CTA; `price_exceeds_cap` selects `price`; capacity errors select `capacity`; unknown errors remain in the publish stage. The checkout flag does not block plan publication and is not part of readiness.

- [ ] **Step 8: Run focused tests and commit**

```bash
git add src/components/coaching/CoachingSetupProgress.tsx src/components/coaching/CoachingSetupProgress.test.tsx src/components/coaching/CoachingPlanForm.tsx 'src/app/(main)/dashboard/tutor/coaching/plan/page.tsx' src/components/coaching/RevenuePreviewCard.tsx src/lib/coachingSetup.test.ts
git commit -m "feat: guide coaching plan setup"
```

### Task 7: Make Coaching availability visual and capacity server-explanatory

**Files:**
- Create: `src/components/coaching/CoachingAvailabilitySection.tsx`
- Create: `src/components/coaching/CoachingAvailabilitySection.test.tsx`
- Modify: `src/components/coaching/CoachingAvailabilityEditor.tsx`
- Modify: `src/components/coaching/CapacityPreviewCard.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/availability/page.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/plan/page.tsx`

**Interfaces:**
- Consumes: existing availability list/create/delete and capacity endpoints.
- Produces: one reusable availability experience embedded in setup step 5 and the dedicated settings route; capacity step 6 reads refreshed server capacity.

- [ ] **Step 1: Write failing separate-availability and capacity tests**

Render zero windows and assert the exact separate-availability explanation plus “Koçluk saatlerini ekle”. Render windows and assert grouped weekday/time rows. Render capacity and assert weekly slots, theoretical capacity, selected capacity, active students, and selected/theoretical progress are present.

- [ ] **Step 2: Run tests and verify current composition fails**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/CoachingAvailabilitySection.test.tsx`

Expected: FAIL because the shared section and visual summary do not exist.

- [ ] **Step 3: Implement one data-aware availability section**

Move React Query list/create/delete/capacity invalidation into `CoachingAvailabilitySection`. Keep `CoachingAvailabilityEditor` presentational. On add/delete success, invalidate availability, capacity, plan, and preview query keys.

- [ ] **Step 4: Redesign the weekly summary and capacity card**

Group windows by weekday; preserve native time inputs and semantic delete buttons. `CapacityPreviewCard` reads only server values and does not compute a higher limit. If a capacity save is rejected, keep the prior saved value and show the server message without terminating or mutating students.

- [ ] **Step 5: Reuse the section in both routes and verify**

The dedicated page uses `CoachingPageShell`; setup embeds the same component. Run the Step 2 command and the relevant coaching setup tests; expected: pass.

- [ ] **Step 6: Commit availability/capacity UX**

```bash
git add src/components/coaching/CoachingAvailabilitySection.tsx src/components/coaching/CoachingAvailabilitySection.test.tsx src/components/coaching/CoachingAvailabilityEditor.tsx src/components/coaching/CapacityPreviewCard.tsx 'src/app/(main)/dashboard/tutor/coaching/availability/page.tsx' 'src/app/(main)/dashboard/tutor/coaching/plan/page.tsx'
git commit -m "feat: clarify coaching availability and capacity"
```

### Task 8: Share the real student-facing Coaching offer presentation

**Files:**
- Create: `src/components/coaching/CoachingOfferCard.tsx`
- Create: `src/components/coaching/CoachingOfferCard.test.tsx`
- Modify: `src/components/coaching/StudentPreviewCard.tsx`
- Modify: `src/components/tutors/TutorCoachingSection.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/preview/page.tsx`

**Interfaces:**
- Consumes: `CoachingPlanPreview` and `TutorCoachingSummary`; parent components retain eligibility and CTA logic.
- Produces: one visual offer card with optional action/footer slots.

- [ ] **Step 1: Write the failing shared-card test**

Render a YKS weekly paid plan and assert “Çalışma koçluğu”, weekly frequency, 30 minutes, YKS, all fixed included services, tutor description, formatted price, and capacity state. Render free and capacity-full variants.

- [ ] **Step 2: Run the test and verify missing-component failure**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/CoachingOfferCard.test.tsx`

Expected: FAIL because `CoachingOfferCard` does not exist.

- [ ] **Step 3: Implement the shared card and adapters**

Keep eligibility fetching and the “Ders paketiyle koçluk al” decision in `TutorCoachingSection`. `StudentPreviewCard` adapts the preview response and adds no tutor-only capacity internals. Both pass their contextual footer/action into `CoachingOfferCard`.

- [ ] **Step 4: Compose the preview page**

Use `CoachingPageShell`, explain that the preview is read-only, and place the shared card in a restrained simulated profile surface using the real tutor name from the preview response. Do not invent photo, rating, university, or availability.

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/coaching/CoachingOfferCard.tsx src/components/coaching/CoachingOfferCard.test.tsx src/components/coaching/StudentPreviewCard.tsx src/components/tutors/TutorCoachingSection.tsx 'src/app/(main)/dashboard/tutor/coaching/preview/page.tsx'
git commit -m "feat: share coaching offer presentation"
```

### Task 9: Reframe onboarding as introduction, quick control, and agreement

**Files:**
- Modify: `src/components/coaching/OnboardingControlQuestions.tsx`
- Create: `src/components/coaching/OnboardingControlQuestions.test.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/onboarding/page.tsx`

**Interfaces:**
- Consumes: unchanged onboarding state and answer endpoints, existing `OnboardingCarousel`.
- Produces: one-at-a-time control presentation with server explanations and honest transition to plan setup.

- [ ] **Step 1: Write failing lightweight-control tests**

Assert only the current unanswered question is prominent, no “puan”, “başarısız”, or “sınav” label is rendered, a wrong server verdict displays its explanation, and a corrected answer advances without a score.

- [ ] **Step 2: Run tests and verify the current all-at-once layout fails**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/OnboardingControlQuestions.test.tsx`

Expected: FAIL on all-at-once rendering/copy.

- [ ] **Step 3: Implement one-question progression without changing grading**

Select the first unanswered/incorrect question from server state. Keep radio inputs and call `onAnswer(questionId, answer)`. Display the server explanation immediately. Show compact completed-question indicators without grades.

- [ ] **Step 4: Correct page copy and completion transition**

Use “Hızlı kontrol” and “Koçluk kapsamını aynı şekilde anladığımızdan emin olmak için birkaç kısa kontrol.” Replace “Onboarding'i tamamla” with “Tanıtım ve sözleşme adımını tamamla”; on success continue to `/dashboard/tutor/coaching/plan?step=frequency`.

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/coaching/OnboardingControlQuestions.tsx src/components/coaching/OnboardingControlQuestions.test.tsx 'src/app/(main)/dashboard/tutor/coaching/onboarding/page.tsx'
git commit -m "feat: soften coaching onboarding controls"
```

### Task 10: Make Coaching earnings readable and financially honest

**Files:**
- Create: `src/components/coaching/CoachingEarningsSummary.tsx`
- Create: `src/components/coaching/CoachingEarningsSummary.test.tsx`
- Modify: `src/app/(main)/dashboard/tutor/coaching/earnings/page.tsx`
- Modify: `src/lib/coachingApi.ts`
- Modify: `src/lib/coachingFaz8.test.ts`
- Modify: `src/lib/money.test.ts`

**Interfaces:**
- Consumes: `CoachingTutorEarningSummary`, `formatTryMinor()`.
- Produces: plain-Turkish summary and monthly accounting records with no internal payout jargon or bank-settlement inference.

- [ ] **Step 1: Write failing money and copy tests**

Render values `12345`, `0`, `94`, and a monthly `ready` record. Assert `123,45`, `0,00`, and `0,94` are present; `kuruş`, `hakediş`, `payout`, `bankaya yatırıldı`, and `ödeme tamamlandı` are absent. Assert `paid_at` is not rendered.

- [ ] **Step 2: Run tests and verify current raw-kuruş output fails**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/CoachingEarningsSummary.test.tsx src/lib/coachingFaz8.test.ts src/lib/money.test.ts`

Expected: FAIL because the current page renders minor integers plus “kuruş” and unsafe jargon.

- [ ] **Step 3: Replace earning status copy with the approved map**

Update `coachingEarningStatusCopy()` to the exact table in this plan. Do not change refund-state copy in this task because it belongs to the existing dispute/refund lifecycle.

- [ ] **Step 4: Implement and mount the earnings summary**

Use one summary card per amount state and labelled stacked rows at small widths. Label monthly data “Aylık kazanç kayıtları”. Render month, safe status, and formatted total only; keep `paid_at` in the API type but omit it from the tutor UI.

- [ ] **Step 5: Run tests and commit**

```bash
git add src/components/coaching/CoachingEarningsSummary.tsx src/components/coaching/CoachingEarningsSummary.test.tsx 'src/app/(main)/dashboard/tutor/coaching/earnings/page.tsx' src/lib/coachingApi.ts src/lib/coachingFaz8.test.ts src/lib/money.test.ts
git commit -m "fix: present coaching earnings honestly"
```

### Task 11: Roll out page shell, contextual navigation, and composed empty states to tutor subroutes

**Files:**
- Create: `src/components/coaching/TutorCoachingRouteShells.test.tsx`
- Modify every tutor route listed in the File and Responsibility Map under `/dashboard/tutor/coaching/`, excluding the already-covered home, plan, availability, preview, onboarding, earnings, and requests routes.

**Interfaces:**
- Consumes: `CoachingPageShell`, `CoachingEmptyState`, existing list/editor/report/program/session components and queries.
- Produces: consistent location awareness without changing active-record actions.

- [ ] **Step 1: Add the route-shell regression test matrix in `TutorCoachingRouteShells.test.tsx`**

Use Node module mocks for each route's query dependency, render the real route component, and assert each route has a contextual parent link, one title, explanation, and a non-blank empty state when its data list is empty. Do not source-scan implementation text. The exact tutor routes are students, upcoming, reports, complaints list/detail, time requests, meeting changes, service-period program, session prepare, and session report.

- [ ] **Step 2: Verify at least the current upcoming and reports pages fail**

Run the new focused test file; expected: FAIL because those pages lack parent navigation and composed explanation.

- [ ] **Step 3: Apply the shell without rewriting domain components**

Use parent `/dashboard/tutor/coaching` for top-level pages. Nested complaint/session/program pages use a two-level breadcrumb but retain the direct Coaching-home return link. Keep existing queries, mutations, permissions, and record actions unchanged.

- [ ] **Step 4: Apply approved terminology and empty-state copy**

- Students: explain active Coaching students and recurring times.
- Upcoming: “Henüz planlanmış bir görüşmen yok” and explain 30-minute meetings.
- Reports: explain progress/work/next-step reporting and distinguish awaiting from published records using existing session/report data.
- Complaints: keep dispute meaning; do not rename them to new student requests.
- Time requests: label “Saat seçimi talepleri”.
- Reschedule requests: label “Görüşme değişiklikleri”.
- Nested pages: provide a meaningful return destination and preserve current actions.

- [ ] **Step 5: Run route-shell tests and commit**

Run:

```bash
node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/TutorCoachingRouteShells.test.tsx
```

Expected: all route cases pass. Then stage only the exact tutor route files and the test:

```bash
git add src/components/coaching/TutorCoachingRouteShells.test.tsx \
  'src/app/(main)/dashboard/tutor/coaching/upcoming/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/students/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/reports/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/complaints/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/complaints/[disputeId]/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/time-requests/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/reschedule-requests/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/service-periods/[servicePeriodId]/program/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/sessions/[id]/prepare/page.tsx' \
  'src/app/(main)/dashboard/tutor/coaching/sessions/[id]/report/page.tsx'
git commit -m "feat: unify tutor coaching subpages"
```

### Task 12: Correct student Coaching entry copy and roll out the shared shell to student subroutes

**Files:**
- Create: `src/components/coaching/StudentCoachingRouteShells.test.tsx`
- Modify every student Coaching route listed in the File and Responsibility Map.

**Interfaces:**
- Consumes: `CoachingPageShell`, `CoachingEmptyState`, existing student scheduling/program/report/dispute components.
- Produces: accurate add-on copy and consistent student location awareness.

- [ ] **Step 1: Write failing student empty-state and route-shell tests in `StudentCoachingRouteShells.test.tsx`**

Use Node module mocks for route queries and render the real route components. Assert the overview says “Henüz aktif bir koçluğun yok.” and “Ders paketi satın alırken uygun bir hocanın çalışma koçluğu hizmetini de ekleyebilirsin.” Assert it does not contain “koçluk teklifini kabul ettiğinde”. Add the same contextual parent-link checks for upcoming, program, reports list/detail, schedule, and complaints list/detail.

- [ ] **Step 2: Run tests and verify current copy/navigation failures**

Expected: the overview fails on standalone-like copy and subroutes fail on missing context.

- [ ] **Step 3: Apply student shells and composed empty states**

Use `/dashboard/student/coaching` as the parent. Preserve all scheduling, report download, program task, and dispute actions. Do not add a purchase CTA from the empty dashboard because Coaching has no standalone marketplace; the explanatory copy may link to `/tutors` only as ordinary tutor discovery.

- [ ] **Step 4: Run tests and commit**

```bash
node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/coaching/StudentCoachingRouteShells.test.tsx
git add src/components/coaching/StudentCoachingRouteShells.test.tsx \
  'src/app/(main)/dashboard/student/coaching/page.tsx' \
  'src/app/(main)/dashboard/student/coaching/upcoming/page.tsx' \
  'src/app/(main)/dashboard/student/coaching/program/page.tsx' \
  'src/app/(main)/dashboard/student/coaching/reports/page.tsx' \
  'src/app/(main)/dashboard/student/coaching/reports/[reportId]/page.tsx' \
  'src/app/(main)/dashboard/student/coaching/schedule/page.tsx' \
  'src/app/(main)/dashboard/student/coaching/complaints/page.tsx' \
  'src/app/(main)/dashboard/student/coaching/complaints/[disputeId]/page.tsx'
git commit -m "feat: clarify student coaching pages"
```

### Task 13: Reproduce the tutor-dashboard hover/image defect before any fix

**Files:**
- Create: `docs/qa/coaching-hover-image-reproduction.md`
- Candidate-only until proven: `src/app/(main)/dashboard/tutor/page.tsx`
- Candidate-only until proven: `src/components/ui/avatar.tsx`
- Candidate-only until proven: the exact affected card/avatar component identified by browser hit testing.

**Reproduction status at planning time:** Not reproduced. No authenticated browser reproduction has been run in the isolated worktree. Static inspection shows `StudentRosterCard` already has click and keyboard handlers and no obvious `pointer-events` override; the dashboard header avatar is display-only. This is insufficient evidence for a fix.

**Interfaces:**
- Consumes: local/test tutor account and browser devtools/Playwright hit testing.
- Produces: a recorded repro or a recorded non-repro; production code changes only after a proven failing interaction.

- [ ] **Step 1: Record the exact browser matrix and target elements**

Run desktop pointer at 1440×900, tablet at 768×1024, and mobile/touch emulation at 375×812. Check header profile image, student roster cards/avatars, booking cards containing participant images, and any reported result card. Record image response status, natural size, bounding box, topmost `document.elementFromPoint()`, computed `pointer-events`, z-index, click/keyboard event, and console hydration errors.

- [ ] **Step 2: Write the reproduction evidence before editing code**

Fill `docs/qa/coaching-hover-image-reproduction.md` with route, account class, viewport, target selector, expected interaction, actual interaction, console/network evidence, and screenshot paths. Do not include credentials.

- [ ] **Step 3: If reproduced, write one failing component interaction test**

The test must exercise the real affected component and fail on the observed symptom, such as an overlay intercepting the card click or an image wrapper collapsing to zero size. Do not mock the affected card.

- [ ] **Step 4: Make the smallest root-cause fix or record non-reproduction**

If reproduced, modify only the proven component and run the failing test to green. If not reproduced across the matrix, make no dashboard code change and commit only the evidence document stating that no safe fix was justified.

- [ ] **Step 5: Commit the evidence and any proven surgical fix**

```bash
git commit -m "test: document tutor dashboard image interaction"
```

### Task 14: Add focused scripts, run the complete verification matrix, and stop

**Files:**
- Create: `scripts/coaching-qa.ts`
- Modify: `package.json`
- Modify: focused test script entries only.

**Interfaces:**
- Consumes: local/test environment credentials supplied through existing secure environment configuration; never logs credentials.
- Produces: screenshots and a pass/fail report for required Coaching states and viewports.

- [ ] **Step 1: Add focused package scripts**

Add `test:coaching` containing every new/modified Coaching, request-card, money, and route-shell test. Add `coaching:qa` invoking `tsx scripts/coaching-qa.ts`.

- [ ] **Step 2: Implement browser QA safety checks**

Read `COACHING_QA_BASE_URL`, `COACHING_QA_TUTOR_EMAIL`, `COACHING_QA_TUTOR_PASSWORD`, `COACHING_QA_STUDENT_EMAIL`, and `COACHING_QA_STUDENT_PASSWORD` from the local shell environment. Fail closed when any value is missing. Reject hosts ending in `hocamozelders.com`, `vercel.app`, or any host not explicitly allowed by the script's local/test-host predicate. Log in through the normal local/test login form, never print credentials, record console errors, check `scrollWidth <= clientWidth`, verify the primary CTA is visible, and store screenshots for 375×812, 768×1024, and 1440×900. Perform no paid-purchase, settlement, refund, admin, or checkout-enable mutation.

- [ ] **Step 3: Run focused frontend tests**

Run: `npm run test:coaching`

Expected: all focused tests pass with zero failures.

- [ ] **Step 4: Run the complete frontend suite**

Run: `npm run test:unit`

Expected: all tests pass with zero failures.

- [ ] **Step 5: Run static and production-build checks**

Run, separately:

```bash
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 6: Run backend verification because Task 1 changes a read endpoint**

Run, separately from the backend worktree:

```bash
../Hocam_backend/.venv/bin/python manage.py test apps.coaching.tests_api apps.coaching.tests_pricing apps.coaching.tests_capacity
../Hocam_backend/.venv/bin/python manage.py check
../Hocam_backend/.venv/bin/python manage.py makemigrations --check --dry-run
git diff --check
```

Expected: tests pass, system check has no issues, and no migrations are generated.

- [ ] **Step 7: Execute the responsive/browser QA matrix**

| Surface/state | 375 px | 768 px | Desktop |
|---|---:|---:|---:|
| Tutor initial Coaching empty state | ✓ | ✓ | ✓ |
| Introduction / quick controls / contract | ✓ | ✓ | ✓ |
| Frequency, price, exams, description | ✓ | ✓ | ✓ |
| Empty and populated Coaching availability | ✓ | ✓ | ✓ |
| Capacity explanation | ✓ | ✓ | ✓ |
| Missing-availability publish redirect | ✓ | ✓ | ✓ |
| Draft status | ✓ | ✓ | ✓ |
| Published + checkout platform-paused status | ✓ | ✓ | ✓ |
| Student preview | ✓ | ✓ | ✓ |
| Students/upcoming/reports empty states | ✓ | ✓ | ✓ |
| Coaching-only requests and lesson-only requests | ✓ | ✓ | ✓ |
| Time selection and meeting-change requests | ✓ | ✓ | ✓ |
| Coaching earnings | ✓ | ✓ | ✓ |
| Student Coaching empty state and subpages | ✓ | ✓ | ✓ |
| Tutor dashboard image/hover targets | touch | pointer | pointer |

For every cell verify no horizontal overflow, no clipped action, visible focus, readable text, correct back navigation, no console error, and no raw minor units.

- [ ] **Step 8: Verify policy-sensitive flows explicitly**

- Plan publication still works independently from checkout availability.
- Published + intake-open + capacity-available + checkout-disabled shows platform-paused information, not sale-ready copy.
- Checkout stays blocked when `checkout_enabled=false`.
- No request appears in both request screens.
- Accept/reject still calls the existing bundle response endpoint once.
- YKS/DGS/KPSS are the only Coaching payload values.
- Revenue rows exactly match backend response values.
- Earnings never claim external payout settlement.

- [ ] **Step 9: Review diffs, commit final QA script/tests, and stop**

Stage exact files only, commit, verify both worktrees are clean, and do not push:

```bash
git status --short --branch
git log --oneline --decorate -12
```

## Backend Change Decision

**One minimal backend change is required:** the read-only tutor setup-config endpoint in Task 1.

Justification:

- Before a plan exists, `GET /api/coaching/plan/` intentionally returns 404.
- The existing revenue-preview endpoint also requires a saved plan.
- The approved first-time price step must show the actual tutor lesson price, runtime cap percentage, and exact cap before creating the plan.
- Frequency cards and package context must use the canonical backend 2/4/12/24-week model and `session_count()` rather than a duplicated frontend matrix.
- Canonical exam choices should come from `CANONICAL_EXAM_GROUPS`, eliminating the source of the TYT/AYT/YDT regression.

The endpoint performs no writes and changes no acceptance, checkout, publication, capacity, payment, refund, earning, dispute, or settlement semantics. No migration is required. If product owners reject this endpoint, the safe fallback is to omit pre-save cap percentages and package meeting counts until the first draft is saved; hardcoding them in the frontend is not an acceptable fallback.

## Implementation Review Gate

Do not start Task 1 until this plan is approved. After approval, execute tasks in order, preserve red/green evidence for each behaviour, and stop after local commits and the final report. Do not push, merge, open a pull request, or modify production.

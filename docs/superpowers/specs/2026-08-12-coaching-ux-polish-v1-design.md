# Coaching UX Polish V1 — Design Specification

**Date:** 2026-08-12  
**Status:** Approved for implementation planning  
**Frontend base:** `c07718e6675d3421da47a2179623ffc8e5860bc7`  
**Backend base:** `63e09c549ba1f101f2e0e1682ebc76a7565e42c9`

## 1. Objective

Make the tutor-facing Çalışma Koçluğu experience feel like a finished Hocam
consumer product rather than an internal route index, while preserving the
existing Master Spec, API contracts, financial truth, feature flags, and
bundle acceptance lifecycle.

The redesign uses an intent-led hybrid model:

- first-time setup is guided and progressive;
- an existing plan remains directly editable by section;
- the Coaching home explains state, readiness, next actions, and real activity;
- operational pages share location-aware navigation and composed empty states;
- student-facing and tutor-preview offer cards share one presentation model.

## 2. Locked constraints

The implementation must not change the following:

- Coaching is an add-on to a paid lesson package; there is no standalone sale.
- Supported Coaching exam groups are exactly `YKS`, `DGS`, and `KPSS`.
- A tutor publishes one Coaching plan.
- Frequencies remain biweekly, weekly, and twice weekly.
- Every Coaching meeting is fixed at 30 minutes.
- Coaching may be free; a paid meeting may not exceed 75% of the tutor's
  40-minute lesson price.
- The platform commission remains 15%.
- Coaching availability remains separate from ordinary lesson availability.
- Control-question semantics remain mandatory, but the UI must not frame them
  as an exam or expose a score.
- No payout, settlement, refund, or paid state may be inferred or invented.
- Existing bundle acceptance semantics remain the only acceptance lifecycle.
- Checkout remains disabled while runtime `is_checkout_enabled=false`.
- Plan publication, tutor intake, tutor capacity, and platform-level checkout
  availability are separate states. A published and open plan does not imply
  that a new sale can currently be completed.
- Production flags, Railway, Vercel, Django admin, and production data are out
  of scope.

## 3. Information architecture

The Coaching area is organised around tutor intent rather than backend model
names.

### Overview

- Plan status and intake state
- Next grounded action
- Active Coaching students
- Upcoming sessions
- New Coaching bundle requests
- Reports requiring tutor attention

### Run my Coaching

- Students
- Meetings
- Reports

### Set up my Coaching

- Plan and price
- Coaching availability and capacity
- Student preview

### Handle requests

- New student requests
- Time selection requests
- Meeting changes

### Understand my money

- Coaching earnings

Disputes remain disputes and must not be relabelled as new student requests.
They may remain accessible from their appropriate operational context without
occupying the same primary hierarchy as bundle acceptance.

## 4. Coaching request partition

The existing payments-owned acceptance endpoint and mutation remain unchanged.
The frontend partitions the returned bundle requests:

- Coaching / New student requests shows only `includes_coaching=true`.
- General Package Requests shows only `includes_coaching=false`.
- A request is never duplicated across the two screens.

A Coaching request card retains the full bundle context:

- student identity;
- lesson package name and lesson frequency;
- package duration and total credits;
- Coaching frequency, number of Coaching sessions, and add-on amount;
- honest pending/accepted/rejected lifecycle copy;
- the existing accept/reject actions and mutation.

No Coaching-specific acceptance endpoint, state, or decision path is created.

## 5. Visual language

The design borrows the current Hocam checkout's information grammar, not its
literal colour skin:

- strong section labels;
- large, understandable choice surfaces;
- clearly selected states;
- contextual detail revealed next to its triggering choice;
- prominent primary values with quieter supporting arithmetic;
- one dominant action per decision area.

The implementation uses existing Hocam tokens:

- `background` / white for the page canvas;
- `card` for primary content surfaces;
- `muted` for supporting context;
- `border` for restrained grouping;
- `primary` for actions, focus, and selected states;
- `brand-50` through `brand-200` only for light brand-identity accents;
- `brand-500` only where a small brand signal is useful.

No global token redefinition is planned. Success, warning, error, draft, and
published states must use text and iconography in addition to colour.

The signature element is a service-readiness rail: status, requirements, and
the next useful action form one continuous explanation instead of separate
badges and errors.

## 6. Shared component boundaries

### `CoachingPageShell`

Provides breadcrumbs, a contextual back link, page title, explanation,
consistent width, and optional header actions. It is used by all modified
tutor Coaching pages.

### `CoachingEmptyState`

Accepts a meaningful icon, title, explanation, optional “what happens here”
copy, and at most one useful primary action plus one contextual link.

### `CoachingStatusCard`

Presents draft/published meaning, frequency, 30-minute duration, price,
canonical exam groups, active/theoretical capacity, and intake state.
Platform-level checkout availability is presented separately and never as a
tutor readiness requirement.

### `CoachingSectionNav`

Presents grouped destination rows for service, settings, requests, and money.
It replaces the current wall of equally weighted pill buttons.

### `CoachingSetupProgress`

Shows the eight setup stages and supports two modes:

- guided first-time mode, where completion advances naturally;
- direct-edit mode, where a tutor with a saved plan can jump to a section.

### `CoachingMoney`

Formats backend minor units as Turkish Lira using the existing money helper.
It never displays raw kuruş to tutors and never converts eligibility into a
settlement claim.

### `CoachingOfferCard`

Provides one shared presentation for the tutor preview and the actual
student-facing tutor profile offer. Tutor-only details are never accepted by
this component.

## 7. Coaching home

Desktop composition:

```text
Koçluk
Hizmetini kur, öğrencilerini yönet ve görüşmelerini takip et.

┌ Plan status and service summary ─┬ Grounded next action ───────┐
│ Draft / Published                │ Add Coaching availability    │
│ Weekly · 30 min · 300.00 TRY     │ explanation + direct CTA     │
│ YKS · active/theoretical capacity│                              │
└──────────────────────────────────┴──────────────────────────────┘

Active students | Upcoming | New requests | Reports requiring action

Run my Coaching             Set up my Coaching
Students                    Plan and price
Meetings                    Coaching availability
Reports                     Student preview

Handle requests             Understand my money
New student requests        Coaching earnings
Time selection requests
Meeting changes
```

Metrics are derived only from existing APIs. A missing endpoint is not filled
with a fabricated count. The next action follows a deterministic priority
based on known state, for example: incomplete onboarding, no plan, no Coaching
availability, capacity mismatch, unpublished plan, pending Coaching request,
report requiring action, or no current activity.

Draft copy states that students cannot see the offer. Published copy states
that eligible students can see it on the tutor profile. Intake-closed,
capacity-full, and platform-level checkout-disabled are distinct states. When
the global checkout flag is disabled, the published summary says:

> Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı.

This is informational. It is not a readiness failure and does not offer a
tutor action that claims to enable checkout.

## 7.1 Coaching status model

The UI treats these axes independently:

1. **Plan publication:** no plan, draft, or published.
2. **Tutor intake:** accepting or not accepting new Coaching students.
3. **Capacity:** no availability, capacity available, or capacity full/server
   constrained.
4. **Platform checkout:** enabled or disabled by runtime Coaching config.
5. **Tutor readiness:** onboarding, plan, availability, capacity, preview, and
   publication requirements backed by real state.

Only tutor-readiness items may generate a “complete this” action. A disabled
platform checkout flag is controlled by Hocam and remains read-only context.

## 8. Guided setup and direct editing

The approved first-time order is:

1. Meeting rhythm
2. Coaching price
3. Exams coached
4. Short description
5. Coaching availability
6. Capacity
7. Student preview
8. Publish

Availability precedes capacity so the capacity explanation is based on real
`weekly_slot_count` and `theoretical_capacity` values.

Each stage contains one conceptual decision. Selection cards replace tiny
pills for frequency. A selected frequency reveals its 30-minute cadence and
package meeting counts derived from canonical domain/API truth in the same
context; illustrative values are never hardcoded as product logic.

The setup form preserves unsaved state while moving between stages. Saving:

- does not automatically publish;
- preserves page context;
- updates React Query caches immediately from the mutation result;
- shows “Plan kaydedildi.”;
- offers the next real readiness action.

For a saved plan, the tutor may jump directly to price, meeting rhythm, exams,
description, Coaching availability, capacity, or preview.

## 9. Price and revenue preview

The price stage shows:

- the tutor's real 40-minute lesson price from the existing tutor profile API;
- the backend-calculated Coaching price cap;
- the locked 75% rule;
- the current per-meeting Coaching price;
- the explicit `0 TRY` free option.

Server validation remains authoritative. Frontend validation prevents an
obvious over-cap submission but does not replace backend checks.

The primary revenue summary uses the one-month package as the default context.
Other durations are available in an expandable region. Each duration shows:

- Coaching meeting count;
- gross Coaching amount;
- package discount;
- platform commission;
- estimated net Coaching earning.

The estimate disclaimer remains visible and says that live collection and
external payout settlement are not active.

Package durations and meeting counts use the canonical 2, 4, 12, and 24-week
product model already represented by the backend revenue-preview contract.
Frequency, Coaching meeting count, effective package discount, 15% commission,
and estimated net values are consumed from current domain/API truth. The
frontend does not recreate discount tables or embed sample calculations.

## 10. Availability and capacity

The page explicitly states:

> Koçluk görüşme saatlerin normal ders müsaitliğinden ayrıdır. Buradaki
> saatler yalnızca koçluk görüşmeleri için kullanılır.

Existing windows are grouped into a visual weekly summary. The editor remains
keyboard accessible and uses the existing create/delete endpoints.

An empty state leads with explanation and “Koçluk saatlerini ekle”. Publishing
without availability does not expose a raw backend dead end; it shows the
same explanation and a direct link to this editor.

Capacity is explained only after availability exists. It presents:

- weekly Coaching slot count;
- theoretical capacity for the selected frequency;
- tutor-selected maximum;
- active Coaching students;
- selected/theoretical progress.

The UI never permits or implies a capacity above server truth. Existing
backend capacity-downshift semantics are preserved. This UX task does not
introduce automatic student termination or any new lifecycle behaviour. If
the backend rejects a lower capacity because of current active load, the UI
surfaces that server validation clearly and keeps the saved capacity intact.

## 11. Onboarding

The semantic sequence remains introduction, scope education, control
questions, contract acceptance, and transition into plan setup.

Tutor-facing language changes:

- “Kontrol soruları” is presented as “Hızlı kontrol”.
- Supporting copy explains that the goal is shared understanding.
- Questions may appear one at a time with immediate explanatory feedback.
- There is no grade, score, pass/fail celebration, or intimidating error tone.
- Existing backend question identifiers and accepted answers remain intact.
- “Onboarding'i tamamla” is replaced with wording that accurately completes
  the introduction and agreement stage before plan creation.

## 12. Student preview and student empty state

The preview sits inside a realistic tutor-profile context and explains that it
is read-only. The shared offer card includes frequency, fixed duration,
canonical exam groups, included services, tutor description, price, and real
student-facing intake/capacity state.

The student's empty Coaching dashboard says that Coaching is an add-on chosen
while buying an eligible tutor's lesson package. It never suggests a
standalone purchase.

## 13. Operational pages and empty states

Students, upcoming meetings, reports, new student requests, time selection
requests, meeting changes, and Coaching earnings use the shared page shell.

Each page answers:

- where the tutor is;
- how to return to the Coaching home;
- what belongs on the page;
- why it may currently be empty;
- what useful action, if any, is available.

Reports specifically explain that tutors document progress, completed work,
and next steps after Coaching meetings. Empty state copy distinguishes a lack
of report work from a loading or API error.

## 14. Coaching earnings

Tutor copy uses “Koçluk kazançları”, not “Hakedişler”. All minor-unit values
are rendered as Turkish Lira. Raw values such as “12345 kuruş” are forbidden.

Status copy distinguishes:

- earning-eligible but unfunded;
- pending processing;
- on hold or disputed;
- reversed accounting state;
- internal monthly accounting records, when the API returns them.

Tutor-facing copy maps these records to plain Turkish and does not expose
terms such as “local payout batch”. `earning_eligible_at` is not a payment
date. `paid_at`, if returned, is not labelled “bankaya yatırıldı”, “ödeme
tamamlandı”, or otherwise presented as guaranteed external settlement unless
the backend contract explicitly proves that state. External payout settlement
is not production-ready, so every summary remains accounting context rather
than a bank-transfer claim.

## 15. Exam-group correction

The frontend owns one canonical Coaching exam option list containing exactly:

- `YKS`
- `DGS`
- `KPSS`

Form state, payload creation, badges, preview, and tests consume this list.
`TYT`, `AYT`, and `YDT` remain valid subject-level concepts elsewhere in
Hocam but can never be serialized in a Coaching plan payload.

The field is labelled “Koçluk verdiğin sınavlar” and explains that it controls
which eligible lesson-package students can see the add-on.

## 16. Tutor dashboard image/hover defect

No speculative fix is included. Browser QA must reproduce the reported issue
on the tutor dashboard and record:

- exact element and interaction;
- viewport and input type;
- image request result;
- pointer-events and overlay hit testing;
- z-index and responsive state;
- click/keyboard handler behaviour;
- hydration console errors.

Only the proven affected component and root cause are changed. Unrelated tutor
dashboard presentation remains out of scope.

## 17. Motion and accessibility

Stage transitions and contextual expansion use a restrained 180–280 ms
opacity/translation transition. Existing motion tooling may be used; no new
dependency is needed. `prefers-reduced-motion` removes nonessential motion.

All controls remain semantic buttons, links, labels, fieldsets, and headings.
Focus is visible. Status is never communicated by colour alone. Empty states
and cards preserve logical keyboard order.

## 18. Responsive behaviour

- At 375 px, dashboard regions and metrics stack into one column; section
  navigation becomes full-width rows; no table requires horizontal scrolling.
- At 768 px, summary areas and grouped destinations may use two columns.
- On desktop, the status/next-action composition is asymmetric but balanced,
  with a purposeful maximum width.
- Revenue details become stacked labelled rows on small screens.
- No sticky action may cover content or the mobile navigation.

## 19. Error handling and cache flow

- API errors retain backend truth but are translated into actionable context
  when a known Coaching error code exists.
- `availability_required` shows a direct Coaching availability CTA.
- `price_exceeds_cap` returns the tutor to the price stage.
- capacity violations return the tutor to the capacity stage with server
  values intact.
- runtime Coaching config supplies platform-level checkout state; the UI does
  not infer it from plan publication, intake, or capacity and cannot mutate it.
- Successful mutations invalidate or update only relevant Coaching and
  acceptance query keys.
- Existing checkout gating and feature flags are not bypassed.

## 20. Test strategy

Implementation follows test-first red/green/refactor cycles. Focused tests
cover at minimum:

1. Coaching exposes only YKS, DGS, and KPSS.
2. TYT, AYT, and YDT cannot reach a Coaching plan payload.
3. Draft and published states explain visibility correctly.
4. Missing Coaching availability offers a direct editor CTA.
5. Coaching pages include contextual return navigation.
6. Student empty state describes the lesson-package add-on model.
7. Earnings format minor units as TRY and never render “kuruş”.
8. Tutor-facing navigation uses the approved terminology.
9. Existing publish/unpublish and intake semantics remain compatible.
10. General package requests exclude Coaching bundles.
11. Coaching new student requests include only Coaching bundles and preserve
    the full bundle presentation and existing response mutation.
12. Checkout remains blocked when runtime checkout is disabled.
13. Modified layouts remain usable at 375 px, 768 px, and desktop.

Final verification includes the complete frontend unit suite, TypeScript,
lint, production build, `git diff --check`, and browser QA. Backend tests and
checks are required only if a minimal, justified backend change becomes
necessary.

## 21. Out of scope

- Production configuration or data changes
- Railway, Vercel, or Django admin changes
- Checkout enablement
- New acceptance or payment lifecycles
- Standalone Coaching purchase
- Financial settlement integration
- Master Spec policy changes
- Unrelated tutor-dashboard redesign
- Push, merge, or pull-request creation

# Coaching Visual Polish V2 — Design Specification

**Date:** 2026-08-12  
**Status:** Approved for implementation planning  
**Frontend base:** `f3571074ee56e6d199d02900e236b9937c4b18d0`  
**Scope:** Frontend-only second visual and interaction pass

## 1. Objective

Move Hocam's Coaching area from a clean but neutral collection of forms and
cards to a warm, layered, recognisable consumer product. The approved direction
is **Coaching Studio**: a Hocam-native interpretation of the reference set's
surface hierarchy, dashboard rhythm, onboarding clarity, and confident selected
states.

The work must improve composition and presentation without changing product
rules, backend contracts, lifecycle semantics, or production state. It must not
copy another product's layout, identity, mascot, illustrations, or copy.

## 2. Locked product and technical constraints

- Coaching remains an add-on to a paid lesson package; no standalone Coaching
  purchase is introduced.
- The canonical Coaching exam groups remain exactly `YKS`, `DGS`, and `KPSS`.
- The approved eight setup stages and their order remain unchanged.
- Coaching availability remains separate from lesson availability.
- Every Coaching meeting remains 30 minutes.
- Price-cap, commission, package-duration, discount, meeting-count, and revenue
  preview values continue to come from current API/domain truth.
- Existing request acceptance remains one lesson-package plus Coaching decision.
- No payout, settlement, collection, or refund truth is inferred.
- Publication, tutor intake, capacity, tutor readiness, and platform checkout
  are presented as independent state axes.
- A globally disabled Coaching checkout remains informational and read-only.
- No backend work, migrations, feature-flag changes, production mutations, or
  new chart dependency are planned.
- The implementation stays inside the isolated frontend worktree. No push,
  merge, pull request, or production operation is allowed.

## 3. Reference interpretation

The references contribute design principles rather than components:

- **Tahta App:** soft tinted canvas, white module islands, large focal panels,
  visible progress, confident active states, and dashboard completeness even
  when data is sparse.
- **Hocam checkout:** clear decision hierarchy, contextual detail beside a
  selected option, restrained outlines, and understandable package arithmetic.
- **Preply and related references:** editorial scale, commercial composition,
  visible step progression, and richer profile/offer hierarchy.

Hocam keeps its own typography, navigation, icon family, primary action colour,
copy voice, and component foundations. Purple gradients, mascots, foreign logos,
and exact reference layouts are not reused.

## 4. Visual system

### 4.1 Surface hierarchy

Coaching pages use four explicit layers:

1. A warm near-white page canvas.
2. Large white or lightly tinted section islands.
3. Smaller neutral inner cards for supporting values.
4. Accent-tinted focused surfaces for the current decision or next action.

These layers use existing semantic tokens and scoped Coaching presentation
classes. Global colour tokens and non-Coaching pages are not changed.

### 4.2 Accent discipline

Hocam's primary colour is reserved for:

- the dominant page action;
- current setup stage;
- selected choice;
- small brand-identifying details;
- focus and keyboard states.

It is not applied to every card, badge, or icon. Operational state continues to
use semantic icon and text combinations, never colour alone.

### 4.3 Shape, spacing, and type

- Section islands use a more generous radius than inner controls.
- Desktop sections use deliberate asymmetry instead of equal card grids.
- Headings become more editorial, while body copy stays compact and practical.
- Small status pills are used only for short categorical labels; full state
  explanations live in panels or rows.
- Decorative shadows stay soft and low contrast.

### 4.4 Signature element

The signature element is the **weekly Coaching rhythm**: a horizontal operational
track that connects active students, upcoming sessions, reports requiring
attention, and pending Coaching requests. It uses only successfully loaded real
counts. It is a presentational distribution, not a historical trend chart.

If all counts are zero, it becomes a purposeful start-state with the next useful
action. If a query fails, the affected value says it is unavailable and is not
silently converted to zero.

## 5. Shared page composition

`CoachingPageShell` gains a scoped Coaching canvas and supports:

- breadcrumb/back navigation;
- editorial title and concise context;
- optional header action;
- a primary content island;
- consistent desktop, tablet, and mobile gutters.

Operational routes keep the current route and lifecycle structure. They share a
compact, location-aware Coaching subnavigation so the user knows both that they
are inside Coaching and which operational area is active. Mobile navigation may
collapse, but the current destination remains visible.

## 6. Coaching home

### 6.1 Desktop composition

The first viewport contains:

1. An asymmetric service hero combining plan publication, tutor intake,
   capacity, and the one deterministic next action.
2. A separate platform-checkout information strip when checkout is disabled.
3. The weekly Coaching rhythm using the four real operational metrics.
4. A compact next-work area prioritising requests, reports, or setup work.

The remaining destinations are grouped by intent in varied-width modules rather
than three equal route cards. “Run Coaching” is visually primary; configuration
and records are quieter supporting areas.

### 6.2 State truth

The hero must not collapse independent axes into a single green/red readiness
badge. In particular, a published plan with globally disabled checkout states:

> Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı.

This message has no tutor-controlled repair action.

### 6.3 Data visualisation

The home does not invent dates, history, percentages, trends, targets, or
benchmarks. The visual track is derived from current counts only. A CSS/SVG
presentation may be used without adding a chart library.

## 7. Eight-stage setup

### 7.1 Progress architecture

Desktop uses a connected eight-stage rail with:

- visible completed, current, available, and locked states;
- concise step labels;
- a clear relationship between stages rather than eight detached tiles.

Mobile replaces horizontal overflow with a compact progress header containing:

- `Adım n / 8`;
- current-stage title;
- next-stage context;
- a proportional progress bar;
- an accessible expandable stage list for already available stages.

No partial card is intentionally clipped at the viewport edge.

### 7.2 Choice cards

Selected choices use a confident combined state: stronger outline, tinted
surface, selection marker, and supporting detail. Hover is never the only signal.

- Meeting rhythm cards show server-returned package meeting counts.
- Exam cards give YKS, DGS, and KPSS equal visual weight with short explanatory
  context; no additional enum or implied exam support is introduced.
- Description uses a focused writing surface with practical guidance.
- Student preview uses the shared student-facing offer composition.
- Publication shows readiness, publication, intake, and platform checkout as
  separate concepts.

### 7.3 Price

The price screen presents lesson price, server-calculated cap, entered Coaching
price, commission context, and revenue preview in one coherent composition.
Canonical values remain API-owned. No example amount is embedded as product
logic.

## 8. Availability and capacity

Availability becomes a weekly planning surface instead of a generic CRUD form:

- the add-window controls form one clear planning row;
- days appear as a seven-day weekly composition;
- configured windows are visually scannable;
- empty days remain quiet rather than becoming seven equally loud error cards;
- Coaching-versus-lesson availability separation stays explicit.

Time selection uses an application-controlled 24-hour presentation. Browser- or
locale-dependent AM/PM rendering must not appear. Submitted values remain the
same `HH:mm` strings expected by the current API.

Capacity follows availability and visualises only returned
`weekly_slot_count`, `theoretical_capacity`, active load, and tutor-selected
maximum. It does not invent capacity-downshift lifecycle behaviour. Server
validation remains authoritative and is surfaced clearly.

## 9. Operational empty states

Empty operational routes use a full composed state, not a small dashed box in a
large blank canvas. Each state contains:

- a warm visual anchor built from existing icons and simple CSS shapes;
- a concrete title and short explanation;
- what will appear here or what happens next;
- at most one primary action and one contextual link;
- a secondary preview or workflow hint only when it is factually stable.

No fake student, appointment, report, or financial row is displayed. The page
still feels complete through layout, not fabricated data.

## 10. Requests and tutor-facing terminology

The request surface keeps the existing `includes_coaching` partition and single
accept/reject callback. Tutor-facing copy removes the internal word `bundle`.

A Coaching request card explains one combined decision through two nested
sections:

- lesson package: student, duration, lesson frequency/credits, and lesson amount;
- Coaching add-on: frequency, number of meetings, 30-minute duration, and
  Coaching amount.

The card states naturally that accept or reject applies to the lesson package
and Coaching together. No second decision or lifecycle is introduced.

## 11. Earnings

The earnings page gains a wallet-like hierarchy without making settlement
claims:

- one large total/context panel;
- a proportional distribution of real accounting-state amounts;
- supporting state cards;
- monthly accounting records in a quieter list;
- the existing financial-truth explanation in plain Turkish.

The visual distribution is computed from returned eligible, pending, on-hold,
and reversed minor-unit amounts. It is not a historical earnings chart.

All Coaching money values use the shared TRY minor-unit formatter and one
convention: currency symbol first, Turkish separators, and two decimal places
when the shared formatter's contract requires them. Lesson/package values that
enter shared Coaching cards are normalised through the appropriate existing
major- or minor-unit formatter rather than manual string concatenation.

`earning_eligible_at` is not presented as payment. Internal processed/paid
records do not claim bank settlement without an explicit backend contract.

## 12. Shared Coaching offer

`CoachingOfferCard` becomes a richer two-part composition shared by:

- tutor setup preview;
- tutor preview route;
- actual public tutor profile Coaching offer.

It presents the learning promise and service contents first, then rhythm,
30-minute meeting duration, exam groups, package relationship, price, and the
context-appropriate action. It does not accept tutor-only readiness or internal
accounting fields.

On desktop, the commercial summary may form a focused side panel. On mobile,
the action follows the information without horizontal compression and remains
reachable without overflow.

## 13. Responsive and interaction behaviour

### 375 × 812

- one-column composition;
- compact progress header instead of horizontal stage cards;
- full-width primary actions;
- no horizontally crushed option, chart, or weekly-planning module;
- Coaching location remains visible in page-level navigation.

### 768 width

- two-level responsive module grid;
- setup and offer details may form two columns where readable;
- weekly availability wraps intentionally.

### Desktop, approximately 1440 × 900

- asymmetric hero and dashboard modules fill the first viewport purposefully;
- empty states use available width without stretching copy excessively;
- commercial offer information and action remain visually connected.

All interactive controls retain keyboard focus, semantic labels, minimum touch
targets, and reduced-motion support. Animation is limited to short entrance,
selection, and progress transitions.

## 14. Implementation boundaries

The pass should refactor and extend current Coaching components instead of
building parallel versions. Expected shared boundaries include:

- `CoachingPageShell`
- `CoachingStatusCard`
- `CoachingMetricGrid` / weekly rhythm presentation
- `CoachingSectionNav`
- `CoachingSetupProgress`
- `CoachingPlanForm`
- `CoachingAvailabilityEditor`
- `CapacityPreviewCard`
- `CoachingEmptyState`
- `CoachingEarningsSummary`
- `AcceptanceRequestCard`
- `CoachingOfferCard`

New presentation-only helpers are acceptable for scoped layout, 24-hour time
options, or derived visual proportions. They must not become alternate business
truth sources.

## 15. Validation and acceptance criteria

The implementation is complete only when:

- focused unit tests cover the new responsive progress semantics, selected
  states, 24-hour time controls, real-data visual derivations, request language,
  money formatting, and financial truth;
- TypeScript, lint, focused tests, and production build succeed;
- existing Coaching lifecycle and request-partition tests continue to pass;
- browser QA covers 375, 768, and desktop widths;
- the required tutor/student/profile states are captured from the actual branch;
- visual self-review explicitly checks blank space, hierarchy, CRUD feeling,
  badge use, alignment, copy density, primary action, selection, money,
  navigation, consistency, and overflow;
- no production, backend, push, merge, or pull-request action occurs.


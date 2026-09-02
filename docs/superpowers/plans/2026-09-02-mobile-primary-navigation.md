# Mobile Primary Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an industry-standard mobile bottom navigation, a stable mobile journey heading, and compliant selected date/time contrast without changing desktop behavior.

**Architecture:** Reuse the rebranded `ysAppNav` route source for mobile instead of mutating the legacy descriptor set that desktop fallbacks still consume. Keep layout-only fixes at responsive class boundaries and protect the three user-visible behaviors with focused component tests.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Radix Dialog/Sheet, Phosphor Icons, Node test runner, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-02-mobile-primary-navigation-design.md`

## Global Constraints

- Mobile-only presentation changes; desktop layout must remain unchanged.
- Use DESIGN.md tokens: `--paper`, `--surface`, `--line`, `--ink`, `--ink-mid`, `--pink`, and white.
- Use Phosphor 20px icons, `regular` inactive and `fill` active.
- Preserve all existing uncommitted work outside the files listed below.
- Follow test-first red/green cycles for every behavior change.

---

### Task 1: Rebuild the mobile primary navigation

**Files:**
- Modify: `src/components/layout/MobileTabBar.tsx`
- Modify: `src/components/layout/MobileTabBar.test.tsx`
- Consume unchanged: `src/components/yemeksepeti/ysAppNav.ts`

**Interfaces:**
- Consumes: `getYsAppTabs(role, flags): YsNavItem[]`, `YS_UTILITY_ITEMS`, `YS_NOTIFICATIONS_LABEL`, `YsNotificationsIcon`, and `getActiveYsNavItem(...)`.
- Produces: a five-column mobile navigation and a role-aware overflow bottom sheet.

- [ ] **Step 1: Write failing student navigation tests**

Assert the rendered labels are exactly `Hocalar`, `Panelim`, `Mesajlar`, `Bildirimler`, `Daha Fazla`; `Ana Sayfa` is absent; `Hocalar` points to `/`; the navigation occupies five equal columns; and `Panelim` is not inside overflow.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm run test:mobile -- --test-name-pattern="student mobile navigation"`

Expected: the old `Ana Sayfa`/`Hocalar` model fails the literal label and route assertions.

- [ ] **Step 3: Write failing design-state and overflow tests**

Assert active route icons expose the Phosphor filled state, inactive icons expose regular state, and opening `Daha Fazla` renders the feature-enabled `Çalışma Programım` route in a dialog sheet.

- [ ] **Step 4: Run the focused test and confirm RED**

Run the `MobileTabBar.test.tsx` node-test command and confirm failures point to Lucide icons and the popover overflow.

- [ ] **Step 5: Implement the minimal navigation change**

Build primary items from the rebranded route source: first two app tabs plus messages and notifications, with all remaining app/utility routes in a Radix bottom sheet. Use a full-width five-column grid, safe-area padding, solid surface, top hairline, Phosphor weights, and an ink active icon pill.

- [ ] **Step 6: Run navigation tests and confirm GREEN**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/layout/MobileTabBar.test.tsx src/components/yemeksepeti/ysAppNav.test.ts`

Expected: all tests pass with no warnings.

### Task 2: Stabilize the compact journey heading

**Files:**
- Modify: `src/components/yemeksepeti/YsJourneyHeading.tsx`
- Modify: `src/components/yemeksepeti/YsHowItWorks.test.tsx`

**Interfaces:**
- Consumes: the existing rotating `STEPS` and `TextRotate` behavior.
- Produces: a two-row compact heading and unchanged horizontal `md+` heading.

- [ ] **Step 1: Write the failing responsive-layout test**

Assert the visual heading container uses a compact column layout, switches to a row at `md`, and the animated pill reserves a stable compact inline size.

- [ ] **Step 2: Run the journey test and confirm RED**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/yemeksepeti/YsHowItWorks.test.tsx`

Expected: the current `flex-wrap` layout lacks compact column and fixed-slot classes.

- [ ] **Step 3: Implement the minimal responsive layout**

Replace compact wrapping with `flex-col md:flex-row`, keep centered alignment, and reserve the longest label's inline size on compact screens while releasing it at `md`.

- [ ] **Step 4: Run the journey test and confirm GREEN**

Run the focused journey test command and confirm all heading, accessibility, and step tests pass.

### Task 3: Enforce white text on selected booking slots

**Files:**
- Modify: `src/components/lessons/BookingModal.tsx`
- Create: `src/components/lessons/BookingModal.mobileSelection.test.tsx`

**Interfaces:**
- Consumes: current `selectedDate`, `selectedTime`, and the shared `Button` component.
- Produces: explicit white selected-state foreground classes for date and time controls.

- [ ] **Step 1: Write the failing selected-state regression test**

Render the booking modal with controlled availability, select a date and time, then assert both selected controls expose a pink surface and an explicit white foreground treatment.

- [ ] **Step 2: Run the booking test and confirm RED**

Run: `node --experimental-test-module-mocks --test-force-exit --import tsx --test src/components/lessons/BookingModal.mobileSelection.test.tsx`

Expected: the selected time does not carry the explicit regression-proof white class.

- [ ] **Step 3: Implement the minimal selected-state classes**

Keep the current pink selection surface and add explicit white foreground classes to selected dates and selected times without changing unselected or desktop geometry.

- [ ] **Step 4: Run the booking test and confirm GREEN**

Run the focused booking test and confirm it passes without warnings.

### Task 4: Full verification

**Files:**
- Verify all files above; do not modify unrelated dirty files.

**Interfaces:**
- Consumes: all three completed task outputs.
- Produces: evidence that mobile behavior changed and desktop/build behavior did not regress.

- [ ] **Step 1: Run focused suites**

Run the mobile, navigation, journey, and booking tests together.

- [ ] **Step 2: Run static verification**

Run: `npx tsc --noEmit` and `npm run build`.

- [ ] **Step 3: Run responsive verification**

Run: `npm run responsive:check` and inspect the compact pages at 375px. Confirm five equal nav destinations, stable journey heading geometry, white selected slot text, and unchanged desktop layout.

- [ ] **Step 4: Review the final diff**

Confirm only scoped files and documentation changed during this task and that pre-existing dirty files remain intact.

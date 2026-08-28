# Lessons and Support Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the student lessons workspace and support center with DESIGN.md hierarchy while preserving all operational behavior.

**Architecture:** Keep query/mutation logic intact and isolate presentation into stable surface components. Replace equal-card and navy-panel patterns with asymmetric product layouts and tokenized states.

**Tech Stack:** Next.js 14, React Query, Tailwind CSS, Radix primitives, Phosphor Icons, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-27-account-surfaces-design-system-refresh.md`

## Global Constraints

- `/Users/ardagg/Desktop/DESIGN.md` is binding.
- Preserve lesson filters, tabs, calendar/list view, join timing, disputes, reviews, materials, and cancellation.
- Preserve support ticket, FAQ, deep-link, and assistant behavior.
- Gold is a surface with `gold-ink`.
- No new lesson or support mechanics.
- Do not overwrite unrelated dirty-tree changes.

---

### Task 1: Establish lessons presentation contract

**Files:**
- Create: `src/components/lessons/StudentLessonsWorkspace.test.tsx`
- Modify: `src/components/lessons/StudentLessonsWorkspace.tsx`

**Interfaces:**
- Produces: compact asymmetric summary, primary next-lesson surface, and gold date lockup while retaining existing query/mutation inputs.

- [ ] Write static/render tests that reject three equal summary cards and navy next-lesson classes, and require `bg-gold text-gold-ink` on timing.
- [ ] Run the focused test and confirm failure.
- [ ] Replace `SummaryCard` trio with one summary region; restyle next lesson, tabs, filters, empty states, and responsive layout using design tokens.
- [ ] Run the focused test and TypeScript.
- [ ] Commit with `feat: refresh student lessons workspace`.

### Task 2: Fix booking and join interaction states

**Files:**
- Modify: `src/components/lessons/BookingCard.tsx`
- Modify: `src/components/lessons/LessonJoinButton.tsx`
- Create: `src/components/lessons/LessonJoinButton.appearance.test.tsx`

**Interfaces:**
- Produces: active pink/white join action and neutral readable disabled/not-yet-open state; public props remain unchanged.

- [ ] Add assertions for active, hover, disabled, and waiting classes without changing time-gating behavior.
- [ ] Run the focused test and confirm failure.
- [ ] Update classes and status surfaces; preserve callbacks, timers, room URL handling, and labels.
- [ ] Run focused lesson tests, `npm run test:unit`, and TypeScript.
- [ ] Commit with `fix: keep lesson actions readable in every state`.

### Task 3: Refresh support center

**Files:**
- Modify: `src/app/(main)/support/page.tsx`
- Modify: `src/components/support/SupportTicketForm.tsx`
- Modify: `src/components/support/SupportAccordionSection.tsx`
- Modify: `src/components/support/SupportFAQ.tsx`
- Create: `src/components/support/SupportSurface.test.tsx`

**Interfaces:**
- Produces: 7/5 desktop support layout, stacked mobile layout, tokenized fields and accordion, unchanged ticket/FAQ behavior.

- [ ] Write assertions for direct header copy, asymmetric layout, token card geometry, and labeled fields.
- [ ] Run the focused test and confirm failure.
- [ ] Recompose the page and normalize form/accordion states without changing submit, preset, deep-link, or assistant code.
- [ ] Run focused tests and TypeScript.
- [ ] Commit with `feat: align support center with design system`.

### Task 4: Full regression and visual verification

**Files:**
- Modify only files required to fix defects discovered during verification.

**Interfaces:**
- Consumes: all tasks in the three implementation plans.
- Produces: verified desktop/mobile, light/dark account experience.

- [ ] Run `npm run test:coaching` to protect existing uncommitted coaching work.
- [ ] Run `npm run test:unit` and record any pre-existing currency-placement failures separately.
- [ ] Run `npx tsc --noEmit` and `npm run build` after the development server is no longer holding `.next`.
- [ ] Verify `/`, `/profile`, `/profile/payments`, `/profile/security`, `/profile/lessons`, `/support`, `/dashboard/student`, and `/dashboard/student/coaching` at desktop and mobile widths in both themes.
- [ ] Fix only in-scope defects, rerun focused suites, and commit with `fix: finish account surface visual verification` when needed.


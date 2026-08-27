# Profile and Account Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh profile, payments, security, account deletion, and payment methods while moving referral access to the profile overview.

**Architecture:** Extract the referral utility into a focused component backed by the existing API, reuse DESIGN.md primitives for all account surfaces, and preserve every account/payment/security mutation.

**Tech Stack:** Next.js 14, React Query, Tailwind CSS, Radix Dialog, Phosphor Icons, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-27-account-surfaces-design-system-refresh.md`

## Global Constraints

- `/Users/ardagg/Desktop/DESIGN.md` is binding.
- Referral rewards logic is not added.
- Payment and security API contracts remain unchanged.
- Payment-method animation is preserved.
- Destructive actions use `error`, never brand pink or brown.
- Do not overwrite unrelated dirty-tree changes.

---

### Task 1: Move referral access to profile

**Files:**
- Create: `src/components/profile/ReferralInviteCard.tsx`
- Create: `src/components/profile/ReferralInviteCard.test.tsx`
- Modify: `src/app/(main)/profile/page.tsx`
- Modify: `src/app/(main)/profile/payments/page.tsx`

**Interfaces:**
- Produces: `ReferralInviteCard(): JSX.Element`, using `fetchReferralInfo()` and the existing clipboard fallback.

- [ ] Write a test that asserts the component has a gold surface, `gold-ink`, referral code, and copy action, while payments no longer renders “Referans kodu”.
- [ ] Run the focused test and confirm failure because the component does not exist.
- [ ] Move referral query/copy behavior into `ReferralInviteCard`, render it directly below the student identity surface, and remove referral imports/section from payments.
- [ ] Run the new test, profile menu tests, and TypeScript.
- [ ] Commit with `feat: move referral invite to profile`.

### Task 2: Refresh profile and payments hierarchy

**Files:**
- Modify: `src/app/(main)/profile/page.tsx`
- Modify: `src/app/(main)/profile/payments/page.tsx`
- Modify: `src/components/profile/ProfileScreen.tsx`
- Modify: `src/components/payments/PackagePurchaseCard.tsx`
- Test: `src/components/payments/PackagePurchaseCard.test.tsx`

**Interfaces:**
- Consumes: `ReferralInviteCard` from Task 1.
- Produces: account surfaces using `paper`, `surface`, `line`, `ink`, `ink-mid`, and tabular numeric metadata.

- [ ] Add package-card assertions for card radius, hairline border, tabular figures, and non-tint status/expanded surfaces.
- [ ] Run the focused test and confirm failure.
- [ ] Update profile section rhythm and asymmetric layouts; simplify payment copy; rebuild package/payment rows without changing expand/cancel behavior.
- [ ] Run focused tests, `npm run test:unit`, and TypeScript.
- [ ] Commit with `feat: align profile and payments with design system`.

### Task 3: Refresh security and deletion dialog

**Files:**
- Modify: `src/app/(main)/profile/security/page.tsx`
- Modify: `src/components/profile/TutorDeletionFlow.tsx`
- Modify: `src/components/profile/DeletionOptionsList.tsx`
- Test: `src/app/(main)/profile/security/page.test.tsx`
- Test: `src/components/profile/TutorDeletionFlow.test.tsx`

**Interfaces:**
- Produces: readable verification/session/danger states with unchanged mutations.

- [ ] Extend tests to require gold pending-verification surface, success verified state, and an `error` destructive confirmation action.
- [ ] Run focused tests and confirm the visual-contract assertions fail.
- [ ] Recompose the sections with DESIGN.md cards/fields/buttons; resize and recolor permanent deletion action without changing confirmation rules.
- [ ] Run security/deletion tests and TypeScript.
- [ ] Commit with `feat: refresh account security surfaces`.

### Task 4: Refresh payment-method dialog

**Files:**
- Modify: `src/components/profile/ProfileMenu.tsx`
- Modify: `src/components/profile/PaymentMethodSelector.tsx`
- Test: `src/components/profile/ProfileMenu.test.tsx`

**Interfaces:**
- Produces: same payment dialog state API and animation, with modal/card/input token geometry.

- [ ] Add assertions for modal radius, floating shadow, and selected method border while keeping existing open/select notice assertions.
- [ ] Run the profile menu test and confirm visual assertions fail.
- [ ] Update dialog and selector classes only; do not alter motion components or callbacks.
- [ ] Run profile tests and TypeScript.
- [ ] Commit with `feat: align payment methods dialog with design system`.


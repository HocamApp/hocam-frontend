# Implementation Plan

How to build `product-home-spec.md` on branch
`feature/udemy-inspired-product-home` without breaking auth, analytics,
payments policy, or a parallel contributor's work.

**Nothing in this plan has been implemented.** No page code was modified during
the research phase; the only changes on this branch are documentation and the
copied reference folder.

---

## 1. Route to modify

**`/home`** — `src/app/(main)/home/page.tsx` → `RoleAwareHome` →
`AuthenticatedHome`.

The route file itself does **not** change. The redesign lands entirely inside
`src/components/home/`. This matters: `/home` is hardcoded as the post-auth
destination in `LoginForm` (×4), `RegisterForm` (×4), `RouteGuard`, `Navbar`,
and both nav descriptor sets. Changing the route would touch all of them and is
explicitly out of scope.

No `/demo`, `/home-v2`, or parallel preview route is created. The real page is
redesigned in place, on a feature branch.

## 2. Files expected to change

### Modified

| File | Change | Size |
| --- | --- | --- |
| `src/components/home/AuthenticatedHome.tsx` | Recomposed: hero compressed to one column, sections reordered per spec §2, section bodies delegated to `HomeCardRow`, selectors imported from `lib/homeContent` | Large (it is the point of the project) |
| `src/lib/homeAnalytics.ts` | **Additive only** — new members on the `HomeAnalyticsEvent` union | Tiny |
| `package.json` | Add new test files to the `test:unit` file list | Tiny |
| `docs/authenticated-home-wireframe-spec.md` | Add a header note pointing at this folder as the newer source for section order. **Do not delete or rewrite it** — it is the agreed low-fidelity contract and still correct about page role, navigation map, and accessibility order | Tiny |

### New

| File | Purpose |
| --- | --- |
| `src/components/home/HomeSectionHeader.tsx` | Promote the private helper (`AuthenticatedHome.tsx:56`) to a shared module |
| `src/components/home/HomeCardRow.tsx` | Responsive row: `md+` grid, mobile snap-scroll with peek, chevrons, skeleton/empty slots |
| `src/components/home/HomeTutorTabs.tsx` | Exam-type tab strip over the tutor row (thin wrapper on `ui/animated-tabs`) |
| `src/components/home/HomeFavoritesRow.tsx` | Favorites section (composition over `useFavorites` + `TutorCard` + `HomeCardRow`) |
| `src/components/home/HomeSubjectLinks.tsx` | Optional §3.7 link block |
| `src/lib/homeContent.ts` | Extracted selectors: `firstUpcomingBooking`, `firstActiveGoal`, `firstActivePackage`, `prioritizedTemplates` |
| `src/lib/homeContent.test.ts` | Unit tests for the above |
| `src/components/home/homeCardRow.test.ts` *(or a pure helper test)* | Overflow/peek/track-count logic, kept pure so it is testable under the node test runner |

### Must not change

- `src/app/(main)/home/page.tsx`, `src/components/home/RoleAwareHome.tsx`
- `src/components/shared/RouteGuard.tsx`, `TutorActivationGate.tsx`,
  `src/components/layout/MainLayoutShell.tsx` — auth and gating
- `src/components/layout/*` (`Navbar`, `Footer`, `MobileTabBar`, `navItems.ts`)
  — covered by `navItems.test.ts` and fixed by the wireframe spec's nav map
- `src/lib/api.ts`, `src/providers/AuthProvider.tsx`
- `src/components/tutors/TutorCard.tsx` — shared with `/tutors` and the learning
  pages; if the home needs a variant, add an **opt-in prop**, never change a
  default
- `src/app/(main)/dashboard/tutor/page.tsx`, `…/dashboard/student/page.tsx` —
  documented merge-conflict hot spots (`AI_AGENT_RULES.md` §5)
- `src/components/home/TutorAuthenticatedHome.tsx` — slice 3 at the earliest
- Anything under `src/components/checkout/`, `src/lib/paymentsApi.ts`,
  `src/lib/lessonPricing.ts` — payment surfaces require their own small branch
  and PR (`AI_AGENT_RULES.md` §5)
- `src/app/globals.css`, `tailwind.config.ts` — **no new tokens.** If the design
  cannot be expressed in existing tokens, that is a signal the design drifted
  toward the reference's brand.

### Cleanup candidates — list, do not delete in slice 1

| File | Condition |
| --- | --- |
| `src/components/home/HomeTutorPreview.tsx` | Becomes unused once the hero goes single-column. Leave in place through slice 1; delete only after the hero decision is confirmed on a real authenticated render. |
| Private `ContinueCard` in `AuthenticatedHome.tsx` | If `ActiveGoalCard` replaces the goal variant |
| Private `PracticeCard`, `TutorCardSkeleton` | Only if they end up genuinely superseded by shared components |

Rationale: an unused component is cheap; a deleted component that a parallel
branch still imports is a broken build for someone else.

## 3. Implementation slices

Each slice is independently reviewable and leaves `/home` in a working state.

**Slice 0 — extraction, zero visual change.**
Move the four selectors to `src/lib/homeContent.ts` + tests; promote
`HomeSectionHeader` to its own file. `AuthenticatedHome` imports them. Nothing
renders differently. This slice is what makes the later reorder verifiable:
after it lands, "which lesson counts as next" is asserted by a test rather than
by reading a 715-line component.

**Slice 1 — row grammar.**
Build `HomeCardRow`. Convert the tutor and package sections to it. Desktop grid
must be pixel-equivalent to today; mobile becomes a peek/snap scroll row. No
reorder yet, so a regression is unambiguously attributable to the row.

**Slice 2 — reorder + hero compression.**
Move the resume section above tutor discovery; compress the hero to a single
column; retire the right-rail preview from the render tree (keep the file). This
is the slice with real product risk — see §8.

**Slice 3 — new real-data modules.**
Tutor tab strip (`home_tutor_tab_changed`), favorites row. Both use only
existing endpoints. Optional `HomeSubjectLinks`.

**Slice 4 — deferred, requires answers.**
Match-based personalization row, pending the backend confirmation in
`data-requirements.md` §5.1. Not started without it.

## 4. Authentication strategy

- No change to auth. `RouteGuard requireAuth` stays; there is no server-side
  middleware in this repo and none is added by this project.
- No component may be built that assumes an anonymous render of `/home`.
- **Prohibited, restated because the temptation is real:** do not add a "demo
  mode" flag, a mocked `AuthProvider`, hardcoded test credentials, or a
  `RouteGuard` bypass to make development or screenshots easier. If the visual
  work needs an authenticated render, the correct fix is a running local backend
  and a real dev login performed by the owner.
- The tutor gating chain (`MainLayoutShell` verification redirect,
  `TutorActivationGate` tutorial redirect) is untouched.

## 5. Data strategy

- **No new endpoints.** Every slice-1–3 module uses a call that already exists
  (`data-requirements.md` §2).
- Query keys: new homepage-specific calls get distinct keys
  (`["home-tutors", examType]`). Shared keys (`["bookings"]`, `["subjects"]`,
  `["profile-me"]`, `["favorites", userId]`) keep their exact current shape —
  changing one silently doubles fetches on other pages.
- Above-the-fold queries stay eager; new below-the-fold rows should not add to
  the eager burst (already 8 parallel requests on mount).
- Empty rows unmount. Loading rows reserve height. Errors degrade per section,
  never per page.
- **Never fabricate a metric.** Only `rating`, `total_reviews`,
  `completed_lessons_count`, `is_verified`, `yks_rank`, `hourly_price`,
  `is_online`/`last_seen_at` may appear on a tutor card.
- Payment/earnings rules from `AI_AGENT_RULES.md` §§1–2 hold verbatim: package
  credits are not currency; `TutorEarningsSummary.total` is never `formatPrice`d.

## 6. Screenshot strategy

- Baseline (anonymous) already captured on this branch:
  `screenshots/product-home-baseline/` — 9 files across 390/768/1440
  (`current-homepage-audit.md` §9). `screenshots/` is git-ignored.
- Authenticated baseline is **blocked** and must be captured before slice 2's
  visual diff is meaningful. Requirements: a running local backend with seeded
  data, and an owner-performed dev login. See the final report's open decisions.
- Per-slice: capture the same three widths, same routes, before/after, into
  `screenshots/product-home-<slice>/`.
- Tooling: the repo's existing `playwright@^1.61.1` devDependency and
  `scripts/responsive-check.ts`. **No new screenshot dependency is installed.**

## 7. Test, responsive, and accessibility validation

**Automated (must pass before any commit):**

| Command | Covers |
| --- | --- |
| `npm run test:unit` | node test runner; new `homeContent.test.ts` + row-logic tests appended to the explicit file list in `package.json` |
| `npx tsc --noEmit` | Types. Note: 2 pre-existing unrelated errors exist on `main`; the count must not grow. |
| `npm run lint` | ESLint / next |
| `npm run build` | Production build |
| `npm run responsive:check` | Playwright, 375/768/1280 across `/`, `/match`, `/tutors`, `/home`, `/dashboard/student`, `/profile`; asserts `scrollWidth <= innerWidth` and reports console errors. **This is the primary regression gate for the mobile scroll rows.** |

**Responsive validation:** 390 / 768 / 1440 by hand in addition to the script,
because `responsive:check` runs at 375/768/1280. Specifically verify: the peek
card is visible at 390; snap points land on card boundaries; the row does not
leak page width; chevrons appear only when the row actually overflows.

**Accessibility validation (manual, per slice):**

- Keyboard-only: tab through hero → search combobox (arrow keys, Escape) → tab
  strip (arrow keys) → each row → CTA. No focus trap, no invisible focus.
- Screen reader on three sections: heading level order, `aria-labelledby`
  association, tab `aria-selected`, chevron labels.
- `prefers-reduced-motion: reduce`: no smooth scroll, no entrance animation.
- Both themes: light and dark, checking the `--primary` inversion.
- Touch: all targets ≥ 44 px; hover-gated content reachable via `.touch-visible`.

**Not automatable here:** anything requiring an authenticated session. Those
checks are listed as manual acceptance and must be reported honestly as
"pending" until a backend is available — the same discipline applied to backend
tests in previous work on this repo.

## 8. Risks

**Technical**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Mobile scroll rows leak page width | Horizontal page scroll on every phone — a previously fixed class of bug in this repo | `minmax(0,1fr)` + `min-w-0`; `responsive:check` gate per slice |
| Hidden scrollbars make rows undiscoverable | Users never see content past card 3 | Mandatory peek + chevrons; verified at 390 px |
| framer-motion unreliability | Animations stuck mid-state (observed previously in this codebase) | CSS / `tailwindcss-animate` only for homepage motion |
| Shared query-key drift | Duplicate fetches on `/tutors` and dashboards | Distinct keys for homepage-specific calls |
| Dark-mode breakage | Unreadable page for dark-theme users | No new hex; verify both themes each slice |
| Merge conflict in a large shared file | Lost work for a parallel contributor | Confine to `components/home/*`; `git fetch origin` before each slice |
| `TutorCard` restyle bleeding into `/tutors` and learning pages | Three surfaces change from one edit | Opt-in props only |
| Growing the 8-query eager burst | Slower first paint | Defer below-the-fold rows |

**Product**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Page reads as Udemy, not Hocam | Brand damage; violates the brief's own success criterion | `REFERENCE_RULES.md`; diff review for new hex/font/accent |
| Fabricated metrics or badges | Users misled; trust damage in a marketplace whose pitch is *verified* | Only the seven real tutor fields |
| Empty-scaffolding page | New students see skeletons and empty cards | Conditional sections unmount |
| `/home` drifts into a second `/dashboard/student` | Two competing operational pages | Keep the wireframe spec's boundary: home = starting point |
| Reorder buries the resume module for some real state combination | A student misses a lesson | Slice 0's extracted selectors + tests make the priority rule explicit and verifiable |
| Analytics regression | Funnel goes dark silently | Event names are additive-only; grep for every existing name after the recompose |
| Wireframe spec becomes a stale contradiction | A future agent "restores" the old order | Supersession note in slice 2 |

## 9. Decisions requiring human approval

1. **Retire the hero's right-rail tutor preview?** (spec §3.1) Removes a
   component and materially changes the hero. Recommended: yes.
2. **Resume above discovery?** (spec §3.2) The single biggest ordering change,
   and it contradicts both the shipped page and
   `docs/authenticated-home-wireframe-spec.md` §3. Recommended: yes, with the
   unmount rule.
3. **Ship the favorites row?** New module, zero backend cost. Recommended: yes.
4. **Tutor row size** — raise `page_size` from 4 to 6 or 8? Needs the caching
   answer in `data-requirements.md` §5.2.
5. **Match-based personalization** — proceed only after §5.1 confirms
   `POST /matching/preview/` is safe as a homepage read.
6. **Subject links block** — ship or cut? Lowest priority.
7. **Authenticated baseline capture** — owner-run local backend + dev login, or
   accept that visual diffs are anonymous-only.
8. **Wireframe-spec supersession** — confirm the intended relationship
   (recommended: annotate, keep, do not delete).
9. **Tutor home** — confirm it stays out of scope for slices 1–3.

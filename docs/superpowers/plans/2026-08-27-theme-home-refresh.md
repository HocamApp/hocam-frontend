# Theme and Homepage Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the split legacy/new theme palette and make shared navigation, search, footer, favorites, and testimonials readable in both themes.

**Architecture:** Map shadcn semantic tokens onto the DESIGN.md neutral hierarchy, then remove component-level overrides that reintroduce navy, brown, or invalid inverse pairs. Keep existing navbar architecture and homepage behavior.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, CSS custom properties, Phosphor Icons, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-27-account-surfaces-design-system-refresh.md`

## Global Constraints

- `/Users/ardagg/Desktop/DESIGN.md` is binding.
- Gold is a surface and text on gold is `gold-ink`.
- No route, API, database, deployment, or business-logic changes.
- Preserve single-navbar architecture and header-height tokens.
- Preserve existing homepage functional animations.
- Do not overwrite unrelated dirty-tree changes.

---

### Task 1: Unify semantic theme tokens

**Files:**
- Modify: `src/app/globals.css`
- Test: `src/components/theme/designTheme.test.ts`

**Interfaces:**
- Produces: shadcn `background`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `border`, `input`, and `ring` values derived from DESIGN.md in both themes.

- [ ] Write `designTheme.test.ts` to read `globals.css` and assert the dark block no longer declares blue/navy primary/background values and maps surfaces to the warm neutral hierarchy.
- [ ] Run `node --test --import tsx src/components/theme/designTheme.test.ts` and confirm it fails on the old dark HSL declarations.
- [ ] Update `globals.css` so body uses `paper`/`ink`, cards use `surface`, and dark semantic HSL tokens match the same neutral ramp; keep calendar subject exceptions unchanged.
- [ ] Run the focused test and `npx tsc --noEmit`.
- [ ] Commit only theme files with `fix: unify light and dark surface tokens`.

### Task 2: Normalize navigation, search, and footer

**Files:**
- Modify: `src/components/tutors/AnimatedSearchBar.tsx`
- Modify: `src/components/layout/AnimatedNavbarLinks.tsx`
- Modify: `src/components/yemeksepeti/YsNavbar.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/yemeksepeti/YsFooter.tsx`
- Test: `src/components/yemeksepeti/YsFooter.test.tsx`
- Test: `src/components/layout/navItems.test.ts`

**Interfaces:**
- Consumes: unified semantic tokens from Task 1.
- Produces: one theme-safe header/search/footer vocabulary.

- [ ] Extend footer/search assertions to reject brown/navy hard-coded theme classes and require token-based surfaces.
- [ ] Run the focused footer/nav tests and confirm the new assertions fail.
- [ ] Change the search trigger to `surface`/`line`/`ink` states; remove brand-blue active navigation overrides; make both footer implementations inherit `paper`, `surface`, `line`, and `ink-mid`.
- [ ] Run `npm run test:messages-panel` and the theme test.
- [ ] Commit with `fix: align shared shell with design tokens`.

### Task 3: Repair homepage dark-mode contrast

**Files:**
- Modify: `src/components/yemeksepeti/YsPromoBanners.tsx`
- Modify: `src/components/yemeksepeti/YsTestimonials.tsx`
- Modify: `src/styles/yemeksepeti.css`
- Test: `src/components/yemeksepeti/YsHomeFaq.test.tsx`
- Create: `src/components/yemeksepeti/YsThemeSurfaces.test.tsx`

**Interfaces:**
- Consumes: theme tokens from Task 1.
- Produces: favorites and testimonial surfaces with valid theme-specific text/hover pairs.

- [ ] Add rendering assertions for explicit `text-ink`, inverse hover text, and theme-matching edge treatment without gradient utilities.
- [ ] Run the new test and confirm failure.
- [ ] Apply explicit contrast pairs to the favorites banner and testimonial heading/cards; replace gradient edge fades with a CSS mask or flat edge treatment that does not paint a gradient.
- [ ] Run the new test, `npm run test:unit`, and `npx tsc --noEmit`.
- [ ] Commit with `fix: restore homepage contrast in dark mode`.


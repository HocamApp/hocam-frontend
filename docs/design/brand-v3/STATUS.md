# Brand v3: status

**This file is the current state of the rollout.** `PLAN.md` is the plan; `BRAND.md` is the color system. Update this file at the end of every task. Last updated 14 October 2026 (Phase 0).

## Where we are

Direction approved (14 October 2026): option "E2" from the palette exploration, black + pink + yellow with soft tints.

Phase 0 is done (branch `agent/brand-v3-phase0-20261014`): the compare harness, the scoped tokens, the `v3:` Tailwind variant and the `NEXT_PUBLIC_BRAND_V3` flag. With the flag off the homepage is pixel-identical to `main`; with it on only the homepage hues change. Next: Phase 1, PR 1A (T1.1 to T1.3), once D3 and D4 are answered or their defaults accepted.

## Progress

| Task | State | PR | Notes |
|---|---|---|---|
| T0.1 Mockup in compare harness | done | Phase 0 PR | `npm run brand:compare` → `screenshots/brand-v3/` |
| T0.2 Tokens | done | Phase 0 PR | See "Phase 0 notes" for three additions to the plan |
| T0.3 Flag | done | Phase 0 PR | Flag off: pixel-identical to `main`, both `HOME_V2` states, 1440/390, light/dark |
| T1.1 Hero | not started | | Waits on D3, D4 |
| T1.2 Tutor directory | not started | | |
| T1.2b Promo row (new) | not started | | Waits on D7 |
| T1.3 Subject grid | not started | | |
| T1.4 Verified band | not started | | |
| T1.5 University strip | no change | | |
| T1.6 Student steps | not started | | |
| T1.7 Pricing | not started | | |
| T1.8 Guarantees | not started | | |
| T1.9 Parents panel | not started | | |
| T1.10 Tutor band | not started | | |
| T1.11 Testimonials | not started | | |
| T1.12 FAQ | not started | | |
| T1.13 Review and Production switch | not started | | |
| T2.1 Global flip | not started | | Starts after the homepage is approved in Production |
| T2.2 Shared components | not started | | |
| T2.3 Surface audit | not started | | 8 groups, see PLAN.md |
| T2.4 Outside the repo | not started | | Owners |
| T3.1 to T3.4 Lock in | not started | | |

## Decisions

| # | Decision | Answer |
|---|---|---|
| D1 | Pink button fill | open (default `--pink-deep`) |
| D2 | Hero search bar | open (default skip) |
| D3 | Hero notification content | open (default generic, no name) |
| D4 | Collage replaces campus gallery | open (default yes) |
| D5 | Dark mode on the homepage | open (default ship with starting values) |
| D6 | Navbar and footer wait for Phase 2 | open (default yes) |
| D7 | Three-banner promo row | open (default skip until copy exists) |

## Open for Baha

- Answer D1 to D7 above.
- With the flag on, white text on the homepage's pink buttons drops to 3.7:1 (`#FF2070`, was `#FA0050`). D1's default (`--pink-deep` fill) fixes it, but buttons are restyled in Phase 1/2, not in Phase 0. Don't switch Production on before that.

## Phase 0 notes

How it was checked:
- Flag off: `npm run home:compare` before and after, plus a deterministic run (reduced motion, frozen CSS animations, `/api/` responses replayed from a recording) pixel-diffed against `main`. Identical at 1440 and 390, light and dark, with `NEXT_PUBLIC_HOME_V2` off (Production today) and on (Preview). Without freezing, two runs of unchanged `main` already differ (gallery, marquee, tutor order from the API), so the plain `home:compare` output can't prove pixel equality on its own.
- Flag on: same page height at every size and theme as flag off, so no layout moved. In the browser, inside `.ys-root` `--yellow-soft` is `#FDFFC7` light and `#384123` dark, pink `#FF2070`, ink `#0C0E09`; the navbar outside the scope keeps `#FA0050` and today's ink.
- `src/lib/brandV3Tokens.test.ts` pins the token values and compiles Tailwind with the real config to check the new colour names and that `v3:` only matches under `[data-brand="v3"]`.

Additions to the plan, all inside the scope:
1. **`--ys-*` re-declared on the scope** (`yemeksepeti.css`: `:root, [data-brand="v3"]`). A `var()` resolves where it's declared, so `--ys-brand-primary: var(--pink)` on `:root` kept the old pink inside the scope. Same for `--tutorial-spotlight-ring`.
2. **`--pink-pale` stays light in dark** (`#FFE3EE`) instead of following `--pink-soft` to `#3D2231`. Today's pink-pale surfaces are fixed light cards with `--ink-on-light` text (the favourites banner); aliasing them into dark put black text on dark plum. Only the hue moves. New work uses `--pink-soft` and gets the dark value.
3. **`--ink-on-light` is `#0C0E09` in the scope**, so the fixed light cards get the v3 black like the rest of the page.

Outside the scope, the new names have fallbacks that keep today's look (`--pink-soft: var(--pink-pale)`, `--yellow: var(--gold)`, `--band: var(--ink-on-light)`, `--on-accent: var(--gold-ink)`). `--yellow-soft` has no counterpart today, so it carries its v3 value everywhere.

Seen with the flag on, left for Phase 1 (each is the matching task's job):
- Dark theme: the tutor band (`YsTutorBand`) is a light section on a dark page. Same on `main`; T1.10 makes it `--band`.
- The shadcn HSL tokens (`--primary`, `--foreground`) are not in the scope, so anything on the homepage using them keeps today's colours until T2.1.
- Hard-coded colours that don't follow tokens: the testimonial hover sheen (`.ys-sheen`, gold hex, T1.11) and the verified band's white button text (`text-[#02171a]`, T1.4).
- Navbar and footer keep today's colours (D6 default).

Unit tests: `npm run test:unit` reports 302 failures on this branch and the same 302 on clean `main` (mostly `Cannot find module '@/lib/…'` under the full runner). The new tests pass; the new cases in `YemeksepetiHome.flag.test.tsx` fail under the full runner only because that whole file already does on `main`, and pass with `--import ./scripts/register-test-aliases.mjs`.

## Intentional differences from the mockup

(List them here as they come up: real copy, real numbers, sections the mockup doesn't have.)

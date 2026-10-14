# Brand v3: status

**This file is the current state of the rollout.** `PLAN.md` is the plan; `BRAND.md` is the color system. Update this file at the end of every task. Last updated 14 October 2026 (Phase 1A).

## Where we are

Direction approved (14 October 2026): option "E2" from the palette exploration, black + pink + yellow with soft tints.

Phase 0 is merged (#345): the compare harness, the scoped tokens, the `v3:` Tailwind variant and the `NEXT_PUBLIC_BRAND_V3` flag.

Phase 1A is in review (branch `agent/brand-v3-phase1a-20261014`): the hero collage, the tutor cards and the subject tiles, all behind the flag. With the flag off the homepage and the other pages that use `TutorCard` are pixel-identical to `main`. Next: PR 1B, after Baha has looked at 1A and the open items below.

## Progress

| Task | State | PR | Notes |
|---|---|---|---|
| T0.1 Mockup in compare harness | done | #345 | `npm run brand:compare` → `screenshots/brand-v3/` |
| T0.2 Tokens | done | #345 | See "Phase 0 notes" for three additions to the plan |
| T0.3 Flag | done | #345 | Flag off: pixel-identical to `main`, both `HOME_V2` states, 1440/390, light/dark |
| T1.1 Hero | in review | Phase 1A PR | Collage (D4), generic notification card (D3) |
| T1.2 Tutor directory | in review | Phase 1A PR | Free-trial tag held back, see "Open for Baha" |
| T1.2b Promo row (new) | skipped | | D7: skip for now |
| T1.3 Subject grid | in review | Phase 1A PR | |
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
| D1 | Pink button fill | **Answered by Baha (14 Oct 2026):** button fills with white text use `--pink-deep`; `--pink` stays everywhere else |
| D2 | Hero search bar | **Answered by Baha:** no search bar under the hero |
| D3 | Hero notification content | **Answered by Baha:** generic text, no name and no photo, an icon instead of the avatar. Text lives in `ysHomeCopy.ts` (`hero.notice`); Baha will rewrite it |
| D4 | Collage replaces campus gallery | **Answered by Baha:** yes, behind the `brandV3` prop |
| D5 | Dark mode on the homepage | **Answered by Baha:** ship dark with the BRAND.md starting values, checked in screenshots |
| D6 | Navbar and footer wait for Phase 2 | **Answered by Baha:** yes |
| D7 | Three-banner promo row | **Answered by Baha:** skip for now |

## Open for Baha

- **Hero notification card wording (D3).** Placeholder in `ysHomeCopy.ts` → `hero.notice`: title "Deneme dersin onaylandı", line "20 dakika · ücretsiz" (the 20 is `TRIAL_MINUTES`). Rewrite it there.
- **Free-trial tag on the tutor card (T1.2), held back.** The plan asks for a yellow "free trial" tag, but all 12 tutors in the live list have `accepts_trial_lessons: true`, so it would be on every card. BRAND.md §7 says "Don't: a yellow tag on every card in a row." Options: (a) skip it while every tutor offers trials, (b) show it anyway, (c) show it only for something rarer. Every card already has a "Deneme Dersi Al" button.
- **Card subject chips.** The card dedupes subjects by name and shows the name only ("Matematik", not "TYT Matematik"), so a tutor who teaches Matematik in both exams gets one pink (TYT) chip. The mockup writes the exam in the chip ("TYT Matematik"). Adding the exam would change the card's text and how many chips fit. Keep as is, or add it?
- **Watermarks the mockup doesn't show.** I picked DE (Almanca), FR (Fransızca), ∴ (Mantık), Ψ (Psikoloji), and 1453 for Tarih-1 and Tarih-2. Coğrafya, Felsefe, Din Kültürü and Sosyoloji get none. Change or drop any of them in `SUBJECT_GLYPHS` (`YsSubjectGrid.tsx`).
- **Subject tiles on a phone.** The API returns 30 TYT/AYT subjects, so at two per row the grid is 15 rows (about 2,100px) at 390. That's what the plan asks for; tell me if you'd rather cap it on mobile.

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

## Phase 1A notes

How it was checked:
- Flag off: frozen screenshots (see Phase 0 notes) of `/`, `/yks-ozel-ders` and `/yks/tyt/matematik-ozel-ders` pixel-diffed against `main`. The last two render `TutorCard` (default size) and `FavoriteButton` outside the homepage. All identical at 1440 and 390, light and dark; `/` also with `NEXT_PUBLIC_HOME_V2` off. `/tutors` redirects to `/`, so the homepage covers it.
- Flag on (`HOME_V2=true`, `BRAND_V3=true`): `npm run brand:compare` → `screenshots/brand-v3/compare__{1440,390}__{light,dark}.png`. At 390 the collage starts below the hero text (y 705, headline ends at y 240), subject tiles are two per row (172px each), and there's no horizontal scroll.
- Tests: `src/components/yemeksepeti/YsBrandV3Phase1A.test.tsx` (hero on/off, D3 card has no person, D1 class, tiles and legend, glyph map, card rank pill and chips are `v3:`-only). `YsHeroCollage.tsx` is added to the "text lives in the copy file" check.

Composition (BRAND.md §3):
- Hero: black headline, yellow highlight and sticker, yellow block, one pink button. The exception allowed by rule 2.
- Directory: one shared treatment per repeated item. Every rank pill is ink, every chip a soft tint, every primary button `--pink-deep`. The selected sort chip is ink, not pink. The favourites banner is already a soft tint (`--pink-pale`), so it stays as it is.
- Subject tiles: soft tints only, one per exam. No strong moment.

What changes under v3, and where:
- **D1** applies to the hero's "Hocaları gör" and the card's "Profili Gör". Other pink buttons on the page (pricing, tutor band, …) belong to PR 1B/1C.
- **Rank tiers (BRAND.md §4)** on the card photo: top 1.000 is an ink pill with a star, top 5.000 an ink pill, the rest an ink outline. In dark, `bg-ink` flips light and a yellow star vanished on it, so in dark the star is black. Under v3 the rank leaves the stats rail and goes onto the photo.
- **Favourite button**: a white circle with a pink heart, moved onto the photo's top-right corner.

## Intentional differences from the mockup

- **Hero:** no "YKS 2027 için hocalar ders alıyor" chip (no copy or fact for it) and no search bar (D2). The headline, subline and buttons keep the site's sizes and copy. The audience pills keep their down arrows next to the new dots.
- **Collage:** no university caption on the photo. In the mockup the notification card covers it, and on a phone the card covered it here too. The photo's alt text names the university.
- **Notification card (D3):** an icon in a pale pink circle instead of Zeynep's photo, and generic text.
- **Tutor cards:** keep the site's horizontal card (photo, bio, price rail) rather than the mockup's vertical one. Only the treatments in PLAN.md T1.2 are applied. Real tutors, prices and ranks, not the demo ones.
- **Subject tiles:** every subject the API returns (30), not the mockup's 12, in API order. Hover draws an ink ring instead of the mockup's lift.

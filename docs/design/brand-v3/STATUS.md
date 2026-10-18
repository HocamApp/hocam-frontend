# Brand v3: status

**This file is the current state of the rollout.** `PLAN.md` is the plan; `BRAND.md` is the color system. Update this file at the end of every task. Last updated 18 October 2026 (Phase 1B review).

## Where we are

Direction approved (14 October 2026): option "E2" from the palette exploration, black + pink + yellow with soft tints.

Phase 0 is merged (#345): the compare harness, the scoped tokens, the `v3:` Tailwind variant and the `NEXT_PUBLIC_BRAND_V3` flag.

Phase 1A is merged (#347): the hero collage, the tutor cards and the subject tiles, with Baha's review fixes.

Phase 1B is merged (#351): the verified band, the student steps, pricing and guarantees, with Baha's review answers (D8, D9). With the flag off every page checked is pixel-identical to `main`. Next: PR 1C (T1.9 to T1.12).

## Progress

| Task | State | PR | Notes |
|---|---|---|---|
| T0.1 Mockup in compare harness | done | #345 | `npm run brand:compare` → `screenshots/brand-v3/` |
| T0.2 Tokens | done | #345 | See "Phase 0 notes" for three additions to the plan |
| T0.3 Flag | done | #345 | Flag off: pixel-identical to `main`, both `HOME_V2` states, 1440/390, light/dark |
| T1.1 Hero | done | #347 | Collage (D4), generic notification card (D3) |
| T1.2 Tutor directory | done | #347 | Free-trial tag skipped (Baha) |
| T1.2b Promo row (new) | skipped | | D7: skip for now |
| T1.3 Subject grid | removed | #347, #352 | Shipped in #347; #352 took the section off the homepage. See "Open for Baha" |
| T1.4 Verified band | done | #351 | Black type and button on the pink band, black checklist card; hex literals gone |
| T1.5 University strip | checked, no change | #351 | The heading picks up the v3 black through `--ys-neutral-strong`; the logos keep their own colours; edge fades are `--paper` (unchanged). Nothing strong, so §3 holds |
| T1.6 Student steps | done | #351 | No floating notification cards (D9) |
| T1.7 Pricing | done | #351 | Example opens on "En popüler" under v3 (D8) |
| T1.8 Guarantees | done | #351 | |
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
| D8 | Pricing example: which plan is selected | **Answered by Baha (18 Oct 2026):** the example opens on the "En popüler" plan, so the pink border and the pink tag are on the same row. Under v3 only; a tutor without that plan keeps the 1-month plan. With the flag off it still opens on 1 month |
| D9 | Floating notification cards in the student steps | **Answered by Baha (18 Oct 2026):** no floating cards |

## Open for Baha

- Nothing open from Phase 1A. See "Answered after Phase 1A review" below.
- **Subject grid is gone from the homepage.** #352 (Arda, 16 Oct 2026, "removes only the requested homepage elements") deleted `YsSubjectGrid.tsx` and its copy, along with the hero's audience row. So the 1B review fix for the desktop tiles (smaller glyphs, overflow hidden, 6 per row) has nothing to apply to and was not done. If the grid should come back, it's a restore of `YsSubjectGrid.tsx` from `6b68a1e` plus that fix, in its own PR, after agreeing with Arda.

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

## Answered after Phase 1A review (Baha, 15 October 2026)

1. **Card subject chips:** when the data says which exam a subject is for, the chip says it ("TYT Matematik", "AYT Matematik") and takes that exam's tint. When it doesn't, every chip gets one treatment (`--pink-soft`, ink text). No pink/yellow switching without a label. Done in #347: a tutor teaching Matematik in both exams now gets two chips. Other exams ("KPSS Tarih") are labelled on the plain outline.
2. **Free-trial tag:** skipped. The "Deneme Dersi Al" button covers it.
3. **Subject signs:** Coğrafya "40°N" (also on Coğrafya-1 and -2, like Tarih-1/-2), Felsefe "∃", Sosyoloji "%". Din Kültürü stays without one.
4. **Subject grid on phones (under 768px):** the first 8 tiles, then "Tüm dersleri gör" (`subjects.showAll` in `ysHomeCopy.ts`) opens the rest and moves focus to the first new tile. Desktop shows all.
5. **Notification text** stays "Deneme dersin onaylandı" / "20 dakika · ücretsiz".
6. The `" 2.ts"` duplicate files in `src/` are iCloud copies; Baha handles them. Leave them alone.

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

## Phase 1B notes

How it was checked:
- Flag off: frozen screenshots pixel-diffed against `main` on `/` (HOME_V2 on and off), `/yks-ozel-ders`, `/hocalar-nasil-dogrulaniyor` and `/nasil-calisir`. The last two use `YsChecklistCard` and the step components outside the homepage. All identical at 1440 and 390, light and dark. The pricing plan box only renders for a signed-in user, so it was checked through a temporary preview route (not committed) on both `main` and the branch: identical with the flag off.
- Flag on: `npm run brand:compare` with `HOME_V2=true`, plus the plan box through the preview route in both themes. At 390 there's no horizontal scroll.
- Tests: `src/components/yemeksepeti/YsBrandV3Phase1B.test.tsx`. `PackageExample` in `YsPricing.tsx` is now exported for it.

What changes under v3:
- **T1.4 verified band:** stays full pink. Its type is `--on-accent` (black, 5.3:1). The "İlk 15.000" pill is yellow through the `--gold` alias. The button is black with paper text. I used `--band`/`--on-band` rather than the plan's `bg-ink text-paper`, because ink flips light in dark mode while the pink band doesn't. The checklist card is `--band`, with `--on-band-quiet` check circles and `--on-band-mid` secondary text. The Phase 0 hex literals on the button are gone: its text is `--ink-on-light` and its hover a new `--surface-pressed-on-light` token (same values, so identical with the flag off).
- **T1.6 student steps:** no left rule or dividers. The active step is a white (`--surface`) card with a yellow number tile, the others have white tiles. The screenshot sits as a white card on a pale pink backdrop, on wide screens and phones alike. The heading's "seç" pill stays full pink, the one allowed below the hero.
- **T1.7 pricing:** the heading pill is pale pink with ink text. The three fact cards each get the same 64px pale pink tile (40/dakika, ₺, 20'/deneme; text in `ysHomeCopy.ts`, numbers from `ysHomeFacts.ts`). The plan box is `--band`. Plan rows are themed (paper, the selected one surface) with a 2px pink border on the selected plan, and the radio dot is pink. "En popüler" is pink: `--pink-deep`, not `--pink`, because the text is 11px white (D1's reasoning, 4.8:1 against 3.7:1). Discount tags are `--yellow-soft`, check circles `--on-band-quiet`, and the avatar has no ring (its fallback initials sit on `--on-band-quiet`).
- **T1.8 guarantees:** the heading pill is pale pink. All four icon tiles are pale yellow, 48px. The "iptal ve iade koşulları" link is ink and underlined instead of pink: pink text on a white card is 3.5:1 (BRAND.md §6).

Composition (BRAND.md §3):
- Verified band: the pink band is the strong moment. The black checklist card and button are the plan's and the mockup's; on a pink surface, black is the text colour.
- Student steps: the "seç" pill is the strong moment. The yellow active-number tile is a small highlight on one row only.
- Pricing: the black plan box is the strong moment. The fact tiles and discount tags are soft.
- Guarantees: soft only (pale pink pill, pale yellow tiles).

### Phase 1B review round (18 October 2026)

- **Updated with main** (#352 to #363). No conflicts. #352 removed the subject grid and the hero's audience row from the homepage; see "Open for Baha".
- **AttentionNotice (#362, #363)** is only used on the coaching session list, outside the homepage's `data-brand="v3"` scope, so the v3 flag doesn't touch it in Phase 1. For Phase 2: its action is "the one pink pill button, white text". After the global flip `--pink` is `#FF2070`, where white text is 3.7:1, so T2.2 should give that button `--pink-deep` per D1.
- **Pricing (D8):** `exampleSelectedDays()` in `YsPricing.tsx`. The box only renders for a signed-in visitor, so this is covered by `YsBrandV3Phase1B.test.tsx` (selected row = the "En popüler" row under v3, 1 month with the flag off or without a 3-month plan), not by a screenshot.
- **"Sen sadece ___" pill:** not clipped. Measured on a flag-on build at 1440, 390 and 360: at rest every word fits inside the pill (widest is "gün belirle", 258px against a 328px heading at 360; no overflow). The "..elirle" was the full-page shot landing mid-swap. `npm run brand:compare` (and `home:compare`, same script) now shoots the site with reduced motion, which holds the heading on "seç".
- **Checks:** flag off, frozen screenshots pixel-diffed against `main` on `/`, `/yks-ozel-ders`, `/hocalar-nasil-dogrulaniyor`, `/nasil-calisir`, `/veliler` and `/hoca-ol`, at 1440 and 390, light and dark, with `HOME_V2` off and on, tutor directory loaded: all 48 identical (`/nasil-calisir` 1440 light was shot twice; the first time a step screenshot hadn't finished loading on the `main` side). Flag on: `npm run brand:compare` → `screenshots/brand-v3/`, no horizontal scroll at 390.
- **Local runs need port 3000.** The Railway API only allows CORS from `http://localhost:3000`; a build served on another port renders an empty tutor directory. The frozen-diff harness answers `/api/` from a shared cache with the page's own origin, so it can run two servers side by side.

## Intentional differences from the mockup

- **Hero:** no "YKS 2027 için hocalar ders alıyor" chip (no copy or fact for it) and no search bar (D2). The headline, subline and buttons keep the site's sizes and copy. The audience pills keep their down arrows next to the new dots.
- **Collage:** no university caption on the photo. In the mockup the notification card covers it, and on a phone the card covered it here too. The photo's alt text names the university.
- **Notification card (D3):** an icon in a pale pink circle instead of Zeynep's photo, and generic text.
- **Tutor cards:** keep the site's horizontal card (photo, bio, price rail) rather than the mockup's vertical one. Only the treatments in PLAN.md T1.2 are applied. Real tutors, prices and ranks, not the demo ones.
- **Verified band button** is `--band`, not `bg-ink`, so it stays black in dark mode (see Phase 1B notes).
- **Student steps:** the site's real step texts and screenshots; no floating notification cards (D9). The step tabs keep their click-to-switch behaviour.
- **Pricing fact cards** keep the site's label/value/body text beside the new tile. The mockup folds them into one line ("Ders başı 400 – 1.400 ₺").
- **Pricing plan box:** real plans for the top-rated tutor, shown only to signed-in visitors as before. Rows are a vertical list, not the mockup's 2×2 grid. The "En popüler" tag is `--pink-deep` and unrotated.
- **Subject tiles:** not on the homepage since #352. (When they were: every subject the API returns, 30, on desktop; the first 8 plus "Tüm dersleri gör" below 768px; API order; an ink ring on hover.)
- **Hero audience row** ("Ders almak istiyorum / Velisiyim / Hoca olmak istiyorum"): removed by #352, so the mockup's dotted pills aren't there.

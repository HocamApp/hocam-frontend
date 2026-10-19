# Brand v3: implementation plan

**Goal:** ship the v3 color system (`BRAND.md`) on the homepage first, then roll it out to every page, then lock it in so new work can't drift.

**Read first, in this order:** `CLAUDE.md`, `AI_AGENT_RULES.md`, `docs/current-product-and-technical-state.md`, `docs/rebrand-handover.md` (the traps in §3 apply here), then `BRAND.md` and this file. Progress is tracked in `STATUS.md` in this folder; update it at the end of every task.

## Ground rules for every task

1. **Copy and numbers never come from the mockup.** The mockup uses demo tutors, demo prices and shortened text. Every sentence stays in `ysHomeCopy.ts`, every number in `ysHomeFacts.ts` or `lib/lessonPricing.ts`. If the mockup shows something that has no copy or fact yet, stop and list it in `STATUS.md` under "Open for Baha".
2. **Flag off means no change.** Everything in Phase 0 and Phase 1 is behind `NEXT_PUBLIC_BRAND_V3`. With the flag off, the site must look exactly like `main` today.
3. **Tokens, not hex.** No hex values in components. Use the tokens from `BRAND.md` through Tailwind classes. The only file with brand hex values is `globals.css`.
4. **Check the composition rules.** After each section, check it against `BRAND.md` §3 (one strong moment per section, repeated items share one treatment, yellow never as text, etc.).
5. **Light and dark, 390 and 1440.** Every PR includes `npm run home:compare` output (or the equivalent screenshots for non-home pages) at both widths and both themes.
6. **Small PRs.** One PR per task group below. Don't mix Phase 1 sections into the Phase 0 PR.

## How the scoping works

Today's tokens (`--pink`, `--ink`, `--gold`, ...) are used by about 200 files. Changing their values in `:root` would repaint the whole site at once. Instead:

- **Palette:** a `[data-brand="v3"]` block in `globals.css` redefines the tokens with v3 values. Only elements inside that attribute see v3 colors. In Phase 1 only the homepage's `.ys-root` gets the attribute.
- **Composition:** a Tailwind variant `v3:` (`[data-brand="v3"] &`) lets a component change classes only under v3, for example `bg-pink v3:bg-pink-soft`. With the flag off the base class wins, so the old look is untouched.
- **Structure:** layout changes (the hero collage, subject tiles) branch in JSX on `BRAND_V3_ENABLED`, passed as a prop with the flag as default, the same pattern `YemeksepetiHome` uses for `v2`.

In Phase 2 the `[data-brand="v3"]` values move to `:root`, so every page gets the new palette. In Phase 3 the `v3:` classes are collapsed into plain classes and the variant is deleted.

---

## Phase 0: foundation (one PR)

### T0.1 Mockup in the compare harness
- Mockup files are in `docs/design/brand-v3/mockup/` (`home.html`, `components.html`, `images/`).
- `scripts/home-mockup-compare.ts`: read the mockup path from `HOME_COMPARE_MOCKUP` (default stays the current homepage-rebuild mockup) and the output folder from the existing `HOME_COMPARE_OUT_DIR`. The v3 mockup has no review notes or bottom bar; make sure the stripping step doesn't fail when they're missing.
- Add `npm run brand:compare` that runs it with `HOME_COMPARE_MOCKUP=docs/design/brand-v3/mockup/home.html` and `HOME_COMPARE_OUT_DIR=screenshots/brand-v3`.
- **Done when:** `npm run brand:compare` writes mockup|site pairs at 1440 and 390, light and dark.

### T0.2 Tokens
- In `globals.css`, add a `[data-brand="v3"]` block with every value from `BRAND.md` §2, and a `.dark [data-brand="v3"]` block with the dark values. Include the new tokens (`--pink-soft`, `--yellow`, `--yellow-soft`, `--band`, `--on-band`, `--on-band-mid`, `--on-band-quiet`, `--on-accent`) and the changed ones (`--pink`, `--pink-deep`, `--ink`). Inside the block, set the legacy names as aliases: `--pink-pale: var(--pink-soft)`, `--gold: var(--yellow)`, `--gold-ink: var(--on-accent)`.
- Also define the new tokens in `:root` and `.dark` with values that keep today's look (for example `--pink-soft: var(--pink-pale)`, `--yellow: var(--gold)`, `--band: var(--ink)`), so a `v3:` class used outside the scope still resolves to something sane.
- In `tailwind.config.ts`: add `pink.soft`, `yellow` (`DEFAULT`, `soft`), `band`, `on-band` (`DEFAULT`, `mid`, `quiet`), `on-accent`. Do not add `black` (see `BRAND.md` §2).
- Add the `v3` variant with a small plugin: `addVariant("v3", '[data-brand="v3"] &')`.
- **Done when:** a test div with `data-brand="v3"` shows `bg-yellow-soft` as `#FDFFC7` in light and `#384123` in dark, and `v3:bg-pink-soft` applies only inside the attribute.

### T0.3 Flag
- `src/lib/featureFlags.ts`: `brandV3EnabledFromEnv` and `BRAND_V3_ENABLED` from `NEXT_PUBLIC_BRAND_V3`, on only when exactly `"true"`. Same shape and tests as `homeV2EnabledFromEnv`.
- `YemeksepetiHome`: new prop `brandV3 = BRAND_V3_ENABLED`; set `data-brand="v3"` on `.ys-root` when it is on.
- **Done when:** flag off, `npm run home:compare` matches `main` pixel for pixel. Flag on, the homepage shows the v3 hues (black text, `#FF2070` pink, yellow where gold was) with no layout change. Unit tests and `npm run build` pass.

---

## Phase 1: homepage (three PRs)

Each task: change only what's listed, gate it with `v3:` classes or the `brandV3` prop, compare against the matching section of `mockup/home.html`, check `BRAND.md` §3.

### PR 1A: top of the page

**T1.1 Hero (`YsHeroIntro`).** The section the owners liked most. Needs D4.
- Headline: the last word sits on a `--yellow` highlight (radius 14, padding 0 12px, rotated -1.5deg).
- Replace `CircularGallery` with the collage when `brandV3` is on: main campus photo (radius 32, 3px ink border) with a `--yellow` block behind it rotated 3deg; a second, smaller campus photo top-left rotated -5deg with a 3px white border and `--shadow-float`. Photos and alt text come from `YS_CAMPUS_ITEMS`.
- Sticker: 112px `--yellow` circle, 3px ink border, rotated 10deg, text from `MAX_TUTOR_YKS_RANK` ("YKS'de / İlk 15.000 / hocalar").
- Notification card overlapping the bottom-left of the photo: white, `--shadow-float`, radius 18, avatar + title + one line + a pink unread dot. Content: see D3.
- Audience row (Ders almak / Velisiyim / Hoca olmak): white pills with a line border and a 10px dot: pink, ink, yellow.
- Mobile: the collage stacks under the text and keeps its proportions; the sticker and card must not cover the headline.

**T1.2 Tutor directory (`YsTutorDirectory`, `components/tutors/TutorCard`, `YsPromoBanners`).**
- Card: rank pill `bg-ink text-paper` overlapping the photo's bottom edge; free-trial tag `--yellow`; favorite button a white circle with a pink heart; TYT chips `--pink-soft`, AYT chips `--yellow-soft`.
- Filters: selected `bg-ink text-paper`, others white with a line border.
- `TutorCard` is shared with `/tutors` and other pages. The homepage `.ys-root` carries `data-brand="v3"`, so `v3:` classes only apply there. Gate every card change with `v3:`.
- `YsPromoBanners` (the favorites banner) keeps its layout; check it against `BRAND.md` §3 and move any strong color that competes with the cards to a soft tint.

**T1.2b Promo row (new, needs D7).** The mockup's row of three banners under the subject grid (free trial, packages, parents) doesn't exist on the site. If D7 is yes: one strong banner in the middle (`--band`, yellow sticker with `MAX_PACKAGE_DISCOUNT_PERCENT`), two soft ones (`--yellow-soft`, `--pink-soft`) with ink text and ink buttons. The headlines in the mockup are placeholders; the copy goes into `ysHomeCopy.ts` only after Baha writes or approves it.

**T1.3 Subject grid (`YsSubjectGrid`).**
- From text pills to tiles: 128px tall, radius 20, `--pink-soft` for TYT and `--yellow-soft` for AYT, ink text, exam label top-left, subject name bottom-left.
- A large subject glyph as a watermark top-right (∑ Matematik, Aa Türkçe, λ Fizik, H₂O Kimya, DNA Biyoloji, 1453 Tarih, ∫ AYT Matematik, F=ma AYT Fizik, pH AYT Kimya, △ Geometri, EN İngilizce, and so on). Glyphs live in one map in the component; a subject without a glyph shows none. Glyph color: pink at 16% on TYT tiles, ink at 10% on AYT tiles, `aria-hidden`.
- Grid: `repeat(auto-fill, minmax(150px, 1fr))`, so two per row on phones.
- Legend top-right: two small squares, TYT and AYT.

### PR 1B: middle

**T1.4 Verified band (`YsVerifiedBand`).** Stays full `--pink`, the page's one big pink surface. Text becomes `--on-accent` (black), not white. The "İlk 15.000" inline pill is `--yellow`. Button: `bg-ink text-paper`. The checklist card is `--band` with `--on-band-quiet` check circles (not yellow).

**T1.5 University strip.** No change.

**T1.6 Student steps (`YsHowItWorks`, `YsStepTabs`, `YsStepList`).** Heading highlight on "seç" stays full pink (the one allowed below the hero). Active step: white card, number tile `--yellow`; other numbers on white tiles. Screenshot backdrop `--pink-soft`. The two floating notification cards from the mockup are optional; if added, their text follows D3.

**T1.7 Pricing (`YsPricing`).** Heading pill `--pink-soft` with ink text. The three fact tiles (40 dakika, ₺, 20') are all `--pink-soft`. The plan box is `--band`; the selected plan gets a pink border and the "En popüler" `--pink` tag; discount tags are `--yellow-soft`; check circles `--on-band-quiet`; no colored ring on the avatar.

**T1.8 Guarantees (`YsGuarantees`).** Heading pill `--pink-soft`. All four icon tiles `--yellow-soft` with ink icons.

### PR 1C: bottom

**T1.9 Parents panel (`YsParentsPanel`).** Label pill `bg-ink text-paper`; icon tiles `--paper`; nothing else.

**T1.10 Tutor band (`YsTutorBand`).** `--band` background. The highlight word on `--yellow`, the primary button `--yellow`. Everything else quiet: check circles `--on-band-quiet`, step numbers `--on-band` at 40%, step cards `--on-band-quiet` borders.

**T1.11 Testimonials (`YsTestimonials`).** Cards cycle `--yellow-soft`, white with a line border, `--pink-soft`. Quote mark ink (pink on the white card). Only approved testimonials render, as today.

**T1.12 FAQ (`YsHomeFaq`).** Selected tab `bg-ink text-paper`.

**T1.13 Review.** Run `npm run brand:compare`, attach the pairs to the PR, list every place the site differs from the mockup on purpose (real copy, real data) in `STATUS.md`. Baha reviews with the flag on in a preview deploy. When approved, the owners set `NEXT_PUBLIC_BRAND_V3=true` in Vercel Production and redeploy.

**Not in Phase 1:** the navbar and footer are rendered by `(main)/layout.tsx`, outside `.ys-root`, so they keep today's colors until Phase 2 (D6). The dark search bar from the mockup is not built unless D2 says so.

---

## Phase 2: every page

Start only after the homepage has run with the flag on in Production and the owners approve.

### T2.1 Global flip (one PR)
- Move the `[data-brand="v3"]` values into `:root` and `.dark`. Keep the attribute block empty for one release, then delete it.
- Change the `v3` variant to always match (`addVariant("v3", "&")`) so homepage classes keep working.
- Remove `BRAND_V3_ENABLED` and the `brandV3` prop branches, keeping the v3 path.
- Point the shadcn HSL tokens at v3: `--primary` (pink), `--foreground`/`--ring` (ink).
- Every page now has the new hues. Nothing else changes in this PR.
- **Done when:** screenshots of the surfaces in T2.3 show only hue changes, and anything that broke (mostly old gold surfaces that are now bright yellow) is listed in `STATUS.md`.

### T2.2 Shared components (one PR)
Fix these first, since pages inherit them: `ui/button.tsx` (primary per D1, secondary ink outline), `ui/badge.tsx`, `shared/StatusBadge` (statuses per `BRAND.md` §4), tabs, `ui/sonner.tsx` (the Toaster uses `richColors`; make sure its colors match or turn it off), `ui/skeleton.tsx`, `ui/calendar.tsx` (selected day pink, lesson days `--yellow-soft`), the mobile tab bar (active item `--pink-soft` pill), the navbar, the footer (`--band`, outline pill).
The notification cards keep their emojis and their own colors on purpose (see `docs/rebrand-handover.md` §1). Ask Baha before changing them.

### T2.3 Surface audit (one PR per group, in this order)
For each group: screenshot 390 and 1440, light and dark, before and after; check every section against `BRAND.md` §3 and §4; fix what fails; update `STATUS.md`.

1. Tutor list and profile: `/tutors`, `/tutors/[id]`, `hoca-bul`, `components/tutors/`
2. Booking and checkout: `(checkout)`, `components/lessons/` (BookingModal, BookingCard, LessonRequestCard)
3. Student and tutor dashboards: `/home` (authenticated), `/dashboard/*`, `/schedule` (keep `--subject-1..6` as the schedule's category palette unless it clashes), `/favoriler`
4. Messages: `/messages`, `components/messaging/`
5. Marketing pages: `/hoca-ol`, `/veliler`, `/nasil-calisir`, `/hocalar-nasil-dogrulaniyor`, `/ucretsiz-deneme-dersi`, `/hakkimizda`, `/hakkimizda-v2`, `/iletisim`, `/yks`, `/yks-ozel-ders`, `/araclar/*`
6. Auth and onboarding: `(auth)`, tutor onboarding and tutorial, the entry dialog
7. Profile, support, legal: `/profile`, `/support`, `(legal)`, `/kvkk`
8. Admin: `/admin-control` (lowest priority; hues only is fine)

### T2.4 Outside the repo (owners)
Logo color check, favicon, OG/Twitter image, email templates (backend), Instagram templates, the Jitsi/JaaS console branding (`CLAUDE.md` notes it lives there, not in code). List them in `STATUS.md`; Claude Code can't change them.

---

## Phase 3: lock it in

- **T3.1** Collapse `v3:` classes: wherever `X v3:Y` appears, keep `Y` and drop `X`. Delete the variant.
- **T3.2** Remove the aliases (`--gold`, `--gold-ink`, `--pink-pale`) after replacing their uses, and the `--brand-50..900` ramp.
- **T3.3** Add `scripts/check-brand-colors.ts` to `prebuild`, next to `check-home-facts.ts`. It fails on: hex colors in `src/` outside `globals.css` (allowlist the notification cards file); Tailwind default palette classes (`bg-red-100`, `text-yellow-500`, ...); `text-yellow` / `text-gold` (yellow as text).
- **T3.4** Docs: add a line to `CLAUDE.md` pointing to `docs/design/brand-v3/BRAND.md` for color; note in `STATUS.md` that DESIGN.md's color section is superseded.

---

## Decisions for Baha

Defaults are what Claude Code does if there's no answer yet.

| # | Question | Default |
|---|---|---|
| D1 | White text on `#FF2070` is 3.7:1, below the 4.5:1 minimum for button-size text. Fill small white-text buttons with `--pink-deep` (`#E0105E`, 4.8:1, barely visible difference), or keep `--pink` exactly like the mockup? | ~~`--pink-deep` for button fills~~ Reversed 19 Oct 2026 by the owners: the pink is back to `#FA0050` and buttons use `--pink` (white text 4.05:1, as before v3) |
| D2 | The mockup has a dark search bar under the hero. The navbar already has search. Add it? | Skip |
| D3 | The hero notification card says "Zeynep deneme dersini onayladı". Zeynep's testimonial isn't approved. Use a real approved person, or generic text with no name? | Generic, no name or photo: an icon instead of the avatar |
| D4 | Replace the rotating campus gallery in the hero with the collage? | Yes |
| D5 | Ship dark mode with the starting values in `BRAND.md` and check screenshots, or force light on the homepage? | Ship dark with the starting values |
| D6 | Navbar and footer keep today's colors until Phase 2? | Yes |
| D7 | Add the mockup's three-banner promo row (free trial, packages, parents)? It's new and needs copy. | Skip until Baha writes the copy |

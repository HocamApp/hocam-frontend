# Hocam Homepage Rebuild: Execution Plan for Claude Code

**Goal:** make the homepage (`/`) look and behave exactly like `homepage-mockup.html`, which is in this folder. After that, build three supporting pages from the same parts.

**Files in this folder**
- `HOCAM_HOMEPAGE_PLAN.md`: this file.
- `homepage-mockup.html`: **the visual spec.** Open it in a browser. Its CSS values are the source of truth for layout, spacing and sizes. Its images are copies of files already in `public/`.

---

## Step 0: before touching code

1. **Work in the live repo, not in `c2c-tutoring/frontend/`.** That folder's `origin` is `donbahadir/hocam-frontend` and it was last fetched on 6 July 2026. It still has the old login homepage, 45/60/90-minute lessons and the old package terms. The site you are rebuilding is `HocamApp/hocam-frontend` `main`, which auto-deploys to Vercel.
   - Clone it, or add it as a remote and `git fetch origin --prune`.
   - Confirm `src/components/yemeksepeti/YemeksepetiHome.tsx` exists.
   - If it doesn't exist, stop and tell Baha.
2. Read, in this order, and follow them:
   - `AI_AGENT_RULES.md`: binding. Wins over this plan if they conflict.
   - `docs/current-product-and-technical-state.md`
   - `CLAUDE.md`
   - `docs/rebrand-handover.md` §1 and §3: DESIGN.md's rules and the known traps.
   - If `DESIGN.md` exists on this machine, read it too.
3. Copy this folder into the repo as `docs/design/product-home/homepage-rebuild/`: the plan and `homepage-mockup.html`.
4. **Git:** follow `AI_AGENT_RULES.md` §6 exactly. That means an `agent/…` branch from `origin/main`, then lint + typecheck + tests, a PR, green checks, and a merge commit. Never push to `main` directly. Use one branch and PR per phase:
   - **A:** T00–T04
   - **B:** T05–T08
   - **C:** T09–T12
   - **D:** T13–T16

## How to read the mockup
- Blue tags (`T05`, `S-2`, …) and blue dashed boxes are review notes. The "Notları gizle" button at the bottom hides them. **Don't build the notes or the bottom bar.**
- **Dotted underline** (`20 dakika`, `15.000`, `12 saat`): the value already exists in code. Read it from `ysHomeFacts.ts` or `lessonPricing.ts`, never retype it.
- **Dashed box** (`[X gün]`, `[D5]`): Baha hasn't decided yet. Build it as a `TODO` fact (T01) so it can't ship by accident.
- Photos, names and prices in the mockup's tutor cards are demo data. The real sections use real API data.

---

## 1. Rules for every task

**Fidelity**
1. Build what the mockup shows: same sections, order, layout and components. Don't add, remove, reorder, restyle or "improve". If something can't be built as shown, stop and ask.
2. **Reuse what exists.** The homepage is `src/components/yemeksepeti/`. Extend those components; don't write parallel ones. The existing pieces are:
   - `YsHeroIntro`, `YsTutorDirectory`, `YsVerifiedBand`, `YsUniversityStrip`, `YsHowItWorks` + `YsJourneyHeading`, `YsTestimonials`, `YsHomeFaq` (on top of `support/SupportAccordionSection`), `YsFooter`
   - `.ys-band`, `.ys-shell` and `.ys-root` in `src/styles/yemeksepeti.css`
   - `ui/button.tsx` pills, `ui/badge.tsx`, the tutor card's gold rank badge, the checkout's package radio card, `ui/marquee`
3. **Tokens only.** The mockup's CSS variables are copied from `globals.css`. Use the existing utilities: `bg-paper`, `bg-surface`, `text-ink`, `text-ink-mid`, `border-line`, `bg-pink`, `text-pink`, `bg-pink-pale`, `rounded-card`, `rounded-input`, `rounded-pill`, `text-h1`, `text-body-l`, and so on.
   - No hex values and no arbitrary `[...]` colors.
   - **The only exception:** elements sitting on the pink band. They use literal white and `#02171a`, the same way the existing "Nasıl doğruluyoruz?" pill does, because the band is pink in both themes.
4. **Dark theme must work.** The site has a dark theme.
   - Use `bg-surface`, not `bg-white`.
   - On `bg-ink`, text is `text-paper`, never `text-white`. `--ink` becomes light in dark mode.
   - Semi-transparent text on ink is `text-paper/70` and similar.
   - Check every new section in both themes.
5. **DESIGN.md rules the mockup already follows.** Keep following them:
   - No tinted fill with same-hue text on it.
   - Badges are filled with inverted text, outlined, or have no container.
   - Gold is a surface, never a text or icon color.
   - Shadows only on things that really float; the calculator card and the band card get none.
   - No emoji, no em dash, no exclamation marks.
   - Currency goes after the number (`980 ₺`), with `formatPrice`.
   - `sen` register everywhere.
6. **Icons:** `@phosphor-icons/react`. In server components import from `@phosphor-icons/react/dist/ssr` (see the trap in rebrand-handover §3). Map the mockup's stand-in SVGs to Phosphor: ArrowDown, ArrowRight, Check, CreditCard, UserMinus, CalendarX, ArrowsLeftRight, ShieldCheck, VideoCamera, Receipt, ChatCircle.
7. **Breakpoints:** match the mockup at 1440px and 390px. It collapses at 1100 / 960 / 860 / 560, so map each to the nearest Tailwind breakpoint. There must be no horizontal scroll at 375px (`npm run responsive:check` already covers `/`).

**Content**
8. **All new homepage text goes in one file: `src/components/yemeksepeti/ysHomeCopy.ts`.** Components import strings from it. Turkish text doesn't live in JSX in new or edited homepage components. Baha will rewrite the copy later by editing only this file. Copy the mockup's text into it word for word.
9. Numbers never go in the copy file. They come from `ysHomeFacts.ts` (T01) and are interpolated. Copy entries that contain numbers are small functions, e.g. `trialBody: (f) => \`Deneme dersi ${f.TRIAL_MINUTES} dakika…\``.
10. **Payments aren't live.** `AI_AGENT_RULES.md` §1–2 and current-product-state apply here:
    - Never say money is held or paid out, or when.
    - Never mention IBAN.
    - Never show package counts as earnings.
    Those sentences are `TODO` facts in the mockup and stay that way.

**Process**
11. After each section task, run T00's comparison and attach both screenshots to the PR.
12. Keep the existing tests green and update the ones whose expectations change:
    - `YemeksepetiHome.test.tsx` (section order)
    - `YsHomeFaq.test.tsx`
    - `YsHowItWorks.test.tsx`
    - `YsFooter.test.tsx`
    - `YsThemeSurfaces.test.tsx`
    Add new tests to `test:unit`.

---

## 2. Final homepage order

`YemeksepetiHome.tsx` renders, top to bottom:

| # | Section | Component | Status | Task |
|---|---|---|---|---|
| 1 | Hero + audience row | `YsHeroIntro` | changed | T02 |
| 2 | Tutor directory | `YsTutorDirectory` | **unchanged** | – |
| 3 | "Hangi dersler var?" | `YsSubjectGrid` | new | T03 |
| 4 | Pink band + checklist card | `YsVerifiedBand` | changed | T04 |
| 5 | University strip | `YsUniversityStrip` | unchanged | – |
| 6 | Students: "Sen sadece …" + 7 steps | `YsHowItWorks` | changed | T05 |
| 7 | "Ne kadar ödersin?" | `YsPricing` | new | T06 |
| 8 | "Ters giderse ne olur?" | `YsGuarantees` | new | T07 |
| 9 | "Veliler için" | `YsParentsPanel` | new | T08 |
| 10 | Tutors ink band | `YsTutorBand` | new | T09 |
| 11 | "Öğrencilerden" | `YsTestimonials` | changed | T10 |
| 12 | FAQ with 3 tabs | `YsHomeFaq` | changed | T11 |
| – | Footer | `YsFooter` | changed | T12 |

Full-bleed sections sit outside `.ys-shell`, the same way `YsVerifiedBand` and `YsHowItWorks` already do: the pink band (4) and the tutors band (10). Anchors: `#ogrenciler` (6), `#fiyatlar` (7), `#veliler` (9), `#hocalar` (10). The FAQ keeps `FAQ_SECTION_ID`.

---

## 3. Tasks

### Phase A

**T00: Visual comparison harness**
- Add `scripts/home-mockup-compare.ts`, modeled on `scripts/home-v3-review-shots.ts`. It uses Playwright, needs no login, and works because `/` is public.
- It screenshots `docs/design/product-home/homepage-rebuild/homepage-mockup.html` (after removing the `review` class from `#page`) and `http://localhost:3000/` at 1440×960 and 390×844, full page, in both light and dark theme.
- It writes side-by-side PNGs to `screenshots/home-mockup/` (`screenshots/` is gitignored).
- Add the npm script `home:compare`.

**T01: Facts, placeholders, copy file**
1. **Extend `src/components/yemeksepeti/ysHomeFacts.ts`; don't create a new facts file.**
   - It already has: `TRIAL_MINUTES` (20), `MONTHLY_TRIAL_LIMIT` (3), `LESSON_MINUTES` (40), `MAX_PACKAGE_DISCOUNT_PERCENT` (30), `CANCELLATION_FREE_HOURS` (12), `PACKAGE_GRACE_DAYS` (14), `MAX_TUTOR_YKS_RANK` ("15.000").
   - Add, with a code-source comment for each like the existing ones:
     - `LESSONS_PER_WEEK = { min, max }` from `WEEKLY_LESSON_OPTIONS`
     - `PLAN_DURATIONS` from `PLAN_DURATION_DAYS` (labels via `formatPlanDuration`)
     - `AUTO_CONFIRM_HOURS = 24` (student confirms, or it auto-confirms after 24h; backend lifecycle rule; cite its source)
     - `SINGLE_LESSON_AVAILABLE = false` (retired, see current-product-state)
2. Add a `TODO` sentinel export and these undecided facts, all set to `TODO`:
   `PRICE_RANGE_TL`, `COMMISSION_PERCENT`, `PAYMENT_CHARGED_WHEN`, `TUTOR_PAYOUT_TEXT`, `TRIAL_PAID_TO_TUTOR`, `TUTOR_NO_SHOW_TEXT`, `REMAINING_ON_SWITCH_TEXT`, `TUTOR_MIN_WEEKLY_HOURS`, `VERIFICATION_REVIEW_DAYS`, `VERIFICATION_DOCS_DELETED_AFTER`, `RECORDING_POLICY_TEXT`, `PARENT_CAN_JOIN_TEXT`, `PARENT_CAN_PAY_TEXT`, `SUPPORT_REPLY_TEXT`, `OFF_PLATFORM_TEXT`, `TAX_TEXT`, `COACHING_TUTOR_TEXT`, `COMPANY_LEGAL_NAME`, `COMPANY_ADDRESS`, `COMPANY_MERSIS`.
   The policy answers (`TUTOR_NO_SHOW_TEXT`, cancellation details) must come from `DERS_POLITIKALARI_RAPORU.md`, which Baha and the other owners hold. Don't invent them.
3. `src/components/yemeksepeti/YsFact.tsx`: `export function YsFact({ value, label }: { value: unknown; label: string }): JSX.Element`.
   - If `value` is `TODO`: in development, render `[label]` with a dashed `border-line` outline. In production, render nothing (the build check below blocks it anyway).
4. `scripts/check-home-facts.ts` lists every `TODO` in `ysHomeFacts.ts` and exits 1.
   - Run it in `prebuild`, skipped when `ALLOW_HOME_TODOS=1`.
   - For Vercel preview builds only, set `ALLOW_HOME_TODOS=1` on the Preview environment, never on Production.
5. Create `ysHomeCopy.ts` with one exported object per section (`hero`, `subjects`, `band`, `students`, `pricing`, `guarantees`, `parents`, `tutors`, `testimonialsTitle`, `faq`, `footer`). Fill it as each task lands.

**T02: Hero** (`YsHeroIntro.tsx`)
1. Headline: second line is `bugünün öğretmeni`, with a lowercase "b". The `<br>` stays.
2. "Hoca ol" goes to `#hocalar` instead of `/register?role=tutor`. The "Hocaları gör" button doesn't change.
3. **New audience row** under the buttons:
   - A 14px `text-ink-mid` label, then three 44px outline pills: `border-line`, `bg-surface`, 15px medium text, and an `ArrowDown` in ink with no container.
   - Targets are `#ogrenciler`, `#veliler`, `#hocalar`. On hover the border turns `border-ink`.
   - The pills wrap on mobile.
4. Leave the carousel and subline alone.

**T03: Directory stays; add the subject grid**
1. `YsTutorDirectory` doesn't change. The homepage is the tutor directory, and pagination stays.
2. New `YsSubjectGrid.tsx`, rendered right after the directory inside the shell:
   - Reads the `["subjects"]` query that `app/(main)/page.tsx` already prefetches with `fetchPublicSubjects`.
   - Layout: a `bg-surface` `rounded-card` box with a `border-line` border, 32px padding, and two columns (260px, then the rest).
     - **Left column:** title and subline.
     - **Right column:** a **TYT** row and an **AYT** row of 36px ink-outline pills. Each pill links to `tutorListHref({ exam_type, subject })` from `lib/tutorDirectoryLinks.ts`.
   - Group by `exam_type`. Show only what the API returns.
   - The ink-filled "YKS koçluğu" pill renders only when `useCoachingFlag()` is on, and links to the coaching filter.
   - Below 860px it stacks into one column.

**T04: Pink band** (`YsVerifiedBand.tsx`)
1. Inside the band's shell, switch to a two-column grid, stacking below 860px.
2. **Left column:** the existing title, lead and pill, plus one new line under the lead: `Sadece YKS'de [İlk 15.000] içine girmiş öğrenciler hoca olabilir.` The `[İlk 15.000]` part is the existing gold rank badge, filled from `MAX_TUTOR_YKS_RANK`.
3. **Right column:** a checklist card.
   - Literal white background (band precedent), `#02171a` text, `rounded-card`, 28px padding, max 500px wide, right-aligned, **no shadow**.
   - A title, then three rows split by `border-line`: `Check` in `--success` with no container, a bold label and a subline. The rows are the three `TutorVerification` documents.
   - A footer line built from `VERIFICATION_REVIEW_DAYS` and `VERIFICATION_DOCS_DELETED_AFTER`.

### Phase B

**T05: Students** (`YsHowItWorks.tsx`)
1. Keep `YsJourneyHeading` with its rotating pill exactly as it is now. The mockup shows one frame of it. Add the centered 18px `text-ink-mid` subline under it.
2. Grid: steps on 5/12, screenshots on 7/12.
3. **Steps:** 7 steps, **all visible at rest**. The current version only shows the active step's description, so add a static mode and drop the tabbing on the homepage.
   - Keep the current look: left rule, `01.` in 13px `ink-mid`, 22px medium titles, 16px `ink-mid` bodies. The first step gets the ink left marker.
   - Step text comes from `ysHomeCopy.students.steps`. Numbers come from the facts: trial minutes and monthly limit in step 3, lessons per week and plan durations in step 4. Step 5 is `PAYMENT_CHARGED_WHEN`, TODO. Step 7 is `REMAINING_ON_SWITCH_TEXT`.
4. **Screenshots column:** sticky under the header (`top: calc(var(--app-header-h) + 24px)`), in a 2-column grid:
   - `01-tutor-list.png`, full width
   - `03-package-selection.png`, full width
   - `04-lesson-dashboard.png`, half width
   - lesson room, half width, as `05-lesson-room.png`. Until Baha adds it, show the striped placeholder in development only and hide the tile in production.
   - Each image sits in a `rounded-card` frame with a `border-line` border and a `bg-surface` caption bar.
   - Below 960px it's one column and not sticky.
   - `02-nazli-profile.png` isn't used here.

**T06: Pricing** (`YsPricing.tsx`, `#fiyatlar`)
1. Headline "Ne kadar [ödersin?]". Extract the pink pill from `YsJourneyHeading` into a static `YsPillHeading` (same classes, no rotation) and use it here and in T07. Centered subline.
2. **Left (5/12):** three `bg-surface` `rounded-card` fact cards:
   - lesson length + lessons per week + durations
   - `PRICE_RANGE_TL` (TODO)
   - the trial: `TRIAL_MINUTES` and `MONTHLY_TRIAL_LIMIT`, one per tutor
3. **Right (7/12):** a `bg-pink-pale` `rounded-card` example box that **reuses the checkout's package radio card and the gold "fiyat avantajı" badge**.
   - Example tutor: the first tutor in the prefetched `["tutors", { ordering: "rating" }, 1]` query.
   - Plans: `fetchTutorOfferedPlans(tutor.id)` (public) → `filterMatrixPlans` → `lessons_per_week === 2`, sorted by `duration_days`.
   - Per-lesson price and lesson count come from `calculatePackagePricing` with the plan's own discount. Labels come from `formatPlanDuration`, and "En popüler" goes on `MOST_POPULAR_DURATION_DAYS`.
   - The 1-month plan is shown selected. Nothing is clickable: this is an illustration, so link the whole box to that tutor's profile.
   - The mockup's 1.040 / 987 / 882 / 756 ₺ and 1/6/16/28% are from a demo screenshot. Use whatever the API and function return.
   - Three check lines underneath: one-time package, no card charge at request time, and "no extra fee on top of the profile price". That last line needs `COMMISSION_PERCENT` to be settled first, so it's TODO.
4. If the offered-plans call fails, hide the right box. Don't fall back to hard-coded plans.

**T07: Guarantees** (`YsGuarantees.tsx`)
- Headline "Ters giderse [ne olur?]" (`YsPillHeading`).
- Four `bg-surface` `rounded-card` cards, 24px padding. Each has a 44px `bg-paper` icon tile, an 18px semibold question and a 15px `ink-mid` answer. 4 → 2 → 1 columns.
- Answers:
  - payment: the no-charge-at-request sentence + `PAYMENT_CHARGED_WHEN`
  - no-show: `TUTOR_NO_SHOW_TEXT`
  - cancel: `CANCELLATION_FREE_HOURS` + a link to `/iptal-ve-iade`
  - switching: `REMAINING_ON_SWITCH_TEXT`
- **Check every answer against `/iptal-ve-iade` before finishing. If they disagree, stop and report.**

**T08: Parents** (`YsParentsPanel.tsx`, `#veliler`)
- A `bg-surface` `rounded-card` panel with 64px padding (32/24 on mobile) and 120px space above it.
- **Left column:** title, lead, and an outline pill "Veliler için tüm bilgiler →" linking to `/veliler`.
- **Right column:** four rows split by `border-line`, each with a 44px `bg-paper` icon tile (ShieldCheck, VideoCamera, Receipt, ChatCircle).
  - The "Her şey platformda" row describes how messaging works today: it opens only after a lesson request.
  - The other rows use `RECORDING_POLICY_TEXT`, `PARENT_CAN_JOIN_TEXT`, `PARENT_CAN_PAY_TEXT` and `SUPPORT_REPLY_TEXT`.

### Phase C

**T09: Tutors band** (`YsTutorBand.tsx`, `YsEarningsCalculator.tsx`, `src/lib/earnings.ts`, `#hocalar`)
1. **The band itself:**
   - Full bleed, outside the shell, 120px space above.
   - `bg-ink text-paper`. Add `.ys-band-ink` to `yemeksepeti.css`, mirroring `.ys-band`'s cut: `clip-path: polygon(0 56px, 100% 0, 100% calc(100% - 56px), 0 100%)`.
   - Padding 136px top, 150px bottom; 100/112 on mobile.
2. **Top row** (2 columns):
   - **Left:** 44px bold title, lead in `text-paper/80`, a pink "Hoca olarak başvur" button and a `border-paper/70` outline button "Hocalık hakkında her şey". Both go to `/hoca-ol` (T13).
   - **Right:** eligibility card with a `border-paper/20` border and `rounded-card`. Four lines, each with a `Check` icon in `text-paper`, **not gold**. Values: `MAX_TUTOR_YKS_RANK`, active student + `.edu.tr`, documents, `TUTOR_MIN_WEEKLY_HOURS`.
3. **Middle row** (6/12 + 5/12):
   - **Left:** a subtitle and 7 steps in the T05 step style, recolored: `border-paper/20` rule, `text-paper/55` numbers, `text-paper/70` bodies.
     - Step 4 uses `TRIAL_MINUTES` and `TRIAL_PAID_TO_TUTOR`.
     - Step 6 uses `AUTO_CONFIRM_HOURS` + `TUTOR_PAYOUT_TEXT` + `COMMISSION_PERCENT`. **No IBAN.**
     - Step 7's "Koçluk" chip and koçluk sentence render only when `useCoachingFlag()` is on.
   - **Right:** `YsEarningsCalculator`, a sticky `bg-surface` `rounded-card` form with no shadow:
     - a range for lessons per week (1–20, default 6, pink accent)
     - a number input for price (default: the lower end of `PRICE_RANGE_TL`)
     - **read-only** commission from `COMMISSION_PERCENT`. The mockup's editable commission field is for review only.
     - a `bg-paper` result box, using `formatPrice`
     - `monthlyEarnings(lessonsPerWeek: number, price: number, commissionPercent: number): { lessons: number; gross: number; commission: number; net: number }`, where `lessons = Math.round(lessonsPerWeek * 4.33)`.
   - **Safeguard:** the calculator promises tutor income while no payment provider is live (current-product-state, F-006). It renders only when `COMMISSION_PERCENT` is set **and** `NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW === "true"`. That flag defaults off, the same pattern as `NEXT_PUBLIC_PAYTR_ENABLED`. While it's off, the steps column goes full width.
   - Unit test: `monthlyEarnings(6, 1000, 20)` returns `{ lessons: 26, gross: 26000, commission: 5200, net: 20800 }`.
4. **Quotes row:** subtitle + two tutor testimonial cards from T10, with a `text-pink` "Profilini gör →" link when `tutorProfileId` is set.
5. Below 960px everything stacks, and the calculator isn't sticky.

**T10: Testimonials** (`YsTestimonials.tsx`)
1. Move the data into `ysTestimonials.ts`: `{ id, name, role: "student" | "tutor", meta, quote, photo, tutorProfileId?, approved: boolean }`.
   - **Delete Bahadir.**
   - Every other entry starts at `approved: false`, and only approved entries render.
   - Background: `docs/rebrand-handover.md` records that these aren't real students and that the owners chose to keep them. Baha re-decides that per entry.
2. **Students section:** "Öğrencilerden" as a static 3-column grid (1 column below 960px) using the existing card. **Remove the marquee.**
3. Tutor entries render in T09. A group with no approved entries doesn't render at all.

**T11: FAQ** (`YsHomeFaq.tsx`)
1. **Left column:** the title, then **three 36px tab pills** (Öğrenci / Veli / Hoca; ink-filled when active), then the existing pink link, which now goes to `#ogrenciler`.
2. Answers must be in the server HTML. Radix `AccordionContent` unmounts closed items. Either pass `forceMount` and hide closed content with `data-[state=closed]:hidden`, or switch to `<details>`. All three panels render; the tabs only toggle `hidden`. Keep the 200ms feel of `SupportAccordionSection`.
3. **Öğrenci tab:** keep the existing fact-backed answers. Update:
   - "Tek ders": no, with lessons per week and durations
   - discount: up to `MAX_PACKAGE_DISCOUNT_PERCENT`
   - cancellation: `CANCELLATION_FREE_HOURS`
4. **Veli and Hoca tabs:** mockup questions, with answers from facts. Answers still `TODO` block the build.
5. Add `FAQPage` JSON-LD with `components/seo/JsonLd`, covering only answers that render.
6. **Done when:** `curl -s localhost:3000 | grep` finds every answer, and the FAQ is readable with JS off.

**T12: Footer** (`YsFooter.tsx`)
1. Five columns: Hocam'ı keşfet (unchanged) · Nasıl çalışır? (add "Fiyatlar ve paketler" → `/#fiyatlar`) · **Kimin için? (new):** Öğrenciler `/#ogrenciler`, Veliler `/veliler`, Hoca ol `/hoca-ol` · Hocam (Hakkımızda, İletişim, and "Mobil uygulama yakında" as plain text) · Yasal Metinler (unchanged).
2. **Remove the App Store / Google Play badges** (`ui/store-badges`) from the footer.
3. Under the bottom row, add one 13px `ink-mid` line: `COMPANY_LEGAL_NAME · COMPANY_ADDRESS · MERSİS COMPANY_MERSIS · KVKK başvuru: iletisim@hocamozelders.com`.
4. Leave the Hakkımızda link on `/hakkimizda-v2`. That page is a deliberate noindex preview waiting to replace `/hakkimizda`. The swap is a separate decision.

### Phase D: supporting pages
There's no mockup for these. Build them only from the homepage components above. Use the `publicPageMetadata` / `JsonLd` / breadcrumb pattern the other public pages use, and add each one to the sitemap.
- **T13 `/hoca-ol`:** `YsTutorBand` as the hero, then the Hoca FAQ tab, then a final pink CTA to `/register?role=tutor`. Every "Hoca ol" link on the site points here (hero, footer, nav).
- **T14 `/veliler`:** `YsParentsPanel`, then `YsGuarantees`, then the Veli FAQ tab.
- **T15 `/nasil-calisir`:** the student steps (T05) and the tutor steps (T09) with an Öğrenciyim / Hocayım pill toggle. Both are server-rendered from `ysHomeCopy`, replacing the page's current four steps.
- **T16 `/hocalar-nasil-dogrulaniyor`:** add a "Kimler başvurabilir?" block (reuse the T04 card, `bg-surface` off the band) and FAQ items for review time, rejection, document deletion and who reviews. The deletion wording must match `/kvkk`.

## 4. Final QA
- [ ] `npm run home:compare`: `/` matches the mockup (notes hidden) at 1440 and 390, light **and** dark. Attach the images to the last PR.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:unit` and `npm run responsive:check` all pass.
- [ ] No Turkish strings in JSX in new or edited homepage components; everything comes from `ysHomeCopy.ts`.
- [ ] No hex colors outside the pink-band exception. No `text-white` on `bg-ink`.
- [ ] `useCoachingFlag` off: no koçluk pill, chip or sentence anywhere. `NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW` off: no calculator.
- [ ] Production `npm run build` passes, which only happens once Baha has filled every `TODO`. Until then, merge with the Preview-only `ALLOW_HOME_TODOS=1`, **don't promote to production**, and tell Baha which TODOs are left.

## 5. For Baha (not Claude Code)
- **Fill the TODOs** listed in T01. Cancellation and no-show answers come from `DERS_POLITIKALARI_RAPORU.md`. Payment timing waits for the payment provider.
- **Approve testimonials** one by one.
- **Add the lesson-room screenshot** as `public/images/how-it-works/05-lesson-room.png`.
- **Turn on `NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW`** only once tutor payouts are real.
- **Rewrite the copy** in `ysHomeCopy.ts`.

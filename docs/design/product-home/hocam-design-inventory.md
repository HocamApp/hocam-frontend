# Hocam Design Inventory

The **actual** design system in this repository, read from source and from usage
across `/home`, `/tutors`, `/tutors/[id]`, `/dashboard/student`,
`/dashboard/student/learning`, `/profile` and `/match`. Configuration files
alone were not treated as authoritative — usage counts are included where they
change the answer.

Everything the redesign builds must come from this list. Nothing from
`references/` may be added to it.

---

## 1. Typography

| Property | Value | Source |
| --- | --- | --- |
| Family | **Inter**, loaded via `next/font/google`, `subsets: ["latin"]`, applied as `inter.className` on `<body>` | `src/app/layout.tsx:12,38` |
| Fallback / second family | none — single-family system | — |
| Antialiasing | `antialiased` on `<body>` | `src/app/layout.tsx:38` |
| Language | `<html lang="tr">` | `src/app/layout.tsx:34` |

### Observed type roles (Tailwind classes actually used)

| Role | Class recipe | Where |
| --- | --- | --- |
| Page `h1` (hero) | `text-4xl font-bold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[3.55rem]` | `AuthenticatedHome.tsx:454` |
| Tutor-home `h1` | `text-3xl font-bold tracking-tight sm:text-4xl` | `TutorAuthenticatedHome.tsx:608,632` |
| Section `h2` | `text-2xl font-semibold tracking-tight sm:text-3xl` | `AuthenticatedHome.tsx:74,573`; `TutorAuthenticatedHome.tsx:102` — this is the **canonical section heading** |
| Card `h3` | `text-lg font-semibold tracking-tight` | `AuthenticatedHome.tsx:145,274` |
| `CardTitle` primitive | `text-2xl font-semibold leading-none tracking-tight` | `ui/card.tsx:39` |
| Lede / section description | `text-sm leading-6 text-muted-foreground sm:text-base` | `AuthenticatedHome.tsx:75` |
| Hero lede | `text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8` | `AuthenticatedHome.tsx:457` |
| Eyebrow / overline | `text-xs font-semibold uppercase tracking-[0.18em] text-primary` (hero) · `tracking-[0.14em]` (card) | `AuthenticatedHome.tsx:451,142` |
| Body small | `text-sm` | ubiquitous |
| Meta / caption | `text-xs font-medium text-muted-foreground` | `AuthenticatedHome.tsx:168` |
| Price | `text-lg font-semibold` + `text-sm text-muted-foreground` unit suffix | `TutorCard.tsx:154` |

Weights in real use: **400** (default), **500** (`font-medium`), **600**
(`font-semibold`), **700** (`font-bold`, hero only). No 300, no 800/900.

`text-muted-foreground` appears **542 times** — muted secondary text is the
dominant hierarchy device in this codebase, far more than color or size.

## 2. Color

shadcn/ui HSL-triple custom properties with a `.dark` class override. Tailwind
maps them via `hsl(var(--token))`.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--background` | `0 0% 100%` | `222 47% 11%` | page |
| `--foreground` | `222.2 84% 4.9%` | `214 32% 91%` | primary text |
| `--card` / `--card-foreground` | `0 0% 100%` / `222.2 84% 4.9%` | `220 37% 14%` / `214 32% 91%` | surfaces |
| `--popover` / fg | `0 0% 100%` | `219 36% 16%` | popovers, menus |
| `--primary` / fg | `222.2 47.4% 11.2%` / `210 40% 98%` | `213 94% 68%` / `222 47% 11%` | **near-black navy in light, blue in dark** |
| `--secondary` / fg | `210 40% 96.1%` | `217 33% 22%` | secondary buttons |
| `--muted` / fg | `210 40% 96.1%` / `215.4 16.3% 46.9%` | `217 33% 20%` / `215 20% 65%` | muted surfaces + text |
| `--accent` / fg | `210 40% 96.1%` | `216 30% 24%` | hover surfaces |
| `--destructive` / fg | `0 84.2% 60.2%` | `0 63% 45%` | errors |
| `--border`, `--input` | `214.3 31.8% 91.4%` | `216 26% 27%` | hairlines |
| `--ring` | `222.2 84% 4.9%` | `213 94% 68%` | focus ring |
| `--radius` | `0.5rem` | (shared) | radius base |

Source: `src/app/globals.css:5–49`; mapping in `tailwind.config.ts:13–47`.

**Critical property:** `--primary` **inverts** between themes (dark navy → light
blue). Any homepage surface that hardcodes a hex, or that assumes
"primary = dark", will break in dark mode. Existing code respects this by using
`bg-primary text-primary-foreground` and alpha tints (`bg-primary/10`,
`border-primary/15`, `text-primary`).

Literal color escapes exist but are deliberate and narrow, and each pairs a
dark-mode variant:

- Online dot: `bg-emerald-500` (`TutorCard.tsx:96`)
- YKS rank pill: `border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-200` (`TutorCard.tsx:114`)
- Hero gradient: `from-muted/60 via-background to-violet-500/[0.08]` (`AuthenticatedHome.tsx:442`)

Dark mode is `class`-based (`darkMode: ["class"]`) and is applied pre-paint by
`THEME_INIT_SCRIPT` to avoid a flash.

## 3. Spacing, container, rhythm

| Convention | Value | Source |
| --- | --- | --- |
| Content container | `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` | `AuthenticatedHome.tsx:444,518` — **17 uses of `max-w-7xl`** vs 10 of `max-w-6xl` (narrower reading surfaces) and 2 of `max-w-5xl`. `max-w-7xl` is the homepage/marketplace standard. |
| Section stack | `space-y-20 lg:space-y-24` | `AuthenticatedHome.tsx:518` |
| Section block padding | `py-16 sm:py-20 lg:py-24` | `AuthenticatedHome.tsx:518` |
| Hero padding | `py-14 sm:py-16 lg:py-[72px]` | `AuthenticatedHome.tsx:444` |
| Within-section stack | `space-y-8` (header→content), `space-y-7` for tighter blocks | `AuthenticatedHome.tsx:519,572` |
| Card grid gap | `gap-5` | `AuthenticatedHome.tsx:530,542,601` |
| Card padding | `p-5 sm:p-6` (feature cards) · `p-4` (TutorCard rows) · `p-6` (`CardHeader`/`CardContent` primitives) | `AuthenticatedHome.tsx:136`, `TutorCard.tsx:85`, `ui/card.tsx` |
| Nav height | 64 px desktop; mobile tab bar reserves `4rem + env(safe-area-inset-bottom)` | `(main)/layout.tsx:18`, `MainLayoutShell.tsx` |

Tailwind's default 4 px scale is used unmodified — `tailwind.config.ts` extends
only colors, borderRadius, keyframes and animation.

## 4. Breakpoints and responsive conventions

Default Tailwind breakpoints (`sm 640`, `md 768`, `lg 1024`, `xl 1280`,
`2xl 1536`) with a small number of deliberate arbitrary breakpoints where a
two-column layout needs to break earlier than `lg`:

- `min-[880px]` — 5 uses, all in the homepage hero grid
  (`min-[880px]:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]`)
- `min-[420px]`, `min-[400px]`, `min-[1039px]` — isolated card/layout fixes

Grid recipes actually used on the homepage:

| Content | Recipe |
| --- | --- |
| Tutor cards | `grid gap-5 md:grid-cols-2 xl:grid-cols-3` |
| Package cards | `grid gap-5 sm:grid-cols-2 xl:grid-cols-3` |
| Continue cards | `grid gap-5 md:grid-cols-2` |
| Practice cards | `grid gap-5 md:grid-cols-2` |
| Hero | 1 column → `min-[880px]` two-column with a fixed-ish right rail |

**Mobile overflow rule (project memory, still true):** rows that scroll
horizontally must use `minmax(0,1fr)` grid tracks and `min-w-0` on children, or
the row leaks page width on mobile. `AuthenticatedHome.tsx:544,604` already
wraps each card in `className="min-w-0"` for exactly this reason.
`scripts/responsive-check.ts` asserts `scrollWidth <= innerWidth`.

Mobile navigation is a bottom tab bar (`MobileTabBar`) shown only when
authenticated; `md:` and up uses the navbar. Safe-area utilities
(`pt-safe`, `pb-safe`, `min-h-dvh-safe`, …) exist in `globals.css:143–172`.

Scrollbars are globally hidden (`globals.css:52–62`) — a horizontal carousel
therefore has **no visible scrollbar affordance** and must supply its own
(chevron buttons, edge fade, or peeking next card).

## 5. Radius, border, elevation

| Element | Value | Note |
| --- | --- | --- |
| `--radius` | `0.5rem` (8 px) | `rounded-lg` = 8 px, `md` = 6 px, `sm` = 4 px |
| Usage counts | `rounded-full` 178 · `rounded-lg` 141 · `rounded-xl` 109 · `rounded-md` 92 · `rounded-2xl` 84 · `rounded-3xl` 17 | pills and 8 px dominate; **feature cards on the homepage escalate to `rounded-2xl` (16 px)**, closing bands to `rounded-3xl` |
| Card primitive | `rounded-lg border bg-card text-card-foreground shadow-sm` | `ui/card.tsx:12` |
| Button primitive | `rounded-md` (6 px); homepage overrides to `rounded-xl` for large CTAs | `ui/button.tsx:9`; `AuthenticatedHome.tsx:471` |
| Borders | `@apply border-border` on `*` in base layer — every element inherits the token border color, so `border` alone is correct | `globals.css:53–56` |
| Shadow | `shadow-sm` 33 · `shadow-lg` 16 · `shadow-xl` 9 · `shadow-md` 9 | resting = `shadow-sm`; **hover** = `shadow-lg`. No custom shadow tokens exist. |
| Hover lift | `transition-all hover:-translate-y-0.5 hover:shadow-lg` (+ `hover:border-t-primary` on TutorCard) | `TutorCard.tsx:82`, `AuthenticatedHome.tsx:269` |

## 6. Component inventory

### Primitives — `src/components/ui/`

`accordion`, `alert`, `animated-tabs`, `avatar`, `badge`, `bouncy-accordion`,
`button`, `calendar`, `card`, `dialog`, `expandable-tabs`, `form`,
`gooey-input`, `input`, `label`, `origin-button`, `popover`, `select`,
`separator`, `sheet`, `skeleton`, `slider`, `sliding-pagination`, `sonner`,
`tabs`, `textarea`, `time-select`, `tooltip`, plus `ease.ts`.

**Button** (`ui/button.tsx`) — cva. Variants: `default` (`bg-primary`),
`destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default` (h-10),
`sm` (h-9), `lg` (h-11 px-8), `icon` (h-10 w-10). Base includes
`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` and
`disabled:opacity-50`. Supports `asChild` (Radix `Slot`) — the homepage uses
`<Button asChild><Link/></Button>` everywhere.

**Card** (`ui/card.tsx`) — `Card`, `CardHeader`, `CardTitle`, `CardDescription`,
`CardContent`, `CardFooter`.

**Badge** (`ui/badge.tsx`) — cva, `rounded-full border px-2.5 py-0.5 text-xs
font-semibold`; variants `default`, `secondary`, `destructive`, `outline`.

**Skeleton** (`ui/skeleton.tsx`) — `animate-pulse rounded-md bg-muted`. Loading
placeholders are hand-composed per section (see `TutorCardSkeleton` in
`AuthenticatedHome.tsx:91`), not generated.

**SlidingPagination** (`ui/sliding-pagination.tsx`) — framer-motion animated
underline pagination, currently used by `/tutors`. This is the closest existing
thing to a carousel page indicator.

**Tabs / animated-tabs / expandable-tabs** — three existing tab treatments;
`animated-tabs` is the closest analogue to the reference's tabbed discovery
strip.

### Shared — `src/components/shared/`

`EmptyState` (dashed border, `FileQuestion` icon, title + description +
optional action), `ErrorMessage`, `LoadingSpinner`, `StatCard`, `StatusBadge`,
`HorizontalDayPicker` (an existing horizontal-scroll pattern),
`NotificationMark`, `NotificationPopoverContent`, `RouteGuard`,
`SessionExpiredDialog`, `PresenceHeartbeat`, `TutorActivationGate`,
`TutorialNudgeBanner`.

### Product — `src/components/tutors/`, `learning/`, `lessons/`, `home/`

Enumerated with props and reuse verdicts in `component-mapping.md`.

## 7. Icons, motion, accessibility

**Icons:** `lucide-react` — imported in **115 files**. Standard sizes `h-4 w-4`
(inline/meta), `h-5 w-5` (card icon in an `h-11 w-11 rounded-xl bg-primary/10`
tile), `h-3.5 w-3.5` (inline arrow), `h-12 w-12` (empty state). Decorative icons
always carry `aria-hidden="true"`. No second icon set.

**Motion:** `framer-motion@^12.42` (plus a `motion@^12.41` alias) imported in
**22 component files**; `tailwindcss-animate` is the Tailwind plugin.
Custom keyframes in `tailwind.config.ts`: `typing-dot`, `message-pop`,
`accordion-down`, `accordion-up`. Custom CSS animations in `globals.css`:
`.animate-element`, `.animate-slide-right` with `.animate-delay-100…900`, and a
`prefers-reduced-motion` block that disables both. Homepage motion today is
CSS-only: `transition-all duration-200`, `hover:-translate-y-0.5`.

Practical note carried over from the live-lesson tutorial work: framer-motion's
declarative `motion.*` primitives proved unreliable in some of this app's
rendering contexts and were replaced with `tailwindcss-animate` classes and CSS
transitions. **Prefer CSS/`tailwindcss-animate` for homepage motion**, and keep
`motion-reduce:` variants.

**Accessibility conventions observed:**

- Sections use `<section aria-labelledby="…-title">` with an `id` on the `h2`.
- Decorative visuals: `aria-hidden="true"` and `alt=""`.
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
  from the button/badge primitives; bare links add it manually
  (`AuthenticatedHome.tsx:483`).
- Touch targets: `min-h-11` on navbar/inline links.
- `HomeSubjectSearch` implements a real combobox — `useId`-generated
  `labelId`/`listboxId`, `activeIndex` keyboard navigation, outside-pointer
  close.
- `(hover: none)` `.touch-visible` escape hatch for hover-gated controls
  (`globals.css:174–183`).
- Turkish-aware string handling: `localeCompare(…, "tr-TR")`,
  `toLocaleLowerCase("tr-TR")`, and an explicit `ı → i` normalization in
  `HomeSubjectSearch.tsx:20–27`.

## 8. Formatting helpers (`src/lib/utils.ts` and friends)

`cn`, `formatPrice`, `formatRating`, `formatDate`, `formatLessonCount`.
Prices must go through `formatPrice`; package price math must use
`roundHalfToEven` from `src/lib/lessonPricing.ts` (never `Math.round`) per
`AI_AGENT_RULES.md` §1.

## 9. What the reference would break if imported

| Reference asks for | Hocam reality | Verdict |
| --- | --- | --- |
| `--color-aubergine: #6d28d2` as accent | `--primary` inverts light↔dark; no chromatic accent exists | Reject |
| Flat hex token set, no dark theme | Every token has a `.dark` value | Reject — would break dark mode globally |
| "Udemy Sans" / new font family | Inter, single family | Reject |
| Outlined-violet primary button | `Button` variant `default` = filled `bg-primary` | Reject |
| 8 px card radius everywhere | 8 px base, but homepage feature cards are 16 px (`rounded-2xl`) by convention | Adapt, don't copy |
| 1200 px page max-width | `max-w-7xl` = 1280 px | Keep Hocam's |
| 48 px section gap | `space-y-20 lg:space-y-24` = 80/96 px | Keep Hocam's (its rhythm is airier by design) |
| Double-layer oklch hover shadow | `shadow-lg` on hover | Keep Hocam's |

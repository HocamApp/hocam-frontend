# Reference Analysis

What the Udemy / Refero references actually teach, and where they stop applying
to Hocam. Based on full reads of both Markdown files and visual inspection of
all eight screenshots (see `reference-index.md`).

---

## 1. The framing problem, stated first

The references document **an anonymous, SEO-facing acquisition homepage for a
video-course catalog**. Hocam's homepage is **an authenticated, post-login
starting page for a live human tutoring marketplace with scheduling and
credits**.

Four consequences, and they govern everything below:

| | Reference (Udemy `/`) | Hocam (`/home`) |
| --- | --- | --- |
| Audience | Logged-out stranger | Logged-in student or tutor, `RouteGuard requireAuth` |
| Job of the page | Convince → acquire → SEO | Orient → resume → discover |
| Unit of content | A course: an asset that exists, is instantly consumable, infinitely available | A tutor **and a time slot**: a person with finite availability, requiring a request/booking handshake |
| Success metric | Enrolment (one-click, instant) | A confirmed booking (multi-step, scheduled, paid via package credits) |

Roughly half the reference composition — hero carousel, company-logo trust bar,
testimonial grid, certification upsell bands, SEO footer link farm — exists to
solve a problem `/home` does not have. Copying it would produce a marketing
page shown to people who already converted.

**Positive corollary:** the reference's genuinely valuable material is its
*mid-page product surface* — screenshots 2, 3, 6 and 7. Those show a repeatable
row grammar that Hocam's homepage currently lacks, and that is exactly the gap
worth closing.

## 2. Patterns worth adapting

### 2.1 Repeatable section grammar (highest value)

Every discovery module in the reference is the same shape:

```
h2 heading  [+ one-line subtitle]
[optional tab strip that swaps the row below]
row of 3–4 cards, horizontally scrollable, chevron affordance at the edge
"Show all … →" text link closing the section
```

Hocam already has the heading + subtitle + "see all" idea in
`HomeSectionHeader` (`AuthenticatedHome.tsx:56`), but each section then invents
its own body: a static `md:grid-cols-2 xl:grid-cols-3` grid for tutors, a
different grid for packages, a two-up for practice. The reference's lesson is
**consistency**: one row component, one heading component, one overflow rule.
That is a real, non-cosmetic improvement and it is the core structural
borrowing.

### 2.2 Tab strip that swaps the row beneath it (screenshot 3)

Udemy: "Skills to transform your career and life" + underlined tabs
(`AI`, `Python`, `Excel`, …) swapping a 4-up course row, closed by
"Show all AI courses →".

Hocam translation: an **exam-type / subject** strip over the tutor row —
`TYT` · `AYT` · `YDT`, or the student's own top subjects. This is buildable
today: `fetchTutors` already accepts `subject` and `exam_type` filters
(`TutorFilters` in `lib/tutorsApi.ts:49`), and `animated-tabs` /
`expandable-tabs` already exist in `components/ui/`. It converts a passive,
one-shot "top rated 3" row into an actual discovery instrument.

### 2.3 Card anatomy discipline (screenshots 2, 6)

Reference card: media → title (2-line clamp) → secondary attribution line →
metric pill row → price. Consistent across "Trending Courses" and "Career
Accelerators", with only the pill contents changing.

`TutorCard` is already ~90% this shape (avatar → name → university·department →
presence + YKS-rank pills → rating · lesson count → price + CTA). The
transferable detail is the **metric pill row as a fixed slot**: same position,
same height, contents vary. That stabilizes a row of cards that otherwise
jitters when one tutor has no reviews.

### 2.4 Horizontal carousel with peek and chevrons (screenshots 2, 3)

The reference shows the next card partially cut off and a floating circular
chevron at the row edge — both signal "there is more sideways" without a
scrollbar. **Hocam needs this more than Udemy does**: scrollbars are globally
hidden in `globals.css:52–62`, so a scroll row with no chevron and no peek is
genuinely undiscoverable. Existing precedent in-repo: `HorizontalDayPicker`,
`CategoryNav`, `MilestonePath`, `TutorWeeklySchedule`.

### 2.5 One dark inverted band as a rhythm break (screenshots 2, 5)

Reference uses `#202230` full-bleed panels to break a long light page and to
mark a high-intent module. Hocam already has this instinct — the closing CTA is
`bg-primary` with a grayscale blackboard image (`AuthenticatedHome.tsx:675`).
Worth **keeping to exactly one such band**, as the reference does per screen
region; two would read as noise.

### 2.6 Long-tail link block (screenshot 7)

"Popular Skills": 4 columns of linked topics with a count under each, plus an
outlined "Show all trending skills" button. Compact, high-density, zero images.

Hocam translation: a **subject/exam discovery block** linking into
`/tutors?subject=…&exam_type=…`. Data exists (`GET /subjects/`, already fetched
with `staleTime: Infinity`). Caveat: the reference's "50,623,022 learners"
counters must **not** be imitated — Hocam has no per-subject learner count, and
inventing one is a product lie (see §4).

### 2.7 Loading and empty behavior

The reference gives little direct evidence here, but its layout implies the
rule Hocam should follow: **card rows reserve their space**. Hocam already does
this well (`TutorCardSkeleton`, `Skeleton className="h-[390px] rounded-2xl"`).
Keep it; extend the same discipline to every new row.

## 3. Patterns explicitly rejected

| Reference pattern | Why rejected for Hocam |
| --- | --- |
| Full-bleed hero carousel with rotating marketing slides | `/home` is post-login. A returning student wants their next lesson, not a slogan carousel. Also adds auto-rotation, a known a11y liability. |
| Company logo trust bar ("trusted by 17,000 companies") | Hocam has no such customers. Fabricating it is dishonest; a real one belongs on a future public marketing page. |
| Testimonial card grid + "View all stories" | Same. `REFERENCE_RULES.md` names marketing testimonials as non-borrowable. Hocam's genuine social proof is per-tutor ratings/reviews, already on `TutorCard` and the tutor detail page. |
| SEO footer link farm (screenshots 7, 8) | Auth-gated route; zero SEO value; enormous visual weight. Hocam's `Footer` stays as-is. |
| `Bestseller` badges | No backing field. See §4. |
| Price anchoring / strike-through pricing | Hocam sells package credits, not discounted SKUs, and `AI_AGENT_RULES.md` §1 forbids inventing pricing surfaces. |
| Certification / voucher upsell bands | No product equivalent. |
| 3D clay-illustration visual language | Would require commissioning assets and would import Udemy's personality wholesale. Hocam's visual language is photography-light and token-driven. |
| Violet outlined primary buttons, Aubergine/Ember accents, "Udemy Sans" | Brand theft, and mechanically breaks dark mode. See `hocam-design-inventory.md` §9. |
| 1200 px max width, 48 px section gap, 8 px-everywhere radius | Hocam's own values (1280 px, 80–96 px, mixed 8/16/24) are already coherent. Swapping them buys nothing and diffs everything. |

## 4. The honesty constraint (most important product note)

The reference's density is manufactured. `Bestseller`, `193,437 ratings`,
`50,623,022 learners`, `29 total hours`, "trusted by 17,000 companies" — that is
a page whose credibility comes from *volume*. Hocam is an early-stage verified
marketplace with a small tutor roster.

Two failure modes to avoid, in order of severity:

1. **Fabricated metrics.** Any badge or counter with no backing API field is a
   product lie. Hocam may display only: `rating`, `total_reviews`,
   `completed_lessons_count`, `is_verified`, `yks_rank`, `hourly_price`,
   `is_online` / `last_seen_at`. That is the complete list of tutor-card
   metrics the API actually returns.
2. **Empty scaffolding.** Copying a 6-row homepage onto a catalog that fills two
   rows produces a page of skeletons and empty states — worse than a shorter,
   full page. **Every row must degrade to nothing (unmount), not to an empty
   shell**, unless its emptiness is itself actionable (e.g. "no lessons yet →
   book one").

This is the reason the spec in `product-home-spec.md` proposes *fewer* sections
than the reference, not more.

## 5. Course marketplace vs. tutor marketplace vs. dashboard vs. landing page

Four page archetypes get conflated in this brief. Distinguishing them is what
makes the section order defensible:

- **Video-course marketplace home (the reference).** Inventory is infinite and
  instantly consumable. Optimal home = maximize browsable surface. Rows of
  rows. No scheduling concept. No supply scarcity.
- **Live tutor marketplace home (Hocam).** Inventory is people with calendars.
  Browsing is *necessary but not sufficient* — the funnel is
  discover → compare → check availability → request/book → pay with credits.
  Therefore the home must carry **availability and next-step state**, which the
  reference has no vocabulary for. Hocam's `/match` questionnaire and
  `HomeSubjectSearch` are the equivalents of Udemy's search, and they matter
  *more*, because a wrong tutor match costs a scheduled hour, not a refund.
- **Student dashboard (`/dashboard/student`).** Operational: my goals, my
  packages, my progress. Already exists and stays. `/home` must not duplicate
  it — the wireframe spec (`docs/authenticated-home-wireframe-spec.md` §1) is
  explicit that `/home` is a *starting point*, not the dashboard.
- **Marketing landing page.** Does **not exist** in this repository. `/` is the
  auth screen. Most of the reference belongs to this archetype — which is why
  most of the reference is out of scope here, and why the parts of it that are
  genuinely good (hero, testimonials, logo bar) should be **saved for a future
  public landing page**, not spent on `/home`.

Where Udemy patterns simply do not fit Hocam:

- **No "add to cart" / instant enrolment.** Every tutor CTA leads to a profile,
  then availability, then a booking modal. The card's primary action can never
  be a one-click purchase.
- **No "continue watching" resume semantics.** Hocam's resume unit is a
  *scheduled future event* or a *goal milestone*, both time-anchored. The
  reference has no time-anchored module at all.
- **No per-item duration/curriculum metadata.** "29 total hours" has no analogue;
  Hocam's closest honest equivalents are package credit counts and lesson
  duration (40 min standard / 20 min trial).
- **Category cards with illustrations** presume a large, stable taxonomy. Hocam's
  taxonomy is small and exam-shaped (TYT/AYT/YDT × subject) — better served by a
  compact tab strip or link block than by 16 illustrated tiles.

## 6. Responsive principles

Stated honestly: **no mobile or tablet capture of the reference exists**
(`reference-index.md`, Limitations). The following is reasoned from the desktop
composition plus the Markdown's layout notes, and from Hocam's own conventions —
it is not observed reference behavior.

- Desktop: 4-up rows within a ~1200 px column. Hocam: 3-up within `max-w-7xl`
  (1280 px), because tutor cards carry more text per card than a course
  thumbnail and 4-up would truncate names.
- Tablet: 2-up.
- Mobile: **one row of horizontally scrolling cards with ~85–90% card width so
  the next card peeks**, rather than a vertical stack of full-width cards. This
  is the single most valuable responsive borrowing — it keeps a 5-section page
  scrollable in a reasonable screen height.
- Mandatory Hocam guardrails when doing this: `minmax(0,1fr)` tracks, `min-w-0`
  on children, `overflow-x-auto` on the row only, `snap-x snap-mandatory` for
  card alignment, and `scripts/responsive-check.ts` must still report
  `scrollWidth <= innerWidth`.

## 7. Visual principles to carry over (structure only)

1. **Flat before elevated** — hairline borders first, shadow only on hover.
   Hocam already matches (`shadow-sm` resting, `shadow-lg` hover).
2. **One accent, used sparingly** — reference uses violet for links/marks only,
   never as a panel flood. Hocam's equivalent: `text-primary` and `bg-primary/10`
   tints, with exactly one `bg-primary` band per page.
3. **Consistent interior rhythm** — reference fixes 24 px card padding / 16 px
   element gap. Hocam's equivalent (`p-5 sm:p-6`, `gap-5`) should likewise be
   applied uniformly rather than per-section.
4. **Type hierarchy over color hierarchy** — reference carries structure with
   size/weight on a near-black ink scale. Hocam does the same via
   `text-muted-foreground` (542 uses).

## 8. Risks of over-copying

| Risk | Manifestation | Mitigation |
| --- | --- | --- |
| Brand theft | Violet accent, Udemy Sans, outlined-CTA language | `REFERENCE_RULES.md`; review diff for any new hex or font |
| Dark-mode breakage | Any hardcoded hex from the token dump | All color via existing HSL tokens; verify both themes |
| Dishonest UI | Badges/counters with no API field | §4 rule: only the seven real tutor metrics |
| Empty-page effect | 6 rows, 2 of which ever fill | Unmount empty rows; ship fewer sections |
| Dashboard duplication | `/home` becoming a second `/dashboard/student` | Keep the wireframe spec's boundary: home = starting point |
| Scope creep into a landing page | Adding testimonials/logo bars to an auth-gated route | Defer to a future public route |
| Merge conflict | Editing shared dashboard files | Homepage work touches `components/home/*` only (`AI_AGENT_RULES.md` §5) |
| Analytics regression | Rewriting sections and dropping `trackHomeEvent` calls | Event contract is a preserve item; see `implementation-plan.md` |

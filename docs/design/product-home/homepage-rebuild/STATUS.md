# Homepage rebuild: status

**This file is the current source of truth for the rebuild.** `HOCAM_HOMEPAGE_PLAN.md` is the original plan; where the two disagree, this file wins. Last updated 7 October 2026.

## What's built

All four phases of the plan are on `main`, plus one fix round:

| PR | Phase | Tasks |
|---|---|---|
| #301 | A | T00 comparison harness (`npm run home:compare`), T01 facts/copy/`YsFact`/`check-home-facts`, T02 hero, T03 subject grid, T04 pink band |
| #302 | B | T05 student steps, T06 pricing, T07 guarantees, T08 parents panel |
| #303 | C | T09 tutors band and earnings calculator, T10 testimonials, T11 FAQ tabs, T12 footer |
| #304 | D | T13 `/hoca-ol`, T14 `/veliler`, T15 `/nasil-calisir` steps toggle, T16 verification page block |
| fix round | – | Interactive student steps, section spacing, visual pass against the mockup, copy fixes (see "Decisions") |

Code lives in `src/components/yemeksepeti/`. Every homepage sentence is in `ysHomeCopy.ts`; every number comes from `ysHomeFacts.ts` or `lib/lessonPricing.ts`.

## What's behind the flag

Everything new renders only when `NEXT_PUBLIC_HOME_V2` is exactly `"true"` (`src/lib/featureFlags.ts`). With it off, the live site is the pre-rebuild site:

- `/`: hero headline, buttons, and no audience row; no subject grid; the one-column pink band; the tabbed four-step journey; the marquee testimonials; the single FAQ; the old footer.
- `/hoca-ol` and `/veliler` return 404.
- `/nasil-calisir` keeps its four static steps.
- `/hocalar-nasil-dogrulaniyor` has no "Kimler başvurabilir?" block.

`NEXT_PUBLIC_*` is inlined at build time, so turning the flag on or off needs a rebuild and redeploy.

To preview locally:

```bash
NEXT_PUBLIC_HOME_V2=true ALLOW_HOME_TODOS=1 NEXT_PUBLIC_API_URL=https://web-production-22415.up.railway.app/api npm run dev
npm run home:compare   # side-by-side PNGs in screenshots/home-mockup/
```

## Remaining TODO facts

`scripts/check-home-facts.ts` fails the production build while any of these are `TODO`. Preview builds set `ALLOW_HOME_TODOS=1` (Vercel Preview environment only, never Production). In development, each one renders as a dashed `[label]` placeholder.

There are 23, all in `src/components/yemeksepeti/ysHomeFacts.ts`:

| Fact | What it needs | Source |
|---|---|---|
| `PRICE_RANGE_TL` | Lowest and highest profile price per 40-minute lesson | Owners (D2) |
| `COMMISSION_PERCENT` | Platform commission | Owners (D3) |
| `PAYMENT_CHARGED_WHEN` | When the student's card is charged | Waits for the payment provider |
| `TUTOR_PAYOUT_TEXT` | When and how tutors are paid (never IBAN) | Waits for the payment provider |
| `TRIAL_PAID_TO_TUTOR` | Whether a free trial is paid to the tutor | Owners (D5) |
| `TUTOR_NO_SHOW_TEXT` | What happens when the tutor doesn't show up | `DERS_POLITIKALARI_RAPORU.md` (D7) |
| `REMAINING_ON_SWITCH_TEXT` | What happens to remaining lessons when switching tutor | Owners (D6) |
| `TUTOR_MUST_ACCEPT_TEXT` | Whether a tutor must accept every request | Owners (D12) |
| `STUDENT_NO_SHOW_TEXT` | What happens when the student doesn't show up | `DERS_POLITIKALARI_RAPORU.md` (D7) |
| `TUTOR_MIN_WEEKLY_HOURS` | Minimum weekly hours a tutor commits to | Owners (D12) |
| `VERIFICATION_REJECTION_TEXT` | What a rejected applicant can do next | Owners |
| `VERIFICATION_REVIEW_DAYS` | Days until an application is decided | Owners |
| `VERIFICATION_DOCS_DELETED_AFTER` | When verification documents are deleted (must match `/kvkk`) | Owners and KVKK text |
| `RECORDING_POLICY_TEXT` | Whether lessons are recorded | Owners (D10) |
| `PARENT_CAN_JOIN_TEXT` | Whether a parent can join or watch | Owners (D10) |
| `PARENT_CAN_PAY_TEXT` | Whether a parent can pay for the student | Owners (D14) |
| `SUPPORT_REPLY_TEXT` | How fast support answers | Owners |
| `OFF_PLATFORM_TEXT` | The rule on taking lessons or payment off-platform | Owners (D13) |
| `TAX_TEXT` | Tutors' tax obligations | Accountant-approved text (D13) |
| `COACHING_TUTOR_TEXT` | Who can give coaching | Owners (D11) |
| `COMPANY_LEGAL_NAME` | Registered company name, for the footer | Company records |
| `COMPANY_ADDRESS` | Registered address, for the footer | Company records |
| `COMPANY_MERSIS` | MERSİS number, for the footer | Company records |

Other open items for the owners:

- Approve testimonials one by one in `ysTestimonialData.ts` (`approved: true`).
- Add the lesson room screenshot as `public/images/how-it-works/05-lesson-room.png`. Step 6 ("Derse gir") picks it up automatically on the next deploy, and until then it shows `04-lesson-dashboard.png`.
- Rewrite the copy in `ysHomeCopy.ts` as needed.

## Decisions so far

1. **The flag.** The rebuild ships dark behind `NEXT_PUBLIC_HOME_V2` (exactly `"true"`, default off). Production stays on the pre-rebuild site until every TODO fact is filled and the owners decide to switch.
2. **Testimonials are approved-only.** Bahadır's entry was deleted. Every other entry starts at `approved: false`, and only approved entries render. A group (students or tutors) with no approved entry doesn't render at all, heading included.
3. **The earnings calculator is behind `NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW`.** It promises tutor income while no payment provider pays tutors, so it renders only when that flag is exactly `"true"` and `COMMISSION_PERCENT` and `PRICE_RANGE_TL` are decided. Turn it on only once tutor payouts are real. While it's off, the tutor steps keep their 6/12 column and the other column stays empty (changed in the fix round: the full-width steps ran too wide).
4. **Interactive student steps replace T05's stacked screenshots.** T05 said "all screenshots visible at rest". That was wrong. Now:
   - Clicking a step (or moving to it with the arrow keys, Home, or End) makes it active. Only that step's screenshot shows in one sticky frame, with a crossfade that stops under `prefers-reduced-motion`.
   - Every step's body text stays visible and in the HTML. The active step gets the ink left marker and ink title; inactive titles are ink-mid and turn ink on hover.
   - Steps are `role="tab"` buttons with `aria-selected` and a roving tabindex.
   - Below 960px there is no sticky column: the active step's screenshot sits directly under that step.
   - Screenshots by step: 1 tutor list, 2 and 3 tutor profile, 4 and 5 package selection, 6 lesson room (or lesson dashboard until that file exists), 7 lesson dashboard.
   - `/nasil-calisir` uses the same component for both tracks. The tutor track has no screenshots, so it switches only the active marker and title.
   - Component: `YsStepTabs.tsx`. The homepage tutor band keeps the static `YsStepList`.
5. **Pricing example needs a signed-in user.** `offered-plans` requires auth, so logged-out visitors see the three fact cards across the full row and no example box. There is no hard-coded fallback.
6. **`.ys-shell` overrides spacing on itself.** `src/styles/yemeksepeti.css` loads after Tailwind and sets `padding: 0 …` and `margin: 0 auto`, so a `pt-*`/`mt-*`/`py-*` class on the same element is silently dropped. Put section spacing on a wrapper around the shell. `.ys-shell` itself was left alone because the flag-off footer and homepage depend on it.
7. **`cn` doesn't know the custom type scale.** `tailwind-merge` reads `text-small`, `text-label`, `text-body` and the other custom sizes as colours. It drops them against a text colour class (or the other way round). Inside `cn`, use arbitrary sizes (`text-[14px]`) or join the class strings by hand.
8. **Copy fixes (fix round):** tutor step 6 is "Dersin tamamlanır" (was "Ödemeni al"); the tutor steps title is "Başvurudan ilk dersine kadar" (was "Başvurudan ilk ödemene kadar"). Nothing on the page promises payouts while payments aren't live.
9. **Package grace period removed.** The flag-off FAQ's "14 günlük ek süre" sentence contradicted `/iptal-ve-iade` (the backend's grace period is now 0). The sentence and the stale `PACKAGE_GRACE_DAYS` fact were removed.

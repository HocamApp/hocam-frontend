# Homepage rebuild: status

**This file is the current source of truth for the rebuild.** `HOCAM_HOMEPAGE_PLAN.md` is the original plan; where the two disagree, this file wins. Last updated 8 October 2026.

## What's built

All four phases of the plan are on `main`, plus a fix round and a facts round:

| PR | Phase | Tasks |
|---|---|---|
| #301 | A | T00 comparison harness (`npm run home:compare`), T01 facts/copy/`YsFact`/`check-home-facts`, T02 hero, T03 subject grid, T04 pink band |
| #302 | B | T05 student steps, T06 pricing, T07 guarantees, T08 parents panel |
| #303 | C | T09 tutors band and earnings calculator, T10 testimonials, T11 FAQ tabs, T12 footer |
| #304 | D | T13 `/hoca-ol`, T14 `/veliler`, T15 `/nasil-calisir` steps toggle, T16 verification page block |
| fix round | – | Interactive student steps, section spacing, visual pass against the mockup, copy fixes (see "Decisions") |
| facts round | – | Every TODO fact filled from the owners' answers (8 Oct 2026); task in `FACTS_ROUND.md` |

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
NEXT_PUBLIC_HOME_V2=true NEXT_PUBLIC_API_URL=https://web-production-22415.up.railway.app/api npm run dev
npm run home:compare   # side-by-side PNGs in screenshots/home-mockup/
```

## Facts

Every homepage fact in `src/components/yemeksepeti/ysHomeFacts.ts` is decided. `scripts/check-home-facts.ts` passes with `NEXT_PUBLIC_HOME_V2=true` and no `ALLOW_HOME_TODOS`. The round that filled them is `FACTS_ROUND.md` in this folder.

The check still guards new facts: a fact added as `TODO` fails the production build again until it is filled. A fact that is decided but must not show yet is `null`, not `TODO`. `YsFact` renders nothing for it and it doesn't block the build. Two kinds are `null` today:

- `PAYMENT_CHARGED_WHEN` and `TUTOR_PAYOUT_TEXT`: filled, but `null` unless `NEXT_PUBLIC_PAYTR_ENABLED` is exactly `"true"`.
- `TAX_TEXT`: no accountant-approved text yet. The Hoca FAQ question "Kazancımı vergi açısından nasıl beyan ederim?" is hidden, JSON-LD included.

## Open for Baha

- Tax text for the Hoca FAQ, approved by the accountant. Set `TAX_TEXT` and the question comes back.
- Approve testimonials one by one in `ysTestimonialData.ts` (`approved: true`).
- Add the lesson room screenshot as `public/images/how-it-works/05-lesson-room.png`. Step 6 ("Derse gir") picks it up automatically on the next deploy, and until then it shows `04-lesson-dashboard.png`.
- Two answers start with "Hayır." and read oddly where they sit inside a sentence rather than under a question: tutor step 4 ("… açıp kapatmak senin elinde. Hayır. 20 dakikalık deneme dersi …") and the parents panel's "Kayıt ve derse katılım" row, which reads "Hayır. … Hayır. …". The sentences were kept word for word; reword them in `ysHomeFacts.ts` if you want.
- Rewrite the copy in `ysHomeCopy.ts` as needed.
- Decide when to switch Production to the rebuild (`NEXT_PUBLIC_HOME_V2=true` plus a redeploy).

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
10. **Facts filled 8 Oct 2026** from the owners' answers (`Hocam_Ana_Sayfa_Doldurulacak_Bilgiler`). The policy answers were checked against `/iptal-ve-iade`, `/kvkk/saklama-ve-imha-politikasi` and the ders odası FAQ. Two changed shape: `VERIFICATION_REVIEW_DAYS` became `VERIFICATION_REVIEW_TIME` ("1–2 iş günü"), and the band's deletion line now quotes the KVKK retention constants (7 and 30 days). `TUTOR_MIN_WEEKLY_HOURS` is gone because there is no minimum: the eligibility line is removed and the Hoca FAQ answers "Alt sınır yok." The switch-tutor answer is now full sentences, so its frames changed: student step 7 and the guarantees card read "… başka hocaya geçebilirsin." and then the answer, instead of wrapping it in "Paketinde kalan dersler … ."
11. **Payment timing and tutor payout texts are PayTR-gated.** They're `null` while payments are off, so neither the student steps, the guarantees card nor the tutor steps say when money moves.
12. **The homepage keeps the request/accept flow** because that's what the product does: the tutor accepts the package request before payment, and bookings start pending unless the tutor turns on automatic confirmation. Direct booking would be its own product, backend and legal round.
13. **The tax FAQ is hidden** until accountant-approved text exists.
14. **No company details in the footer.** The legal name, address and MERSİS facts and the footer line built from them were removed. The KVKK contact line stays on its own.

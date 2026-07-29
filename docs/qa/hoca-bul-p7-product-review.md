# Hoca Bul P7 independent product review

Review date: 29 July 2026
Reviewer mode: independent, read-only product/design review
Reviewed revision: `b003fee3483d11d24329f36d20abf7198208847c` plus the uncommitted Task 1 analytics-contract correction and Task 2 QA harness in the shared P7 worktree

## A. Overall verdict

**Conditional local product approval; independent sign-off remains unverified.** The focused wizard, result hierarchy, truthful relaxation disclosure, illustration family, dark/light treatment, and error recovery remain inside the approved product direction. The independent follow-up correctly rejected an earlier false-positive CTA check and exposed sticky-footer occlusion in the evidence. A final constrained correction was then made and the permanent Chromium harness passed, but no further independent review was run per the stop instruction.

Production enable should not proceed yet. The original mobile conversion defect and evidence gaps were corrected locally, but the evidence still does not prove 200% zoom, Safari/VoiceOver, a physical iOS safe area, Vercel Preview behavior, or real deployed-backend data. The separate production-readiness report records those external gates.

Evidence reviewed:

- All current PNGs in `screenshots/hoca-bul-qa/`, including the 375x667/812 returning-home, selected wizard, full review, exact/relaxed results, loading, HTTP 429, zero-result, edit-recovery, and flag-off states.
- `14-complete-yks-flow.webm` plus four `15-human-paced-yks-review-*` normal/reduced-motion desktop/mobile videos and traces. The paced recordings are approximately 14.6-14.9 seconds each.
- Fresh light, dark, and 390px mobile illustration contact sheets from `scripts/hoca-bul-illustration-shots.ts`.
- Relevant home entry, wizard shell, controls, illustrations, submission, results, analytics, route-gate, and feature-flag source.
- Handoff sections 37, 42, and 44, plus `hocam_tutor_matching.pdf` pages 28-34 in extracted and rendered form.

## B. Severity-ranked findings

### Blocker

None in the fixture-backed product UI reviewed here. This does not mean the production gate passes; deployed-backend and platform checks remain open in the readiness report.

### High

#### HBPR-H1 - Returning-home primary action is covered by the mobile tab bar — AUTOMATED FIX PASS; MANUAL SIGN-OFF UNVERIFIED

- **Original screen:** superseded `03-home-draft-continuation-mobile.png`, first 375x812 viewport.
- **Component:** `src/components/home/HocaBulEntryCard.tsx`, interacting with `src/components/layout/MobileTabBar.tsx` and `src/components/layout/MainLayoutShell.tsx`.
- **Problem:** The fixed bottom tab bar crosses the draft card at the action area. The primary `Devam et` button is behind the bar; only the secondary `Tüm hocalara göz at` action becomes readable below it.
- **Why it matters:** This is the highest-intent returning state, yet its primary continuation action is not visible or directly tappable at the initial viewport. It creates a conversion and accessibility obstacle even though the page can be scrolled.
- **Correction and verification:** The draft-only mobile card was compacted and repositioned without changing tablet/desktop spacing or action order. The corrected browser assertion first resets to `scrollY=0` and proves that the CTA and mobile navigation do not intersect at both 375x812 and 375x667. It then centers the CTA and proves safe clearance. The final harness passed. Manual or independent acceptance of the final correction was not rerun.

### Medium

#### HBPR-M1 - Mobile sticky-footer/control occlusion — AUTOMATED FIX PASS; MANUAL SIGN-OFF UNVERIFIED

- **Screens missing:** Mobile review with all rows, mobile exact plus relaxed result cards, and a selected mobile wizard state. Current mobile captures show only the unselected YKS-area step and zero-result state.
- **Components:** `ReviewSummary.tsx`, `HocaBulResultCard.tsx`, `HocaBulResultsView.tsx`, `WizardFooter.tsx`, and `MobileIllustrationBand.tsx`.
- **Problem:** The evidence proves no overflow for several mobile scenarios, but it does not visually prove wrapping, sticky-footer clearance, card action placement, caveat wrapping, or touch density in the longest successful mobile states.
- **Why it matters:** Success-state cards contain the most information and are the surfaces on which a student decides to open, favorite, and eventually book a tutor.
- **Correction and verification:** The compact illustration band is now 80 px below `sm`, preserving more question space. The footer has a stable test identifier. At 375x667 and 375x812 the final harness centers every radio or `Düzenle` control in turn and verifies that none intersects the sticky footer; all assertions pass. Viewport captures replace the misleading full-page sticky-position artifact. Manual or independent acceptance of the final correction was not rerun.

#### HBPR-M2 - The named video is too fast for independent motion approval — RESOLVED FOR LOCAL CHROMIUM

- **Screen/evidence:** `14-complete-yks-flow.webm`; total duration 6.68 seconds for the complete nine-step YKS flow.
- **Component:** `scripts/hoca-bul-qa.ts` capture pacing; production motion tokens are in `src/components/hoca-bul/motion.ts`.
- **Problem:** Automated interactions advance roughly every 180 ms while step, artwork, and review animations use 280 ms, 420 ms, and up to 900 ms. The trace proves actions and final states, but the video is not human-paced evidence of transition rhythm or interruption quality.
- **Why it matters:** Motion restraint and comprehension are explicit acceptance dimensions. A fast automation recording can conceal overlap, visual churn, or a poorly timed review assembly.
- **Correction and verification:** Four new 1280x900/375x812 normal/reduced-motion recordings pause 700 ms after selections and transitions and 1.1 seconds on review. No production motion token changed. Local Chromium evidence is accepted; Safari and physical-device motion remain external readiness checks.

### Low

#### HBPR-L1 - Submission error bodies are repetitive or unnecessarily blaming

- **Screen:** `07-submission-429.png`; the same component renders offline/500/timeout errors.
- **Component:** `src/components/hoca-bul/HocaBulSubmissionStatus.tsx`.
- **Problem:** The generic body repeats the heading, and the 429 body says the student personally made too many attempts.
- **Why it matters:** Calm, non-blaming recovery copy improves trust during a failure without changing behavior.
- **Exact copy corrections:**
  - 429 body: replace `Çok fazla deneme yaptın. Birkaç dakika sonra tekrar dene.` with `Kısa sürede çok fazla eşleştirme isteği gönderildi. Birkaç dakika sonra tekrar dene.`
  - Generic body: replace `Eşleşmeler hazırlanamadı. Yanıtların korundu, tekrar deneyebilirsin.` with `Yanıtların korundu. Biraz sonra yeniden deneyebilir veya tercihlerine dönebilirsin.`

No other copy change is recommended from the reviewed captures.

## C. Mobile findings

- **Automated pass after correction:** The draft continuation CTA does not intersect the fixed mobile tab bar at `scrollY=0` at either target height. Manual device acceptance remains unverified. See HBPR-H1.
- **Pass in fixture evidence:** The 375x812 YKS-area step keeps the question, four choices, progress, and sticky action within the width without horizontal overflow.
- **Pass in fixture evidence:** The 375x812 zero-result state has readable hierarchy and four full-width recovery actions.
- **Pass in source and Chromium fixture:** The wizard footer includes `env(safe-area-inset-bottom)` and the shell uses `dvh`; this is not equivalent to an actual iOS safe-area test.
- **Not accepted yet:** 200% zoom, software-keyboard viewport behavior, Safari, physical iOS safe area, and VoiceOver.

## D. Copy and motion decisions

Copy changes are limited to HBPR-L1. Preserve all approved home entry strings, step questions, result headings, truthful reason/caveat text, and zero-result actions.

No production motion-value correction is approved from this evidence. Preserve the current 120 ms option press, 260/280 ms step movement, 420 ms illustration/answer transitions, 900 ms maximum review assembly, and reduced-motion fade behavior until HBPR-M2's human-paced recordings are reviewed.

## E. Do not change

- Do not change the approved home eyebrow, title, body, four goal chips, selected CTA grammar, returning-result copy, or `Tüm hocalara göz at` action.
- Do not add LGS, education coaching, target rank, current net, timeline, weekly frequency, free text, lesson-request prefill, checkout choices, or anonymous matching.
- Do not change the YKS nine-step and DGS/KPSS/undecided eight-step branching merely to shorten the flow; the current questions map to matching inputs.
- Do not expose score, percentage, budget segment, internal reason codes, or claims that AI performed the match.
- Do not replace the original line-art illustrations, add stock/reference assets, or add looping/idle motion.
- Do not remove the exact-versus-relaxed grouping or the budget/schedule relaxation caveats.
- Do not invent tutor counts, ratings, reviews, availability, profile data, or social proof.
- Do not add a direct auto-book or auto-message action to result cards. The current profile-first path is safer.
- Do not change payments, polling, auth architecture, backend schemas, or production configuration as part of these findings.
- Do not interpret the flag-off 404 and restored `HomeSubjectSearch` as a visual defect; that is the current safe disabled behavior.

## F. Final acceptance checklist

- [x] Home entry clearly replaces the old search surface when the flag is on.
- [x] Approved default and selected home copy is present in light and dark modes.
- [x] Wizard information hierarchy and progress are clear on reviewed desktop/mobile screens.
- [x] Exact and relaxed results are separated and truthfully explained.
- [x] Zero, loading, 429, offline/500/timeout, retry, draft, cache, and edit flows have deterministic fixture coverage.
- [x] Illustration family is original, semantically reactive, restrained, and free of idle loops.
- [x] Focus destinations, radio/toggle semantics, 44 px targets, and reduced-motion code paths are present and automatically exercised.
- [x] HBPR-H1 mobile CTA/tab-bar intersection is corrected and regression-tested in Chromium.
- [ ] HBPR-H1 final manual/independent sign-off is unverified.
- [x] HBPR-M1 controls are regression-tested against the sticky footer in Chromium.
- [ ] HBPR-M1 final manual/independent sign-off is unverified.
- [x] HBPR-M2 human-paced normal/reduced-motion Chromium videos are reviewed.
- [ ] 200% zoom and short-height wizard/results are manually accepted.
- [ ] Safari, VoiceOver, software keyboard, and physical iOS safe-area checks pass.
- [ ] The production-readiness report reaches PASS; it is currently HOLD/FAIL.

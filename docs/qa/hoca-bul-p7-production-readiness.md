# Hoca Bul P7 production readiness

Assessment date: 29 July 2026
Base commit: `b003fee3483d11d24329f36d20abf7198208847c` (`origin/main`)
Overall gate: **HOLD / FAIL for production enable**
Automated local gate: **PASS for the tested frontend and fixture-backed Chromium scope**

## 1. Decision summary

The current frontend compiles, typechecks, passes both flag-off and flag-on production builds, passes 417 unit tests and 4 SEO tests, passes the expanded Hoca Bul fixture browser suite, the general responsive check, the illustration capture suite, and the backend owner's eight matching tests. Those are meaningful local signals, but they do not prove a production deployment.

Production enable is blocked by missing final independent/manual sign-off for the mobile fixes, Vercel Preview evidence, real deployed Railway/backend integration, named production-like accounts and per-gate owners, Safari/VoiceOver/iOS safe-area testing, 200% zoom, production analytics delivery, and an explicit decision about the already-landed P8 legacy retirement baseline. The previous high-severity mobile home CTA finding now passes the corrected local Chromium regression, but has not received final manual/device acceptance.

No deployment, environment/configuration change, feature enable, commit, push, PR, production API call, or persistent backend change was made. Backend activity was limited to local read-only checks and an isolated Django test database that was destroyed after the run.

## 2. Fresh commands and results

| Command | Result | What it proves / does not prove |
| --- | --- | --- |
| `npm run lint` | PASS, exit 0 | Frontend lint passes. One pre-existing warning remains at `src/app/(main)/tutors/[id]/page.tsx:1119` for `<img>`. |
| `npx tsc --noEmit` | PASS, exit 0 | Current shared TypeScript tree has no diagnostics. |
| `npm run test:unit` | PASS, 417 passed, 0 failed | Unit/integration contracts pass, including Hoca Bul branching, storage, cache, results, controls, route gating, entry card, and illustrations. |
| `NEXT_PUBLIC_HOCA_BUL_ENABLED=false npm run build` | PASS, exit 0, Next.js 14.2.35 | Flag-off production compilation and static generation complete. |
| `NEXT_PUBLIC_HOCA_BUL_ENABLED=true npm run build` | PASS, exit 0, Next.js 14.2.35 | Flag-on production compilation and static generation complete. `/hoca-bul` is 11.3 kB route JS and `/hoca-bul/sonuclar` is 8.82 kB route JS. Neither build proves a deployed Preview. |
| `npm run hoca-bul:qa` | PASS, exit 0 | Fresh fixture run passed the flag-on/off matrices, CTA geometry, mobile success captures, paced motion evidence, analytics, profile-to-checkout entry, and atomic evidence promotion. |
| `RESPONSIVE_CHECK_BASE_URL=http://localhost:3150 npm run responsive:check` | PASS, exit 0 | General application responsive regression passed against the local flag-on production build. |
| `npx tsx scripts/hoca-bul-illustration-shots.ts` in the requested P7 worktree | PASS, exit 0 | Desktop light/dark and 390px mobile sheets saved; no overflow, clipping, incomplete motion, or console error. The temporary route was absent afterward. |
| Backend `check`, migration dry-run, and `apps.students.tests_matching` | PASS; 8 tests | Local backend contract tests pass with no migration drift. This does not prove Railway deployment state or production data. |
| `git diff --check` | PASS, exit 0 | Current diffs contain no whitespace errors. |
| `rg -n -S "hoca_bul_draft_resumed" src` | Runtime PASS with one intentional test occurrence | The unapproved event is absent from runtime source; its only occurrence is the regression assertion that it must not be emitted. |

`npm run responsive:check` was not used as P7 evidence because its page list excludes `/hoca-bul` and requires a separately running site. The dedicated `npm run hoca-bul:qa` matrix directly covers the P7 home/wizard/results routes at 375, 768, and 1280 widths. The removed legacy `scripts/matching-motion-check.ts` is not runnable on this base; the permanent illustration harness is the current motion/geometry check.

## 3. Automated browser scope

The fresh `hoca-bul:qa` manifest reports `status: passed`, no failures, and no fatal error. The network evidence contains 54 named scenario records plus a strict-fixture invariant note. There were no hydration warnings, unexpected external requests, or unknown API requests.

Automated PASS coverage includes:

- YKS, DGS, KPSS, and undecided branch completion through real controls.
- Home goal prefills, direct route canonicalization, refresh/resume, invalid params, auth guard, wrong role, and account switch.
- Corrupt, expired, cross-user, valid draft/cache behavior and saved-preference recovery.
- Options delay/offline/500/retry/empty; preview offline/500/real timeout/429/retry.
- Strong, budget-relaxed, schedule-relaxed, and zero-result presentation.
- Favorite fixture mutation, profile navigation, result editing, feature flag on/off.
- Light/dark, reduced motion, 375/768/1280 widths, a 375x667 home sweep, focus checks, and horizontal-overflow assertions on named surfaces.
- Browser performance observers. Fresh comprehensive-flow evidence records CLS `0` and one 148 ms long task in Next development mode.

Important limitations:

- The suite uses Playwright Chromium and explicit route fixtures. It aborts all unknown/non-local requests. No production service was contacted.
- It runs Next development servers, not a deployed production build.
- The CLS number is summed layout-shift evidence rather than the Web Vitals session-window algorithm. The 148 ms long task is recorded but is not a failing budget.
- Dense selected wizard, full review, and exact/relaxed result screens are captured at 375x667 and/or both target heights.
- It does not test 200% browser zoom, Safari/WebKit rendering, VoiceOver speech order, a real software keyboard, or a physical iPhone safe area.

## 4. Capture inventory

All persistent captures are under `screenshots/hoca-bul-qa/` and were regenerated by the fresh passing run.

| Capture | Dimensions | Coverage |
| --- | --- | --- |
| `01-home-fresh-desktop-light.png` | 1280x4422 | Flag-on fresh home, light |
| `02-home-goal-selected-desktop-dark.png` | 1280x4422 | Selected YKS chip/CTA, dark |
| `03-home-draft-continuation-375x667.png` and `-375x812.png` | 375px wide | Returning draft home; CTA/tab-bar clearance regression evidence |
| `04-wizard-yks-middle-step-mobile.png` | 375x812 | Mobile YKS-area step |
| `04-wizard-selected-enabled-375x667-light.png` | 375x667 | Selected option and enabled sticky footer |
| `05-wizard-review-desktop.png` | 1280x1228 | Complete review and edit controls |
| `05-wizard-review-375x667-*-light.png` and `-375x812-*-light.png` | 375px wide | Dense mobile review, top and last-control viewport evidence |
| `06-submission-loading.png` | 1280x1228 | Preview loading |
| `07-submission-429.png` | 1280x1228 | Rate-limit recovery |
| `08-results-strong-and-relaxed-desktop-light.png` | 1280x1747 | Exact plus both relaxed variants, light |
| `08-results-exact-relaxed-375x667-light.png` and `-375x812-light.png` | 375px wide | Exact plus both relaxed variants on mobile |
| `09-results-desktop-dark.png` | 1280x1747 | Results, dark |
| `10-results-zero-mobile.png` | 375x812 | Zero state and four recovery actions |
| `11-preference-edit-new-results.png` | 1280x1747 | Edited preference resolves new preview |
| `12-flag-off-home-subject-search.png` | 1280x4080 | Flag-off fallback home search |
| `13-flag-off-hoca-bul-404.png` | 1280x900 | Disabled route 404 |
| `14-complete-yks-flow-results.png` | 1280x1747 | Full YKS result endpoint |

Additional evidence:

- `14-complete-yks-flow.webm`: 1280x900, VP8, 25 fps, 6.68 seconds, 614,001 bytes.
- `14-complete-yks-flow.trace.zip`: 7,060,115 bytes, 273 archive entries, 120 frame snapshots, 259 screencast frames, 16 input events, 65 before/65 after call records.
- Four `15-human-paced-yks-review-*` WebM/trace pairs: desktop/mobile normal and reduced motion, approximately 14.6-14.9 seconds each.
- `hoca-bul-analytics-evidence.json`: eight named analytics scenarios.
- `hoca-bul-network-evidence.json`: diagnostics and strict request evidence.
- `hoca-bul-performance-evidence.json`: CLS and long-task evidence.
- `hoca-bul-failure-manifest.json`: final pass/fail manifest.
- Temporary illustration captures inspected but intentionally not retained: `illustrations-desktop-light.png`, `illustrations-desktop-dark.png`, and `illustrations-mobile-band-light.png`.

## 5. Analytics matrix

The implementation emits a provider-neutral `hocam:analytics` browser `CustomEvent`. The fixture harness proves property allowlists and rejects account ID, email, stage, subject, challenge, availability, and budget values. Allowed captured keys are limited to `candidate_count`, `entry`, `goal`, `has_relaxed`, `index`, `match_count`, `match_level`, `position`, `served_from_cache`, `state`, `step_id`, `subject_count`, `total`, and approved opaque `tutor_id`.

| Approved event | Source wired | Browser evidence | Current status |
| --- | --- | --- | --- |
| `hoca_bul_started` | Yes | 6 captured | PASS for fixture seam |
| `hoca_bul_step_completed` | Yes | 8 captured in complete YKS | PASS for fixture seam |
| `hoca_bul_step_back` | Yes | 1 captured in back/exit scenario | PASS for fixture seam |
| `hoca_bul_abandoned` | Yes, explicit exit dialog | 1 confirmed; canceled exit emits 0 | PASS for fixture seam |
| `hoca_bul_submitted` | Yes | 1 captured | PASS for fixture seam |
| `hoca_bul_results_viewed` | Yes | 3 captured | PASS for fixture seam |
| `hoca_bul_result_opened` | Yes | 1 captured | PASS for fixture seam |
| `hoca_bul_all_tutors_clicked` | Yes | 1 captured | PASS for fixture seam |
| `hoca_bul_no_results` | Yes | 1 captured | PASS for fixture seam |
| `home_matching_started` | Yes | 4 captured | PASS for fixture seam |

Production analytics is **not ready**: repository search finds emitters but no runtime subscriber/vendor transport for `hocam:analytics`. No production destination, dashboard, alert, retention policy, consent decision, named analytics owner, or delivery verification was supplied. The table above proves event creation only, not ingestion.

## 6. Frontend and backend responsibility

| Area | Frontend responsibility | Backend responsibility | Current evidence |
| --- | --- | --- | --- |
| Feature exposure | Compile-time `NEXT_PUBLIC_HOCA_BUL_ENABLED`, home swap, route 404 when off | None | Fixture PASS; Vercel env not checked |
| Options | Render real goal/stage/subject/count/budget options, loading/retry/empty | `GET /matching/options/`, valid dynamic supply and price ranges, auth/CORS | Fixture PASS only |
| Matching | Validate/serialize eight approved fields, timeout/retry/cache | `POST /matching/preview/`, deterministic order, truthful reasons/caveats, authorization, rate limit, query performance | Fixture PASS only; real endpoint missing |
| Preferences | User-scoped draft/cache and safe restore | `GET/PUT /matching/preferences/me/`, ownership and schema validation | Fixture/unit PASS only |
| Results | Group strong/relaxed, render only returned profile data, favorites/profile links | Real verified tutor data, availability, rating/review/price integrity, favorites/profile authorization | Fixture PASS only |
| Privacy | Closed analytics payload union; no answer/budget/account data in events | Do not expose internal scores or other students; reject invalid/unauthorized payloads | Frontend automated PASS; local matching tests PASS; deployed backend unverified |
| Reliability | Distinct loading/429/generic errors and retry | Stable status/error contract, observability, SLOs | Fixture PASS; production not checked |

Local backend `manage.py check`, migration dry-run, and `apps.students.tests_matching` all pass (8 tests). The frontend harness also verifies deterministic fixture ordering and profile-to-existing-checkout entry. Railway deployment state, real tutor supply, production-like authorization, and query/latency smoke remain unpassed.

## 7. Required environments, owners, and accounts

The repository names Arda and Emin as shared project owners, but no person is assigned to the individual gates below. Assigning one here would be invented. No production-like account identifiers or credentials were supplied; the browser accounts use `example.invalid` fixture identities and are not valid external accounts.

| Required gate | Named owner/account still required | Status |
| --- | --- | --- |
| Vercel Preview deployment with flag on | Frontend release owner, Vercel project, Preview URL | MISSING |
| Railway matching API verification | Backend release owner, deployed revision/API base URL | MISSING |
| Product acceptance | Founder/product approver for HBPR-H1 and copy decision | MISSING |
| Safari/VoiceOver/iOS | QA owner plus physical iPhone/iPad or agreed device lab | MISSING |
| Analytics delivery | Analytics owner, destination, dashboard, alerts | MISSING |
| Student flow | Verified production-like student account A | MISSING |
| Cross-account isolation | Verified production-like student account B | MISSING |
| Tutor truth/profile/booking | Public verified tutor account with real subjects, price, availability, rating/review data | MISSING |
| Rate limit/error smoke | Backend-approved non-production account/environment where 429/5xx tests are safe | MISSING |

Do not place credentials in this report. Supply account IDs through the team's approved secret channel and record only non-secret labels here.

## 8. Manual production checks still required

1. Deploy a Vercel Preview from the reviewed revision with `NEXT_PUBLIC_HOCA_BUL_ENABLED=true` and the intended non-production Railway API URL.
2. Run real options, exact, budget-relaxed, schedule-relaxed, zero-result, invalid payload, unauthorized access, saved preference, favorites, profile, and profile-to-booking flows.
3. Confirm deterministic ordering and explanations against backend tests and the same payload repeated at least three times.
4. Confirm real tutor counts, prices, availability timestamps/time zone, verification, ratings, reviews, and profile links. No fixture labels may appear.
5. Test 375x667, 375x812, 768, 1280, dark/light, 200% zoom, keyboard-only, reduced motion, and short-height success states on the Preview.
6. Test Safari plus VoiceOver reading/focus order, modal focus trap, option semantics, progress announcements, fixed footer, software keyboard, and iOS safe-area/home-indicator clearance.
7. Recheck the already-passing HBPR-H1 CTA/tab-bar bounding assertion on the deployed Preview.
8. Confirm production analytics reaches the intended destination once per action and contains no disallowed fields.
9. Obtain explicit product, frontend release, backend release, QA/device, and analytics approvals.

## 9. Enable preparation, monitoring, and rollback

### Enable preparation

- The flag defaults to false in `.env.local.example` and is read at build time. Enabling requires a new Vercel build/deployment; no runtime toggle exists.
- Before production, freeze the exact frontend commit and backend revision, confirm `NEXT_PUBLIC_API_URL`, CORS/auth, and the flag in Preview, then rerun the gate matrix.
- Do not enable until the overall gate in this report is updated to PASS by named owners.

### Monitoring required before enable

- Client: JS errors, route failures, options/preview latency, timeout/429/5xx rate, retry success, empty-options state, zero-result rate, relaxed-result ratio, favorite/profile navigation failures.
- Funnel: home start, flow start, step completion/back/abandonment, submit, results, result open, all-tutors click. Break down only by approved low-cardinality metadata.
- Backend: options/preview/preferences status and latency, authorization failures, rate-limit volume, query counts, deterministic-order regression, candidate-count anomalies.
- Product: completion rate by step, mobile versus desktop drop-off, zero-result rate, and profile-open rate.

No production baselines or alert thresholds were supplied. A named owner must set them before enable; this report does not invent numbers.

### Rollback preparation

1. Set `NEXT_PUBLIC_HOCA_BUL_ENABLED=false` and redeploy the last known-good frontend.
2. Verify the authenticated home restores `HomeSubjectSearch` and `/hoca-bul` returns 404.
3. Leave backend endpoints and saved preferences in place unless the backend owner identifies an incident; the frontend flag is the narrow rollback.
4. Monitor home navigation, 404 volume, and frontend/backend errors after rollback.

Rollback caveat: base commit `b003fee` already contains merged P8 legacy retirement. `/match`, legacy components/assets/helpers, and legacy draft migration were removed before this review. Therefore rollback cannot promise restoration of the old `/match` experience; it only restores the home subject search and disables `/hoca-bul`. Product/release owners must explicitly accept that baseline or restore a safe legacy route in a separately approved change.

## 10. Pass/fail gate

| Gate | Status |
| --- | --- |
| Lint/typecheck/unit/build | PASS |
| Fixture-backed Chromium P7 suite | PASS |
| Clean-worktree illustration geometry/motion suite | PASS |
| High mobile CTA finding | PASS in corrected Chromium geometry test; final independent/manual sign-off unverified |
| Mobile sticky-footer/control clearance | PASS in Chromium control-by-control geometry test; final manual/device sign-off unverified |
| Complete mobile success-state evidence | PARTIAL - automated Chromium evidence exists; manual/device review unverified |
| 200% zoom and short-height success states | FAIL - missing |
| Safari/VoiceOver/iOS safe area/software keyboard | FAIL - missing |
| Vercel Preview production build | FAIL - missing |
| Local backend matching tests | PASS - 8 tests, no migration drift |
| Deployed backend authorization, data truth, and performance | FAIL - missing |
| Production analytics ingestion/monitoring | FAIL - missing |
| Named per-gate owners and production-like accounts | FAIL - missing |
| P8 baseline/rollback acceptance | FAIL - explicit owner decision missing |

**Final decision: HOLD / FAIL for production enable.** Local implementation and fixture automation are green, but final mobile sign-off and the listed manual, account, staging, deployed-backend, analytics, ownership, and production gates are unverified.

## 11. Frozen P8 actions

No P8 action is authorized by this report. Keep the following frozen until all P7 gates pass and the founders give explicit approval:

- Production feature enable.
- Any `/match` redirect or further route behavior change.
- Further legacy visual/helper cleanup.
- Any remaining legacy draft-key retirement.
- Any production configuration, deploy, push, PR, merge, backend migration, payment, polling, booking, or messaging change.

Historical baseline note: several legacy-removal actions are already present in merged base commit `b003fee`. Task 3 did not perform, expand, approve, or validate that P8 work. Any corrective action belongs to a separately authorized task.

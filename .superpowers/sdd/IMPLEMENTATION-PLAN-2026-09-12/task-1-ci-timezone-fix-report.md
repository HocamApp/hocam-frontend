# Task 1 — CI timezone fix report

Date: 2026-09-12
Branch: `codex/test-ci-20260912`

## Root cause

Conversation activity and message-thread presentation used the host-local
`Date` getters and locale formatting defaults. The developer machine's
Europe/Istanbul timezone masked the defect; the GitHub Actions Ubuntu runner
uses UTC. Istanbul is the product calendar and display timezone.

## RED evidence

Ran the requested reproduction before the production change:

```text
rtk env TZ=UTC node --experimental-test-module-mocks --test-force-exit \
  --import ./scripts/register-test-aliases.mjs --import tsx --test \
  src/components/messaging/conversationPresentation.test.ts \
  src/components/messaging/threadPresentation.test.ts
```

Result: 2 failures, 4 passes. The activity assertion received `07:20`
instead of `10:20`, and the two messages at Istanbul `23:59` and `00:01`
were grouped under one separator instead of two.

## Implementation

- `src/components/messaging/conversationPresentation.ts`
  - Uses the established `istanbulDayKey` helper for day-difference
    calculations.
  - Adds `timeZone: "Europe/Istanbul"` to time, weekday, and date labels.
- `src/components/messaging/threadPresentation.ts`
  - Compares Istanbul day keys for grouping and today/yesterday labels.
  - Computes the previous Istanbul calendar day independently of the host
    timezone.
  - Adds `timeZone: "Europe/Istanbul"` to date labels and uses Istanbul years.

No test source changes were needed: the existing behavioral tests caught the
actual regression under UTC and pass in independent host timezones.

## GREEN and verification evidence

Focused tests passed in both environments (6 passed, 0 failed each):

```text
rtk env TZ=UTC node --experimental-test-module-mocks --test-force-exit \
  --import ./scripts/register-test-aliases.mjs --import tsx --test \
  src/components/messaging/conversationPresentation.test.ts \
  src/components/messaging/threadPresentation.test.ts

rtk env TZ=America/New_York node --experimental-test-module-mocks \
  --test-force-exit --import ./scripts/register-test-aliases.mjs --import tsx \
  --test src/components/messaging/conversationPresentation.test.ts \
  src/components/messaging/threadPresentation.test.ts
```

Final repository checks all completed successfully:

- `rtk npm run test:unit`: 1,223 passed, 1 skipped, 0 failed (195 files).
- `rtk npm run typecheck`: passed.
- `rtk npm run lint`: passed; existing warning for `<img>` in
  `src/app/(main)/tutors/[id]/page.tsx:1354`.
- `rtk npm run build`: passed; existing Next/Tailwind/Browserslist warnings.
- `rtk git diff --check`: passed.

## Self-review

The patch is limited to the two affected presentation modules and reuses the
repository's existing Istanbul day-key convention. It does not rely on source
text assertions, alter message data, or change user-visible Turkish copy.
Invalid day keys are prevented from comparing equal. No unrelated worktree or
branch was modified, and no push or pull request was created.

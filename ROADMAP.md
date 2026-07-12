# HOCAM Technical Analysis & Development Roadmap - M1 Revised Update

> **Historical document — superseded as operational guidance on 12 July 2026.**
> This M1 record is retained for history only. For active work, read
> [`docs/current-product-and-technical-state.md`](docs/current-product-and-technical-state.md)
> and `AI_AGENT_RULES.md`.

This Markdown accompanies the PDF `Hocam_Technical_Roadmap_v2_M1_REVISED.pdf`. It keeps the original v2 roadmap structure while updating only the sections affected by Milestone 1.

## Current Status

Milestone 1 Tutor Onboarding is completed and accepted after live browser testing. The verified live flow is:

`/register?role=tutor -> /tutor/setup -> /dashboard/tutor`

Test account: `m1browser20260620-1245@hocam.test`

## M1 Completed PRs

- PR-01: TutorProfileSerializer missing fields - DONE
- PR-02: POST /api/tutors/profile/ + GET/PATCH /api/tutors/me/ - DONE
- PR-03: Sonner toast system - DONE
- PR-04: Type sync + isOwnProfile fix - DONE
- PR-05: Tutor setup page /tutor/setup + redirects - DONE
- Production hotfix: Vercel origin CORS allowlist - DONE as part of M1 stabilization

## Next Immediate Gate

PR-12 Supabase Storage must run after M1 and before real tutor verification uploads. Railway local filesystem is ephemeral and cannot safely store identity or YKS result documents.

## M2 Dependency Rules

- Backend PR-06, PR-07, PR-08 can run in parallel after the storage gate decision.
- Frontend PR-10 can start independently.
- Frontend PR-09 and PR-11 must wait for PR-08 backend search/filter/order params.

## M1 Lessons

- Correct tutor register route is `/register?role=tutor`, not `/register/tutor`.
- Vercel env must be `NEXT_PUBLIC_API_URL=https://web-production-22415.up.railway.app/api`.
- Next.js `useSearchParams()` must be wrapped in Suspense when needed by static prerendering.
- Browser CORS failures require backend CORS allowlist changes.
- Production 500s should be debugged from Railway request id and traceback first.

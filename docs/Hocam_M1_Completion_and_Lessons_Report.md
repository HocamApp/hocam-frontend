# Hocam Milestone 1 Completion and Lessons Report

**Date:** June 20, 2026  
**Project:** Hocam - Peer-to-peer YKS tutoring marketplace  
**Scope:** Milestone 1 - Tutor Onboarding  
**Audience:** Backend developer, frontend developer, and backend GPT reviewer  
**Status:** PASSED in live browser testing

## 1. Executive Summary

Milestone 1 is complete and accepted from a live production browser flow. A tutor can now register, is redirected to the tutor setup page, creates a tutor profile, lands on the tutor dashboard, survives a hard refresh, and can log out and log back in to the same tutor dashboard.

This milestone cleared the original onboarding blockers from the technical roadmap: the tutor profile serializer contract, tutor profile create/me/update endpoints, frontend type mismatches, broken own-profile logic, missing `/tutor/setup`, and lack of toast feedback.

## 2. Production Environment Verified

| Item | Value |
|---|---|
| Frontend production URL | `https://hocam-frontend-five.vercel.app` |
| Backend production URL | `https://web-production-22415.up.railway.app/api` |
| Tutor registration route | `/register?role=tutor` |
| Tutor setup route | `/tutor/setup` |
| Tutor dashboard route | `/dashboard/tutor` |
| Final tested account | `m1browser20260620-1245@hocam.test` |
| Final browser result | PASS |

## 3. Completed Milestone 1 Scope

### Backend completion

- **PR-01 - TutorProfileSerializer fields**: completed.
  - Added/confirmed fields required by frontend: `user`, `bio`, `profile_picture`, `is_verified`, `total_reviews`, `created_at`.
- **PR-02 - Tutor profile endpoints**: completed.
  - `POST /api/tutors/profile/`
  - `GET /api/tutors/me/`
  - `PATCH /api/tutors/me/`
  - `subject_ids` profile creation/update support.
- **Production hotfix from PR-19 scope - CORS origin allowlist**: partially completed early to unblock live testing.
  - Added `https://hocam-frontend-five.vercel.app` to backend CORS allowlist.

### Frontend completion

- **PR-03 - Toast system**: completed.
  - Sonner toast system integrated and API error feedback improved.
- **PR-04 - Type sync and own-profile logic**: completed.
  - UUID contract aligned with live backend.
  - `hourly_price` and `rating` aligned as numbers.
  - `isOwnProfile` fixed by comparing current user id with `tutor.user`.
- **PR-05 - Tutor setup page**: completed.
  - `/tutor/setup` implemented.
  - Tutor with `tutor_profile_id === null` is redirected to setup.
  - Profile creation redirects to `/dashboard/tutor`.
- **Tutor register mode hotfix**: completed.
  - `/register?role=tutor` enables tutor mode and displays “Hoca olarak kaydol”.

## 4. Final Live Browser Test Result

Final live flow tested:

1. Opened `https://hocam-frontend-five.vercel.app/register?role=tutor`.
2. Confirmed page displayed “Hoca olarak kaydol”.
3. Registered tutor account: `m1browser20260620-1245@hocam.test`.
4. Confirmed redirect to `/tutor/setup`.
5. Filled tutor setup form:
   - Name: `M1`
   - Surname: `Browser Test`
   - University: `Bogazici Universitesi`
   - Department: `Matematik`
   - YKS type: `SAY`
   - Grade: `2`
   - YKS rank: `1234`
   - Hourly price: `500`
   - Subject: `Matematik / TYT`
   - Bio: `M1 browser live test profile.`
6. Submitted form.
7. Confirmed redirect to `/dashboard/tutor`.
8. Hard refreshed the dashboard; the tutor dashboard remained stable.
9. Logged out and logged back in with the same account; the user returned to `/dashboard/tutor`.

**Conclusion:** M1 tutor onboarding is accepted from the live frontend and live Railway backend.

## 5. Bugs and Errors Encountered During M1

### 5.1 API contract mismatch

Initial frontend types did not match the live backend. The live backend returned UUID strings for user, subject, and tutor profile ids, while earlier frontend assumptions treated some ids as numbers. `hourly_price` and `rating` were numeric in live responses.

**Resolution:** Frontend types were realigned to the live API contract.

**Prevention:** Before frontend type work, run contract curl tests against production or staging and paste real JSON into the task prompt.

### 5.2 Backend profile create 500

During API testing, `POST /api/tutors/profile/` returned `HTTP 500` for a create payload. Auth and subject endpoints were already working, which proved the failure was inside backend create/serialization behavior.

**Resolution:** Backend and payload contract were aligned. Later production browser flow confirmed profile creation works.

**Prevention:** Backend must return structured JSON errors for validation failures instead of uncaught 500s. Every create endpoint should have a curl smoke test before frontend browser testing.

### 5.3 Vercel environment variable issue

The live frontend initially displayed a connection message referring to `localhost:8000`. Investigation showed the frontend uses `NEXT_PUBLIC_API_URL`, and the production value must include `/api`.

**Resolution:** Vercel env var was updated to:

```text
NEXT_PUBLIC_API_URL=https://web-production-22415.up.railway.app/api
```

and the production deployment was redeployed.

**Prevention:** Every production deploy must include a Network-tab check confirming requests go to Railway, not localhost.

### 5.4 Next.js production build failure with `useSearchParams()`

The first tutor register route patch failed on Vercel:

```text
useSearchParams() should be wrapped in a suspense boundary at page "/register"
```

**Resolution:** The component that calls `useSearchParams()` was moved under a `<Suspense>` boundary. Local `npm run build` passed before pushing the fix.

**Prevention:** After any App Router search param change, run `npm run build` locally. Do not trust dev-mode success.

### 5.5 Wrong route assumption: `/register/tutor`

The team initially tested `/register/tutor`, which does not exist. The correct route is `/register?role=tutor`.

**Resolution:** Route was clarified and the route mode was implemented.

**Prevention:** Keep a single source-of-truth route map in the roadmap and update it after every route change.

### 5.6 CORS blocker after Vercel env was correct

Once the frontend correctly called Railway, the browser blocked the request due to missing CORS allowlist origin:

```text
Origin: https://hocam-frontend-five.vercel.app
Request: https://web-production-22415.up.railway.app/api/auth/register/
```

**Resolution:** Backend CORS allowlist was updated and Railway redeployed.

**Prevention:** Every new Vercel production or preview domain must be added to backend CORS settings before browser testing.

### 5.7 Terminal quoting issue during curl tests

Using passwords with `!` in zsh caused `dquote>` prompt confusion and incomplete shell commands.

**Resolution:** For shell smoke tests, use passwords without shell-special characters or quote safely.

**Prevention:** Test credentials should use predictable shell-safe values such as `TestPass12345`.

## 6. M1 Acceptance Checklist

| Check | Result |
|---|---|
| Tutor register route works | PASS |
| Tutor mode visible | PASS |
| Register calls Railway API | PASS |
| CORS allows frontend origin | PASS |
| Register returns logged-in tutor | PASS |
| Tutor without profile reaches setup | PASS |
| Tutor profile create succeeds | PASS |
| Dashboard redirect works | PASS |
| Hard refresh keeps dashboard stable | PASS |
| Logout/login returns tutor to dashboard | PASS |

## 7. Operational Rules for Future Milestones

1. **Always test the real API contract first.** Use curl before frontend assumptions.
2. **Do not start browser testing until Vercel deployment is Ready.** Failed deployments are not live.
3. **Run `npm run build` locally before every push that affects Next.js routing.** Dev mode is not enough.
4. **Verify Vercel env values before testing.** For Hocam frontend, the API env value must be `https://web-production-22415.up.railway.app/api`.
5. **Use Network tab as the source of truth.** Error UI may be hardcoded or misleading.
6. **CORS is a backend deploy dependency.** Every frontend production/preview origin must be allowlisted.
7. **Avoid broad rewrites.** M1 succeeded through targeted patches and production checks.
8. **Do not mark a milestone complete until live browser flow passes.** API-only success is not enough.

## 8. Next Recommended Work

### Immediate next gate: PR-12 Supabase Storage

Before real tutor verification uploads, move verification documents off Railway's ephemeral filesystem and into Supabase Storage. This protects trust-critical identity/YKS documents from being lost on redeploy.

### Milestone 2 priority

- **PR-06:** verified-only tutor visibility and request/booking guards.
- **PR-07:** double-booking protection using locking/overlap checks.
- **PR-08:** tutor search, ordering, university, `yks_rank_max`, and featured parameters.
- **PR-10:** frontend availability display can start independently.
- **PR-09/PR-11:** frontend filters and navbar search should wait for PR-08.

## 9. Backend GPT Handoff Summary

Milestone 1 is complete. Do not rework onboarding unless a regression appears. The most important backend risks now are storage, verification visibility rules, and booking integrity.

Next backend GPT should focus on:

1. PR-12 Supabase Storage before any real verification uploads.
2. PR-06 verified-only rules for list, lesson request, booking, and messaging access.
3. PR-07 double-booking protection with transaction safety.
4. PR-08 search/filter/order API contract for frontend M2 work.

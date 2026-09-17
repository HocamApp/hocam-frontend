# PayTR Frontend Implementation Roadmap

**Prepared:** 17 September 2026  
**Audience:** HOCAM frontend engineer  
**Repository baseline:** `hocam-frontend` `origin/main` at `eca6cba`  
**Backend dependency:** `hocam-backend` PR [#163](https://github.com/HocamApp/hocam-backend/pull/163)  
**Delivery objective:** Connect the existing package checkout to PayTR iFrame payments without allowing the browser return URL, stale client pricing, or duplicate user actions to activate a purchase.

## 1. What already exists

The frontend already has the expensive product work needed before payment:

- Tutor, package-duration, weekly-frequency and recurring-slot selection.
- Server-authoritative package creation and promotion preview.
- Optional coaching quote/hold integration.
- Tutor-acceptance status, withdrawal and unpaid cancellation surfaces.
- A student package/payment history page.
- Checkout-specific layout, colors, responsive shell and component tests.
- Legal pages for usage terms, distance sales and cancellation/refund.

The live site currently stops after creating a pending package request. It does not collect PayTR-required customer information, request a PayTR iframe token, render the iframe, reconcile an asynchronous callback, or provide accurate payment result pages.

## 2. Non-negotiable payment rules

These rules apply to every implementation choice:

1. Only the backend callback can establish payment success and activate credits.
2. `/odeme/basarili` is a progress/result screen. Reaching it is not proof of payment.
3. `/odeme/basarisiz` is also not authoritative. A late success callback may already have won.
4. Card number, expiry, CVV, 3D Secure password and OTP must remain inside PayTR's hosted iframe.
5. The frontend must never receive, store or log PayTR merchant key or merchant salt.
6. The package amount displayed before payment must come from the created `PackagePurchase`, not a recalculated client estimate.
7. A purchase requiring tutor acceptance cannot start payment until the server reports `acceptance.status === "accepted"`.
8. Retrying payment creates a new PayTR attempt for the same eligible purchase. It must not create a second package purchase.
9. A timeout or closed browser is an unknown outcome until the server state is fetched.
10. Test credits, free trials and unfunded admin QA flows never enter PayTR.
11. Do not show tutor earnings or the 15% commission as settled money in this work.
12. Do not persist name, phone or address in localStorage/sessionStorage.

## 3. Target user journey

### 3.1 Package selection

Keep the existing route:

`/tutors/[tutorId]/checkout`

The student selects the plan, recurring schedule, promotion and optional coaching. The primary action creates a pending package purchase exactly once.

After creation:

- If tutor acceptance is required and still pending, show the current request-pending state and direct the student to **Paketlerim**.
- If tutor acceptance is not required, navigate directly to the payment route.
- If the tutor has already accepted an existing pending purchase, do not create another purchase; use the existing purchase and navigate to payment.

### 3.2 Dedicated payment route

Create:

`/package-purchases/[purchaseId]/pay`

Recommended file:

`src/app/(checkout)/package-purchases/[purchaseId]/pay/page.tsx`

This route owns all payment-specific UI:

- Purchase lookup and ownership-safe rendering.
- Tutor-acceptance readiness check.
- Final authoritative package summary.
- Required customer information.
- Legal links and payment disclosure.
- PayTR token initiation.
- PayTR iframe rendering.
- Callback reconciliation and retry.

Using one route for both immediate and delayed payment prevents the package-selection page and the profile page from implementing separate payment forms.

### 3.3 Delayed payment after tutor acceptance

On `/profile/payments`, an accepted and unpaid package must show a clear **Ödemeye devam et** action that links to:

`/package-purchases/{purchaseId}/pay`

Pending acceptance continues to show the existing wait/withdraw state. Rejected, expired, withdrawn, cancelled, paid or refunded purchases must not show the payment action.

### 3.4 PayTR handoff and asynchronous result

After the customer form is valid:

1. POST the customer details to the PayTR checkout-initiation endpoint.
2. Store only non-personal recovery metadata in `sessionStorage`:
   - `purchaseId`
   - `merchantOid`
   - `tutorId`
   - `startedAt`
3. Render the returned PayTR iframe URL.
4. Poll authoritative server state while the iframe is visible.
5. If the package becomes `paid`, stop polling and render success immediately.
6. If no final state arrives within the UI timeout, show “Ödeme sonucu doğrulanıyor” and provide a safe route to **Paketlerim**. Do not call it failed.

## 4. Backend contracts to consume

All calls go through `src/lib/api.ts` and React Query. Do not call `fetch` or axios directly from page/components.

### 4.1 Create package purchase

`POST /api/payments/package-purchases/`

Existing request and response types remain authoritative. The returned purchase ID is the only ID passed into the payment route.

### 4.2 Read tutor acceptance

`GET /api/payments/package-purchases/{purchaseId}/acceptance-status/`

Payment is allowed when either:

- `requires_tutor_acceptance === false`, or
- `requires_tutor_acceptance === true` and `acceptance.status === "accepted"`.

Any other state renders a non-payment explanation. The frontend must not guess readiness from package status alone.

### 4.3 Initialize PayTR iframe

`POST /api/payments/package-purchases/{purchaseId}/paytr-checkout/`

Request:

```ts
interface StartPayTRCheckoutRequest {
  user_name: string;    // required, max 60
  user_address: string; // required, max 400
  user_phone: string;   // required, max 20
}
```

Response:

```ts
interface StartPayTRCheckoutResponse {
  merchant_oid: string;
  iframe_url: string;
}
```

Known errors:

| HTTP | Meaning | Frontend behavior |
|---|---|---|
| 400 | Missing/invalid customer data or IP | Keep form visible; map safe field errors inline |
| 404 | Purchase does not exist or does not belong to user | Show unavailable state; no retry loop |
| 409 | Purchase is not pending or tutor acceptance is missing | Refetch purchase/acceptance and render the resulting state |
| 503 | PayTR is disabled, unconfigured or temporarily unavailable | Keep purchase pending; show retry action |

Never display raw backend exception text if it exposes infrastructure detail. Use a user-safe Turkish fallback.

### 4.4 Read authoritative purchase status

Current available API:

`GET /api/payments/package-purchases/`

Find the owned purchase by ID and read `status`, `paid_at` and `remaining_credits`.

Polling defaults:

- Every 2 seconds while an active PayTR attempt is on screen.
- Stop immediately when `status !== "pending"`.
- Stop active polling after 45 seconds and switch to a slower/manual recovery state.
- Refetch on window focus and on the PayTR return pages.

### 4.5 Backend follow-up required before complete failure UX

The current backend does not expose a student-safe PayTR attempt status. A pending purchase therefore cannot distinguish these states:

- iframe token issued and waiting for the customer;
- PayTR returned a verified failed callback;
- callback has not arrived;
- the attempt needs manual review.

Request a read-only endpoint such as:

`GET /api/payments/package-purchases/{purchaseId}/payment-state/`

Recommended response:

```ts
interface PurchasePaymentState {
  purchase_id: string;
  purchase_status: "pending" | "paid" | "cancelled" | "refunded";
  latest_attempt: null | {
    merchant_oid: string;
    status: "created" | "token_issued" | "succeeded" | "failed";
    failure_message: string | null;
    created_at: string;
    completed_at: string | null;
  };
  manual_review: boolean;
}
```

Until this endpoint exists, the frontend may use package polling for success but must use neutral copy for unresolved/failure outcomes. It must not invent an attempt status.

## 5. Frontend types and API module

Add shared types to `src/types/api.ts`:

- `StartPayTRCheckoutRequest`
- `StartPayTRCheckoutResponse`
- `PayTRAttemptStatus`
- `PurchasePaymentState` when the backend endpoint lands

Add functions to `src/lib/paymentsApi.ts`:

- `startPayTRCheckout(purchaseId, payload)`
- `fetchPurchasePaymentState(purchaseId)` when available
- A focused safe-error extractor for PayTR initiation errors

Keep types out of components and pages. Do not embed endpoint strings in UI components.

## 6. Payment page component structure

Suggested components:

```text
src/components/payments/paytr/
  PayTRCustomerForm.tsx
  PayTRPurchaseSummary.tsx
  PayTRLegalNotice.tsx
  PayTRFrame.tsx
  PayTRProcessingState.tsx
  PayTRResultState.tsx
  paytrCheckoutState.ts
```

Responsibilities:

### `PayTRCustomerForm`

- React Hook Form + Zod.
- Fields: full name, telephone, billing/contact address.
- Respect backend maximum lengths.
- Trim text before submit.
- Use `autoComplete="name"`, `autoComplete="tel"`, and `autoComplete="street-address"`.
- Do not persist field values after navigation or reload.
- Disable duplicate submission while the token request is pending.
- Focus the first invalid field and expose errors with accessible descriptions.

Suggested client validation:

- Name: 2–60 visible characters.
- Phone: accept common Turkish input formatting, send a normalized string no longer than 20 characters.
- Address: 5–400 visible characters.

Client validation improves UX; backend validation remains authoritative.

### `PayTRPurchaseSummary`

Display values from the created purchase:

- Tutor.
- Package name.
- Total credits.
- Recurring schedule when available.
- Subtotal.
- Package discount.
- Promotion discount.
- Final amount.
- “Tek seferlik ödeme; otomatik yenilenmez.”

Do not recompute the final amount from tutor hourly price on this route.

### `PayTRLegalNotice`

Always show links to:

- `/kullanim-kosullari`
- `/mesafeli-satis-sozlesmesi`
- `/iptal-ve-iade`

Do not add a checkbox that claims a versioned contract acceptance is recorded unless the backend stores the accepted document versions and timestamp. Displaying links is valid; fabricating an audit trail is not.

Exact seller/intermediary identity, VAT language and invoice promises remain dependent on the legal/tax decision. Do not invent them in frontend copy.

### `PayTRFrame`

- Accept only an iframe URL beginning with `https://www.paytr.com/odeme/guvenli/`.
- Reject any other origin with a safe error state.
- Provide a meaningful `title`, for example `PayTR güvenli ödeme formu`.
- Use full available width and a mobile-safe minimum height.
- Never add card inputs around or over the iframe.
- Do not log the iframe URL; it contains the short-lived token.
- Use PayTR's official iframe-resizer script only if required for height behavior. Load it once with `next/script`; do not duplicate script tags on retries.
- Do not apply a restrictive `sandbox` attribute unless every PayTR and 3D Secure flow has been verified. An incorrect sandbox can break bank redirects and challenges.

If a Content Security Policy is added later, it must explicitly permit PayTR in `frame-src` and the official resizer source in `script-src`. The current `X-Frame-Options: DENY` protects HOCAM from being embedded and does not block HOCAM from embedding PayTR.

## 7. Explicit UI state machine

Implement a pure state mapper in `paytrCheckoutState.ts`. Components should render its result instead of scattering conditions across JSX.

Recommended states:

| State | Trigger | Primary UI/action |
|---|---|---|
| `loading_purchase` | Initial purchase query | Skeleton/loading label |
| `purchase_unavailable` | Missing/not owned | Return to Paketlerim |
| `acceptance_pending` | Tutor decision pending | Waiting explanation; withdraw link |
| `acceptance_rejected` | Rejected/expired/withdrawn | Explain request ended; start a new selection |
| `payment_ready` | Pending purchase and acceptance satisfied | Customer form |
| `starting_payment` | Token request in flight | Disabled CTA and inline progress |
| `iframe_open` | Valid PayTR iframe URL returned | Hosted payment form + status polling |
| `callback_pending` | Return/timeout before paid state | “Sonuç doğrulanıyor” + refetch |
| `payment_paid` | Purchase status `paid` | Success and available credits |
| `attempt_failed` | Verified failed attempt | Safe failure reason + retry same purchase |
| `manual_review` | Backend says review required | No retry storm; support/recheck guidance |
| `purchase_cancelled` | Purchase cancelled | No payment controls |
| `service_unavailable` | PayTR init 503/network error | Retry token request |

State precedence matters. For example, a failed return page must render `payment_paid` if the server already says the purchase is paid.

## 8. Changes to the existing checkout page

File:

`src/app/(checkout)/tutors/[id]/checkout/page.tsx`

Required changes:

1. Keep selection, promo, coaching and schedule behavior unchanged.
2. Rename purchase submission copy so it describes the real next step:
   - If acceptance is required: **Paketi hocaya gönder**.
   - If acceptance is not required: **Ödemeye devam et**.
3. After `createPackagePurchase`, fetch acceptance state.
4. Route payment-ready purchases to `/package-purchases/{id}/pay`.
5. Render the existing request-created result only for acceptance-pending purchases.
6. Remove “Kartından anlık ödeme alınmaz” from payment-ready paths.
7. Keep the statement only where it is factually true: before tutor acceptance and before PayTR initiation.
8. Do not create another purchase when a matching pending purchase already exists.

The checkout page should not render the PayTR iframe itself. Its job ends after it creates or resolves the payable purchase.

## 9. Changes to Paketlerim and acceptance UI

Files:

- `src/components/payments/PackageRequestStatus.tsx`
- `src/components/payments/PackagePurchaseCard.tsx`
- `src/app/(main)/profile/payments/page.tsx`

Required behavior:

- `pending` acceptance: keep wait and withdrawal controls.
- `accepted` + purchase `pending`: show **Ödemeye devam et**.
- `accepted` + active attempt: show **Ödeme durumunu kontrol et** or resume payment route.
- `paid`: show credits and paid date; remove unpaid cancellation.
- `failed attempt` + purchase `pending`: show **Ödemeyi tekrar dene**.
- `manual_review`: show a neutral review message and no repeated automatic token calls.
- `cancelled/refunded`: never show payment controls.

Update old comments and copy that say no payment provider is connected. Keep statements about no collection only in states where no PayTR attempt has started.

## 10. Return pages

Create:

```text
src/app/(checkout)/odeme/basarili/page.tsx
src/app/(checkout)/odeme/basarisiz/page.tsx
```

Both pages must:

1. Read the non-PII active-attempt metadata from sessionStorage.
2. Refetch the owned purchase/payment state.
3. Treat backend state as authoritative.
4. Clear recovery metadata only after a final server state is established or the user explicitly abandons recovery.

### Successful return copy

While callback is pending:

- Heading: **Ödeme sonucu doğrulanıyor**
- Body: **Bankadan gelen sonuç güvenli şekilde kontrol ediliyor. Bu sayfayı kapatsan da Paketlerim alanından durumu takip edebilirsin.**

After `paid`:

- Heading: **Ödemen onaylandı**
- Show package, paid amount and activated lesson credits.
- Primary action: **Paketlerime git**.

### Failed return copy

First refetch server state. If paid, render success. If unresolved:

- Heading: **Ödeme tamamlanamadı**
- Body: **Kartından ücret alındığından emin değilsen yeni bir ödeme başlatmadan önce Paketlerim alanındaki durumu kontrol et.**
- Primary action when backend confirms attempt failure: **Tekrar dene**.
- Secondary action: **Paketlerime git**.

Never say “Kartından kesinlikle çekilmedi” unless PayTR/backend provides an authoritative result supporting that claim.

## 11. Retry and recovery design

- A retry calls `paytr-checkout` again for the same purchase ID.
- Never POST `package-purchases/` during a payment retry.
- Replace the old iframe token and merchant OID with the new attempt.
- Guard against double clicks with mutation state and button disabling.
- If the user reloads the iframe page, refetch purchase/payment state before creating a new attempt.
- If an earlier attempt later succeeds, purchase polling must move to success and suppress further retry controls.
- If sessionStorage is missing, the return page falls back to **Paketlerim** without claiming a result.

## 12. Error presentation matrix

| Condition | User message | Retry? |
|---|---|---|
| Network error starting token | “Güvenli ödeme formu açılamadı.” | Yes |
| Backend 503 / PayTR disabled | “Ödeme hizmeti şu anda kullanılamıyor.” | Yes, manual |
| Tutor not accepted | “Ödeme için öğretmen onayı bekleniyor.” | No |
| Purchase already paid | Render success | No |
| Purchase cancelled/refunded | “Bu paket için ödeme başlatılamaz.” | No |
| Invalid iframe origin | “Güvenli ödeme adresi doğrulanamadı.” | No; report operationally |
| Callback pending | “Ödeme sonucu doğrulanıyor.” | Refetch only |
| Verified failed attempt | Safe PayTR failure or generic message | Yes |
| Manual review | “Ödeme kontrol ediliyor; yeni işlem başlatma.” | No automatic retry |

Provider failure messages are untrusted display data. Prefer a mapped, approved message set; never inject HTML.

## 13. Tests required

### Unit tests

Add tests for:

- API URL, method and payload shape.
- Customer-form length and required-field validation.
- Turkish phone normalization.
- iframe origin allowlist.
- Payment-state precedence.
- Retry reuses purchase ID.
- No PII is written to localStorage/sessionStorage.
- Legal links render before the payment CTA.
- Old “no instant payment” copy is absent from payment-ready/iframe states.

### Component tests

- Tutor acceptance pending blocks payment.
- Accepted purchase exposes the payment route.
- Token request disables duplicate submission.
- Valid token renders one iframe.
- Invalid iframe URL renders no iframe.
- Purchase becoming paid while iframe is open replaces it with success.
- Browser return before callback shows pending verification.
- Callback before browser return shows success immediately.
- Failed return followed by paid server state shows success.
- Failed attempt offers retry and creates no new package.
- Manual review suppresses retry.

### Route/integration tests

Mock API responses for the complete state machine. Include hard refresh on:

- payment form;
- active iframe;
- successful return;
- failed return.

### Responsive and accessibility verification

Verify at minimum:

- 320×568
- 375×812
- 768×1024
- 1440×900

Checks:

- No horizontal overflow.
- PayTR iframe is usable without clipped bank/3D Secure controls.
- Labels and errors are programmatically connected.
- Loading states use `role="status"` or appropriate live regions.
- Focus moves to the iframe heading or result heading after state changes.
- Keyboard users can reach legal links, submit, iframe and recovery actions.
- Color is not the only indication of success/failure.

Run before review:

```bash
npm run lint
npm run typecheck
npm run test:checkout
npm run test:unit
npm run build
```

Add a focused command such as `test:paytr` for the new tests.

## 14. Manual test-mode checklist

Use PayTR test mode only. Never use a real card during development.

1. Backend PR #163 is deployed to a test environment.
2. `PAYTR_ENABLED=True` only in that test environment.
3. Merchant credentials are deployment secrets, never frontend variables.
4. PayTR panel callback URL points to the deployed HTTPS backend callback.
5. Frontend points to that backend.
6. Create a lesson-only package without acceptance and pay successfully.
7. Create a package requiring tutor acceptance; verify payment is blocked before acceptance.
8. Accept it as tutor; resume and complete payment as student.
9. Verify one paid ledger entry and one credit activation after duplicate callback delivery.
10. Exercise declined card, abandoned iframe, browser refresh and back button.
11. Exercise a delayed callback: return page must show pending, then success.
12. Repeat on mobile viewport.
13. Confirm card/OTP data appears only in PayTR UI and nowhere in HOCAM logs or storage.

## 15. Feature flags and rollout

Add a frontend presentation flag:

`NEXT_PUBLIC_PAYTR_ENABLED=false`

This flag controls whether payment UI and **Ödemeye devam et** actions are visible. It does not authorize payment by itself; the backend `PAYTR_ENABLED` remains authoritative.

Rollout order:

1. Merge/deploy backend with `PAYTR_ENABLED=False`.
2. Merge/deploy frontend with `NEXT_PUBLIC_PAYTR_ENABLED=false`.
3. Configure test backend secrets and PayTR callback URL.
4. Enable both flags in test/staging.
5. Complete the manual checklist.
6. Rotate any merchant credentials previously exposed during setup.
7. Record test evidence: merchant OID, timestamps, callback result and purchase ID. Do not record secrets or card data.
8. Obtain the production activation decision.
9. Enable backend first, then frontend.
10. Monitor webhook manual-review records, token errors and duplicate callbacks.

Rollback:

- Disable the frontend flag to hide new payment entry points.
- Keep backend callback processing available until every already-issued attempt is
  settled. Disabling backend PayTR immediately would also reject legitimate callbacks
  for customers already inside the iframe.
- After the maximum attempt/retry window and reconciliation check, disable backend
  `PAYTR_ENABLED` if a full provider shutdown is required.
- Existing paid purchases and ledger entries remain intact.

## 16. File-level implementation checklist

### Create

- `src/app/(checkout)/package-purchases/[purchaseId]/pay/page.tsx`
- `src/app/(checkout)/odeme/basarili/page.tsx`
- `src/app/(checkout)/odeme/basarisiz/page.tsx`
- `src/components/payments/paytr/PayTRCustomerForm.tsx`
- `src/components/payments/paytr/PayTRPurchaseSummary.tsx`
- `src/components/payments/paytr/PayTRLegalNotice.tsx`
- `src/components/payments/paytr/PayTRFrame.tsx`
- `src/components/payments/paytr/PayTRProcessingState.tsx`
- `src/components/payments/paytr/PayTRResultState.tsx`
- `src/components/payments/paytr/paytrCheckoutState.ts`
- Focused tests beside the modules above

### Modify

- `src/lib/paymentsApi.ts`
- `src/types/api.ts`
- `src/app/(checkout)/tutors/[id]/checkout/page.tsx`
- `src/components/checkout/CheckoutSummary.tsx`
- `src/components/checkout/CheckoutSuccess.tsx`
- `src/components/payments/PackageRequestStatus.tsx`
- `src/components/payments/PackagePurchaseCard.tsx`
- `src/app/(main)/profile/payments/page.tsx`
- `src/lib/paymentHistoryCopy.ts` and affected copy tests
- `AI_AGENT_RULES.md`
- `docs/current-product-and-technical-state.md`
- `package.json` for the focused PayTR test command

### Review before deleting or rewriting

- Existing schedule query serialization.
- Coaching hold/idempotency behavior.
- Promotion preview invalidation.
- Login `returnUrl` preservation.
- Free-trial and existing-credit booking paths.

These paths share the checkout page but must remain outside PayTR.

## 17. Definition of done

Frontend payment work is complete only when all statements below are true:

- A student can create a package, wait for tutor acceptance when required, and resume payment later.
- The final amount shown before PayTR comes from the created purchase.
- Required customer details are validated and sent only to the backend.
- PayTR card entry occurs only in the hosted iframe.
- Success is rendered only after authoritative backend state says `paid`.
- Failure and timeout copy never makes an unsupported charge claim.
- Retry uses the same purchase and a new PayTR attempt.
- Duplicate clicks and page reloads do not create duplicate purchases.
- Legal links are visible before payment.
- Payment-ready paths contain no obsolete “provider absent/no charge” language.
- Package history exposes payment continuation and recovery actions.
- Mobile, keyboard and screen-reader paths are verified.
- Lint, typecheck, focused tests, unit tests and production build pass.
- A real PayTR test-mode transaction completes end to end on deployed HTTPS URLs.
- No merchant secret, iframe token, card data, OTP, full address or phone appears in logs, analytics or browser persistence.

## 18. Out of scope for this frontend delivery

- Tutor payout/Platform Transfer UI.
- 15% commission accrual and tutor earnings settlement.
- Refund execution through PayTR.
- Invoice generation or tax calculation.
- Admin reconciliation tooling beyond consuming a future safe status.
- Changing booking completion, dispute or cancellation economics.

Those belong to later backend/payment phases and must not be simulated in the frontend.

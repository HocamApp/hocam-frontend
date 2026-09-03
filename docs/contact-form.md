# Public contact form

The `/iletisim` page replaces the inactive placeholder with a Turkish form adapted from the supplied ContactSimpleForm layout. It uses existing Hocam design tokens and dependencies.

## Delivery

- `POST /api/support/contact/` is implemented in the backend branch `codex/iletisim-formu`.
- Anonymous JSON requests require first name, last name, email, user type, message (10–5000 characters), and acknowledgment of the existing privacy notice. Phone and discovery source are optional.
- The server controls the recipient (`CONTACT_RECIPIENT_EMAIL`, default `iletisim@hocamozelders.com`) and verified sender (`DEFAULT_FROM_EMAIL`). The validated visitor address is Reply-To only.
- The existing transactional `EMAIL_*` configuration sends the message. Console, dummy, file and memory email backends return 503 instead of a false success.
- 200 means the configured email provider accepted the message. It does not prove inbox delivery. Provider failures return 503; validation returns 400; the per-IP limit is five submissions per hour (429). The existing DRF proxy and cache configuration applies.
- A honeypot filters basic automated submissions. Contact messages are not stored in the application database, and message bodies/contact details are not logged by the endpoint. No database migration is required.

## Local preview and deployment

The isolated preview uses `NEXT_PUBLIC_CONTACT_API_URL=http://localhost:8107/api/support/contact/` in an ignored `.env.local`. Only contact requests use that override; other API calls retain their existing configuration. The backend runs on port 8107, with transactional mail settings in its ignored, mode-600 `.env`.

For deployment, release the backend endpoint before the frontend. Normal deployment does not need `NEXT_PUBLIC_CONTACT_API_URL`: the form uses the configured API base URL plus `/support/contact/`. Do not deploy a localhost override. Existing production transactional email configuration is reused; no new API key is required.

## Verification

- Backend support suite: 18 passing tests, including contact validation, fixed recipient/Reply-To, failed/non-delivering backends, anonymous access and throttling.
- Frontend: lint, TypeScript, production build, SEO/footer/FAQ tests, 375/768/1440 layouts.
- Browser submission through the real local backend returned 200 and the provider accepted one clearly identified test email on 3 September 2026.
- With the backend unavailable, the browser showed failure, retained form data, and enabled retry.
- Retired price guide and success-story pages return 404; Blog had only an inert footer entry. All three are absent from the footer, sitemap and llms.txt.

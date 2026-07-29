# Technical SEO, AI Readability, Security, and Implementation Report

Audit date: 29 July 2026
Environment inspected: current frontend repository, public production frontend, and public production API
Production changes made: none

## Executive finding

Hocam had almost no machine-discovery foundation. The apex domain redirected correctly to `www`, but the live site returned homepage HTML at `/robots.txt`, returned 404 for `/sitemap.xml` and `/llms.txt`, exposed the same generic title and description across most routes, and delivered no tutor-directory H1 or tutor cards in the initial `/tutors` HTML. Authenticated route shells were crawlable and lacked `noindex`.

The local implementation fixes the non-visual foundation:

- Real `robots.txt`, XML sitemap, and `llms.txt`
- Canonical `www` URLs
- Descriptive site and public-page metadata
- `noindex` metadata for login, account, dashboard, messaging, checkout, lesson, support, matching, and admin routes
- Server-readable initial HTML for the public tutor directory and tutor profiles
- `Organization`, `WebSite`, `Service`, `ProfilePage`, and `Person` JSON-LD
- Script-safe JSON-LD serialization
- Sitemap coverage for the public tutor directory and 66 verified public tutor profiles
- Graceful sitemap fallback during a transient API outage

No visual component, user flow, payment behavior, authentication behavior, or backend permission was changed.

## Live baseline

| Check | Baseline evidence | Severity |
| --- | --- | ---: |
| Apex redirect | `https://hocamozelders.com` returned 308 to `https://www.hocamozelders.com/` | Pass |
| Homepage | 200, title `Hocam`, description `YKS hazırlık için özel ders` | Weak |
| `robots.txt` | 200 HTML homepage, not crawler directives | Critical |
| `sitemap.xml` | 404 | Critical |
| `llms.txt` | 404 | Opportunity |
| Search sample | `site:hocamozelders.com` returned no Hocam result in the sampled engine | Critical signal, not proof of zero indexation |
| Tutor directory HTML | No H1 or tutor content in initial HTML | Critical |
| Public tutor profiles | Data available from a public API; 66 profiles over paginated responses | Opportunity |
| Private route indexing | No `noindex` on dashboard, messages, profile, support, or question-library shells | High |
| Metadata | Same generic title/description across sampled routes | High |
| Structured data | None found | Medium |
| Analytics | No provider found | Measurement blocker |
| Search Console | No connection or export found | Measurement blocker |
| Security headers | HSTS, frame denial, MIME sniffing protection, referrer policy, and permissions policy present | Pass |

## Route inventory and indexing decision

### Index

- `/tutors`
- `/tutors/{public-verified-tutor-id}`

### Do not index

- `/`
- Authentication and password-reset routes
- `/admin-control`
- `/ai`
- `/cikmis-sorular`
- `/dashboard/**`
- `/hoca-bul/**`
- `/home`
- `/match`
- `/messages/**`
- `/profile/**`
- `/session/**`
- `/support`
- `/tutor/**`
- `/tutors/{id}/checkout`

The root is currently an authentication screen, not a public marketing homepage. It is therefore deliberately excluded from indexing. A future public homepage is the single largest content/architecture opportunity, but it is a visible product change and was not implemented.

## Crawlability and rendering

The public Django API exposes verified tutor data without authentication. The local frontend now prefetches this data on the server and hydrates the existing React Query keys, preserving the current components while making the initial document useful to crawlers and non-JavaScript agents.

The sitemap fetches all public tutor pages with bounded pagination, deduplicates IDs, and revalidates hourly. If the API is temporarily unavailable, `/tutors` remains in the sitemap and profiles return on the next refresh.

## Metadata and canonicalization

- Canonical origin: `https://www.hocamozelders.com`
- Site title: `Hocam | YKS için Online Özel Ders`
- Tutor directory title: `Doğrulanmış YKS Hocaları | Hocam`
- Tutor profile titles and descriptions are generated from the public profile
- Query-filtered tutor URLs consolidate to `/tutors`
- Tutor profiles canonicalize to their stable UUID URL
- Checkout and authenticated routes are not indexable

## Structured data

| Type | Location | Data source | Safety rule |
| --- | --- | --- | --- |
| `Organization` | Root layout | Stable business name, URL, and logo | No unverified address, ratings, or social links |
| `WebSite` | Root layout | Stable site identity | Turkish language declared |
| `Service` | Tutor directory | Visible online YKS tutor service | No price or guarantee claims |
| `ProfilePage` | Tutor profile | Public API and visible profile | Only public profile fields |
| `Person` | Tutor profile | Public API and visible profile | No employment relationship asserted |
| `AggregateRating` | Tutor profile | Public rating and count | Emitted only when review count is positive |

All JSON-LD is serialized with `<` escaped to prevent a user-controlled profile field from closing the script element.

## AI-agent readability

The new `/llms.txt` is intentionally small. It identifies the business, links to the canonical public directory, describes the verified-public-profile model, and warns agents not to treat account, booking, payment, lesson, or admin URLs as public sources.

`llms.txt` remains experimental. The primary machine-readable layer is the initial HTML, canonical URLs, sitemap, structured data, and consistent entity information.

The generic crawler rule retains public access while listing private/action routes as disallowed. No crawler-specific training decision was introduced. Whether to explicitly allow or block model-training crawlers remains a founder policy choice.

## Security and privacy review

- No secret or private environment value was added.
- Only an already-public API URL is used server-side.
- Public sitemap entries are limited to profiles returned by the public tutors endpoint.
- Private account and lesson routes are excluded from crawler guidance and marked `noindex`.
- No user email, token, booking, message, payment, document, or private tutor-verification field enters metadata or schema.
- API pagination is bounded to 20 requests and each request has an eight-second timeout.
- No dependency was added.
- Existing security headers were preserved.
- No CSP was introduced because an untested policy could break authentication, video, storage, or third-party sign-in.

## Performance and media

- The production build completes.
- Server prefetch adds public API work only to the tutor directory and tutor-profile routes.
- Fetches are cached/revalidated for one hour.
- No additional image, font, client script, or tracking SDK was added.
- The existing tutor photo-preview `<img>` lint warning remains. It is inside a modal preview and predates this work. Converting it to `next/image` requires image-domain and interaction QA and is not necessary for this foundation batch.
- Google PageSpeed API data could not be collected because the unauthenticated API quota returned 429. No performance score is claimed.

## Accessibility and frontend regression

The changes are metadata, server data hydration, route files, and non-rendered scripts. Existing visible JSX and styles are unchanged. The public directory should render the same hydrated state instead of showing a client-only shell first.

Browser verification covered the public tutor directory at desktop and 390-pixel mobile widths and a real public tutor profile at desktop width. The existing visible components were not edited.

- `/tutors` rendered one H1, 12 unique profile destinations, the expected canonical and `index, follow`, with no console warnings or horizontal overflow.
- The tutor profile rendered one profile-specific H1, canonical and index directives, three JSON-LD blocks, no missing image alt attributes, no unnamed buttons, no console warnings, and no horizontal overflow.
- The mobile viewport showed the existing responsive card layout without overflow. A browser-tool full-page mobile capture artifact did not reproduce in the viewport capture; DOM geometry and the normal viewport render were correct.
- Root, checkout, and dashboard indexing directives were verified from production-rendered local HTML.

Authenticated interactions, bookings, and payments were not exercised because this batch did not alter those flows and no test account or transaction authorization was supplied.

## Verification record

| Check | Result |
| --- | --- |
| Baseline lint | Pass with one existing `<img>` warning |
| Baseline TypeScript CLI | Initially failed in two pre-existing question test files; their test-only lazy-component typing was repaired |
| Baseline unit tests | 432/432 pass |
| Post-change SEO tests | 4/4 pass |
| Post-change TypeScript CLI | Pass |
| Post-change lint | Pass with the same existing `<img>` warning |
| Post-change production build | Pass |
| Generated routes | `/robots.txt`, `/sitemap.xml`, `/llms.txt` present |
| Local sitemap entries | 67: directory plus 66 public profiles |
| Root indexing | `noindex, follow` |
| Dashboard indexing | `noindex, nofollow, nocache` |
| Tutor directory indexing | `index, follow` |
| Tutor profile metadata | Profile-specific title, description, canonical, and JSON-LD |

## Remaining release gates

1. Review the PR; do not merge or deploy without approval.
2. After an approved deployment, verify production HTTP responses and submit the sitemap in Search Console.

## Authoritative references

- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Google robots specification: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- Google robots meta guidance: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google structured-data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google site-name guidance: https://developers.google.com/search/docs/appearance/site-names
- OpenAI publisher guidance: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- `llms.txt` proposal: https://llmstxt.org/

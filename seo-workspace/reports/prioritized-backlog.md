# Prioritized SEO Backlog

Scoring dimensions: business value, search opportunity, AI readability, confidence, effort, frontend impact, security risk, regression risk, and time to evidence.

## P0 — Foundation

| Item | State | Frontend impact | Risk |
| --- | --- | --- | --- |
| Correct `robots.txt` | Implemented locally | None | Low |
| Generate XML sitemap | Implemented locally | None | Low |
| Add `llms.txt` | Implemented locally | None | Low |
| Add canonical metadata | Implemented locally | None | Low |
| Add public/private indexing controls | Implemented locally | None | Low |
| Server-render tutor directory and profiles | Implemented locally | No intended visual change | Medium |
| Add truthful JSON-LD | Implemented locally | None | Low |
| Connect Search Console | Pending external access | None | Low |
| Select privacy-approved analytics | Pending founder decision | None until implemented | Medium |

## P1 — Public acquisition and trust

| Item | State | Approval |
| --- | --- | --- |
| Dedicated YKS landing page | Implemented locally | Publishing approval pending |
| “How it works” page | Implemented locally | Publishing approval pending |
| Tutor verification page | Implemented locally from current verification flow | Publishing approval pending |
| TYT mathematics page | Implemented locally from live public tutor supply | Publishing approval pending |
| AYT mathematics page | Implemented locally from live public tutor supply | Publishing approval pending |
| Price-factor guide | Implemented locally with disclosed live-data methodology | Publishing approval pending |
| Tutor-selection guide | Planned | Editorial reviewer |
| About page | Implemented locally | Publishing approval pending |
| Contact and legal visibility | Planned | Founder and legal |

## P2 — Expansion

- Physics, chemistry, biology, Turkish, and geometry clusters after supply/GSC validation
- Balanced learning-model comparisons
- Tutor acquisition page
- Dedicated social preview assets
- Anonymized linkable research
- Personalized digital PR

## P3 — Deferred or excluded

- City/district pages without a physical service
- Coaching-price keywords when coaching is not the product
- Copyrighted notes/PDF intent
- Legal/tax advice
- Competitor alternative pages without brand/legal review
- Model-training crawler policy without founder approval
- Mass content or mass outreach

## Release sequence

1. Finish local QA.
2. Review diff and branch against current `origin/main`.
3. Obtain approval to push and open a PR.
4. Approve merge/deployment separately.
5. Verify live crawler files, metadata, HTML, and structured data.
6. Connect Search Console and submit sitemap.
7. Collect four weeks of first-party data.
8. Use first-party data to approve the next content batch.

## Rollback conditions

Rollback the technical batch if:

- Tutor directory or profile behavior changes for users
- Authentication or protected-route behavior regresses
- Production build or hydration errors appear
- Public API failures materially slow public pages
- Private data appears in HTML, metadata, schema, or sitemap
- Crawler files expose private URLs as indexable

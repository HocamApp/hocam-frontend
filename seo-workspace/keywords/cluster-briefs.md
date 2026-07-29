# Keyword Clusters and Page Mapping

Metrics are deliberately marked unknown. The clusters are based on Turkish autocomplete, sampled live SERPs, product fit, and intent—not lexical similarity alone. Search Console and OpenSEO should later validate demand, difficulty, and current impressions.

## Mapping summary

- Clusters: 13
- Existing public targets: 2 (`/tutors` and tutor profiles)
- Proposed commercial/support pages: 11
- Explicit exclusions: copyrighted PDF intent, tax advice, and coaching-price intent
- Cannibalization risk: highest between broad YKS mathematics, TYT mathematics, and AYT mathematics

## Cluster map

| Cluster | Primary keyword | Intent | Target | Priority | Decision |
| --- | --- | --- | --- | ---: | --- |
| Core directory | `yks özel ders` | Commercial | `/tutors` | P0 | Optimize existing |
| Verified ranked tutors | `yks dereceli hoca özel ders` | Commercial | `/tutors` + verification page | P0 | Existing + proposed trust page |
| TYT mathematics | `tyt matematik özel ders` | Commercial | `/yks/tyt/matematik-ozel-ders` | P0 | Create after approval |
| AYT mathematics | `ayt matematik özel ders` | Commercial | `/yks/ayt/matematik-ozel-ders` | P0 | Create after approval |
| Mathematics hub | `yks matematik özel ders` | Commercial | `/yks/matematik-ozel-ders` | P1 | Create only if hub has distinct intent |
| Science subjects | `yks fizik özel ders` | Commercial | Subject pages | P1 | Validate supply first |
| Pricing | `online özel ders fiyatları` | Commercial | `/rehber/online-ozel-ders-ucretleri` | P1 | Use real platform data |
| How it works | `online özel ders nasıl alınır` | Informational-commercial | `/nasil-calisir` | P1 | Create |
| Tutor selection | `özel ders hocası nasıl bulunur` | Informational-commercial | `/rehber/yks-hocasi-nasil-secilir` | P1 | Create |
| Trust and verification | `doğrulanmış özel ders hocası` | Commercial support | `/hocalar-nasil-dogrulaniyor` | P1 | Create after policy review |
| Learning-model comparison | `yks koçluk mu özel ders mi` | Comparison | `/rehber/yks-kocluk-mu-ozel-ders-mi` | P1 | Create balanced guide |
| Competitor alternatives | `kunduz alternatifi` | Comparison | Brand-reviewed comparison pages | P2 | Approval required |
| Tutor acquisition | `online özel ders verme` | Supply | `/hoca-ol` | P1 | Create separate funnel |

## Brief: `/tutors`

- Page type: live tutor directory
- Searcher problem: find and compare a credible YKS tutor
- Primary term: `yks özel ders`
- Required visible sections:
  - What makes listed tutors relevant to YKS
  - How verification works in one concise linkable explanation
  - How to compare subject, rank, availability, reviews, and price
  - Real tutor results
  - How the next step works
- Internal links:
  - Verification page
  - How it works
  - Pricing guide
  - Subject pages
- Current limitation: the page has the directory UI, but lacks durable explanatory content below the results.

## Brief: `/yks/tyt/matematik-ozel-ders`

- Searcher problem: find a tutor for TYT mathematics weaknesses and exam preparation
- Required sections:
  - Who the service fits
  - Common TYT mathematics needs without promising outcomes
  - How to choose a tutor by level and teaching style
  - Live filtered tutor inventory
  - Price factors from current platform supply
  - Lesson and trial process
  - FAQs
- Must not:
  - Publish fabricated averages
  - Promise net increases
  - Use copied exam questions or book content

## Brief: `/yks/ayt/matematik-ozel-ders`

- Searcher problem: find deeper topic and problem-solving support for AYT mathematics
- Required sections:
  - Difference from TYT intent
  - Topic-depth and prerequisite considerations
  - Tutor selection signals
  - Live filtered inventory
  - Scheduling and lesson process
  - FAQs

## Brief: `/rehber/online-ozel-ders-ucretleri`

- Searcher problem: understand what changes the price and inspect current options
- Data source: current public tutor prices, aggregated safely
- Required:
  - “Updated on” date
  - Lesson-duration context
  - Subject, tutor experience/rank, demand, and frequency factors
  - Live min/median/max only when sample size and methodology are disclosed
  - Link to filtered profiles
- Review cadence: monthly

## Brief: `/nasil-calisir`

- Searcher problem: understand the full process before registration
- Required steps:
  - Explore verified profiles
  - Compare fit
  - Contact or start the approved booking path
  - Schedule and join the online lesson
  - Review and continue
- Must match actual product behavior and current payment gates.

## Brief: `/hocalar-nasil-dogrulaniyor`

- Searcher problem: understand what “verified” does and does not mean
- Required:
  - Publicly approved criteria
  - Document review at a safe level of detail
  - What YKS rank means
  - What verification does not guarantee
  - Reporting and review mechanisms
- Security rule: never reveal storage paths, internal admin processes, or document examples.

## Brief: learning-model comparison

- Page type: balanced decision guide
- Compare:
  - One-to-one subject tutoring
  - Exam coaching/mentoring
  - Group course/online course
  - Self-study
- Dimensions:
  - Need
  - Personalization
  - Accountability
  - Content teaching
  - Scheduling
  - Cost structure
- Do not declare Hocam the universal winner.

## Cannibalization rules

1. `/tutors` owns broad platform and directory intent.
2. Subject pages own subject + exam intent.
3. Guides own informational questions.
4. Pricing pages own “price/fees/how much” intent.
5. Do not create city pages for an online-first service.
6. Merge TYT/AYT mathematics into one hub if live SERPs or GSC show the same ranking pages.
7. Tutor profiles target names and individual credentials, not broad category keywords.

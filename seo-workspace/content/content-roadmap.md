# Content, Architecture, On-Page, Trust, Media, and Conversion Roadmap

The first approved batch has been implemented locally and is not deployed:

- `/yks-ozel-ders`
- `/yks/tyt/matematik-ozel-ders`
- `/yks/ayt/matematik-ozel-ders`
- `/nasil-calisir`
- `/hocalar-nasil-dogrulaniyor`
- `/rehber/online-ozel-ders-ucretleri`
- `/hakkimizda`

The remaining routes are proposals that still require separate approval. Contact and legal pages remain pending because approved public text and ownership details were not available.

## Recommended public architecture

```text
/
├── tutors
│   └── {tutor-id}
├── yks
│   ├── matematik-ozel-ders
│   ├── tyt
│   │   ├── matematik-ozel-ders
│   │   ├── fizik-ozel-ders
│   │   ├── kimya-ozel-ders
│   │   └── biyoloji-ozel-ders
│   └── ayt
│       ├── matematik-ozel-ders
│       ├── fizik-ozel-ders
│       ├── kimya-ozel-ders
│       └── biyoloji-ozel-ders
├── nasil-calisir
├── hocalar-nasil-dogrulaniyor
├── rehber
│   ├── online-ozel-ders-ucretleri
│   ├── yks-hocasi-nasil-secilir
│   ├── yks-kocluk-mu-ozel-ders-mi
│   ├── ozel-ders-mi-dershane-mi
│   └── online-ozel-ders-nasil-yapilir
├── hoca-ol
├── hakkimizda
├── iletisim
└── yasal
    ├── gizlilik
    ├── kullanim-kosullari
    └── cerez-politikasi
```

Only pages supported by real services, tutor supply, approved legal text, and maintainable editorial ownership should be created.

## Homepage decision

Current state:

- `/` is a login/register screen and is correctly treated as `noindex`.
- This leaves Hocam without a crawlable public homepage that explains the business.

Preferred option:

- Make `/` a public marketing and discovery page.
- Keep authentication at `/login` and `/register`.

Lower-impact alternative:

- Preserve `/` as login.
- Create `/yks-ozel-ders` as the primary public landing page.

The lower-impact alternative is implemented locally. The root authentication flow is unchanged. Moving the public experience to `/` remains a separate product decision.

## Publication order

### Foundation pages

1. Public homepage or approved primary landing page
2. How it works
3. How tutors are verified
4. About and contact
5. Approved public legal/policy pages

### Commercial clusters

1. TYT mathematics private lessons
2. AYT mathematics private lessons
3. YKS mathematics hub, only if it serves a distinct intent
4. Physics, chemistry, and biology pages in order of verified tutor supply

### Decision support

1. How to choose a YKS tutor
2. Online private-lesson price factors
3. Private tutoring versus coaching
4. Private tutoring versus a tutoring center
5. How online one-to-one lessons work

### Supply acquisition

1. Become a tutor
2. Verification requirements
3. Tutor platform workflow

## On-page specification

Every indexable page must have:

- One clear purpose and primary intent
- A unique title and meta description
- One meaningful H1
- An answer to the primary question near the top
- Real HTML text
- A logical H2/H3 hierarchy
- A canonical URL
- Relevant internal links
- Accurate update date where facts can age
- Author or reviewer where educational advice is published
- Only schema that matches visible content
- A conversion action appropriate to the page intent

Avoid:

- Keyword repetition
- Generic intros
- Fake urgency
- Guaranteed outcomes
- Unsupported “best” claims
- City or district doorway pages
- One thin page per keyword variation
- AI-generated content published without subject review

## Content quality and editorial controls

### Authors and review

- Product/process pages: reviewed by a founder or product owner
- Educational guidance: reviewed by a qualified, named educator
- Legal/policy pages: reviewed by the relevant legal owner
- Pricing reports: methodology and sample size disclosed
- Verification pages: reviewed for security and privacy

### Update cadence

- Pricing: monthly
- Product process: every release that changes the flow
- Exam rules/dates: whenever ÖSYM publishes changes
- Evergreen decision guides: at least every six months
- Tutor inventory: live data

### Source policy

- Use ÖSYM and MEB as primary sources for exam rules and curricula.
- Cite the source and access/update date.
- Do not reproduce copyrighted questions, books, or answer keys.
- Separate Hocam product facts from general educational advice.

## Trust and entity plan

Public trust signals should include:

- Clear business identity and contact path
- Honest marketplace model
- Verification explanation
- Tutor rank and university context
- Genuine reviews tied to completed lessons
- Reporting and safety process
- Current privacy, terms, cancellation, and service policies
- Named content reviewers

Do not expose:

- Verification documents
- Storage paths
- Private admin criteria
- Personal contact details not approved for public use
- Student or booking data

## Internal-link plan

### From `/tutors`

- How tutors are verified
- How it works
- Price guide
- Subject pages

### From subject pages

- Prefiltered tutor directory
- Tutor selection guide
- Pricing guide
- Relevant comparison guide

### From tutor profiles

- Back to relevant subject/exam directory
- Verification explanation
- Booking-process explanation

### From guides

- One primary commercial page
- One or two related guides
- Relevant tutor inventory

Anchor text should describe the destination naturally. Avoid repeated exact-match anchors in every block.

## Media plan

- Use `next/image` for content images and meaningful tutor assets where interaction permits.
- Keep correct dimensions to avoid layout shift.
- Use concise alt text for informative images.
- Use empty alt text for decorative assets.
- Provide captions or transcripts for educational video.
- Do not place essential claims only in images or video.
- Create a dedicated social-share image before using a square application logo as the default Open Graph asset.

## Local SEO decision

Hocam is currently online-first. Do not create city, district, neighborhood, or Google Business Profile strategies until a real physical location or verified face-to-face service area exists.

If physical service begins:

1. Confirm legal business name, address, phone, and operating model.
2. Define service areas.
3. Create only location pages with real local supply and unique information.
4. Keep business details consistent.
5. Track local leads separately.

## Conversion review

Current acquisition friction:

- The root URL assumes the visitor is ready to sign in.
- Searchers receive little public explanation before account creation.
- The tutor directory has a strong discovery UI but limited durable explanatory content.

Recommended tests after visible changes are approved:

- Public homepage versus dedicated acquisition landing page
- “Browse tutors” as the primary unauthenticated action
- Verification explanation near directory trust signals
- Clear distinction among message, trial, and booking actions
- Parent-focused reassurance without inventing a parent account flow

No conversion change should alter payment or package behavior.

## Content scorecard

Approve a page only if it passes:

| Criterion | Required |
| --- | --- |
| Business fit | Yes |
| Distinct search intent | Yes |
| Real tutor supply or evidence | Yes |
| Original value | Yes |
| Named owner/reviewer | Yes |
| Internal-link destination | Yes |
| Conversion role | Yes |
| Update plan | Yes |
| Legal/security review where needed | Yes |
| No unsupported claim | Yes |

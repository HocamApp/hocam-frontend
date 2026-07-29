# Measurement and Monitoring Plan

## Current state

- Search Console: not connected
- Analytics provider: not installed
- Provider-neutral in-app analytics events: present for selected product flows, but no collector was found
- Conversion baseline: unavailable
- Ranking baseline: directional SERP observations only

No tracker was added. Installing one without consent, privacy, retention, and payload decisions would create unnecessary legal and security risk.

## Primary business outcomes

1. Qualified students discover a relevant tutor.
2. Students view a tutor profile.
3. Students begin and complete the approved contact or booking path.
4. Tutors complete verification and become publicly listable.

Payment records are not treated as proof of settled payment or revenue until the product has a live payment provider and the existing product gates are lifted.

## KPI hierarchy

### Search visibility

- Non-branded impressions and clicks
- Branded impressions and clicks
- Average position by cluster
- Indexed public tutor profiles
- Sitemap discovery and crawl errors
- Query-to-page cannibalization

### Engagement

- Tutor directory visits
- Filter and search use
- Tutor profile views
- Profile-to-contact or profile-to-booking start rate
- Hoca matching starts and completions when the feature is enabled

### Conversion

- Qualified lesson request starts
- Qualified lesson request completions
- Booking starts and completions
- Trial requests
- Lead-to-completed-lesson rate

### Quality and trust

- Verified tutors listed
- Tutor profile completeness
- Review count and rating coverage
- Cancellation, dispute, and no-show rates, reported only in private dashboards

### AI discovery

- Referral sessions containing `utm_source=chatgpt.com`
- Public citations of Hocam
- Accuracy of AI descriptions
- Competitor inclusion for a fixed benchmark prompt set

## Privacy-safe event taxonomy

Proposed public events:

- `seo_landing_view`
- `tutor_directory_view`
- `tutor_filter_applied`
- `tutor_profile_view`
- `contact_flow_started`
- `contact_flow_completed`
- `booking_flow_started`
- `booking_flow_completed`
- `trial_request_completed`

Never include email, full name, message text, free-form search text, profile biography, token, booking ID, payment details, or document identifiers in analytics payloads. Use coarse page category and non-identifying aggregate dimensions.

## Provider selection gate

Before implementation, approve:

1. Analytics provider
2. Consent and cookie model
3. Data-processing agreement and region
4. Retention period
5. Event allowlist
6. Staff access
7. Deletion procedure
8. Search Console ownership

## Monitoring cadence

### Weekly

- Indexing and sitemap errors
- Public-route availability
- Organic landing pages
- Qualified conversion changes
- Structured-data errors
- Performance or frontend regressions

### Monthly

- Cluster performance
- Page growth and decline
- Cannibalization
- Competitor SERP changes
- New links and mentions
- AI citation benchmark
- Content decay and refresh candidates

### Quarterly

- Business positioning
- Page architecture
- Crawler policy
- Privacy and retention
- Content consolidation
- Priority roadmap

## AI citation benchmark prompts

Record answers, source links, and date for:

1. “Türkiye’de YKS için online özel ders hocası nasıl bulabilirim?”
2. “YKS’de derece yapmış üniversite öğrencilerinden özel ders alabileceğim platformlar hangileri?”
3. “TYT matematik için online özel ders platformu öner.”
4. “Kunduz’a alternatif birebir özel ders platformları hangileri?”
5. “Doping Hafıza yerine birebir hoca seçebileceğim bir platform var mı?”
6. “Online özel ders hocası seçerken YKS sıralaması ve yorumları nasıl karşılaştırabilirim?”

Treat results as qualitative observations, not stable ranking metrics.

## Release annotations

For every SEO release, record:

- Date and commit
- URLs changed
- Technical/content/schema category
- Expected outcome
- Search Console annotation note
- Analytics annotation note
- Rollback condition
- Review date at 7, 28, and 90 days

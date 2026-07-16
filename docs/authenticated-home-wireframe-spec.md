# Authenticated Home — Grayscale Wireframe Specification

**Artifact status:** Ready for content review and low-fidelity validation
**Route:** `/home`
**Audience:** Authenticated students
**Primary conversion:** Tutor discovery
**Secondary conversion:** Learning-package discovery
**Out of scope:** High-fidelity styling, dashboard redesign, tutor-marketplace rebuild, new backend recommendation logic

This document is the agreed low-fidelity structure for Hocam's authenticated student home. It fixes content order, layout proportions, behavior, state rules, and real data dependencies before visual polish or implementation begins.

---

## 1. Product and route decisions

### Page role

`/home` answers: **“Hocam'da ne yapabilirim ve nereden başlamalıyım?”**

It is a discovery and starting-point page. It does not replace:

- `/dashboard/student`, which remains the operational student dashboard.
- `/tutors`, which remains the full tutor marketplace and filtering experience.
- `/dashboard/student/learning`, which remains the full learning-goal catalogue and progress hub.
- `/cikmis-sorular`, which remains the question library.

### Role behavior

- Authenticated student → render `/home`.
- Unauthenticated visitor → redirect to `/login?returnUrl=/home`.
- Authenticated tutor → redirect to `/dashboard/tutor`.
- After student login or registration → default destination becomes `/home`, unless a valid `returnUrl` is present.
- Tutor login behavior remains unchanged.
- The existing `/` integrated login/register screen remains unchanged in V1.

### Student navigation map

| Label | Destination | Role on Home |
| --- | --- | --- |
| Hocam logo | `/home` | Home shortcut |
| Ana Sayfa | `/home` | Active item |
| Hocalar | `/tutors` | Tutor marketplace |
| Öğrenme | `/dashboard/student/learning` | Learning hub |
| Çıkmış Sorular | `/cikmis-sorular` | Practice library |
| Panelim | `/dashboard/student` | Operational dashboard |
| Mesajlar | `/messages` | Utility action |
| Favoriler | `/tutors?favorites=1` | Utility action |
| Bildirimler | Existing popover | Utility action |
| Profil | Existing profile menu | Account utility |

For tutors, the existing navigation and logo destination are not changed by this student-home project.

---

## 2. Wireframe conventions

The wireframes use grayscale roles rather than final colors.

| Token | Meaning |
| --- | --- |
| G0 | Page background / white |
| G1 | Subtle section surface |
| G2 | Border / divider / skeleton |
| G3 | Muted icon or metadata |
| G4 | Secondary text |
| G5 | Primary text |
| G6 | Primary action / strongest emphasis |

No gradients, branded accents, photography treatment, decorative glow, or motion styling should be judged in this phase. Tutor photography may appear as a gray image block only to validate composition.

### Shared layout dimensions

| Property | Desktop | Tablet | Mobile |
| --- | ---: | ---: | ---: |
| Reference viewport | 1440 px | 900 px | 390 px |
| Content max width | 1280 px | Fluid | Fluid |
| Page gutter | 32 px | 24 px | 16 px |
| Section vertical gap | 96 px | 72 px | 56 px |
| Grid gap | 24 px | 20 px | 16 px |
| Navigation height | 64 px | 64 px | 108 px total |
| Minimum touch target | 44 × 44 px | 44 × 44 px | 44 × 44 px |

Use the existing spacing scale in implementation. The dimensions above describe hierarchy and density, not new one-off design tokens.

---

## 3. Full-page order

The default page uses this fixed order:

1. Optional announcement bar — absent by default
2. Authenticated navigation
3. Hero
4. Tutor discovery
5. Continue module — conditional
6. Learning-package discovery
7. Practice resources
8. Compact status strip — conditional
9. Closing tutor CTA
10. Existing footer

The continue module and status strip collapse completely when they have no useful content. They never show large empty-state cards on Home.

---

## 4. Desktop overview wireframe

Reference viewport: **1440 × 900 px**. Container: **1280 px**. The next section title should remain visible below the hero at common laptop heights.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HOCAM  [Ana Sayfa] Hocalar Öğrenme Çıkmış Sorular Panelim   ◇ ◇ ◇ [Profil] │ 64
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐   ┌──────────────────────────────────┐   │
│  │ DOĞRULANMIŞ YKS HOCALARI       │   │ [Doğrulanmış hoca]              │   │
│  │                                 │   │                                  │   │
│  │ Hedefine uygun hocayı bul,      │   │      (Tutor image)               │   │
│  │ öğrenmeye bugün başla.          │   │      Name ✓                      │   │
│  │                                 │   │      University · Department     │   │
│  │ Supporting copy                 │   │      Subject · Rating            │   │
│  │                                 │   │                                  │   │
│  │ [ Subject combobox       ][CTA] │   │ YKS rank        Price / 40 dk    │   │
│  │ Learning link · Questions link  │   │ [Profili gör]                    │   │
│  │                                 │   └──────────────────────────────────┘   │
│  │ ✓ Verified  ★ Reviews  ◷ Flexible                                      │
│  └─────────────────────────────────┘                                        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Sana uygun hocaları keşfet                              [Tüm hocaları gör →] │
│ Ders ve sınav bilgilerine göre karşılaştır.                                  │
│ [ Tutor card ]               [ Tutor card ]               [ Tutor card ]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

Hero composition:

- Left column: 56%.
- Right column: 44%.
- Column gap: 64 px.
- Hero content area: approximately 620 px tall after navigation.
- Hero top/bottom padding: 72 px.
- The hero uses a contained G1 surface or a full-width G1 band; choose one in high fidelity, not both.
- The hero visual is vertically centered and never taller than the content column.

---

## 5. Navigation specification

### Desktop, 1024 px and wider

- Keep the existing 64 px sticky header and border.
- Show all five student destination labels as text.
- Reuse the current selected-navigation pill treatment for `Ana Sayfa`.
- Place Messages, Notifications, Favorites, and Profile in the utility area.
- Utility items may remain icon-first, but every icon must have an accessible name and tooltip.
- Do not display a permanent promotional bar.

### Tablet, 768–1023 px

- Keep the logo and active destination label visible.
- Collapse lower-priority route labels to their existing icons when needed.
- Keep the route order unchanged.
- Never wrap navigation into two unstructured rows.

### Mobile, below 768 px

Use two ordered rows inside one sticky navigation system:

1. 56 px top row: logo, Messages, Notifications, Profile.
2. 52 px horizontally scrollable route row: Ana Sayfa, Hocalar, Öğrenme, Sorular, Panelim.

The second row reuses the selected pill language. It is not a new navigation system. The active item scrolls into view, and the row has a visible focus treatment even though scrollbars remain visually hidden.

---

## 6. Hero section

### 6.1 Fixed content

| Role | Final low-fidelity copy |
| --- | --- |
| Eyebrow | **DOĞRULANMIŞ YKS HOCALARI** |
| H1 | **Hedefine uygun hocayı bul, öğrenmeye bugün başla.** |
| Supporting copy | Dersine, sınav hedefine, bütçene ve uygun saatlerine göre doğrulanmış hocaları karşılaştır. İstersen hazır çalışma paketleri ve soru içerikleriyle kendi hızında ilerle. |
| Combobox visible label | **Hangi ders için destek arıyorsun?** |
| Combobox placeholder | Ders veya sınav seç |
| Primary submit | **Hocaları göster** |
| Secondary link | **Hedef paketlerini keşfet** |
| Tertiary link | **Çıkmış sorulara göz at** |

Do not put the student's name inside the H1. If profile data is available, a quiet greeting may appear above the eyebrow, for example `Merhaba Memin`. If profile data is absent or loading, omit the greeting; do not derive a name from the email address.

### 6.2 Tutor subject combobox

Source: existing `GET /api/subjects/` through `fetchSubjects()`.

Behavior:

1. Default state shows the placeholder.
2. Opening the control shows a searchable list grouped by exam type.
3. Each option is announced as the full tuple, for example `TYT Matematik`.
4. Keyboard support: Tab, Enter, Escape, Up, Down, Home, End.
5. Typing filters both subject name and exam type.
6. Selecting an item stores its `name` and `exam_type`.
7. Submit with a selection routes to:

   ```text
   /tutors?subject=<Subject.name>&exam_type=<Subject.exam_type>
   ```

8. Submit without a selection routes to `/tutors`.
9. The button remains enabled with no selection, so the student can browse all tutors.
10. If there is no local match, show `Bu aramayla eşleşen ders yok.` and a quiet `Tüm hocaları gör` action.

This corrects the conceptual brief's sample `exam` parameter to the application's real `exam_type` contract.

### 6.3 Action hierarchy

- `Hocaları göster` is the only filled primary button.
- `Hedef paketlerini keşfet` is a quiet link with an arrow.
- `Çıkmış sorulara göz at` is lower contrast than the learning link.
- Do not add a second `Hoca bul` button beside the search submit; it would duplicate the same action.

### 6.4 Trust row

Use three inline items under the actions:

1. `Doğrulanmış akademik bilgiler`
2. `Şeffaf değerlendirmeler`
3. `Esnek ders saatleri`

If the tutor-list request succeeds, the first item may include the real count: `<count> doğrulanmış hoca`. Never render `0` while loading or after an API error.

Desktop: one row. Tablet: two rows if needed. Mobile: a vertical or 2+1 compact list, not three miniature cards.

### 6.5 Tutor preview

The preview is a presentation variant of the existing `TutorCard`, not a screenshot and not a second data model.

Required fields when available:

- Tutor photo or existing avatar fallback
- Name and verification mark
- University and department
- Up to two subject labels
- Rating and review count, or `Henüz değerlendirme yok`
- YKS rank when greater than zero
- Price with the existing `/40 dk` unit
- `Profili gör` action

Truthfulness rules:

- Use `Çevrim içi` only when `is_online === true`.
- Do not show `Bu akşam uygun`; current tutor-list data has no slot-level availability.
- Use `Sana uygun eşleşme` only after a selected subject matches one of the tutor's returned subjects.
- Otherwise use the neutral label `Doğrulanmış hoca`.
- Hide missing rank, price, rating, or university metadata without leaving empty labeled rows.
- Long university/department text clamps to two lines; the card height does not grow.

Default tutor selection for the preview:

- Request highest-rated tutors with existing deterministic ordering.
- Use the first public verified result.
- No recommendation-engine language appears in V1.

### 6.6 Hero states

| State | Search | Trust count | Tutor preview |
| --- | --- | --- | --- |
| Loading | Fully usable once subjects load; button still browses all | Neutral skeleton width | Fixed-size skeleton; no layout shift |
| Subject error | Text entry disabled; browse-all submit remains | Omit count | Tutor query remains independent |
| Tutor error | Fully usable | Omit count | Neutral product-preview fallback with `Hocaları keşfet` link |
| No tutor results | Fully usable | `Henüz listelenen hoca yok` | No fabricated profile; simple empty preview |
| Missing image | Fully usable | Real count | Existing initials/demo fallback behavior |

The hero headline and navigation never disappear because of API state.

---

## 7. Tutor discovery section

### Purpose

Reinforce the primary conversion immediately after the hero with real choices.

### Header copy

- H2: **Sana uygun hocaları keşfet**
- Supporting text: **Ders, sınav ve uygunluk bilgilerine göre karşılaştır.**
- Section CTA: **Tüm hocaları gör** → `/tutors`

### Content

- Desktop: 3 tutor cards in one row.
- Tablet: 2 columns; third card begins a second row.
- Mobile: one-column stack. Show 3 cards; do not use a carousel in V1.
- Use the existing `TutorCard` structure and data contract.
- Use deterministic highest-rated ordering.
- Do not add tabs such as `Online`, `Önerilen`, or `En iyi sıralama` in V1. They add control density without a dedicated recommendation contract.
- If the hero uses tutor result 1, this section uses results 2–4 to avoid immediate duplication. If fewer results exist, include the first result rather than leaving the section visually broken.

### States

- Loading: three stable card skeletons with the final card height.
- Error: one compact inline error with `Tekrar dene` and a working `/tutors` link.
- Empty: compact message, `Şu anda gösterilecek hoca yok.`, plus the `/tutors` action.
- A tutor-card error must not block packages or practice sections.

---

## 8. Continue section — conditional

### Visibility

Render only when at least one of these exists:

1. An in-progress or future confirmed booking
2. An active learning goal
3. A paid package with remaining credits

Do not render an empty title, dashed card, onboarding promotion, or placeholder if none exists.

### Header

- H2: **Kaldığın yerden devam et**

### Priority and maximum content

Show no more than two compact continuation cards.

1. Upcoming/current lesson
2. Active learning goal
3. Active package, only if neither of the first two fills the second slot

### Card actions

| Card | Primary information | Action |
| --- | --- | --- |
| Lesson | Subject, tutor, date, time, status | `Dersi görüntüle` or existing join behavior when allowed |
| Goal | Goal title, next milestone, progress | `Yola devam et` |
| Package | Tutor, remaining credits, expiry | `Paketi görüntüle` |

Desktop: two equal columns. Mobile: one column. This is a continuation preview, not a status dashboard.

---

## 9. Learning-package discovery

### Header copy

- H2: **Hedefine göre çalışma paketleri**
- Supporting text: **Sınavına ve seviyene uygun hazır yol haritalarını keşfet.**
- Section CTA: **Tümünü gör** → `/dashboard/student/learning`

### Content rules

- Source: existing learning goal templates.
- Desktop: 3 cards.
- Tablet: 2 columns.
- Mobile: one-column stack of 3 cards.
- Reuse `GoalPackageCard` information hierarchy, but the wireframe cover is a G2 rectangle.
- Prefer `is_featured` templates, then preserve backend catalogue order.
- If the student profile has `target_exam_type`, it may reorder matching templates ahead of other featured templates. It must not remove nonmatching options.
- No AI or personalized recommendation claim.
- Never introduce subscription, payment, discount, or purchase language in this home section.

### Card minimum content

- Exam type and subject
- Level
- Package title
- Two-line description
- Lesson count
- Milestone count
- `Detaylar` or `Yola devam et` when already active

### States

- Loading: three fixed-height skeletons.
- Error: compact notice and working learning-hub link.
- Empty: show one compact `Hazır paketler yakında burada` message; do not render three empty cards.

---

## 10. Practice resources

### Header copy

- H2: **Bugün biraz pratik yap**
- Supporting text: **Kısa bir çalışma seç ve hemen başla.**

### V1 cards

Only implemented destinations appear:

| Card | Description | Route | Action |
| --- | --- | --- | --- |
| Çıkmış Sorular | TYT, AYT ve YDT sorularını filtreleyerek çöz. | `/cikmis-sorular` | `Soruları aç` |
| Yanlış Sorularım | Yanlış cevapladığın soruları yeniden çöz. | `/dashboard/student/learning/yanlis-sorular` | `Tekrar havuzunu aç` |

Desktop/tablet: two equal compact cards. Mobile: one column.

Do not invent topic-practice, history, or daily-question routes. A third card is added only when a real destination exists.

If the question-library metadata says the feature is disabled, hide the corresponding card rather than promising an unavailable action. If both resources are unavailable, collapse the whole section.

---

## 11. Compact status strip — conditional

This strip provides orientation without reproducing the dashboard.

### Visibility

Render only when at least one metric is nonzero or actionable. Omit empty items individually. Collapse the strip when all are empty.

### Candidate items

| Item | Value | Destination |
| --- | --- | --- |
| Sıradaki ders | Relative date or time | `/dashboard/student` or lesson view |
| Aktif hedef | Goal title or progress | Goal detail |
| Kalan ders kredisi | Real remaining credit count, never a currency amount | Package detail/dashboard |
| Bekleyen işlem | Booking/review count | Relevant profile route |

Maximum: four items. Desktop: one horizontal bordered strip. Tablet: 2 × 2 grid. Mobile: vertical list.

Do not show tutor earnings, speculative payment state, or any package value as currency.

---

## 12. Closing CTA and footer

### CTA

- Copy: **Bir hocayla başlamaya hazır mısın?**
- Supporting line: **Dersine ve hedeflerine uygun doğrulanmış hocaları karşılaştır.**
- Button: **Hocaları keşfet** → `/tutors`

Desktop: copy left, button right, 120–144 px total height. Mobile: stacked, full-width button.

The high-fidelity phase may map this strip to the existing dark primary surface. In wireframes it is G5 with G0 text and a G0/G6 action contrast.

### Footer

Reuse the existing compact copyright footer. Do not add public-marketing link columns in V1.

---

## 13. Tablet wireframe

Reference viewport: **900 px**.

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo  [Home]  ◇ ◇ ◇ ◇                              [Profile] │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐  ┌─────────────────────────────┐ │
│ │ Eyebrow                  │  │ Tutor preview               │ │
│ │ H1 (3–4 lines)           │  │                             │ │
│ │ Supporting copy          │  │ Image + identity            │ │
│ │ [Subject combobox      ] │  │ Metadata                    │ │
│ │ [Hocaları göster       ] │  │ [Profili gör]               │ │
│ │ Secondary links          │  └─────────────────────────────┘ │
│ │ Trust  Trust  Trust      │                                  │
│ └──────────────────────────┘                                  │
├──────────────────────────────────────────────────────────────┤
│ Tutor heading                                      View all   │
│ [Tutor]                         [Tutor]                        │
│ [Tutor]                                                        │
├──────────────────────────────────────────────────────────────┤
│ [Continue]                     [Continue]  (only when present) │
├──────────────────────────────────────────────────────────────┤
│ [Package]                       [Package]                       │
│ [Package]                                                       │
└──────────────────────────────────────────────────────────────┘
```

At 800–900 px, retain the split hero only while both columns remain at least 340 px. Below that threshold, switch to the mobile stacking order rather than squeezing the tutor card.

---

## 14. Mobile wireframe

Reference viewport: **390 × 844 px**.

```text
┌──────────────────────────────┐
│ Hocam            ◇ ◇ [Avatar]│ 56
│ [Home][Tutors][Learn][Q][Dash│ 52 horizontal scroll
├──────────────────────────────┤
│ DOĞRULANMIŞ YKS HOCALARI     │
│                              │
│ Hedefine uygun hocayı bul,   │
│ öğrenmeye bugün başla.       │
│                              │
│ Supporting copy              │
│                              │
│ Hangi ders için...           │
│ [ Subject combobox         ] │
│ [ Hocaları göster          ] │
│ Learning packages →          │
│ Questions →                  │
│                              │
│ ✓ Verified                  │
│ ★ Reviews                   │
│ ◷ Flexible                  │
│                              │
│ ┌──────────────────────────┐ │
│ │ Tutor preview            │ │
│ │ Image + name + verified  │ │
│ │ School / subjects        │ │
│ │ Rating / rank / price    │ │
│ │ [Profili gör]            │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Sana uygun hocaları keşfet   │
│ Supporting copy       All →  │
│ [Tutor card]                 │
│ [Tutor card]                 │
│ [Tutor card]                 │
├──────────────────────────────┤
│ Continue (only if relevant)  │
│ [Continuation card]          │
├──────────────────────────────┤
│ Hedefine göre paketler       │
│ [Package]                    │
│ [Package]                    │
│ [Package]                    │
├──────────────────────────────┤
│ Bugün biraz pratik yap       │
│ [Questions]                  │
│ [Wrong questions]            │
├──────────────────────────────┤
│ Status list (conditional)    │
├──────────────────────────────┤
│ Ready to begin?              │
│ [Hocaları keşfet]            │
└──────────────────────────────┘
```

Mobile rules:

- Hero order is copy → search → actions → trust → tutor preview.
- Primary button is full width.
- Search input and button never share a row.
- Tutor preview has no overlapping floating cards.
- Cards use one column; V1 does not use horizontal carousels.
- Section header actions remain visible and wrap beneath the title if needed.
- Headline target is 36 px in high fidelity, with no more than four lines at 320 px width.

---

## 15. User-state variants

### New account

Visible:

- Universal hero
- Tutor discovery
- Learning packages
- Practice resources when enabled
- Closing CTA

Hidden:

- Continue section
- Status strip

No empty dashboard modules are substituted.

### Returning but inactive student

Use the new-account structure. If a real active goal or recent eligible state exists, the continue module may appear. “Recently viewed” content is excluded until an existing persisted source is available.

### Active student

Visible:

- Universal hero remains first
- Tutor discovery remains second
- Continue module appears after tutors
- Packages and practice remain discovery sections
- Status strip appears near the end if actionable data exists

An upcoming lesson never replaces the hero or moves the page into dashboard mode.

---

## 16. Data-source map

V1 must reuse existing APIs. No backend expansion is required for the wireframed structure.

| UI need | Existing client/API | Notes |
| --- | --- | --- |
| Student first name / target exam | `fetchProfileMe()` → `/profile/me/` | Greeting optional; never parse email for name |
| Subjects | `fetchSubjects()` → `/subjects/` | Drives combobox |
| Tutor count and cards | `fetchTutors()` → `/tutors/` | Paginated and normalized already |
| Learning templates / goals | `fetchLearningDashboard()` and `fetchLearningGoalTemplates()` | Templates can render even if dashboard context is unavailable |
| Upcoming lesson | `fetchBookings()` | Reuse dashboard lifecycle rules |
| Active package / credits | `fetchPackagePurchases()` | Credits are counts, not currency |
| Question feature availability | `fetchQuestionMetadata()` | Hide unavailable resource cards |
| Notification state | Existing summary query | Navigation utility only |

Suggested query independence:

- Hero subjects and tutors load independently.
- Tutor section failure does not block learning templates.
- Learning failure does not block practice resources.
- Continue/status queries may share cached React Query data with dashboard/profile surfaces.

---

## 17. Existing system reuse map

| Need | Reuse / adapt |
| --- | --- |
| Page container | Existing `max-w-7xl` pattern |
| Route protection | `RouteGuard requireRole="student"` |
| Navigation | `Navbar`, `AnimatedNavbarLinks`, selected pill language |
| Buttons | Existing shadcn `Button` variants |
| Tutor data card | `TutorCard`; add a presentation variant or small composed wrapper |
| Verification | `VerifiedTutorMark` |
| Presence | `TutorPresenceBadge` |
| Tutor loading | Existing tutor-card skeleton proportions |
| Package card | `GoalPackageCard` and `PackageCover` hierarchy |
| Continue content | Existing booking, active-goal, and package helpers |
| Practice destinations | Existing question-library routes |
| Loading / error | `Skeleton`, `ErrorMessage`, compact inline states |
| Footer | Existing `Footer` |
| Tokens | Existing CSS variables and Tailwind semantic colors |

Avoid copying full dashboard page components that carry operational density. Reuse their selectors, status rules, and formatting helpers, then compose smaller Home-specific previews.

---

## 18. Semantic and accessibility order

Recommended document outline:

```text
header
  nav
main
  section[hero]
    h1
    form[subject search]
    trust list
    tutor preview
  section[tutor discovery]
    h2
  section[continue] (conditional)
    h2
  section[learning packages]
    h2
  section[practice]
    h2
  section[status] (conditional, labelled)
  section[closing CTA]
footer
```

Requirements:

- Exactly one H1.
- Section names use H2; card titles use H3.
- Hero visual follows hero actions in DOM order, matching mobile reading order.
- Search uses a visible label, combobox semantics, listbox relationship, active option state, and announced results.
- Focus is never removed. Use existing ring tokens and at least 2 px visible contrast.
- Entire cards are not nested inside other interactive elements.
- Tutor images use meaningful alt text; decorative skeletons and visual layers are hidden from assistive technology.
- Icon-only utilities have accessible names.
- All touch targets are at least 44 px.
- Reduced motion shows final states immediately.
- Loading skeletons are not announced as content; concise live-region text may announce completion or errors.

---

## 19. Interaction and motion notes for later phases

This phase specifies behavior, not final animation.

- Search suggestion panel opens below the field without moving surrounding content.
- Card hover may change border/shadow only; no large scale transform.
- Hero entrance may use one subtle opacity/vertical reveal sequence.
- Tutor preview may enter after the text, but remains static afterward.
- No autoplay, carousel, parallax, typewriter effect, continuous floating, or rotating tutor card.
- Under `prefers-reduced-motion`, remove all entrance and layout animations.

---

## 20. Analytics contract

The repository currently has no identified analytics SDK. The implementation phase should add provider-neutral hooks or connect an approved provider; it must not silently introduce a third-party tracker.

| Event | Minimum properties |
| --- | --- |
| `authenticated_home_viewed` | `student_state`, `has_active_goal`, `has_upcoming_lesson` |
| `home_subject_search_opened` | none |
| `home_subject_selected` | `subject_id`, `subject_name`, `exam_type` |
| `home_tutor_search_submitted` | selected subject fields or `browse_all: true` |
| `home_learning_link_clicked` | `placement: hero` |
| `home_question_link_clicked` | `placement` |
| `home_tutor_profile_opened` | `tutor_id`, `placement: hero|list`, `position` |
| `home_all_tutors_clicked` | `placement` |
| `home_package_opened` | `template_id`, `position`, `is_active` |
| `home_continue_clicked` | `content_type`, `content_id` |
| `home_practice_opened` | `resource` |

Do not include email, full name, free-form search text, or other personal data in analytics payloads.

---

## 21. Low-fidelity acceptance checklist

The wireframe is ready to move to content design/high fidelity when reviewers can answer “yes” to all of these:

- The page is clearly a logged-in student home, not a public landing page.
- The hero and first content section make tutor discovery dominant.
- Learning packages are clearly secondary.
- New students see no large empty states.
- Active students receive continuation value without turning Home into the dashboard.
- Every visible feature card has a real implemented destination.
- Search routing matches the existing `subject` + `exam_type` contract.
- Missing tutor availability is not fabricated.
- Mobile reading order is logical and needs no overlapping composition.
- Loading and partial API failure preserve the primary journey.
- Existing component and token reuse is explicit.
- No payment, subscription, testimonial, promotion, or recommendation-engine scope has slipped into V1.

---

## 22. Decisions deliberately deferred to high fidelity

These choices do not affect structure and should not block wireframe approval:

- Contained hero panel versus full-width subtle hero band
- Exact warm-neutral versus cool-neutral background mapping
- Final headline font size within the specified responsive range
- Final icon choices for trust items and practice cards
- Subtle highlight treatment behind the tutor preview
- Exact shadow and radius values, mapped from the existing system

No section order, action hierarchy, route, data dependency, or mobile stacking decision should be deferred beyond this document.

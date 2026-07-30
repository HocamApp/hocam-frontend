import type { ScribbleLayerSpec } from "@/lib/scribbles";

/**
 * Placement data transcribed from the approved Figma frames in
 * "Hocam — Scribble Foundation" → page "05 — Editable Website Capture".
 *
 * Every `top` is a percentage of the host section's height and every horizontal
 * value is measured from a page edge, so the layout survives copy changes and
 * content of a different height. The Figma frames are 1440px wide; widths and
 * reveals scale down proportionally below that (see `fluidPx`/`shrinkingPx`).
 *
 * Source frames:
 *   /home              → "Homepage — Lite Scribble V2 · Reference Matched" (139:2)
 *   /tutors            → "Hocalar — Lite Scribble" (110:2)
 *   /dashboard/student → "Öğrenci Paneli — Lite Scribble" (110:764)
 *   /cikmis-sorular    → "Çıkmış Sorular — Lite Scribble" (110:1130)
 */

const EMPTY: readonly ScribbleLayerSpec[] = [];

/* ------------------------------------------------------------------ /home */

export const HOME_SCRIBBLES = {
  /**
   * The hero carousel is left undecorated: the yellow edge blob from the Figma
   * frame read as part of the rotating slide rather than as page decoration.
   */

  /** "Sana uygun hocayı 2 dakikada bulalım" band. */
  hocaBul: [
    {
      bleedTop: 32,
      bleedBottom: 96,
      items: [
        {
          id: "home-hocabul-flame",
          asset: "blob-pink-flame",
          side: "right",
          reveal: 145,
          top: -1.6,
          width: 160,
          opacity: 0.55,
          rotate: 2.6,
          visibility: "md-up",
        },
        {
          // The three strokes flick toward the card's top-left corner.
          id: "home-hocabul-curl",
          asset: "accent-curl",
          side: "inset-left",
          inset: 66,
          top: 6.8,
          width: 34,
          opacity: 1,
          rotate: -141.6,
          visibility: "md-up",
        },
        {
          id: "home-hocabul-ring",
          asset: "accent-target-ring",
          side: "inset-right",
          inset: 22,
          top: 15.2,
          width: 86,
          opacity: 1,
          visibility: "md-up",
        },
        {
          id: "home-hocabul-blue",
          asset: "blob-blue",
          side: "left",
          reveal: 70,
          top: 62,
          width: 264,
          opacity: 0.3,
          visibility: "lg-up",
        },
      ],
    },
  ],

  /**
   * "Sınav hedeflerini keşfet" band. The left pink shape is the *upper* half of
   * the two-tone seam and is clipped exactly on this band's bottom edge
   * (`bleedBottom: 0`); its darker twin continues in `teacherRail`.
   */
  explore: [
    {
      bleedTop: 224,
      items: [
        {
          id: "home-explore-pink-right",
          asset: "blob-pink-dotted",
          side: "right",
          reveal: 80,
          top: -31.9,
          width: 395,
          opacity: 0.35,
          visibility: "lg-up",
        },
        {
          id: "home-explore-pink-seam-upper",
          asset: "blob-pink-dotted",
          side: "left",
          reveal: 129,
          top: 39.6,
          width: 537,
          opacity: 0.34,
          visibility: "md-up",
        },
        {
          // Sits on the top-right diagonal of the "Tüm dersleri gör" button.
          id: "home-explore-spark",
          asset: "accent-spark-yellow",
          side: "inset-left",
          inset: 281,
          top: 44.1,
          width: 34,
          opacity: 1,
          visibility: "md-up",
        },
      ],
    },
  ],

  /** "Öne çıkan hocalar" band — lower half of the seam, clipped on the top edge. */
  teacherRail: [
    {
      items: [
        {
          id: "home-teacherrail-pink-seam-lower",
          asset: "blob-pink-dotted",
          side: "left",
          reveal: 129,
          top: -50.3,
          width: 537,
          opacity: 0.3,
          visibility: "md-up",
        },
        {
          // Hand-drawn stroke under the word "hocalar" in the section title.
          // Figma rotates it 135.8° counter-clockwise, hence the negative angle;
          // the offsets below are for the un-rotated box, which CSS spins about
          // its own centre.
          id: "home-teacherrail-underline",
          asset: "underline-orange",
          side: "inset-left",
          inset: 263,
          top: 8.9,
          width: 80,
          opacity: 1,
          rotate: -135.8,
          visibility: "md-up",
        },
      ],
    },
    {
      bleedTop: 112,
      items: [
        {
          id: "home-teacherrail-blue",
          asset: "blob-blue",
          side: "right",
          reveal: 72,
          top: -13.4,
          width: 264,
          opacity: 0.35,
          visibility: "lg-up",
        },
      ],
    },
  ],

  /** "Derse göre hoca seç" band. */
  tabbedDiscovery: [
    {
      bleedTop: 112,
      items: [
        {
          id: "home-tabbed-yellow",
          asset: "blob-yellow",
          side: "right",
          reveal: 80,
          top: -9.8,
          width: 299,
          opacity: 0.4,
          rotate: 180,
          visibility: "lg-up",
        },
        {
          id: "home-tabbed-blue",
          asset: "blob-blue",
          side: "left",
          reveal: 104,
          top: 38.8,
          width: 264,
          opacity: 0.3,
          visibility: "lg-up",
        },
        {
          // Sits inside the content column, behind the card row.
          id: "home-tabbed-pink-inset",
          asset: "blob-pink-dotted",
          side: "inset-right",
          inset: 170,
          top: 53.3,
          width: 339,
          opacity: 0.35,
          visibility: "lg-up",
        },
      ],
    },
  ],

  /** "Hedefine göre ilerle" band. */
  goalCards: [
    {
      items: [
        {
          id: "home-goalcards-yellow",
          asset: "blob-yellow",
          side: "left",
          reveal: 129,
          top: 34.6,
          width: 319,
          opacity: 0.45,
          rotate: 180,
          visibility: "md-up",
        },
      ],
    },
  ],

  /** "Konu başlıkları" band. */
  topicLinks: [
    {
      items: [
        {
          id: "home-topiclinks-diamond",
          asset: "accent-diamond",
          side: "inset-left",
          inset: 80,
          top: 11.3,
          width: 28,
          opacity: 1,
          visibility: "narrow-up",
        },
        {
          id: "home-topiclinks-curl",
          asset: "accent-vertical-curl",
          side: "inset-right",
          inset: 156,
          top: 60.2,
          width: 42,
          opacity: 0.85,
          visibility: "md-up",
        },
      ],
    },
  ],

  /** Closing dark CTA band. */
  promoStrip: [
    {
      items: [
        {
          id: "home-promostrip-spark",
          asset: "accent-spark",
          side: "inset-right",
          inset: 72,
          top: 9.7,
          width: 40,
          opacity: 1,
          visibility: "md-up",
        },
      ],
    },
  ],
} satisfies Record<string, readonly ScribbleLayerSpec[]>;

/* ---------------------------------------------------------------- /tutors */

export const TUTORS_SCRIBBLES: readonly ScribbleLayerSpec[] = [
  {
    items: [
      {
        id: "tutors-pink-top",
        asset: "blob-pink-dotted",
        side: "left",
        reveal: 90,
        top: 4.3,
        width: 537,
        opacity: 0.55,
        visibility: "narrow-up",
      },
      {
        id: "tutors-yellow-top",
        asset: "blob-yellow",
        side: "right",
        reveal: 85,
        top: 9.6,
        width: 359,
        opacity: 0.5,
        rotate: 180,
        visibility: "md-up",
      },
      {
        id: "tutors-blue-mid",
        asset: "blob-blue",
        side: "left",
        reveal: 70,
        top: 49.7,
        width: 264,
        opacity: 0.35,
        visibility: "lg-up",
      },
      {
        id: "tutors-pink-low",
        asset: "blob-pink-dotted",
        side: "right",
        reveal: 65,
        top: 71.5,
        width: 339,
        opacity: 0.35,
        visibility: "lg-up",
      },
      {
        id: "tutors-yellow-bottom",
        asset: "blob-yellow",
        side: "right",
        reveal: 75,
        top: 90.6,
        width: 265,
        opacity: 0.35,
        rotate: 180,
        visibility: "lg-up",
      },
    ],
  },
];

/* ------------------------------------------------------ /dashboard/student */

/** The most restrained page: nothing at all below `md`. */
export const STUDENT_DASHBOARD_SCRIBBLES: readonly ScribbleLayerSpec[] = [
  {
    items: [
      {
        id: "dashboard-pink-top",
        asset: "blob-pink-dotted",
        side: "left",
        reveal: 95,
        top: 12,
        width: 480,
        opacity: 0.3,
        visibility: "md-up",
      },
      {
        id: "dashboard-blue-mid",
        asset: "blob-blue",
        side: "right",
        reveal: 90,
        top: 53.4,
        width: 248,
        opacity: 0.28,
        visibility: "lg-up",
      },
      {
        id: "dashboard-yellow-bottom",
        asset: "blob-yellow",
        side: "right",
        reveal: 70,
        top: 94.7,
        width: 319,
        opacity: 0.32,
        rotate: 180,
        visibility: "lg-up",
      },
    ],
  },
];

/* -------------------------------------------------------- /cikmis-sorular */

export const QUESTIONS_SCRIBBLES: readonly ScribbleLayerSpec[] = [
  {
    bleedTop: 224,
    items: [
      {
        id: "questions-flame-top",
        asset: "blob-pink-flame",
        side: "inset-right",
        inset: 122,
        top: -12.3,
        width: 198,
        opacity: 0.3,
        visibility: "md-up",
      },
      {
        id: "questions-yellow-left",
        asset: "blob-yellow",
        side: "left",
        reveal: 90,
        top: 31.5,
        width: 339,
        opacity: 0.45,
        rotate: 180,
        visibility: "narrow-up",
      },
      {
        id: "questions-pink-right",
        asset: "blob-pink-dotted",
        side: "right",
        reveal: 85,
        top: 59,
        width: 395,
        opacity: 0.4,
        visibility: "lg-up",
      },
      {
        id: "questions-flame-low",
        asset: "blob-pink-flame",
        side: "left",
        reveal: 75,
        top: 84.4,
        width: 232,
        opacity: 0.35,
        visibility: "md-up",
      },
    ],
  },
];

export { EMPTY as NO_SCRIBBLES };

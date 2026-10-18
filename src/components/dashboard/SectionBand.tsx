import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The coloured header strip of a dashboard list card.
 *
 * Two tones, and the split carries meaning: pink is for what is coming up
 * (a lesson to attend, a request to answer), ink is for what is already on
 * record (history, cancellations). Pink is budgeted at 20 to 30% of a
 * viewport, and a cancelled lesson under a pink band would read as an offer,
 * which is why records never get it.
 *
 * Text on pink is always white (DESIGN.md v0.8). The title is bold rather than
 * the scale's 500: white on --pink is 4.05:1, which clears AA only for large
 * text, and 22px counts as large only at 700. On ink the text is --paper, not
 * white, so the band inverts with the dark theme instead of going white on a
 * light fill.
 */
export type SectionBandTone = "pink" | "ink";

const TONE_CLASSES: Record<SectionBandTone, string> = {
  pink: "bg-pink text-primary-foreground",
  ink: "bg-ink text-paper",
};

export function sectionBandClass(tone: SectionBandTone, className?: string): string {
  return cn(
    "flex items-center justify-between gap-3 px-6 py-4",
    TONE_CLASSES[tone],
    className,
  );
}

/** Title block of a band: an optional icon, the heading, an optional sentence. */
export function SectionBandHeading({
  id,
  title,
  subtitle,
  icon,
  as: Heading = "h2",
  className,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  as?: "h2" | "span";
  /** Placement and wrapping of the whole block, for a band that rearranges on a phone. */
  className?: string;
}) {
  return (
    // No min-w-0 here: it would let the title shrink below its longest word,
    // and "derslerin" then runs underneath the count pill on a phone.
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      {icon}
      <div>
        {/* `md:font-bold` is not redundant: `md:text-h3` carries its own
            weight of 500 and, being a media variant, lands after `font-bold`. */}
        <Heading
          id={id}
          className="block text-h3-m font-bold md:text-h3 md:font-bold"
        >
          {title}
        </Heading>
        {subtitle && <span className="mt-0.5 block text-small">{subtitle}</span>}
      </div>
    </div>
  );
}

/**
 * A flat count pill. Gold on pink is the one correct pairing at badge scale
 * (DESIGN.md §1) with --gold-ink on top; on ink it is an outline in the band's
 * own text colour. Text never sits at an angle (DESIGN.md v0.12), so the pill is
 * flat.
 */
export function SectionBandCount({
  tone,
  children,
  className,
}: {
  tone: SectionBandTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    // A template string, not cn(): tailwind-merge reads the custom size
    // `text-label` as a colour and would drop it in favour of the colour.
    <span
      className={`inline-flex shrink-0 items-center rounded-pill px-3 py-0.5 text-label tabular-nums ${
        tone === "pink" ? "bg-gold text-gold-ink" : "border border-paper text-paper"
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

import type { SVGProps } from "react";

/**
 * The two icons that carry brand meaning rather than utility, so they are
 * drawn rather than installed. They are also the two things users actually
 * look at on a tutor card.
 *
 * Both inherit `currentColor` and ship as inline SVG, never an icon font.
 */

/**
 * Rank mark. Three stacked bars, the top one solid and the lower two at 32%
 * and 16%, so it reads literally as first position in a list — which is what
 * a YKS rank is.
 *
 * It replaces the amber medal that had been in use without a decision behind
 * it, and it avoids the medal, trophy and laurel clichés those decisions
 * usually land on. Three rectangles hold legibly at 16px, which a laurel does
 * not.
 */
export function RankMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className} {...props}>
      <rect x="2" y="3" width="12" height="3" rx="1" />
      <rect x="2" y="7.5" width="12" height="3" rx="1" opacity="0.32" />
      <rect x="2" y="12" width="12" height="3" rx="1" opacity="0.16" />
    </svg>
  );
}

/**
 * Verified mark. A document with a check, not the scalloped circle every
 * social network uses.
 *
 * On Hocam, verification means a submitted YKS result belge that an admin
 * reviewed. It is not a paid badge, and the mark should say what it actually
 * means — a reviewed document, not purchased status.
 */
export function VerifiedMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      <path d="M9.5 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V5.5z" />
      <path d="M9.5 1.5v4h4" />
      <path d="m5.75 9.75 1.5 1.5 3-3" />
    </svg>
  );
}

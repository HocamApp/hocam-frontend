import { cn } from "@/lib/utils";

/**
 * Five stars that show the real score, not a rounded one.
 *
 * `Math.round` meant 4.3 and 4.8 both lied: one lost a star it had earned,
 * the other claimed a perfect score. The fifth star is now filled by exactly
 * the fraction left over.
 *
 * Colour (DESIGN.md): filled stars are `--pink`; empty ones are the same pink
 * as an outline, not `--line` — at roughly 1.3:1 on paper that outline was
 * invisible, so a 4.0 looked like a four-star scale. Gold fails as a glyph
 * (about 1.6:1), and `--pink-deep` stays reserved for hover/active. The
 * numeral beside the stars carries the exact value.
 */
export interface RatingStarsProps {
  rating: number;
  /** sm: inline meta rows · md (default) · lg: profile header. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: 12, md: 16, lg: 22 } as const;

// One star path, drawn once and referenced five times.
const STAR_PATH =
  "M12 2.6l2.9 5.88 6.49.95-4.7 4.58 1.11 6.46L12 17.43l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.95L12 2.6z";

export function RatingStars({ rating, size = "md", className }: RatingStarsProps) {
  const safeRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;
  const pixels = SIZES[size];
  // "4,3" — Turkish decimal comma, matching formatRating next to it.
  const label = `5 üzerinden ${safeRating.toFixed(1).replace(".", ",")}`;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 align-middle", className)}
      role="img"
      aria-label={label}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.min(1, Math.max(0, safeRating - index));
        return (
          <svg
            key={index}
            width={pixels}
            height={pixels}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="shrink-0 text-pink"
            data-fill={fill}
          >
            <path
              d={STAR_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            {fill > 0 && (
              // CSS inset() rather than a <clipPath id>: several ratings share
              // a page, and generated ids would collide. Fills left-to-right,
              // so 0.3 of a star reads as 30% full.
              <path
                d={STAR_PATH}
                fill="currentColor"
                style={{ clipPath: `inset(0 ${(1 - fill) * 100}% 0 0)` }}
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}

// Ink, not gold: #FFD100 as a glyph measures about 1.6:1 on paper, and gold is
// a surface colour here. The numeral beside the stars carries the value.
export function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating) ? (
          <span key={i} className="text-ink">★</span>
        ) : (
          <span key={i} className="text-line">☆</span>
        )
      )}
    </span>
  );
}

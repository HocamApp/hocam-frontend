// Pink, not gold: #FFD100 as a glyph measures about 1.6:1 on paper, and gold is
// a surface colour here. --pink (not --pink-deep, which DESIGN.md keeps for
// hover/active) measures about 3.8:1 on paper and 4.5:1 on the dark canvas,
// past the 3:1 floor for graphics. The numeral beside the stars carries the value.
export function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating) ? (
          <span key={i} className="text-pink">★</span>
        ) : (
          <span key={i} className="text-line">☆</span>
        )
      )}
    </span>
  );
}

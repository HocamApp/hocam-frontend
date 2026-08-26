import Link from "next/link";

/**
 * The diagonal band, on the one claim that carries the product.
 *
 * It sits under the opening section rather than above it, which is where the
 * device works: the page opens on paper, and the cut arrives as you scroll
 * into it. Leading with it puts a saturated slab under the navbar and blows
 * the colour budget on the first screen — pink is meant to be roughly a fifth
 * of a viewport, and a full-bleed band alone is more than twice that.
 *
 * Directly above the university strip on purpose: the band says the tutors
 * are verified, the logos underneath are what the verification produced.
 *
 * Full bleed, so it renders outside `.ys-shell` and opens a shell of its own
 * for the text. The cut itself lives in `.ys-band`.
 *
 * The button is a white pill rather than DESIGN.md's secondary treatment: a
 * transparent fill with an ink border disappears against the pink. Inside the
 * band the primary is simply inverted.
 */
export function YsVerifiedBand() {
  return (
    <section className="ys-band py-16 md:py-20" aria-labelledby="ys-band-title">
      <div className="ys-shell">
        <h2 id="ys-band-title" className="max-w-[18ch] text-h1-m font-bold md:text-h1">
          Belgesi olmayan kimse ders veremez
        </h2>

        {/* The three documents are the TutorVerification fields, and the
            dashboard stays closed until an admin approves them. */}
        <p className="mt-4 max-w-[52ch] text-body-l text-white/[0.88]">
          Öğrenci kimliği, YKS sonuç belgesi ve üniversite e-posta adresi tek tek kontrol
          edilir. Doğrulama tamamlanmadan hiçbir hoca ders vermeye başlayamaz.
        </p>

        <Link
          href="/hocalar-nasil-dogrulaniyor"
          className="mt-8 inline-flex h-11 items-center rounded-pill bg-white px-[34px] text-body font-semibold text-ink transition-colors duration-[--duration-state] hover:bg-paper"
        >
          Nasıl doğruluyoruz?
        </Link>
      </div>
    </section>
  );
}

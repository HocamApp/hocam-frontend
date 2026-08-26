import Link from "next/link";

import { MAX_TUTOR_YKS_RANK } from "./ysHomeFacts";

/**
 * The page's opening statement, on DESIGN.md's diagonal band.
 *
 * It sits directly above the university strip, and that order is the point:
 * the band makes the claim, the logos underneath are the evidence for it.
 *
 * It carries the `<h1>`. The homepage's only one used to live in the
 * Yemeksepeti signup banner this replaces, so without it the page would ship
 * with no top-level heading at all.
 *
 * Full bleed, so it renders outside `.ys-shell` and re-opens a shell of its
 * own for the text. The cut itself lives in `.ys-band`.
 *
 * The button is a white pill rather than DESIGN.md's secondary treatment: a
 * transparent fill with an ink border disappears against the pink. Inside the
 * band the primary is simply inverted.
 */
export function YsHeroBand() {
  return (
    // 64/80px, well under the 128px the design doc allows a hero, because pink
    // is budgeted at 20-30% of a viewport and a full-bleed band eats that fast.
    // Even here it lands around 40% on a 1000px-tall screen. See the note at
    // the top of this file.
    <section className="ys-band py-16 md:py-20">
      <div className="ys-shell">
        <h1 className="max-w-[17ch] text-h1-m font-bold md:text-h1">
          Dünün öğrencisi, bugünün öğretmeni
        </h1>

        {/* The rank ceiling is a real rule, not a marketing round number: tutor
            signup rejects anything outside 1 to 15.000. */}
        <p className="mt-4 max-w-[46ch] text-body-l text-white/[0.88]">
          YKS&apos;de derece yapmış öğrencileri, derece yapacaklarla buluşturuyoruz. Her
          hocanın sıralaması belgeyle doğrulanır: profilde gördüğün sıralama ilk{" "}
          {MAX_TUTOR_YKS_RANK} içinde.
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

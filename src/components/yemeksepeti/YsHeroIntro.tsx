import Link from "next/link";

/**
 * The page's opening statement.
 *
 * Text only, left aligned, on paper — the mock's proportions: a display
 * headline, a subline about a third its size, and two buttons under it. No
 * second column. The yellow chip and the sample tutor card the mock had beside
 * it are deliberately not here.
 *
 * The padding is what keeps the diagonal band below it out of the first
 * screen. Trim it and the band climbs back up under the navbar, which is the
 * arrangement this replaced.
 *
 * Both buttons say "hoca" rather than "öğretmen". Everything else on the page
 * does — the nav tab, the directory heading, the footer's own "Hoca ol" link
 * pointing at this same route — and the brand is Hocam.
 */
export function YsHeroIntro() {
  return (
    <section className="py-20 md:py-32" aria-labelledby="ys-hero-title">
      <h1 id="ys-hero-title" className="text-display-m md:text-display">
        Dünün öğrencisi,
        <br />
        Bugünün öğretmeni
      </h1>

      <p className="mt-6 max-w-[34ch] text-hero-sub-m text-ink-mid md:text-hero-sub">
        YKS&apos;de derece yapmış öğrencileri, derece yapacaklarla buluşturuyoruz.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        {/* The directory is further down this same page, so this scrolls
            rather than navigating to /tutors and reloading the same list. */}
        <Link
          href="#ys-tutor-list-title"
          className="inline-flex h-12 items-center rounded-pill bg-pink px-8 text-body font-semibold text-white transition-colors duration-[--duration-state] hover:bg-pink-deep"
        >
          Hocaları gör
        </Link>
        <Link
          href="/register?role=tutor"
          className="inline-flex h-12 items-center rounded-pill border border-ink px-8 text-body font-semibold text-ink transition-colors duration-[--duration-state] hover:bg-ink hover:text-paper"
        >
          Hoca ol
        </Link>
      </div>
    </section>
  );
}

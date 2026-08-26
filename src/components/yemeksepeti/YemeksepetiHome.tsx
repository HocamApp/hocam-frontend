"use client";

import { useCallback, useState } from "react";
import { YsEntryDialog } from "./YsEntryDialog";
import { YsFooter } from "./YsFooter";
import { YsHeroIntro } from "./YsHeroIntro";
import { YsHomeFaq } from "./YsHomeFaq";
import { YsNavbar } from "./YsNavbar";
import { YsTestimonials } from "./YsTestimonials";
import { YsTutorDirectory } from "./YsTutorDirectory";
import { YsUniversityStrip } from "./YsUniversityStrip";
import { YsVerifiedBand } from "./YsVerifiedBand";

export function YemeksepetiHome() {
  /* The coachmark waits for the entry promo: it fires at 900ms and would
     otherwise spend its whole life behind the modal overlay. */
  const [coachmarkReady, setCoachmarkReady] = useState(false);
  const handlePromoResolved = useCallback(() => setCoachmarkReady(true), []);

  return (
    <div className="ys-root flex min-h-screen flex-col">
      <YsNavbar startCoachmark={coachmarkReady} />

      <main id="ys-main-content" className="flex-1">
        <div className="ys-shell">
          <YsHeroIntro />
        </div>

        {/* Outside the shell on purpose: a diagonal band is full bleed, and
            `.ys-shell` would cap it at 1440px and inset it by its padding. It
            opens its own shell for the text. */}
        <div className="mt-12 md:mt-28">
          <YsVerifiedBand />
        </div>

        <div className="ys-shell pb-12">
          {/* Directly under the band: the band makes the claim, these logos
              are the evidence for it. */}
          <YsUniversityStrip />
          <YsTutorDirectory />
          {/* Between the directory and the FAQ: proof after browsing, before the
              objections the FAQ answers. */}
          <YsTestimonials />
          <YsHomeFaq />
        </div>
      </main>

      <YsFooter />

      <YsEntryDialog onResolved={handlePromoResolved} />
    </div>
  );
}

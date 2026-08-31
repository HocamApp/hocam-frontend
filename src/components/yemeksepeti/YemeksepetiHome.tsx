"use client";

import { YsEntryDialog } from "./YsEntryDialog";
import { YsHeroIntro } from "./YsHeroIntro";
import { YsHomeFaq } from "./YsHomeFaq";
import { YsHowItWorks } from "./YsHowItWorks";
import { YsTestimonials } from "./YsTestimonials";
import { YsTutorDirectory } from "./YsTutorDirectory";
import { YsUniversityStrip } from "./YsUniversityStrip";
import { YsVerifiedBand } from "./YsVerifiedBand";

export function YemeksepetiHome() {
  return (
    <div className="ys-root">
      <div className="ys-shell">
        <YsHeroIntro />
      </div>

      {/* The directory comes straight after the hero. A visitor who arrives
            on this page came to look at tutors, and the band, the logo strip
            and the testimonials were three screens of argument in front of
            the thing they came for. */}
      <div className="ys-shell">
        <YsTutorDirectory />
      </div>

      {/* Outside the shell on purpose: a diagonal band is full bleed, and
            `.ys-shell` would cap it at 1440px and inset it by its padding. It
            opens its own shell for the text. */}
      <div className="mt-12 md:mt-28">
        <YsVerifiedBand />
      </div>

      <div className="ys-shell">
        {/* Directly under the band: the band makes the claim, these logos
              are the evidence for it. */}
        <YsUniversityStrip />
      </div>

      {/* Outside the shell for the same reason the verified band is: the
            journey owns a full-bleed surface band, and a shell would cap it
            at 1440px and inset it. It opens its own shell inside. */}
      <div className="mt-16 md:mt-24">
        <YsHowItWorks />
      </div>

      <div className="ys-shell pb-12">
        {/* The journey explains the product, then social proof and the FAQ
              answer whether that product is worth trying. */}
        <YsTestimonials />
        <YsHomeFaq />
      </div>
      <YsEntryDialog />
    </div>
  );
}

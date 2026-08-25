"use client";

import { useCallback, useState } from "react";
import "@/styles/yemeksepeti.css";
import { YsCampaignLane } from "./YsCampaignLane";
import { YsEntryDialog } from "./YsEntryDialog";
import { YsFooter } from "./YsFooter";
import { YsHomeFaq } from "./YsHomeFaq";
import { YsNavbar } from "./YsNavbar";
import { YsAppBanner, YsFavouritesBanner, YsSignupBanner } from "./YsPromoBanners";
import { YsTestimonials } from "./YsTestimonials";
import { YsTutorDirectory } from "./YsTutorDirectory";
import { YsUniversityPath } from "./YsUniversityPath";

export function YemeksepetiHome({ fontClassName }: { fontClassName?: string }) {
  const [activeTab, setActiveTab] = useState("tutors");
  /* The search bar lives in the navbar but drives the directory below, so the
     committed term is held here. `searchDraft` is what is being typed;
     `search` only moves on blur or Enter, matching /tutors. */
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);
  /* The coachmark waits for the entry promo: it fires at 900ms and would
     otherwise spend its whole life behind the modal overlay. */
  const [coachmarkReady, setCoachmarkReady] = useState(false);
  const handlePromoResolved = useCallback(() => setCoachmarkReady(true), []);

  return (
    <div className={`ys-root flex min-h-screen flex-col ${fontClassName ?? ""}`}>
      <YsNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearchCommit={setSearch}
        startCoachmark={coachmarkReady}
      />

      <main id="ys-main-content" className="flex-1">
        {/* The promo blocks span the full shell: the filter sidebar now lives
            below them, inside the directory, rather than beside them. */}
        <div className="ys-shell pb-12">
          <YsSignupBanner />
          <YsAppBanner />
          <YsCampaignLane />
          {/* Sits directly above the tutor list: the gesture it demonstrates
              is the heart on the cards right below it. */}
          <YsFavouritesBanner />
          <YsTutorDirectory search={search} />
          {/* Between the directory and the FAQ: proof after browsing, before the
              objections the FAQ answers. */}
          <YsTestimonials />
          {/* A breath between the wall of quotes and the wall of questions. */}
          <YsUniversityPath />
          <YsHomeFaq />
        </div>
      </main>

      <YsFooter />

      <YsEntryDialog onResolved={handlePromoResolved} />
    </div>
  );
}

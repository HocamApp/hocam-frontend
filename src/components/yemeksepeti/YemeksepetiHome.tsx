"use client";

import { useState } from "react";
import "@/styles/yemeksepeti.css";
import { YsCampaignLane } from "./YsCampaignLane";
import { YsFooter } from "./YsFooter";
import { YsNavbar } from "./YsNavbar";
import { YsAppBanner, YsFavouritesBanner, YsSignupBanner } from "./YsPromoBanners";
import { YsTutorDirectory } from "./YsTutorDirectory";

export function YemeksepetiHome({ fontClassName }: { fontClassName?: string }) {
  const [activeTab, setActiveTab] = useState("tutors");
  /* The search bar lives in the navbar but drives the directory below, so the
     committed term is held here. `searchDraft` is what is being typed;
     `search` only moves on blur or Enter, matching /tutors. */
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState<string | undefined>(undefined);

  return (
    <div className={`ys-root flex min-h-screen flex-col ${fontClassName ?? ""}`}>
      <YsNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        onSearchCommit={setSearch}
      />

      <main id="ys-main-content" className="flex-1">
        {/* The promo blocks span the full shell: the filter sidebar now lives
            below them, inside the directory, rather than beside them. */}
        <div className="ys-shell pb-12">
          <YsSignupBanner />
          <YsFavouritesBanner />
          <YsCampaignLane />
          <YsAppBanner />
          <YsTutorDirectory search={search} />
        </div>
      </main>

      <YsFooter />
    </div>
  );
}

"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CAMPAIGNS } from "@/lib/yemeksepetiMock";
import { YsSectionTitle } from "./YsControls";
import { hueStyle } from "./hueStyle";

const SCROLL_STEP = 296; // one 280px card + the 16px lane gap

export function YsCampaignLane() {
  const laneRef = useRef<HTMLUListElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    laneRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });
  };

  return (
    <section className="mt-8" aria-labelledby="ys-campaign-title">
      <YsSectionTitle id="ys-campaign-title">Kampanyalar</YsSectionTitle>

      <div className="relative">
        <ul ref={laneRef} className="ys-lane">
          {CAMPAIGNS.map((campaign) => (
            <li key={campaign.id} className="ys-lane__item">
              <div className="relative h-full w-full" style={hueStyle(campaign.hue)}>
                <span className="ys-placeholder">{campaign.title}</span>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="ys-icon-btn ys-icon-btn--contained ys-from-md absolute left-0 top-1/2 -translate-y-1/2"
          onClick={() => scrollBy(-1)}
          aria-label="Önceki kampanyalar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="ys-icon-btn ys-icon-btn--contained ys-from-md absolute right-0 top-1/2 -translate-y-1/2"
          onClick={() => scrollBy(1)}
          aria-label="Sonraki kampanyalar"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

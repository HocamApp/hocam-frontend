"use client";

import { useMemo, useState } from "react";
import "@/styles/yemeksepeti.css";
import { VENDORS } from "@/lib/yemeksepetiMock";
import { YsCampaignLane } from "./YsCampaignLane";
import { YsFilterPanel, type FilterState } from "./YsFilterPanel";
import { YsFooter } from "./YsFooter";
import { YsNavbar } from "./YsNavbar";
import { YsAppBanner, YsFavouritesBanner, YsSignupBanner } from "./YsPromoBanners";
import { YsVendorTile } from "./YsVendorTile";

const INITIAL_FILTERS: FilterState = {
  sort: "sort_relevance",
  quick: [],
  cuisines: [],
  payment: "",
  minBasket: 0,
  budgets: [],
};

/** Parses "Min. sepet tutarı 2.499TL" / "0 TL minimum" into a number. */
function minBasketValue(label: string) {
  const match = label.match(/([\d.]+)\s*TL/);
  if (!match) return 0;
  return Number(match[1].replace(/\./g, ""));
}

function ratingValue(rating?: string) {
  return rating ? Number(rating) : 0;
}

function deliveryMinutes(label: string) {
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

export function YemeksepetiHome({ fontClassName }: { fontClassName?: string }) {
  const [activeTab, setActiveTab] = useState("restaurant");
  const [query, setQuery] = useState("");
  const [cuisineQuery, setCuisineQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const vendors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr");

    const filtered = VENDORS.filter((vendor) => {
      if (
        normalizedQuery &&
        !`${vendor.name} ${vendor.cuisine}`.toLocaleLowerCase("tr").includes(normalizedQuery)
      ) {
        return false;
      }
      if (filters.cuisines.length && !filters.cuisines.includes(vendor.cuisine)) return false;
      if (filters.budgets.length && !filters.budgets.includes(vendor.priceRange)) return false;
      if (filters.minBasket > 0 && minBasketValue(vendor.minBasket) > filters.minBasket) {
        return false;
      }
      if (filters.quick.includes("platform_delivery") && vendor.deliveryFee !== "Ücretsiz") {
        return false;
      }
      return true;
    });

    switch (filters.sort) {
      case "delivery_time_asc":
        return [...filtered].sort(
          (a, b) => deliveryMinutes(a.deliveryTime) - deliveryMinutes(b.deliveryTime),
        );
      case "rating_desc":
        return [...filtered].sort((a, b) => ratingValue(b.rating) - ratingValue(a.rating));
      case "distance_asc":
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "tr"));
      default:
        return filtered;
    }
  }, [query, filters]);

  return (
    <div className={`ys-root flex min-h-screen flex-col ${fontClassName ?? ""}`}>
      <YsNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        query={query}
        onQueryChange={setQuery}
      />

      <main id="ys-main-content" className="flex-1">
        <div className="ys-shell flex gap-8">
          <div className="hidden lg:block">
            <YsFilterPanel
              value={filters}
              onChange={setFilters}
              cuisineQuery={cuisineQuery}
              onCuisineQueryChange={setCuisineQuery}
            />
          </div>

          <div className="min-w-0 flex-1 pb-12">
            <YsSignupBanner />
            <YsFavouritesBanner />
            <YsCampaignLane />
            <YsAppBanner />

            <section className="mt-8" aria-labelledby="ys-vendor-list-title">
              <h2
                id="ys-vendor-list-title"
                className="mb-4 text-2xl font-semibold leading-[1.3125] md:text-[2rem]"
              >
                Tüm Restoranlar
              </h2>

              {vendors.length ? (
                <ul className="ys-vendor-grid">
                  {vendors.map((vendor) => (
                    <YsVendorTile key={vendor.id} vendor={vendor} />
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-sm" style={{ color: "var(--ys-neutral-secondary)" }}>
                  Seçtiğiniz filtrelere uyan restoran bulunamadı.
                </p>
              )}
            </section>
          </div>
        </div>
      </main>

      <YsFooter />
    </div>
  );
}

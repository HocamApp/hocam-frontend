"use client";

import { useState } from "react";
import { Bike, Heart, Star, Tag as TagIcon } from "lucide-react";
import type { Vendor } from "@/lib/yemeksepetiMock";
import { YsTag } from "./YsControls";
import { hueStyle } from "./hueStyle";

function Bullet() {
  return (
    <span className="ys-tile__bullet" aria-hidden>
      •
    </span>
  );
}

export function YsVendorTile({ vendor }: { vendor: Vendor }) {
  const [favorite, setFavorite] = useState(false);

  return (
    <li className="ys-tile">
      {/* No vendor photography is bundled — the tile renders a placeholder. */}
      <div className="ys-tile__image">
        <div className="ys-tile__image-inner" style={hueStyle(vendor.hue)}>
          <span className="ys-placeholder">{vendor.cuisine}</span>
        </div>

        <div className="absolute inset-0 flex items-start justify-between p-3">
          {vendor.promoted ? <YsTag variant="sponsored">Öne Çıkan</YsTag> : <span />}
          <button
            type="button"
            className="ys-icon-btn ys-icon-btn--contained ys-icon-btn--small"
            onClick={() => setFavorite((current) => !current)}
            aria-label={`${vendor.name} favorilere ekle`}
            aria-pressed={favorite}
          >
            <Heart
              className="h-4 w-4"
              style={favorite ? { color: "var(--ys-interaction-primary)" } : undefined}
              fill={favorite ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-base font-semibold">{vendor.name}</span>
          {vendor.rating ? (
            <span className="flex shrink-0 items-center gap-1">
              <Star
                className="h-3.5 w-3.5"
                style={{ color: "var(--ys-interaction-primary)" }}
                fill="currentColor"
              />
              <span className="text-xs font-semibold">{vendor.rating}</span>
              <span className="text-xs font-normal" style={{ color: "var(--ys-neutral-secondary)" }}>
                ({vendor.reviewCount})
              </span>
            </span>
          ) : null}
        </div>

        <div className="ys-tile__row overflow-hidden">
          <span>{vendor.deliveryTime}</span>
          <Bullet />
          <span>{vendor.priceRange}</span>
          <Bullet />
          <span className="truncate">{vendor.minBasket}</span>
          <Bullet />
          <span className="truncate">{vendor.cuisine}</span>
        </div>

        <div className="ys-tile__row">
          <Bike className="h-3.5 w-3.5 shrink-0" />
          {vendor.deliveryFeeNote ? (
            <>
              <span className="line-through">{vendor.deliveryFee}</span>
              <span className="font-semibold" style={{ color: "var(--ys-deal-primary)" }}>
                {vendor.deliveryFeeNote}
              </span>
            </>
          ) : (
            <span className="font-semibold" style={{ color: "var(--ys-deal-primary)" }}>
              {vendor.deliveryFee}
            </span>
          )}
        </div>

        {vendor.dealTags?.length ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {vendor.dealTags.map((tag) => (
              <YsTag
                key={tag}
                variant={tag === "Yeni" ? "new" : "deal"}
                icon={tag === "Yeni" ? undefined : <TagIcon className="h-3 w-3" />}
              >
                {tag}
              </YsTag>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}

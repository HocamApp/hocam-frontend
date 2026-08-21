"use client";

import { ChevronDown, Heart, MapPin, Search, ShoppingCart } from "lucide-react";
import { VERTICAL_TABS } from "@/lib/yemeksepetiMock";

type Props = {
  activeTab: string;
  onTabChange: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
};

function AddressButton({ className }: { className?: string }) {
  return (
    <button type="button" className={`ys-btn ys-btn--text ys-btn--small min-w-0 ${className ?? ""}`}>
      <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--ys-interaction-primary)" }} />
      <span className="truncate">
        <span className="font-semibold">Yeni Adres</span>
        <span className="ml-1 font-normal" style={{ color: "var(--ys-neutral-secondary)" }}>
          Adresinizi seçin
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0" />
    </button>
  );
}

export function YsNavbar({ activeTab, onTabChange, query, onQueryChange }: Props) {
  const searchField = (
    <div className="ys-search">
      <Search className="h-4 w-4 shrink-0" />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Yemek, mutfak veya restoran arayın"
        aria-label="Ara"
      />
    </div>
  );

  return (
    <section
      className="sticky top-0 z-30 flex w-full flex-col bg-white"
      style={{ boxShadow: "var(--ys-elevation-low)" }}
    >
      <a
        href="#ys-main-content"
        className="ys-btn ys-btn--primary ys-btn--regular sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50"
      >
        Ana içeriğe geç
      </a>

      {/* Top row — brand, address picker (desktop), account actions */}
      <header className="ys-shell flex h-16 items-center gap-2">
        <nav className="shrink-0">
          <span className="text-xl font-bold" style={{ color: "var(--ys-brand-primary)" }}>
            yemeksepeti
          </span>
        </nav>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <AddressButton className="max-w-full" />
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 md:flex-none md:gap-2">
          <button type="button" className="ys-btn ys-btn--secondary ys-btn--small">
            Giriş Yap
          </button>
          <button type="button" className="ys-btn ys-btn--primary ys-btn--small ys-from-md">
            Ücretsiz teslimat için kaydolun
          </button>
          <button type="button" className="ys-btn ys-btn--text ys-btn--small ys-from-md">
            TR
            <ChevronDown className="h-4 w-4" />
          </button>
          <span
            className="ys-icon-btn ys-from-md"
            aria-label="Favorilerim"
            role="button"
            tabIndex={0}
          >
            <Heart className="h-5 w-5" />
          </span>
          <button type="button" className="ys-icon-btn" disabled aria-label="Sepetim">
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Address row — the reference collapses the picker onto its own line on small screens */}
      <div
        className="ys-shell ys-until-md border-t pb-2"
        style={{ borderColor: "var(--ys-neutral-divider)" }}
      >
        <AddressButton className="w-full justify-start" />
      </div>

      {/* Bottom row — vertical switcher + search */}
      <div
        className="ys-shell flex items-center gap-4 border-t"
        style={{ borderColor: "var(--ys-neutral-divider)" }}
      >
        <div className="scrollbar-none flex min-w-0 flex-1 overflow-x-auto">
          {VERTICAL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="ys-tab"
              data-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ys-from-md w-[340px] shrink-0 py-2">{searchField}</div>
      </div>

      <div
        className="ys-shell ys-until-md border-t pb-3 pt-2"
        style={{ borderColor: "var(--ys-neutral-divider)" }}
      >
        {searchField}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";

import { BrandMark } from "@/components/brand/BrandMark";
import { VERTICAL_TABS } from "@/lib/yemeksepetiMock";

type Props = {
  activeTab: string;
  onTabChange: (id: string) => void;
};

export function YsNavbar({ activeTab, onTabChange }: Props) {
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

      {/* Top row — brand on the left, account actions on the right. The
          address picker, language selector, favourites and cart the reference
          page carries have no Hocam counterpart and are gone. */}
      <header className="ys-shell flex h-16 items-center gap-2">
        <Link href="/" aria-label="Hocam ana sayfa" className="shrink-0">
          <BrandMark priority />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 md:gap-2">
          <Link href="/login" className="ys-btn ys-btn--secondary ys-btn--small">
            Giriş Yap
          </Link>
          <Link href="/register" className="ys-btn ys-btn--primary ys-btn--small ys-from-md">
            Ücretsiz deneme dersi için kaydolun
          </Link>
        </div>
      </header>

      {/* Bottom row — vertical switcher. Only the first tab is wired to
          anything; the rest are placeholders for future Hocam verticals. */}
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
      </div>
    </section>
  );
}

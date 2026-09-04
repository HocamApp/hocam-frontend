"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LEGAL_DOCUMENTS, legalNavLabel } from "@/lib/legalDocuments";
import { cn } from "@/lib/utils";

/**
 * Persistent index of every published legal document.
 *
 * Client only because a layout receives no pathname and the active item needs
 * one. `usePathname` is cheap in a way `useSearchParams` is not: it does not
 * opt the subtree into dynamic rendering, so all six documents stay
 * statically generated and no Suspense boundary is needed.
 *
 * One markup tree, two layouts, no JavaScript in the responsive switch:
 * a sticky vertical rail at lg+, and a horizontally scrollable pill row above
 * the document below it. A vertical six-item stack on a 375px screen would
 * push the document roughly 300px below the fold.
 */

const ITEMS = LEGAL_DOCUMENTS.map((doc) => ({
  href: doc.href,
  label: legalNavLabel(doc),
}));

export function LegalDocsSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Yasal metinler"
      className="lg:sticky lg:top-[calc(var(--app-header-h)+24px)] lg:self-start"
    >
      <div className="rounded-card border border-line bg-surface p-2">
        <p className="hidden px-3 pb-2 pt-1 text-label text-ink-mid lg:block">
          Yasal metinler
        </p>
        <ul
          className={cn(
            "flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "lg:flex-col lg:overflow-visible",
          )}
        >
          {ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center whitespace-nowrap rounded-pill px-4 py-2 text-small",
                    "transition-colors duration-[var(--duration-state)] ease-linear",
                    // Nested radius: a 20px card with 8px padding holds a
                    // 12px child. The pill shape is kept for the mobile row,
                    // where the items read as chips rather than a list.
                    "lg:whitespace-normal lg:rounded-[12px]",
                    isActive
                      ? "bg-ink font-medium text-white"
                      : "text-ink-mid hover:bg-paper hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

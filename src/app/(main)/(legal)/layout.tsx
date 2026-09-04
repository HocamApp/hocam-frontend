import type { ReactNode } from "react";

import { LegalDocsSidebar } from "@/components/legal/LegalDocsSidebar";

/**
 * Shell for the published legal documents.
 *
 * This is a route group, so it adds no URL segment: /kvkk and
 * /kvkk/aydinlatma-metni keep the addresses they have always had.
 *
 * /kvkk/veli-onayi is deliberately a sibling of this group rather than a
 * member. It is a token-gated confirmation flow arriving from an email link,
 * not a document, so it inherits (main) alone — navbar and footer, no
 * document rail.
 *
 * Not a <main>: (main)/layout.tsx already owns the page's single
 * <main id="ys-main-content">, and a second primary landmark would make "skip
 * to content" ambiguous.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-8 md:px-6 md:py-12">
      {/* minmax(0,1fr) plus the min-w-0 on LegalArticle is what keeps the
          900px cookie inventory table scrolling inside its own box. A grid
          track defaults to min-width:auto, which lets wide content push the
          whole column — and the page — sideways on a phone.
          The single-column form is spelled out for the same reason: an
          implicit track is auto-sized, so leaving the base breakpoint
          without grid-cols reintroduces the overflow below lg. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-8">
        <LegalDocsSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

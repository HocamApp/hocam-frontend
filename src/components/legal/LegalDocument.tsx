import type { ReactNode } from "react";

import {
  getLegalDocument,
  type LegalDocumentSlug,
} from "@/lib/legalDocuments";
import { cn } from "@/lib/utils";

/**
 * Shared shell and typography for every published legal document.
 *
 * All server components on purpose. The page tests render these pages
 * directly, and a `usePathname` anywhere in this tree would force every one
 * of them to mock `next/navigation`. The sidebar is the only client piece and
 * it lives in the layout, not in the pages.
 *
 * Body copy is `text-body` (16px), not the 14px these documents used before
 * the shared shell existed. DESIGN.md §2: body never drops below 16px.
 */

/** The white in-flow card. Separates by hairline and value, never by shadow. */
export function LegalArticle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        // min-w-0 lets the card shrink below its content's intrinsic
        // width, so a long unbroken string inside a document cannot push
        // the page sideways on a phone.
        "min-w-0 rounded-card border border-line bg-surface p-6 text-ink md:p-8",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function LegalDocHeader({ slug }: { slug: LegalDocumentSlug }) {
  const doc = getLegalDocument(slug);

  return (
    <header className="space-y-2">
      <h1 className="text-h2-m text-ink md:text-h2">{doc.title}</h1>
      {doc.updatedAt ? (
        <p className="text-small tabular-nums text-ink-mid">
          {doc.version ? `Sürüm ${doc.version} · ` : "Yürürlük tarihi: "}
          <time dateTime={doc.updatedAtIso}>{doc.updatedAt}</time>
        </p>
      ) : null}
    </header>
  );
}

/**
 * A framed aside for the "this notice informs you, it does not ask for
 * consent" line each notice opens with. Hairline plus the page ground, never
 * a tinted fill — DESIGN.md banned pattern 31.
 */
export function LegalNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-input border border-line bg-paper p-4 text-body leading-[1.6] text-ink-mid">
      {children}
    </div>
  );
}

export function LegalSection({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-3 scroll-mt-24">
      <h2 className="text-h3-m text-ink md:text-h3">{title}</h2>
      {/* The measure cap is applied to text children only. Putting it on the
          section itself would squeeze the cookie inventory table into a
          ~500px window on desktop. */}
      <div className="space-y-4 text-body leading-[1.6] text-ink-mid [&_ol]:max-w-[60ch] [&_p]:max-w-[60ch] [&_ul]:max-w-[60ch]">
        {children}
      </div>
    </section>
  );
}

/** Inline link inside document prose. */
export function LegalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink"
    >
      {children}
    </a>
  );
}

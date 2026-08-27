import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One heading scale for everything below the page title.
 *
 * The shell's h1 is identical on every coaching tab, but the in-page headings
 * were ad hoc across five scales — an unsized 16px h2 here, a 24px CardTitle
 * default there, a 20px empty state somewhere else. Moving between tabs read as
 * the font changing size, which is exactly what it was doing.
 *
 * text-lg / sm:text-xl because it is already the de-facto section size in the
 * tree, it sits one clean step under the h1, and it is specifically not the
 * 24px CardTitle default that made the program tab shout.
 */
export const COACHING_SECTION_TITLE_CLASS =
  "text-[1.375rem] font-medium leading-[1.3] tracking-[-0.01em] text-ink";

export const COACHING_SUBSECTION_TITLE_CLASS =
  "text-body font-medium leading-[1.4] text-ink";

type CoachingSectionHeadingProps = {
  children: ReactNode;
  /** "section" for a top-level block, "subsection" for one inside a card. */
  level?: "section" | "subsection";
  as?: "h2" | "h3";
  description?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
};

export function CoachingSectionHeading({
  children,
  level = "section",
  as,
  description,
  actions,
  id,
  className,
}: CoachingSectionHeadingProps) {
  const Tag = as ?? (level === "section" ? "h2" : "h3");
  const titleClass =
    level === "section"
      ? COACHING_SECTION_TITLE_CLASS
      : COACHING_SUBSECTION_TITLE_CLASS;

  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <Tag id={id} className={titleClass}>
          {children}
        </Tag>
        {description ? (
          <p className="mt-2 text-small leading-[1.5] text-ink-mid">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

"use client";

import { useRef, type ReactNode } from "react";

import { useRevealActiveInStrip } from "@/hooks/useRevealActiveInStrip";

/* The scrolling strip is the only interactive part of the coaching subnav, so it
   is the only part that ships to the client; the links and their SSR icons stay
   server-rendered in CoachingSubnav.

   On a phone the strip is wider than the screen. Without the reveal, a page
   whose tab sits past the right edge opened with its own tab cut off — which
   the longer "Koçluk Programım" label turned from an edge case into the
   program page's default state. */
export function CoachingSubnavStrip({
  activeHref,
  children,
}: {
  activeHref: string | null | undefined;
  children: ReactNode;
}) {
  const stripRef = useRef<HTMLElement>(null);
  useRevealActiveInStrip(stripRef, [activeHref]);

  return (
    <nav
      ref={stripRef}
      aria-label="Koçluk bölümleri"
      className="flex gap-1 overflow-x-auto rounded-card border border-line bg-surface p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </nav>
  );
}

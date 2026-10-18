import type { ReactNode } from "react";

export function CoachingSubnavStrip({
  audience,
  children,
}: {
  audience: "student" | "tutor";
  children: ReactNode;
}) {
  return (
    <nav
      aria-label="Koçluk bölümleri"
      data-audience={audience}
      className="grid grid-cols-6 gap-1 rounded-card border border-line bg-surface p-2 xl:flex xl:flex-nowrap xl:justify-between [&>a]:col-span-2 [&>a]:min-w-0 [@media(max-width:1279px)]:[&[data-audience=student]>a:nth-child(-n+2)]:col-span-3"
    >
      {children}
    </nav>
  );
}

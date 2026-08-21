import type { ReactNode } from "react";

export function YsSectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-4 text-2xl font-bold leading-[1.333]">
      {children}
    </h2>
  );
}

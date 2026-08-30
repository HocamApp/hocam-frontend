import type { Metadata } from "next";

import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

export default function TutorTutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen canvas, no navbar — the lesson mock owns its ink workspace,
  // while loading/completion states stay on the product paper surface.
  return <div className="flex h-dvh-safe flex-col bg-paper">{children}</div>;
}

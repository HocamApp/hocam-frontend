import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HOCA_BUL_ENABLED } from "@/lib/featureFlags";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

/**
 * /hoca-bul lives outside the (main) group on purpose: the matching flow is a
 * focused, full-screen experience with no navbar and no footer.
 *
 * The flag check happens here rather than in the page so a disabled feature
 * ships no client JavaScript for it at all.
 */
export default function HocaBulLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!HOCA_BUL_ENABLED) {
    notFound();
  }

  return children;
}

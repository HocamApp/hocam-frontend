import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MATCHING_FEATURE_ENABLED } from "@/lib/featureFlags";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

export default function MatchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!MATCHING_FEATURE_ENABLED) {
    notFound();
  }

  return children;
}

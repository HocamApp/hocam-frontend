import { notFound } from "next/navigation";
import { MATCHING_FEATURE_ENABLED } from "@/lib/featureFlags";

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

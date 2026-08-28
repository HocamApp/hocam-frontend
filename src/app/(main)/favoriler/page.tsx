import type { Metadata } from "next";

import { YsFavoritesPage } from "@/components/yemeksepeti/YsFavoritesPage";

/**
 * Saved tutors, on a route of their own.
 *
 * The heart in the header used to point at `/?favorites=1` — the homepage
 * with its list swapped out, which meant reaching a shortlist of four tutors
 * went through the hero, the verified band, the university strip and back.
 * The list is the whole page here.
 *
 * `noindex`: it is a signed-in view of one person's saved tutors and has
 * nothing for a crawler.
 */
export const metadata: Metadata = {
  title: "Favori Hocalarım",
  description: "Kaydettiğin hocaları tek bir yerden karşılaştır.",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <YsFavoritesPage />;
}

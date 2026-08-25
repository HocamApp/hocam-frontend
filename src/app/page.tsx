import type { Metadata } from "next";

import { YemeksepetiHome } from "@/components/yemeksepeti/YemeksepetiHome";

/**
 * Experiment branch: `/` renders a Yemeksepeti-shaped homepage whose chrome is
 * a local rebuild of a captured page, and whose tutor directory (filters +
 * cards) is Hocam's real `/tutors` machinery imported unchanged.
 *
 * Nothing from Yemeksepeti's runtime was carried over: no analytics, tracking,
 * cookie consent or third-party assets. The auth entry screen this route used
 * to host still lives at `/login` and `/register`.
 */

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  // Experiment surface — keep it out of the index until the design settles.
  robots: {
    index: false,
    follow: true,
  },
};

export default function Home() {
  return <YemeksepetiHome />;
}

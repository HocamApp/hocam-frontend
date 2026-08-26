import type { Metadata } from "next";

import { YemeksepetiHome } from "@/components/yemeksepeti/YemeksepetiHome";

/**
 * The homepage and the tutor directory, which in this design are one screen
 * rather than two: the root route lists the tutors, and the header's search
 * filters them.
 *
 * It lives in `(main)` rather than at the top of `app/` so it shares a layout
 * with the rest of the signed-in app. That is not filing tidiness — a layout
 * is the only thing React keeps mounted across a navigation, so this is what
 * lets the header survive `/` to `/dashboard/student` instead of being torn
 * down and rebuilt.
 *
 * Nothing from the reference page's runtime was carried over: no analytics,
 * tracking, cookie consent or third-party assets. The auth entry screen this
 * route used to host still lives at `/login` and `/register`.
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

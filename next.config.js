/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    /*
     * The directory moved to the root route, and /home was the signed-in
     * landing page it replaced. Both are retired.
     *
     * `source` is an exact path on purpose. `/tutors/:path*` would swallow
     * `/tutors/[id]` and `/tutors/[id]/checkout/*` — every tutor profile and
     * the checkout behind it — which is the one way this change could take
     * the product down rather than tidy it.
     *
     * Here rather than a `redirect()` inside a page, because Next passes the
     * original query through a config redirect verbatim and a page-level
     * redirect does not. `/tutors?favorites=1` has to arrive as
     * `/?favorites=1`; dropping the query would silently strand the
     * favourites link.
     *
     * Permanent only in production. A 308 is cached hard by browsers, so a
     * mistake keeps redirecting people long after it is reverted — previews
     * get a 307 they can iterate on. Production is where the permanence is
     * the point: it is what moves the old URL's search value to the new one.
     */
    const permanent = process.env.VERCEL_ENV === "production";
    return [
      { source: "/tutors", destination: "/", permanent },
      { source: "/home", destination: "/", permanent },
      /*
       * /kvkk used to be an index page whose only content was a list of the
       * same documents the sidebar already shows on every legal page, so
       * arriving there meant reading the menu twice and clicking again.
       * It now lands on the first document; the sidebar carries the rest.
       *
       * Not permanent even in production: the hub is a plausible thing to
       * bring back, and a cached 308 would make that impossible.
       */
      {
        source: "/kvkk",
        destination: "/kvkk/aydinlatma-metni",
        permanent: false,
      },
      /*
       * The coaching earnings page ("Parayı çek") was removed: tutor money
       * gets one earnings screen outside coaching later. Old links and
       * bookmarks land on the coaching overview instead of a 404. Temporary,
       * so the path can be reused.
       */
      {
        source: "/dashboard/tutor/coaching/earnings",
        destination: "/dashboard/tutor/coaching",
        permanent: false,
      },
    ];
  },

  async headers() {
    const shared = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // JaaS video is embedded from 8x8.vc. Delegate camera and microphone
      // only to that trusted iframe origin; keep them disabled elsewhere.
      {
        key: "Permissions-Policy",
        value:
          'camera=(self "https://8x8.vc"), microphone=(self "https://8x8.vc"), geolocation=()',
      },
    ];
    // The app is never legitimately embedded; YouTube intro videos are
    // iframes WE embed, which X-Frame-Options does not restrict.
    const deny = { key: "X-Frame-Options", value: "DENY" };

    // PayTR sends the student back to /odeme/basarili or /odeme/basarisiz
    // after 3D Secure. Its docs do not say whether that lands in the top
    // window or inside the payment iframe on our own page; if it is the
    // iframe, DENY blanks it. With payments built in, those two pages may be
    // framed by this site only (they then move themselves to the top
    // window). The flag is inlined at build time, so a production build with
    // payments off sends exactly the headers it always has.
    if (process.env.NEXT_PUBLIC_PAYTR_ENABLED !== "true") {
      return [{ source: "/(.*)", headers: [deny, ...shared] }];
    }
    return [
      {
        source: "/((?!odeme/basarili$|odeme/basarisiz$).*)",
        headers: [deny, ...shared],
      },
      {
        source: "/odeme/:result(basarili|basarisiz)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          ...shared,
        ],
      },
    ];
  },
};

module.exports = nextConfig;

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
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // The app is never legitimately embedded; YouTube intro videos are
          // iframes WE embed, which X-Frame-Options does not restrict.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // JaaS video is embedded from 8x8.vc. Delegate camera and microphone
          // only to that trusted iframe origin; keep them disabled elsewhere.
          {
            key: "Permissions-Policy",
            value:
              'camera=(self "https://8x8.vc"), microphone=(self "https://8x8.vc"), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

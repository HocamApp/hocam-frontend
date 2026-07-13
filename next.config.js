/** @type {import('next').NextConfig} */
const nextConfig = {
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

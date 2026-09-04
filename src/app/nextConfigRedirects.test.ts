import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

// next.config.js is CommonJS and not part of the TS program, so it is loaded
// through createRequire rather than imported.
const nextConfig = createRequire(import.meta.url)("../../next.config.js") as {
  redirects: () => Promise<
    { source: string; destination: string; permanent: boolean }[]
  >;
};

/**
 * Guards the shape of the directory-retirement redirects.
 *
 * The runtime behaviour is checked by `scripts/route-migration-check.ts`
 * against a real server, because a redirect is not a redirect until something
 * routes a request. What can be checked here is the part a person can get
 * wrong while editing: the `source` patterns.
 *
 * `/tutors/:path*` is the mistake this exists to catch. It looks like a more
 * thorough version of `/tutors` and it would send every tutor profile and
 * every checkout under it to the homepage.
 */
describe("directory retirement redirects", () => {
  it("retires exactly the old directory routes and the KVKK index", async () => {
    const redirects = await nextConfig.redirects();
    assert.deepEqual(
      redirects.map((r) => [
        r.source,
        r.destination,
      ]),
      [
        ["/tutors", "/"],
        ["/home", "/"],
        ["/kvkk", "/kvkk/aydinlatma-metni"],
      ],
    );
  });

  it("never uses a wildcard, which would swallow the tutor profiles", async () => {
    const redirects = await nextConfig.redirects();
    for (const redirect of redirects) {
      assert.equal(
        /[:*]/.test(redirect.source),
        false,
        `${redirect.source} has a path parameter and would match its own subtree`,
      );
    }
  });

  it("is temporary outside production, so a mistake is not cached forever", async () => {
    const previous = process.env.VERCEL_ENV;
    try {
      delete process.env.VERCEL_ENV;
      for (const redirect of await nextConfig.redirects()) {
        assert.equal(redirect.permanent, false);
      }

      process.env.VERCEL_ENV = "preview";
      for (const redirect of await nextConfig.redirects()) {
        assert.equal(redirect.permanent, false);
      }

      // Production is where permanence is the point: it is the signal that
      // moves the retired URL's search value to the route that replaced it.
      process.env.VERCEL_ENV = "production";
      for (const redirect of await nextConfig.redirects()) {
        // /kvkk is the exception: the hub is a plausible thing to restore,
        // and a cached 308 would make restoring it impossible.
        const expected = redirect.source !== "/kvkk";
        assert.equal(redirect.permanent, expected, redirect.source);
      }
    } finally {
      if (previous === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = previous;
    }
  });
});

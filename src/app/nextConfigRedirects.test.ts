import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, it } from "node:test";

import { readCoachingSetupStep } from "../lib/coachingSetup";

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
  it("retires exactly the old directory routes, the KVKK index, the coaching earnings page, the two pages the plan wizard replaced and Paket Talepleri", async () => {
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
        // Removed with "Parayı çek"; tutor earnings move outside coaching.
        ["/dashboard/tutor/coaching/earnings", "/dashboard/tutor/coaching"],
        // Old pages that the Teklif ayarları wizard replaced.
        ["/dashboard/tutor/coaching/availability", "/dashboard/tutor/coaching/plan?step=availability"],
        ["/dashboard/tutor/coaching/preview", "/dashboard/tutor/coaching/plan?step=publish"],
        // "Paket Talepleri": a lesson package no longer waits for the tutor, and the
        // coaching bundle requests that still do are answered under Koçluk.
        ["/dashboard/tutor/requests", "/dashboard/tutor/coaching/requests"],
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
        // /kvkk is a documents hub that may plausibly return, and the
        // coaching earnings path will be reused; a cached 308 would make
        // restoring either impossible.
        // The two wizard pages are temporary too: the wizard's steps may move.
        const expected = ![
          "/kvkk",
          "/dashboard/tutor/coaching/earnings",
          "/dashboard/tutor/coaching/availability",
          "/dashboard/tutor/coaching/preview",
          "/dashboard/tutor/requests",
        ].includes(redirect.source);
        assert.equal(redirect.permanent, expected, redirect.source);
      }
    } finally {
      if (previous === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = previous;
    }
  });
});

/**
 * /availability and /preview were pages before the Teklif ayarları wizard took
 * over their jobs: the hours step, and the review step with the student's view.
 * Their old addresses land on those steps, and the pages themselves are gone, so
 * there is one place for each job and no dead code behind the redirect.
 */
describe("retired tutor coaching pages", () => {
  const RETIRED = [
    ["/dashboard/tutor/coaching/availability", "availability"],
    ["/dashboard/tutor/coaching/preview", "publish"],
  ] as const;

  it("lands each old address on the wizard step that does its job, one the wizard really reads", async () => {
    const redirects = await nextConfig.redirects();
    for (const [source, step] of RETIRED) {
      const redirect = redirects.find((candidate) => candidate.source === source);
      assert.ok(redirect, `${source} has no redirect`);
      const target = new URL(redirect.destination, "https://hocam.test");
      assert.equal(target.pathname, "/dashboard/tutor/coaching/plan");
      assert.equal(target.searchParams.get("step"), step);
      assert.equal(readCoachingSetupStep(target.searchParams.get("step")), step);
    }
  });

  it("leaves no page file behind the redirect", () => {
    for (const [source] of RETIRED) {
      const file = resolve(process.cwd(), "src/app/(main)", `${source.slice(1)}/page.tsx`);
      assert.equal(existsSync(file), false, `${file} should be deleted`);
    }
  });
});

/**
 * "Paket Talepleri" answered lesson-package requests. A lesson package no longer
 * waits for the tutor and the coaching bundles that do are answered under Koçluk,
 * so the page could only ever say there was nothing to answer. Its address lands
 * on the place the requests really are.
 */
describe("retired Paket Talepleri page", () => {
  it("lands on the coaching requests page, which exists", async () => {
    const redirects = await nextConfig.redirects();
    const redirect = redirects.find((candidate) => candidate.source === "/dashboard/tutor/requests");
    assert.ok(redirect, "/dashboard/tutor/requests has no redirect");
    assert.equal(redirect.destination, "/dashboard/tutor/coaching/requests");
    assert.equal(
      existsSync(resolve(process.cwd(), "src/app/(main)", `${redirect.destination.slice(1)}/page.tsx`)),
      true,
    );
  });

  it("leaves no page file behind the redirect", () => {
    assert.equal(
      existsSync(resolve(process.cwd(), "src/app/(main)/dashboard/tutor/requests/page.tsx")),
      false,
    );
  });
});

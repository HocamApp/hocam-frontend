import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

/**
 * Response headers for every route, read straight from next.config.js.
 *
 * The production build ships with NEXT_PUBLIC_PAYTR_ENABLED unset, and there
 * the headers must stay exactly what main sends: the app is never framed.
 */

const require = createRequire(import.meta.url);
const CONFIG = join(process.cwd(), "next.config.js");

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

async function headersWith(flag: string | undefined): Promise<HeaderRule[]> {
  if (flag === undefined) delete process.env.NEXT_PUBLIC_PAYTR_ENABLED;
  else process.env.NEXT_PUBLIC_PAYTR_ENABLED = flag;
  delete require.cache[require.resolve(CONFIG)];
  const config = require(CONFIG) as { headers: () => Promise<HeaderRule[]> };
  return config.headers();
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_PAYTR_ENABLED;
});

// Captured from origin/main 08c0b76.
const MAIN_HEADERS: HeaderRule[] = [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: 'camera=(self "https://8x8.vc"), microphone=(self "https://8x8.vc"), geolocation=()',
      },
    ],
  },
];

describe("next.config headers with PayTR off (production build)", () => {
  it("sends exactly main's headers, framing denied everywhere", async () => {
    assert.deepEqual(await headersWith(undefined), MAIN_HEADERS);
    // A near miss is not "on" either.
    assert.deepEqual(await headersWith("TRUE"), MAIN_HEADERS);
  });
});

describe("next.config headers with PayTR on (staging build)", () => {
  // Next matches header sources with path-to-regexp; use the same compiler.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pathToRegexp } = require("next/dist/compiled/path-to-regexp") as {
    pathToRegexp: (source: string, keys: unknown[]) => RegExp;
  };

  function headersFor(rules: HeaderRule[], path: string) {
    const merged = new Map<string, string>();
    for (const rule of rules) {
      if (!pathToRegexp(rule.source, []).test(path)) continue;
      for (const { key, value } of rule.headers) merged.set(key, value);
    }
    return merged;
  }

  it("lets only the two PayTR return pages be framed, and only by this site", async () => {
    const rules = await headersWith("true");
    for (const path of ["/odeme/basarili", "/odeme/basarisiz"]) {
      const headers = headersFor(rules, path);
      assert.equal(headers.get("X-Frame-Options"), "SAMEORIGIN", path);
      assert.equal(headers.get("Content-Security-Policy"), "frame-ancestors 'self'", path);
      assert.equal(headers.get("X-Content-Type-Options"), "nosniff", path);
      assert.equal(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin", path);
    }
  });

  it("keeps every other route unframeable, exactly as main", async () => {
    const rules = await headersWith("true");
    const main = new Map(MAIN_HEADERS[0].headers.map(({ key, value }) => [key, value]));
    for (const path of [
      "/",
      "/package-purchases/purchase-1/pay",
      "/profile/payments",
      "/odeme",
      "/odeme/basarili/extra",
      "/login",
    ]) {
      assert.deepEqual(headersFor(rules, path), main, path);
    }
  });
});

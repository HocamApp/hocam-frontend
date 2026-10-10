import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

/**
 * The /araclar proxy, read straight from next.config.js (CommonJS, so it is
 * loaded through createRequire with the cache cleared per case).
 *
 * The runtime behaviour is checked by hand against a real tools server; what
 * is pinned here is what a person editing the config can get wrong: the
 * unset case must add nothing, the destinations must stay at the origin root,
 * and links without a proxy must not be buildable.
 */

const require = createRequire(import.meta.url);
const CONFIG = join(process.cwd(), "next.config.js");

type Rewrite = { source: string; destination: string };

function setOrDelete(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

async function rewritesWith(env: { origin?: string; enabled?: string }): Promise<Rewrite[]> {
  setOrDelete("TOOLS_ORIGIN", env.origin);
  setOrDelete("NEXT_PUBLIC_TOOLS_ENABLED", env.enabled);
  delete require.cache[require.resolve(CONFIG)];
  const config = require(CONFIG) as { rewrites: () => Promise<Rewrite[]> };
  return config.rewrites();
}

afterEach(() => {
  delete process.env.TOOLS_ORIGIN;
  delete process.env.NEXT_PUBLIC_TOOLS_ENABLED;
});

describe("/araclar rewrite", () => {
  it("adds nothing when TOOLS_ORIGIN is unset, so /araclar stays a 404", async () => {
    assert.deepEqual(await rewritesWith({}), []);
  });

  it("proxies exactly /araclar and /araclar/:path* to the tools origin", async () => {
    assert.deepEqual(await rewritesWith({ origin: "https://hocam-tools.vercel.app" }), [
      { source: "/araclar", destination: "https://hocam-tools.vercel.app/araclar" },
      { source: "/araclar/:path*", destination: "https://hocam-tools.vercel.app/araclar/:path*" },
    ]);
  });

  it("keeps only the origin, so a trailing slash or path cannot move the destination", async () => {
    const rewrites = await rewritesWith({ origin: "https://hocam-tools.vercel.app/some/path/" });
    assert.deepEqual(
      rewrites.map((r) => r.destination),
      ["https://hocam-tools.vercel.app/araclar", "https://hocam-tools.vercel.app/araclar/:path*"],
    );
  });

  it("accepts http only for localhost", async () => {
    const rewrites = await rewritesWith({ origin: "http://localhost:3100" });
    assert.equal(rewrites[0].destination, "http://localhost:3100/araclar");
    await assert.rejects(() => rewritesWith({ origin: "http://hocam-tools.vercel.app" }), /https/);
  });

  it("fails the build on a malformed origin instead of shipping a broken proxy", async () => {
    await assert.rejects(() => rewritesWith({ origin: "hocam-tools" }), /not a valid URL/);
  });

  it("refuses the links without the proxy, which would publish a 404", async () => {
    await assert.rejects(() => rewritesWith({ enabled: "true" }), /requires TOOLS_ORIGIN/);
  });

  it("allows the proxy before the links, so it can be checked first", async () => {
    const rewrites = await rewritesWith({ origin: "https://hocam-tools.vercel.app" });
    assert.equal(rewrites.length, 2);
  });

  it("treats a near-miss flag value as off", async () => {
    assert.deepEqual(await rewritesWith({ enabled: "TRUE" }), []);
  });
});

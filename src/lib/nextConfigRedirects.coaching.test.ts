import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);

type Redirect = { source: string; destination: string; permanent: boolean };

describe("removed coaching earnings page", () => {
  it("sends old links to the coaching overview with a temporary redirect", async () => {
    const config = require(join(process.cwd(), "next.config.js")) as {
      redirects: () => Promise<Redirect[]>;
    };
    const rule = (await config.redirects()).find(
      (entry) => entry.source === "/dashboard/tutor/coaching/earnings",
    );
    assert.deepEqual(rule, {
      source: "/dashboard/tutor/coaching/earnings",
      destination: "/dashboard/tutor/coaching",
      permanent: false,
    });
  });
});

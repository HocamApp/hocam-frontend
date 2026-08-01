import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import React from "react";

// The flag is read from the environment when the module first loads, and a
// module mock cannot be re-registered inside one process — so the enabled case
// lives in its own file, with the variable set before any import happens.
process.env.NEXT_PUBLIC_HOCA_BUL_ENABLED = "true";

mock.module("next/navigation", {
  namedExports: {
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  },
});

describe("hoca-bul route gate (feature enabled)", () => {
  it("renders the flow instead of a not-found", async () => {
    const Layout = (await import("./layout")).default;
    const children = React.createElement("div", null, "wizard");
    assert.equal(Layout({ children }), children);
  });

  it("keeps the flag on", async () => {
    const flags = await import("@/lib/featureFlags");
    assert.equal(flags.HOCA_BUL_ENABLED, true);
  });
});

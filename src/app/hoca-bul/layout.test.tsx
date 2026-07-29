import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import React from "react";

const NOT_FOUND = "NEXT_NOT_FOUND";

// No flag mock: with NEXT_PUBLIC_HOCA_BUL_ENABLED unset, the real module
// evaluates to false, which is exactly the shipped default this asserts.
mock.module("next/navigation", {
  namedExports: {
    notFound: () => {
      throw new Error(NOT_FOUND);
    },
  },
});

describe("hoca-bul route gate (default configuration)", () => {
  it("hides the route entirely, so nothing is reachable before the flow is ready", async () => {
    const Layout = (await import("./layout")).default;
    assert.throws(
      () => Layout({ children: React.createElement("div") }),
      /NEXT_NOT_FOUND/
    );
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { before, describe, it, mock } from "node:test";
import React from "react";
import { render, screen } from "@testing-library/react";

let guardProps: Record<string, unknown> = {};

before(() => {
  mock.module("@/components/shared/RouteGuard", {
    namedExports: {
      RouteGuard: ({ children, ...props }: { children: React.ReactNode }) => {
        guardProps = props;
        return React.createElement(React.Fragment, null, children);
      },
    },
  });
  mock.module("@/components/hoca-bul/HocaBulResults", {
    namedExports: {
      HocaBulResults: () => React.createElement("div", null, "results-controller"),
    },
  });
});

describe("/hoca-bul/sonuclar", () => {
  it("requires a student and preserves the exact results return URL", async () => {
    const { default: Page } = await import("./page");
    render(<Page />);
    assert.ok(screen.getByText("results-controller"));
    assert.deepEqual(guardProps, {
      requireAuth: true,
      requireRole: "student",
      redirectTo: "/login?role=student&returnUrl=%2Fhoca-bul%2Fsonuclar",
    });
  });
});

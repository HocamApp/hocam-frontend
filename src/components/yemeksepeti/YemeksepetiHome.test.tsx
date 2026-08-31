import "@/test/setupDom";

import assert from "node:assert/strict";
import test from "node:test";
import React, { type ReactElement } from "react";

import { YemeksepetiHome } from "./YemeksepetiHome";
import { YsHomeFaq } from "./YsHomeFaq";
import { YsHowItWorks } from "./YsHowItWorks";
import { YsTestimonials } from "./YsTestimonials";
import { YsUniversityStrip } from "./YsUniversityStrip";

test("places the how-it-works journey between university proof and testimonials", () => {
  const home = YemeksepetiHome() as ReactElement<{ children: React.ReactNode }>;
  const sections = React.Children.toArray(home.props.children) as ReactElement[];
  const proofShell = sections.find(
    (section) => section.props?.className === "ys-shell pb-12",
  );

  assert.ok(proofShell, "homepage proof shell is missing");
  const proofSections = React.Children.toArray(proofShell.props.children) as ReactElement[];

  assert.deepEqual(
    proofSections.map((section) => section.type),
    [YsUniversityStrip, YsHowItWorks, YsTestimonials, YsHomeFaq],
  );
});

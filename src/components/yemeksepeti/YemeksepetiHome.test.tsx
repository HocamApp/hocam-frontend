import "@/test/setupDom";

import assert from "node:assert/strict";
import test from "node:test";
import React, { type ReactElement } from "react";

import { YemeksepetiHome } from "./YemeksepetiHome";
import { YsHomeFaq } from "./YsHomeFaq";
import { YsHowItWorks } from "./YsHowItWorks";
import { YsTestimonials } from "./YsTestimonials";
import { YsUniversityStrip } from "./YsUniversityStrip";

type Wrapper = ReactElement<{ className?: string; children?: React.ReactNode }>;

function wrappers(home: Wrapper): Wrapper[] {
  return React.Children.toArray(home.props.children).filter(
    (child): child is Wrapper => React.isValidElement(child),
  );
}

function sectionsOf(wrapper: Wrapper): unknown[] {
  return React.Children.toArray(wrapper.props.children)
    .filter((child): child is ReactElement => React.isValidElement(child))
    .map((child) => child.type);
}

test("places the how-it-works journey between university proof and testimonials", () => {
  const home = YemeksepetiHome() as Wrapper;
  const order = wrappers(home)
    .flatMap(sectionsOf)
    .filter((type) =>
      [YsUniversityStrip, YsHowItWorks, YsTestimonials, YsHomeFaq].includes(
        type as never,
      ),
    );

  assert.deepEqual(order, [
    YsUniversityStrip,
    YsHowItWorks,
    YsTestimonials,
    YsHomeFaq,
  ]);
});

test("keeps the journey band outside the shell so its surface runs full bleed", () => {
  const home = YemeksepetiHome() as Wrapper;
  const journeyWrapper = wrappers(home).find((wrapper) =>
    sectionsOf(wrapper).includes(YsHowItWorks),
  );

  assert.ok(journeyWrapper, "journey wrapper is missing");
  assert.doesNotMatch(journeyWrapper.props.className ?? "", /ys-shell/);
});

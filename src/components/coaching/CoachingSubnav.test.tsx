import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

let CoachingSubnav: typeof import("./CoachingSubnav").CoachingSubnav;

before(async () => {
  mock.module("next/link", {
    defaultExport: React.forwardRef<
      HTMLAnchorElement,
      { href: string; children?: React.ReactNode }
    >(function MockLink({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children);
    }),
  });

  // The pending-request badge reads React Query; its own count is not what
  // these tab-resolution tests are about.
  mock.module("./TutorCoachingPendingBadge", {
    namedExports: { TutorCoachingPendingBadge: () => null },
  });

  CoachingSubnav = (await import("./CoachingSubnav")).CoachingSubnav;
});

after(() => window.close());
afterEach(cleanup);

function activeLabels(currentHref: string, audience: "tutor" | "student") {
  render(<CoachingSubnav currentHref={currentHref} audience={audience} />);
  return screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent?.trim());
}

// Every currentHref the app actually passes, collected from the call sites.
const STUDENT_ROUTES: [string, string][] = [
  ["/dashboard/student/coaching", "Genel bakış"],
  ["/dashboard/student/coaching/program", "Koçluk Programım"],
  ["/dashboard/student/coaching/upcoming", "Görüşmeler"],
  ["/dashboard/student/coaching/reports", "Raporlar"],
  ["/dashboard/student/coaching/complaints", "Sorun bildir"],
  // Choosing the first hours is a step of getting started, so it sits under the overview.
  ["/dashboard/student/coaching/schedule", "Genel bakış"],
];

const TUTOR_ROUTES: [string, string][] = [
  ["/dashboard/tutor/coaching", "Genel bakış"],
  ["/dashboard/tutor/coaching/students", "Öğrenciler"],
  ["/dashboard/tutor/coaching/service-periods/abc/program", "Öğrenciler"],
  ["/dashboard/tutor/coaching/time-requests", "Talepler"],
  ["/dashboard/tutor/coaching/upcoming", "Görüşmeler"],
  ["/dashboard/tutor/coaching/sessions/prepare", "Görüşmeler"],
  ["/dashboard/tutor/coaching/reschedule-requests", "Talepler"],
  ["/dashboard/tutor/coaching/requests", "Talepler"],
  ["/dashboard/tutor/coaching/reports", "Kayıtlar"],
  ["/dashboard/tutor/coaching/complaints", "Kayıtlar"],
  ["/dashboard/tutor/coaching/plan", "Teklif ayarları"],
  ["/dashboard/tutor/coaching/availability", "Teklif ayarları"],
  ["/dashboard/tutor/coaching/preview", "Teklif ayarları"],
  ["/dashboard/tutor/coaching/onboarding", "Teklif ayarları"],
];

describe("coaching subnav highlights exactly one tab", () => {
  STUDENT_ROUTES.forEach(([href, label]) => {
    it(`student ${href} → ${label}`, () => {
      assert.deepEqual(activeLabels(href, "student"), [label]);
    });
  });

  TUTOR_ROUTES.forEach(([href, label]) => {
    it(`tutor ${href} → ${label}`, () => {
      assert.deepEqual(activeLabels(href, "tutor"), [label]);
    });
  });
});

describe("complaints belongs to a different tab per audience", () => {
  // The regression: the /reports grouping rule also claimed /complaints, so on
  // the student complaints page both Raporlar and Sorun bildir rendered as active.
  it("does not also light Raporlar on the student complaints page", () => {
    const active = activeLabels("/dashboard/student/coaching/complaints", "student");

    assert.deepEqual(active, ["Sorun bildir"]);
    assert.equal(active.includes("Raporlar"), false);
  });

  it("keeps grouping complaints under Kayıtlar for the tutor, who has no Destek tab", () => {
    render(<CoachingSubnav currentHref="/dashboard/tutor/coaching/complaints" audience="tutor" />);

    assert.equal(screen.queryByText("Sorun bildir"), null);
    assert.equal(
      screen.getByText("Kayıtlar").closest("a")?.getAttribute("aria-current"),
      "page"
    );
  });

  it("announces the same tab it highlights", () => {
    render(
      <CoachingSubnav currentHref="/dashboard/student/coaching/complaints" audience="student" />
    );

    assert.ok(screen.getByText("Koçlukta konumun: Sorun bildir"));
  });
});

describe("the tab strip on a narrow screen", () => {
  it("keeps all five student destinations in a wrapping grid", () => {
    render(<CoachingSubnav currentHref="/dashboard/student/coaching/program" audience="student" />);
    const strip = screen.getByRole("navigation", { name: "Koçluk bölümleri" });
    assert.equal(strip.getAttribute("data-audience"), "student");
    assert.match(strip.className, /grid-cols-6/);
    assert.doesNotMatch(strip.className, /overflow-x-auto/);
    assert.equal(strip.querySelectorAll("a").length, 5);
    assert.ok(screen.getByRole("link", { name: "Sorun bildir" }));
  });

  it("keeps all six tutor destinations in the same non-scrolling layout", () => {
    render(<CoachingSubnav currentHref="/dashboard/tutor/coaching" audience="tutor" />);
    const strip = screen.getByRole("navigation", { name: "Koçluk bölümleri" });
    assert.equal(strip.querySelectorAll("a").length, 6);
    assert.doesNotMatch(strip.className, /overflow-x-auto/);
  });
});

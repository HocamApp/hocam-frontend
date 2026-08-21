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
  ["/dashboard/student/coaching/program", "Programım"],
  ["/dashboard/student/coaching/upcoming", "Görüşmeler"],
  ["/dashboard/student/coaching/reports", "Raporlar"],
  ["/dashboard/student/coaching/complaints", "Destek"],
];

const TUTOR_ROUTES: [string, string][] = [
  ["/dashboard/tutor/coaching", "Genel bakış"],
  ["/dashboard/tutor/coaching/students", "Öğrenciler"],
  ["/dashboard/tutor/coaching/service-periods/abc/program", "Öğrenciler"],
  ["/dashboard/tutor/coaching/time-requests", "Öğrenciler"],
  ["/dashboard/tutor/coaching/upcoming", "Görüşmeler"],
  ["/dashboard/tutor/coaching/sessions/prepare", "Görüşmeler"],
  ["/dashboard/tutor/coaching/reschedule-requests", "Görüşmeler"],
  ["/dashboard/tutor/coaching/requests", "Talepler"],
  ["/dashboard/tutor/coaching/reports", "Kayıtlar"],
  ["/dashboard/tutor/coaching/complaints", "Kayıtlar"],
  ["/dashboard/tutor/coaching/earnings", "Kazançlar"],
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
  // the student complaints page both Raporlar and Destek rendered as active.
  it("does not also light Raporlar on the student complaints page", () => {
    const active = activeLabels("/dashboard/student/coaching/complaints", "student");

    assert.deepEqual(active, ["Destek"]);
    assert.equal(active.includes("Raporlar"), false);
  });

  it("keeps grouping complaints under Kayıtlar for the tutor, who has no Destek tab", () => {
    render(<CoachingSubnav currentHref="/dashboard/tutor/coaching/complaints" audience="tutor" />);

    assert.equal(screen.queryByText("Destek"), null);
    assert.equal(
      screen.getByText("Kayıtlar").closest("a")?.getAttribute("aria-current"),
      "page"
    );
  });

  it("announces the same tab it highlights", () => {
    render(
      <CoachingSubnav currentHref="/dashboard/student/coaching/complaints" audience="student" />
    );

    assert.ok(screen.getByText("Koçlukta konumun: Destek"));
  });
});

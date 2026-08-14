import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as navItemsModule from "./navItems";

type NavItemsApi = {
  getNavDescriptors?: (role: "student" | "tutor") => unknown[];
  getActiveNavIndex?: (
    descriptors: unknown[],
    pathname: string,
    searchParams: Pick<URLSearchParams, "get">
  ) => number;
  isNavRouteActive?: (
    descriptor: unknown,
    descriptors: unknown[],
    pathname: string,
    searchParams: Pick<URLSearchParams, "get">
  ) => boolean;
};

const navItems = navItemsModule as NavItemsApi;

describe("getNavDescriptors", () => {
  it("preserves the student desktop order while assigning mobile placement", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");

    assert.deepEqual(navItems.getNavDescriptors?.("student"), [
      {
        kind: "route",
        title: "Ana Sayfa",
        icon: "Home",
        href: "/home",
        mobilePlacement: "primary",
      },
      {
        kind: "route",
        title: "Hocalar",
        icon: "GraduationCap",
        href: "/tutors",
        mobilePlacement: "primary",
      },
      {
        kind: "route",
        title: "Panelim",
        icon: "LayoutDashboard",
        href: "/dashboard/student",
        mobilePlacement: "overflow",
      },
      {
        kind: "route",
        title: "Çalışma Programım",
        icon: "CalendarDays",
        href: "/schedule",
        mobilePlacement: "overflow",
      },
      { kind: "separator", mobilePlacement: "hidden" },
      {
        kind: "route",
        title: "Mesajlar",
        icon: "MessageCircle",
        href: "/messages",
        mobilePlacement: "primary",
      },
      {
        kind: "popover",
        id: "notifications",
        title: "Bildirimler",
        icon: "Bell",
        mobilePlacement: "primary",
      },
      {
        kind: "route",
        title: "Favoriler",
        icon: "Heart",
        href: "/tutors?favorites=1",
        mobilePlacement: "overflow",
      },
    ]);
  });

  it("preserves the tutor desktop order while assigning mobile primary items", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");

    assert.deepEqual(navItems.getNavDescriptors?.("tutor"), [
      {
        kind: "route",
        title: "Ana Sayfa",
        icon: "Home",
        href: "/home",
        mobilePlacement: "primary",
      },
      {
        kind: "route",
        title: "Dersler",
        icon: "GraduationCap",
        href: "/tutors",
        mobilePlacement: "primary",
      },
      {
        kind: "route",
        title: "Mesajlar",
        icon: "MessageCircle",
        href: "/messages",
        mobilePlacement: "primary",
      },
      {
        kind: "route",
        title: "Panom",
        icon: "LayoutDashboard",
        href: "/dashboard/tutor",
        mobilePlacement: "primary",
      },
      { kind: "separator", mobilePlacement: "hidden" },
      {
        kind: "popover",
        id: "notifications",
        title: "Bildirimler",
        icon: "Bell",
        mobilePlacement: "primary",
      },
    ]);
  });
});

describe("active navigation matching", () => {
  it("uses the longest matching prefix for nested student dashboard routes", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");
    assert.equal(typeof navItems.getActiveNavIndex, "function");

    const descriptors = navItems.getNavDescriptors?.("student") ?? [];
    const activeIndex = navItems.getActiveNavIndex?.(
      descriptors,
      "/dashboard/student/hedefler/deneme",
      new URLSearchParams()
    );

    assert.equal(activeIndex, 2);
  });

  it("matches the student panel when no more specific dashboard prefix applies", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");
    assert.equal(typeof navItems.getActiveNavIndex, "function");

    const descriptors = navItems.getNavDescriptors?.("student") ?? [];
    const activeIndex = navItems.getActiveNavIndex?.(
      descriptors,
      "/dashboard/student/bookings",
      new URLSearchParams()
    );

    assert.equal(activeIndex, 2);
  });

  it("activates only Favoriler for the exact favorites query special case", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");
    assert.equal(typeof navItems.getActiveNavIndex, "function");
    assert.equal(typeof navItems.isNavRouteActive, "function");

    const descriptors = navItems.getNavDescriptors?.("student") ?? [];
    const searchParams = new URLSearchParams("favorites=1");
    const activeIndex = navItems.getActiveNavIndex?.(
      descriptors,
      "/tutors",
      searchParams
    );

    assert.equal(activeIndex, 7);
    assert.equal(
      navItems.isNavRouteActive?.(
        descriptors[1],
        descriptors,
        "/tutors",
        searchParams
      ),
      false
    );
    assert.equal(
      navItems.isNavRouteActive?.(
        descriptors[7],
        descriptors,
        "/tutors",
        searchParams
      ),
      true
    );
  });

  it("keeps the ordinary tutors route active without the favorites query", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");
    assert.equal(typeof navItems.getActiveNavIndex, "function");

    const descriptors = navItems.getNavDescriptors?.("student") ?? [];
    assert.equal(
      navItems.getActiveNavIndex?.(
        descriptors,
        "/tutors/algebra-hocasi",
        new URLSearchParams()
      ),
      1
    );
  });

  it("returns no active item for an unrelated route", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");
    assert.equal(typeof navItems.getActiveNavIndex, "function");

    const descriptors = navItems.getNavDescriptors?.("tutor") ?? [];
    assert.equal(
      navItems.getActiveNavIndex?.(
        descriptors,
        "/ayarlar",
        new URLSearchParams()
      ),
      -1
    );
  });
});

describe("study schedule nav flag", () => {
  type RouteLike = { kind: string; href?: string };

  const hrefsWith = (options: Record<string, boolean>) =>
    (
      (navItems.getNavDescriptors as unknown as (
        role: string,
        options?: Record<string, boolean>
      ) => RouteLike[])("student", options) ?? []
    )
      .filter((descriptor) => descriptor.kind === "route")
      .map((descriptor) => descriptor.href);

  it("is present when the flag is not passed at all — the feature is live", () => {
    assert.equal(hrefsWith({}).includes("/schedule"), true);
  });

  it("is present when explicitly enabled", () => {
    assert.equal(hrefsWith({ scheduleEnabled: true }).includes("/schedule"), true);
  });

  it("leaves no trace when disabled", () => {
    assert.equal(hrefsWith({ scheduleEnabled: false }).includes("/schedule"), false);
  });

  it("sits after coaching when both are on", () => {
    const routes = hrefsWith({ coachingEnabled: true, scheduleEnabled: true });
    assert.equal(
      routes.indexOf("/schedule"),
      routes.indexOf("/dashboard/student/coaching") + 1
    );
  });

  it("still follows the panel when coaching is off", () => {
    const routes = hrefsWith({ scheduleEnabled: true });
    assert.equal(
      routes.indexOf("/schedule"),
      routes.indexOf("/dashboard/student") + 1
    );
  });
});

describe("study schedule nav entry", () => {
  type RouteLike = { kind: string; href?: string };

  const hrefs = (role: "student" | "tutor") =>
    (
      (navItems.getNavDescriptors as unknown as (role: string) => RouteLike[])(
        role
      ) ?? []
    )
      .filter((descriptor) => descriptor.kind === "route")
      .map((descriptor) => descriptor.href);

  it("is offered to students and sits right after their panel", () => {
    const studentHrefs = hrefs("student");

    assert.equal(studentHrefs.includes("/schedule"), true);
    assert.equal(
      studentHrefs.indexOf("/schedule"),
      studentHrefs.indexOf("/dashboard/student") + 1
    );
  });

  it("is not offered to tutors — the screen is a student's own program", () => {
    assert.equal(hrefs("tutor").includes("/schedule"), false);
  });

  it("stays active on the schedule route", () => {
    const descriptors = navItems.getNavDescriptors?.("student") ?? [];
    const activeIndex = navItems.getActiveNavIndex?.(
      descriptors,
      "/schedule",
      new URLSearchParams()
    );

    assert.equal(activeIndex, 3);
  });

  it("does not steal activation from the student panel", () => {
    const descriptors = navItems.getNavDescriptors?.("student") ?? [];
    const activeIndex = navItems.getActiveNavIndex?.(
      descriptors,
      "/dashboard/student",
      new URLSearchParams()
    );

    assert.equal(activeIndex, 2);
  });
});

describe("coaching nav entry", () => {
  type RouteLike = { kind: string; href?: string; title?: string };

  const hrefs = (role: "student" | "tutor", coachingEnabled?: boolean) =>
    (
      (navItems.getNavDescriptors as unknown as (
        role: string,
        options?: { coachingEnabled?: boolean }
      ) => RouteLike[])(role, { coachingEnabled }) ?? []
    )
      .filter((descriptor) => descriptor.kind === "route")
      .map((descriptor) => descriptor.href);

  it("is absent for tutors when coaching is disabled", () => {
    assert.equal(hrefs("tutor", false).includes("/dashboard/tutor/coaching"), false);
  });

  it("is absent when no options are passed at all", () => {
    assert.equal(hrefs("tutor").includes("/dashboard/tutor/coaching"), false);
  });

  it("appears for tutors when coaching is enabled", () => {
    assert.equal(hrefs("tutor", true).includes("/dashboard/tutor/coaching"), true);
  });

  it("sits directly after the tutor dashboard", () => {
    const routes = hrefs("tutor", true);
    const dashboardIndex = routes.indexOf("/dashboard/tutor");
    const coachingIndex = routes.indexOf("/dashboard/tutor/coaching");
    assert.equal(coachingIndex, dashboardIndex + 1);
  });

  it("never appears for students", () => {
    assert.equal(hrefs("student", true).includes("/dashboard/tutor/coaching"), false);
  });
});

describe("package requests nav entry", () => {
  type RouteLike = { kind: string; href?: string };

  const hrefs = (options?: {
    coachingEnabled?: boolean;
    packageRequestsEnabled?: boolean;
  }) =>
    (
      (navItems.getNavDescriptors as unknown as (
        role: string,
        options?: Record<string, boolean>
      ) => RouteLike[])("tutor", options) ?? []
    )
      .filter((descriptor) => descriptor.kind === "route")
      .map((descriptor) => descriptor.href);

  it("is absent by default", () => {
    assert.equal(hrefs().includes("/dashboard/tutor/requests"), false);
  });

  it("appears independently of coaching", () => {
    // A tutor with no coaching plan still gets ordinary package requests.
    const routes = hrefs({ coachingEnabled: false, packageRequestsEnabled: true });
    assert.equal(routes.includes("/dashboard/tutor/requests"), true);
    assert.equal(routes.includes("/dashboard/tutor/coaching"), false);
  });

  it("coaching appears independently of package requests", () => {
    const routes = hrefs({ coachingEnabled: true, packageRequestsEnabled: false });
    assert.equal(routes.includes("/dashboard/tutor/coaching"), true);
    assert.equal(routes.includes("/dashboard/tutor/requests"), false);
  });

  it("both sit after the tutor dashboard, coaching first", () => {
    const routes = hrefs({ coachingEnabled: true, packageRequestsEnabled: true });
    const dashboardIndex = routes.indexOf("/dashboard/tutor");
    assert.equal(routes.indexOf("/dashboard/tutor/coaching"), dashboardIndex + 1);
    assert.equal(routes.indexOf("/dashboard/tutor/requests"), dashboardIndex + 2);
  });
});

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
        title: "Öğrenme",
        icon: "Route",
        href: "/dashboard/student/learning",
        activePrefixes: ["/dashboard/student/hedefler"],
        mobilePlacement: "primary",
      },
      {
        kind: "route",
        title: "Çıkmış Sorular",
        icon: "FileQuestion",
        href: "/cikmis-sorular",
        mobilePlacement: "overflow",
      },
      {
        kind: "route",
        title: "Panelim",
        icon: "LayoutDashboard",
        href: "/dashboard/student",
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

  it("preserves the tutor desktop order while assigning five mobile primary items", () => {
    assert.equal(typeof navItems.getNavDescriptors, "function");

    assert.deepEqual(navItems.getNavDescriptors?.("tutor"), [
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
      {
        kind: "route",
        title: "Çıkmış Sorular",
        icon: "FileQuestion",
        href: "/cikmis-sorular",
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

    assert.equal(activeIndex, 4);
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

    assert.equal(activeIndex, 8);
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
        descriptors[8],
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

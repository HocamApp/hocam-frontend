import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  YS_PUBLIC_TABS,
  YS_UTILITY_ITEMS,
  getActiveYsNavItem,
  getYsAppTabs,
} from "./ysAppNav";

const noParams = new URLSearchParams();
const favourites = new URLSearchParams("favorites=1");

const labelOf = (pathname: string, params = noParams, tabs = getYsAppTabs("student", flags)) =>
  getActiveYsNavItem(tabs, pathname, params)?.label ?? null;

const flags = {
  coachingEnabled: true,
  scheduleEnabled: true,
  packageRequestsEnabled: true,
};

describe("ys app nav", () => {
  it("puts the directory on the root route, with no separate home tab", () => {
    // The old nav had "Ana Sayfa" at /home and "Hocalar" at /tutors. In this
    // shell they are one destination, and a second entry for it would be the
    // old two-destination model reintroduced by accident.
    const tabs = getYsAppTabs("student", flags);
    assert.deepEqual(
      tabs.map((t) => t.label),
      ["Hocalar", "Panelim", "Koçluk", "Çalışma Programım"],
    );
    assert.equal(tabs[0].href, "/");
  });

  it("does not leave the root tab lit on every route", () => {
    // The whole reason `exact` exists. "/" is a prefix of every path in the
    // app, so plain prefix matching would light Hocalar everywhere and the
    // strip would never tell you where you are.
    assert.equal(labelOf("/"), "Hocalar");
    assert.equal(labelOf("/messages"), null);
    assert.equal(labelOf("/schedule"), "Çalışma Programım");
  });

  it("gives the deepest match the tab rather than its parent", () => {
    assert.equal(labelOf("/dashboard/student"), "Panelim");
    assert.equal(labelOf("/dashboard/student/coaching"), "Koçluk");
    assert.equal(labelOf("/dashboard/student/coaching/program"), "Koçluk");
  });

  it("treats favourites as its own view of the root route", () => {
    // Both live at "/", so without the query arbitration the two would tie and
    // the directory tab would stay lit while the reader is in favourites.
    assert.equal(labelOf("/", favourites), null);
    assert.equal(
      getActiveYsNavItem(YS_UTILITY_ITEMS, "/", favourites)?.label,
      "Favoriler",
    );
    assert.equal(getActiveYsNavItem(YS_UTILITY_ITEMS, "/", noParams), null);
    assert.equal(
      getActiveYsNavItem(YS_UTILITY_ITEMS, "/messages", noParams)?.label,
      "Mesajlar",
    );
  });

  it("gives a tutor their own destinations", () => {
    const tabs = getYsAppTabs("tutor", flags);
    assert.deepEqual(
      tabs.map((t) => t.label),
      ["Hocalar", "Panom", "Koçluk", "Paket Talepleri"],
    );
    // Çalışma Programım is a student surface; RouteGuard would bounce a tutor
    // straight back off /schedule, so offering it would be a broken link.
    assert.equal(
      tabs.find((t) => t.href === "/schedule"),
      undefined,
    );
    assert.equal(labelOf("/dashboard/tutor/coaching", noParams, tabs), "Koçluk");
  });

  it("drops flagged-off destinations rather than showing dead tabs", () => {
    const off = getYsAppTabs("student", {
      coachingEnabled: false,
      scheduleEnabled: false,
      packageRequestsEnabled: false,
    });
    assert.deepEqual(
      off.map((t) => t.label),
      ["Hocalar", "Panelim"],
    );
  });

  it("keeps every signed-out destination anonymously reachable", () => {
    // A public strip that links into the app would bounce the visitor to
    // /login, which reads as the site being broken rather than gated.
    const guarded = ["/dashboard", "/messages", "/schedule", "/profile"];
    for (const tab of YS_PUBLIC_TABS) {
      assert.equal(
        guarded.some((prefix) => tab.href.startsWith(prefix)),
        false,
        `${tab.href} is behind auth`,
      );
    }
  });
});

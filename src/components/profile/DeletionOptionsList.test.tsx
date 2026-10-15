import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { DeletionOptionsList } from "./DeletionOptionsList";
Object.defineProperty(globalThis, "self", { value: window, configurable: true });
afterEach(cleanup);

it("paid future lessons block continuation and offer lessons and refund resolution", () => {
  render(<DeletionOptionsList blockers={[{ code: "paid_upcoming_lessons", message: "Ödenmiş derslerin var.", data: {count: 2} }]} warnings={[]} onContinue={() => assert.fail("must not continue")} upcomingLessonsHref="/lessons" />);
  assert.equal(screen.queryByRole("button", { name: "Yine de devam et" }), null);
  assert.equal(screen.getByRole("link", {name: "Derslerinizi görüntüleyin"}).getAttribute("href"), "/lessons");
  assert.equal(screen.getByRole("link", {name: "İade talebi oluştur"}).getAttribute("href"), "/profile/payments");
});

it("an unresolved payment offers status review with no deletion bypass", () => {
  render(<DeletionOptionsList blockers={[{ code: "payment_in_progress", message: "Ödemenin sonucu bekleniyor.", data: {} }]} warnings={[]} onContinue={() => assert.fail("must not continue")} upcomingLessonsHref="/lessons" />);
  assert.equal(screen.queryByRole("button", {name: "Yine de devam et"}), null);
  assert.equal(screen.getByRole("link", {name: "Süreci görüntüle"}).getAttribute("href"), "/profile/payments");
});

it("unpaid upcoming lessons remain an acknowledgeable warning", () => {
  render(<DeletionOptionsList blockers={[]} warnings={[{code:"upcoming_lessons",message:"Planlanmış derslerin var.",data:{count:1}}]} onContinue={() => {}} upcomingLessonsHref="/lessons" />);
  assert.ok(screen.getByRole("button", {name: "Yine de devam et"}));
});

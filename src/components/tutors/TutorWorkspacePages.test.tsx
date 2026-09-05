import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

const redirects: string[] = [];
let role = "tutor";
let authenticated = true;
mock.module("next/navigation", { namedExports: { useRouter: () => ({ push: (href: string) => redirects.push(href) }) } });
mock.module("next/link", { defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={String(href)} {...props}>{children}</a> });
mock.module("@/hooks/useAuth", { namedExports: { useAuth: () => ({ isAuthenticated: authenticated, isLoading: false, isStudent: role === "student", isTutor: role === "tutor", isAdmin: role === "admin", isImpersonating: false }) } });

let pages: Array<{ title: string; description: string; Page: React.ComponentType }>;
before(async () => {
  pages = [
    { title: "Takvim", description: "Derslerini ve müsaitlik saatlerini bir arada göreceğin takvim hazırlanıyor.", Page: (await import("@/app/(main)/dashboard/tutor/calendar/page")).default },
    { title: "İstatistiklerim", description: "Ders etkinliğini zaman içinde inceleyebileceğin alan hazırlanıyor.", Page: (await import("@/app/(main)/dashboard/tutor/statistics/page")).default },
  ];
});
afterEach(() => { cleanup(); role = "tutor"; authenticated = true; redirects.length = 0; });

test("workspace routes show preparation copy and a working return link, without extra landmarks", () => {
  for (const { title, description, Page } of pages) {
    const { container } = render(<Page />);
    assert.equal(screen.getAllByRole("heading", { level: 1 }).length, 1);
    assert.ok(screen.getByRole("heading", { level: 1, name: title }));
    assert.ok(screen.getByText((text) => text.startsWith(description)));
    assert.equal(screen.getByRole("link", { name: "Panoma dön" }).getAttribute("href"), "/dashboard/tutor");
    assert.equal(container.querySelectorAll("main, table, input").length, 0);
    assert.equal(screen.queryByRole("navigation"), null);
    cleanup();
  }
});

for (const audience of ["student", "anonymous", "admin"]) {
  test(`workspace routes reject ${audience} through the real RouteGuard`, () => {
    role = audience;
    authenticated = audience !== "anonymous";
    for (const { Page } of pages) {
      render(<Page />);
      assert.equal(screen.queryByRole("heading"), null);
      assert.equal(redirects.at(-1), audience === "student" ? "/dashboard/student" : audience === "admin" ? "/admin-control" : "/login");
      cleanup();
    }
  });
}

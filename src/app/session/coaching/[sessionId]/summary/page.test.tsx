import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let detail: Record<string, unknown> = {};
let Page: React.ComponentType;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("next/navigation", {
    namedExports: {
      useParams: () => ({ sessionId: "s2" }),
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
    },
  });
  mock.module("@/hooks/useAuth", {
    namedExports: { useAuth: () => ({ user: { role: "student" } }) },
  });
  mock.module("@/components/shared/RouteGuard", {
    namedExports: { RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  });
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/coaching/sessions/s2/") return { data: detail };
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

afterEach(cleanup);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>,
  );
}

const base = {
  id: "s2",
  status: "awaiting_report",
  tutor_name: "Elif Kaya",
  student_name: "Deniz",
  viewer_role: "student",
};

describe("post-session summary: the rating card", () => {
  it("asks for a rating from a student who has not rated", async () => {
    detail = { ...base, rating_submitted: false };
    renderPage();

    assert.ok(await screen.findByRole("button", { name: "Değerlendirmeyi gönder" }));
    assert.equal(screen.queryByText(/değerlendirmen alındı/), null);
  });

  it("says the rating was received instead of offering a form that would silently keep the first answer", async () => {
    detail = { ...base, rating_submitted: true };
    renderPage();

    assert.ok(await screen.findByText("Bu görüşme için değerlendirmen alındı, teşekkürler."));
    assert.equal(screen.queryByRole("button", { name: "Değerlendirmeyi gönder" }), null);
  });

  it("keeps the form when an older server does not say", async () => {
    detail = { ...base };
    renderPage();

    assert.ok(await screen.findByRole("button", { name: "Değerlendirmeyi gönder" }));
  });
});

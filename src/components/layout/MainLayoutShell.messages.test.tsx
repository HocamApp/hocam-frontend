import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, mock, test } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let pathname = "/messages/conversation-1";

mock.module("next/navigation", {
  namedExports: {
    usePathname: () => pathname,
    useRouter: () => ({ replace: () => {} }),
  },
});
mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({
      isAuthenticated: true,
      isLoading: false,
      isTutor: false,
      isAdmin: false,
      isImpersonating: false,
      user: { role: "student" },
    }),
  },
});
mock.module("@/components/layout/MobileTabBar", {
  namedExports: { MobileTabBar: () => <nav>Mobil menü</nav> },
});
mock.module("@/components/shared/EarlySupporterWelcome", {
  namedExports: { EarlySupporterWelcome: () => null },
});

let MainLayoutShell: React.ComponentType<{ children: React.ReactNode }>;

before(async () => {
  MainLayoutShell = (await import("./MainLayoutShell")).MainLayoutShell;
});

afterEach(() => cleanup());

test("message routes do not reserve the fixed mobile tab bar a second time", () => {
  pathname = "/messages/conversation-1";
  const queryClient = new QueryClient();
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <MainLayoutShell>
        <main>Konuşma</main>
      </MainLayoutShell>
    </QueryClientProvider>,
  );

  const shell = container.firstElementChild as HTMLElement;
  assert.doesNotMatch(shell.className, /pb-\[calc\(4rem/);
  assert.match(shell.className, /\[&>main\]:min-h-0/);
});

test("regular routes still reserve the fixed mobile tab bar", () => {
  pathname = "/tutors";
  const queryClient = new QueryClient();
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <MainLayoutShell>
        <main>Hocalar</main>
      </MainLayoutShell>
    </QueryClientProvider>,
  );

  const shell = container.firstElementChild as HTMLElement;
  assert.match(shell.className, /pb-\[calc\(4rem/);
});

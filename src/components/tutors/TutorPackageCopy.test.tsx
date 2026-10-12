import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { TutorProfile } from "@/types";

let TutorRequestsPage: React.ComponentType;
let TutorCapacitySettings: typeof import("./TutorCapacitySettings").TutorCapacitySettings;

before(async () => {
  mock.module("@/components/shared/RouteGuard", {
    namedExports: { RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  });
  mock.module("@/components/requests/TutorAcceptanceRequestList", {
    namedExports: { TutorAcceptanceRequestList: () => <div data-testid="requests" /> },
  });
  TutorRequestsPage = (await import("@/app/(main)/dashboard/tutor/requests/page")).default;
  ({ TutorCapacitySettings } = await import("./TutorCapacitySettings"));
});

afterEach(cleanup);

describe("what a tutor is told about packages", () => {
  it("says a new lesson package does not wait for the tutor, and where it ends up", () => {
    render(<TutorRequestsPage />);

    const text = document.body.textContent ?? "";
    assert.match(text, /Yeni ders paketleri onayını beklemez/);
    assert.match(text, /doğrudan takvimine eklenir/);
    assert.match(text, /Daha önce gelmiş ders paketi taleplerini/);
    assert.ok(screen.getByTestId("requests"));
  });

  it("says that a student about to pay holds one of the open places for a short time", () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <TutorCapacitySettings profile={{ id: "t1", open_student_slots: 3 } as TutorProfile} />
      </QueryClientProvider>
    );

    assert.match(
      document.body.textContent ?? "",
      /Ödemesini yapmak üzere olan bir öğrenci de yerlerinden birini kısa süre ayırır; ödeme tamamlanmazsa yer yeniden açılır/
    );
  });
});

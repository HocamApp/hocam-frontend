import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { TutorProfile } from "@/types";

let TutorCapacitySettings: typeof import("./TutorCapacitySettings").TutorCapacitySettings;

before(async () => {
  ({ TutorCapacitySettings } = await import("./TutorCapacitySettings"));
});

afterEach(cleanup);

describe("what a tutor is told about packages", () => {
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

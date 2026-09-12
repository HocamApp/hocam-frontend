import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { Booking } from "@/types";

let LessonHistorySection: typeof import("./LessonHistorySection").LessonHistorySection;
let LessonIssuesSection: typeof import("./LessonIssuesSection").LessonIssuesSection;
let canCancelLesson: typeof import("./CancelLessonButton").canCancelLesson;

const NOW = Date.parse("2026-09-12T09:00:00Z");

function booking(overrides: Partial<Booking> & { id: string }): Booking {
  return {
    status: "completed",
    start_time: "2026-09-01T10:00:00Z",
    duration_minutes: 40,
    subject: { id: "s1", name: "Matematik", exam_type: "TYT" },
    tutor: { id: "t1", name: "Ahmet", surname: "Yılmaz", profile_picture: "" },
    ...overrides,
  } as unknown as Booking;
}

before(async () => {
  mock.module("@/lib/serverClock", { namedExports: { serverNow: () => NOW } });
  ({ LessonHistorySection } = await import("./LessonHistorySection"));
  ({ LessonIssuesSection } = await import("./LessonIssuesSection"));
  ({ canCancelLesson } = await import("./CancelLessonButton"));
});

afterEach(() => cleanup());

describe("lesson history on the dashboard", () => {
  const many = Array.from({ length: 8 }, (_, index) =>
    booking({
      id: `b${index}`,
      subject: {
        id: index % 2 ? "s2" : "s1",
        name: index % 2 ? "Fizik" : "Matematik",
        exam_type: "TYT",
      },
      tutor: {
        id: "t1",
        name: index % 2 ? "Zeynep" : "Ahmet",
        surname: "Yılmaz",
        profile_picture: "",
      },
    } as Partial<Booking> & { id: string }),
  );

  it("shows more than the three lessons the dashboard used to cap at", () => {
    render(<LessonHistorySection bookings={many} onOpenMaterials={() => {}} />);

    assert.ok(screen.getByText("8 ders"));
    assert.equal(screen.getAllByText("İçeriği aç").length, 5);

    fireEvent.click(screen.getByRole("button", { name: "3 ders daha göster" }));
    assert.equal(screen.getAllByText("İçeriği aç").length, 8);
  });

  it("filters by tutor or subject once the list is long enough to need it", () => {
    render(<LessonHistorySection bookings={many} onOpenMaterials={() => {}} />);

    fireEvent.change(screen.getByLabelText("Geçmiş derslerde ara"), {
      target: { value: "zeynep" },
    });

    assert.equal(screen.getAllByText("Fizik").length, 4);
    assert.equal(screen.queryByText("Matematik"), null);
  });

  it("hides the search controls when every lesson already fits on screen", () => {
    render(
      <LessonHistorySection
        bookings={many.slice(0, 3)}
        onOpenMaterials={() => {}}
      />,
    );

    assert.equal(screen.queryByLabelText("Geçmiş derslerde ara"), null);
  });
});

describe("cancelled and disputed lessons", () => {
  const issues = [
    booking({ id: "c1", status: "cancelled" }),
    booking({ id: "c2", status: "disputed" }),
  ];

  it("stays closed so a long cancellation history is not the first thing seen", () => {
    render(<LessonIssuesSection bookings={issues} />);

    const toggle = screen.getByRole("button", { name: /İptal ve sorunlar/ });
    assert.equal(toggle.getAttribute("aria-expanded"), "false");
    assert.equal(screen.queryByText("Bu rezervasyon iptal edildi."), null);
  });

  it("explains each status once opened", () => {
    render(<LessonIssuesSection bookings={issues} />);

    fireEvent.click(screen.getByRole("button", { name: /İptal ve sorunlar/ }));

    assert.ok(screen.getByText("Bu rezervasyon iptal edildi."));
    assert.ok(screen.getByText("Bildirdiğin sorun ekip tarafından inceleniyor."));
  });

  it("renders nothing at all when there is no history to show", () => {
    const { container } = render(<LessonIssuesSection bookings={[]} />);
    assert.equal(container.innerHTML, "");
  });
});

describe("which lessons a student may still cancel", () => {
  const future = new Date(NOW + 48 * 3600_000).toISOString();
  const past = new Date(NOW - 3600_000).toISOString();

  it("allows an unanswered request and a confirmed future lesson", () => {
    assert.equal(
      canCancelLesson(booking({ id: "p", status: "pending", start_time: future })),
      true,
    );
    assert.equal(
      canCancelLesson(booking({ id: "c", status: "confirmed", start_time: future })),
      true,
    );
  });

  it("refuses a lesson that already started or finished", () => {
    assert.equal(
      canCancelLesson(booking({ id: "s", status: "confirmed", start_time: past })),
      false,
    );
    assert.equal(
      canCancelLesson(booking({ id: "d", status: "completed", start_time: past })),
      false,
    );
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { ScheduleEvent } from "@/types";
import { DeleteStudyBlockDialog, type DeleteScope } from "./DeleteStudyBlockDialog";

after(() => window.close());
afterEach(cleanup);

function block(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    source: "study_block",
    id: "block-1",
    local_date: "2026-08-17",
    local_time: "19:30",
    duration_minutes: 60,
    status: "planned",
    subject: null,
    title: "Soru çözümü",
    block_type: "soru_cozumu",
    completed: false,
    editable: true,
    room_url: "",
    occurrence_date: "2026-08-17",
    recurrence: "none",
    block_title: "Soru çözümü",
    ...overrides,
  };
}

describe("a one-off block", () => {
  it("is deleted outright, with no scope to choose", () => {
    const scopes: DeleteScope[] = [];
    render(
      <DeleteStudyBlockDialog
        event={block()}
        onOpenChange={() => {}}
        onConfirm={(_event, scope) => scopes.push(scope)}
      />
    );

    assert.equal(screen.queryByText("Sadece bu hafta"), null);
    assert.equal(screen.queryByText("Tüm seriyi bitir"), null);

    fireEvent.click(screen.getByText("Sil"));

    assert.deepEqual(scopes, ["single"]);
  });
});

describe("a weekly series", () => {
  const series = block({ recurrence: "weekly" });

  it("asks which of the two different things the student means", () => {
    render(
      <DeleteStudyBlockDialog
        event={series}
        onOpenChange={() => {}}
        onConfirm={() => {}}
      />
    );

    assert.ok(screen.getByText("Sadece bu hafta"));
    assert.ok(screen.getByText("Tüm seriyi bitir"));
    // The unconditional delete button belongs to the one-off case only.
    assert.equal(screen.queryByText("Sil"), null);
  });

  it("drops a single week without touching the series", () => {
    const scopes: DeleteScope[] = [];
    render(
      <DeleteStudyBlockDialog
        event={series}
        onOpenChange={() => {}}
        onConfirm={(_event, scope) => scopes.push(scope)}
      />
    );

    fireEvent.click(screen.getByText("Sadece bu hafta"));

    assert.deepEqual(scopes, ["this_occurrence"]);
  });

  it("ends the whole series when that is what was chosen", () => {
    const scopes: DeleteScope[] = [];
    render(
      <DeleteStudyBlockDialog
        event={series}
        onOpenChange={() => {}}
        onConfirm={(_event, scope) => scopes.push(scope)}
      />
    );

    fireEvent.click(screen.getByText("Tüm seriyi bitir"));

    assert.deepEqual(scopes, ["series"]);
  });

  it("names the occurrence being dropped so the choice is concrete", () => {
    render(
      <DeleteStudyBlockDialog
        event={series}
        onOpenChange={() => {}}
        onConfirm={() => {}}
      />
    );

    assert.ok(screen.getByText(/17 Ağustos · Pzt/));
  });

  it("fires once even when the confirm is double-clicked", () => {
    const scopes: DeleteScope[] = [];
    render(
      <DeleteStudyBlockDialog
        event={series}
        onOpenChange={() => {}}
        onConfirm={(_event, scope) => scopes.push(scope)}
      />
    );

    const choice = screen.getByText("Tüm seriyi bitir");
    fireEvent.click(choice);
    fireEvent.click(choice);

    // The ref latch, not the disabled prop: the second click of a real
    // double-click lands before React re-renders with isSubmitting.
    assert.deepEqual(scopes, ["series"]);
  });
});

describe("nothing selected", () => {
  it("stays closed", () => {
    render(
      <DeleteStudyBlockDialog
        event={null}
        onOpenChange={() => {}}
        onConfirm={() => {}}
      />
    );

    assert.equal(screen.queryByText("Çalışmayı sil"), null);
  });
});

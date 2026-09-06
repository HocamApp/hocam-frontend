import "@/test/setupDom";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

afterEach(cleanup);

test("workspace shell owns one page heading without nesting a second main", () => {
  const { container } = render(
    <WorkspacePageShell title="Çalışma alanı" width="wide" actions={<button>İşlem</button>}>
      <section aria-label="İçerik">Gerçek sayfa içeriği</section>
    </WorkspacePageShell>,
  );

  assert.equal(screen.getAllByRole("heading", { level: 1 }).length, 1);
  assert.ok(screen.getByRole("heading", { level: 1, name: "Çalışma alanı" }));
  assert.ok(screen.getByRole("region", { name: "İçerik" }));
  assert.ok(screen.getByRole("button", { name: "İşlem" }));
  assert.equal(container.querySelectorAll("main").length, 0);
  assert.ok(screen.getByTestId("workspace-page-header").className.includes("max-w-7xl"));
});

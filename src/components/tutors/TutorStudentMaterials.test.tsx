import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  TutorStudentMaterialsView,
  formatMaterialSize,
  validateMaterialFile,
} from "./TutorStudentMaterials";
import type { TutorStudentMaterial } from "@/types";

const material: TutorStudentMaterial = {
  id: "material-1",
  student: "student-1",
  original_name: "TYT Deneme.pdf",
  mime_type: "application/pdf",
  file_extension: "pdf",
  size_bytes: 1_572_864,
  created_at: "2026-07-22T10:00:00Z",
};

const noop = () => {};

function renderView(overrides: Partial<React.ComponentProps<typeof TutorStudentMaterialsView>> = {}) {
  return render(
    <TutorStudentMaterialsView
      materials={[]}
      isLoading={false}
      isError={false}
      isUploading={false}
      uploadProgress={0}
      deletingMaterial={null}
      isDeleting={false}
      onRetry={noop}
      onSelectFile={noop}
      onOpen={noop}
      onDownload={noop}
      onRequestDelete={noop}
      onCancelDelete={noop}
      onConfirmDelete={noop}
      {...overrides}
    />
  );
}

after(() => window.close());
afterEach(cleanup);

describe("TutorStudentMaterialsView", () => {
  it("renders loading, error, and empty states", () => {
    const first = renderView({ isLoading: true });
    assert.ok(screen.getByTestId("materials-loading"));
    first.unmount();

    const retryCalls: number[] = [];
    const second = renderView({ isError: true, onRetry: () => retryCalls.push(1) });
    fireEvent.click(screen.getByRole("button", { name: "Yeniden dene" }));
    assert.equal(retryCalls.length, 1);
    second.unmount();

    renderView();
    assert.ok(screen.getByText("Bu öğrenci için henüz materyal eklemedin."));
  });

  it("shows metadata and upload progress", () => {
    renderView({ materials: [material], isUploading: true, uploadProgress: 45 });

    assert.ok(screen.getByText("TYT Deneme.pdf"));
    assert.ok(screen.getByText("PDF · 1,5 MB"));
    assert.ok(screen.getByText("%45 yükleniyor"));
    assert.equal(screen.getByRole("button", { name: "Dosya ekle" }).hasAttribute("disabled"), true);
  });

  it("requires explicit confirmation before deleting", () => {
    const requested: string[] = [];
    const confirmed: string[] = [];
    const first = renderView({ materials: [material], onRequestDelete: (item) => requested.push(item.id) });
    fireEvent.click(screen.getByRole("button", { name: "TYT Deneme.pdf dosyasını sil" }));
    assert.deepEqual(requested, ["material-1"]);
    first.unmount();

    renderView({
      materials: [material],
      deletingMaterial: material,
      onConfirmDelete: (item) => confirmed.push(item.id),
    });
    assert.ok(screen.getByText("Bu işlem geri alınamaz."));
    assert.deepEqual(confirmed, []);
    fireEvent.click(screen.getByRole("button", { name: "Evet, sil" }));
    assert.deepEqual(confirmed, ["material-1"]);
  });
});

describe("tutor material helpers", () => {
  it("formats byte sizes and rejects unsupported or oversized files", () => {
    assert.equal(formatMaterialSize(1_572_864), "1,5 MB");
    assert.equal(
      validateMaterialFile(new File(["x"], "notes.exe", { type: "application/octet-stream" })),
      "PDF, Word, PowerPoint, Excel, metin, görsel, ses veya video dosyası seç."
    );
    const oversized = new File(["x"], "notes.pdf", { type: "application/pdf" });
    Object.defineProperty(oversized, "size", { value: 50 * 1024 * 1024 + 1 });
    assert.equal(validateMaterialFile(oversized), "Dosya 50 MB veya daha küçük olmalı.");
  });

  it("accepts a 40 MB question book and office files with an empty browser MIME", () => {
    const book = new File(["x"], "TYT Soru Bankası.pdf", { type: "application/pdf" });
    Object.defineProperty(book, "size", { value: 40 * 1024 * 1024 });
    assert.equal(validateMaterialFile(book), null);
    assert.equal(validateMaterialFile(new File(["x"], "sunum.PPTX", { type: "" })), null);
    for (const name of ["ders.mp4", "ses.m4a", "tablo.xlsx", "eski.doc", "not.txt", "foto.heic"]) {
      assert.equal(validateMaterialFile(new File(["x"], name)), null, name);
    }
    for (const name of ["sayfa.html", "logo.svg", "arsiv.zip"]) {
      assert.notEqual(validateMaterialFile(new File(["x"], name)), null, name);
    }
  });

  it("advertises the new limit and types in the panel", () => {
    renderView();
    assert.ok(screen.getByText("PDF, Word, PowerPoint, Excel, metin, görsel, ses veya video · En fazla 50 MB"));
    const input = screen.getByLabelText("Özel materyal dosyası seç");
    assert.match(input.getAttribute("accept") ?? "", /\.mp4/);
  });
});

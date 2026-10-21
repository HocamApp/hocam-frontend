import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, beforeEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import api from "@/lib/api";
import type { TutorStudentMaterial } from "@/types";
import { TutorStudentMaterialsView } from "./TutorStudentMaterials";
import { TutorStudentNotes } from "./TutorStudentNotes";

/**
 * The tutor's private notes and materials: one frame, the new coaching language
 * (ink band, count, who sees it; solid gold row actions; plain red delete), and a
 * bare form of the same content for a row that already names it. Behaviour (create,
 * edit, delete, retry, per-student isolation) is covered in TutorClassroom.test.tsx
 * and TutorStudentMaterials.test.tsx; this file holds what the restyle promises.
 */

const NOTE = { id: "n-1", content: "Türev tekrar edilecek", created_at: "2026-10-20T10:00:00Z", updated_at: "2026-10-20T10:00:00Z" };
const MATERIAL: TutorStudentMaterial = {
  id: "m-1",
  student: "student-1",
  original_name: "TYT Deneme.pdf",
  mime_type: "application/pdf",
  file_extension: "pdf",
  size_bytes: 1_572_864,
  created_at: "2026-07-22T10:00:00Z",
};
const CAPTION = "Yalnızca sana görünür; öğrenciyle paylaşılmaz.";

let notes: unknown[];
let client: QueryClient;

beforeEach(() => {
  notes = [NOTE];
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  api.defaults.adapter = async (config) => {
    const url = config.url ?? "";
    const data = url.includes("tutor-student-notes") ? notes : [];
    return { config, data, status: 200, statusText: "OK", headers: {} };
  };
});
afterEach(() => {
  cleanup();
  client.clear();
});
after(() => window.close());

function renderNotes(props: Partial<React.ComponentProps<typeof TutorStudentNotes>> = {}) {
  return render(
    <QueryClientProvider client={client}>
      <TutorStudentNotes studentId="student-1" {...props} />
    </QueryClientProvider>,
  );
}

const noop = () => {};
function renderMaterials(overrides: Partial<React.ComponentProps<typeof TutorStudentMaterialsView>> = {}) {
  return render(
    <TutorStudentMaterialsView
      materials={[MATERIAL]}
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
    />,
  );
}

describe("the tutor's private notes", () => {
  it("sit in a card with an ink band that names them, counts them and says who sees them", async () => {
    renderNotes();

    const card = await screen.findByRole("region", { name: "Özel notlarım" });
    const heading = within(card).getByRole("heading", { name: "Özel notlarım" });
    assert.ok(heading.closest(".bg-ink"), "the heading sits on an ink band");
    assert.ok(await within(card).findByText("1 not"));
    assert.ok(within(card).getByText(CAPTION));
  });

  it("give a row's actions as a solid gold Düzenle and a plain red Sil, and add with a solid gold Not ekle", async () => {
    renderNotes();

    await screen.findByText(NOTE.content);
    const edit = screen.getByRole("button", { name: "Notu düzenle" });
    assert.match(edit.className, /bg-gold/);
    assert.equal(edit.textContent, "Düzenle");
    const remove = screen.getByRole("button", { name: "Notu sil" });
    assert.match(remove.className, /bg-danger/);
    assert.equal(remove.textContent, "Sil");
    assert.match(screen.getByRole("button", { name: "Not ekle" }).className, /bg-gold/);
    assert.ok(screen.getByText(NOTE.content).closest("li"), "each note is a row of a list");
  });

  it("say there are none in plain words, not in a dashed box", async () => {
    notes = [];
    renderNotes();

    const empty = await screen.findByText(/Bu öğrenci için henüz notun yok/);
    assert.ok(!/border-dashed/.test(empty.className));
    assert.ok(!/border-dashed/.test(empty.parentElement?.className ?? ""));
  });

  it("drop the card, the band and the caption when the row they sit in already names them", async () => {
    renderNotes({ bare: true });

    await screen.findByText(NOTE.content);
    assert.ok(screen.getByRole("textbox", { name: "Yeni özel not" }));
    assert.equal(screen.queryAllByRole("heading").length, 0);
    assert.equal(screen.queryAllByRole("region").length, 0);
    assert.equal(screen.queryAllByText(CAPTION).length, 0);
    assert.equal(screen.queryAllByText("1 not").length, 0);
  });

  it("keep scrolling in the room's narrow panel", async () => {
    renderNotes({ compact: true });

    await screen.findByText(NOTE.content);
    assert.match(screen.getByRole("list").className, /max-h-48/);
    assert.match(screen.getByRole("list").className, /overflow-y-auto/);
  });
});

describe("the tutor's private materials", () => {
  it("sit in a card with an ink band that names them, counts them and says who sees them", () => {
    renderMaterials();

    const card = screen.getByRole("region", { name: "Materyallerim" });
    assert.ok(within(card).getByRole("heading", { name: "Materyallerim" }).closest(".bg-ink"));
    assert.ok(within(card).getByText("1 dosya"));
    assert.ok(within(card).getByText(CAPTION));
  });

  it("add with a solid gold Dosya ekle, open and download with solid gold row buttons, delete with plain red", () => {
    renderMaterials();

    assert.match(screen.getByRole("button", { name: "Dosya ekle" }).className, /bg-gold/);
    assert.match(screen.getByRole("button", { name: "TYT Deneme.pdf dosyasını aç" }).className, /bg-gold/);
    assert.match(screen.getByRole("button", { name: "TYT Deneme.pdf dosyasını indir" }).className, /bg-gold/);
    assert.match(screen.getByRole("button", { name: "TYT Deneme.pdf dosyasını sil" }).className, /bg-danger/);
    assert.ok(screen.getByText("TYT Deneme.pdf").closest("li"), "each file is a row of a list");
  });

  it("say there are none in plain words, not in a dashed box, and show no count while loading or failed", () => {
    const empty = renderMaterials({ materials: [] });
    const text = screen.getByText("Bu öğrenci için henüz materyal eklemedin.");
    assert.ok(!/border-dashed/.test(text.className));
    assert.ok(within(screen.getByRole("region", { name: "Materyallerim" })).getByText("0 dosya"));
    empty.unmount();

    const loading = renderMaterials({ isLoading: true });
    assert.equal(screen.queryAllByText(/\d+ dosya/).length, 0);
    loading.unmount();

    renderMaterials({ isError: true });
    assert.equal(screen.queryAllByText(/\d+ dosya/).length, 0);
  });

  it("drop the card, the band and the caption when the row they sit in already names them", () => {
    renderMaterials({ bare: true });

    assert.ok(screen.getByText("TYT Deneme.pdf"));
    assert.ok(screen.getByRole("button", { name: "Dosya ekle" }));
    assert.equal(screen.queryAllByRole("heading").length, 0);
    assert.equal(screen.queryAllByRole("region").length, 0);
    assert.equal(screen.queryAllByText(CAPTION).length, 0);
  });

  it("keep scrolling in the room's narrow panel", () => {
    renderMaterials({ compact: true });

    assert.match(screen.getByRole("list").className, /max-h-56/);
  });

  it("ask before deleting with a plain red Evet, sil and a quiet Vazgeç", () => {
    renderMaterials({ deletingMaterial: MATERIAL });

    assert.match(screen.getByRole("button", { name: "Evet, sil" }).className, /bg-danger/);
    assert.match(screen.getByRole("button", { name: "Vazgeç" }).className, /hover:bg-paper/);
  });
});

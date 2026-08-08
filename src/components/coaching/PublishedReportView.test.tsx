import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PublishedReportView } from "./PublishedReportView";

after(() => window.close());
afterEach(cleanup);

describe("PublishedReportView", () => {
  it("renders only the immutable latest published revision content", () => {
    render(
      <PublishedReportView
        revision={{
          id: "revision-2",
          report_id: "report-1",
          revision_number: 2,
          source_draft_version: 4,
          published_at: "2026-08-08T10:00:00Z",
          change_note: "Hedefler güncellendi.",
          content: {
            short_summary: "Son görüşmenin yayınlanmış özeti",
            topics_discussed: "Fonksiyonlar",
            student_progress: "İstikrarlı ilerleme",
            next_priorities: "Problem çözme",
            study_recommendations: "Her gün 20 soru",
            focus_until_next_meeting: "Yanlış defteri",
          },
        }}
      />
    );

    assert.ok(screen.getByText("Son görüşmenin yayınlanmış özeti"));
    assert.ok(screen.getByText("Hedefler güncellendi."));
    assert.equal(screen.queryByText("Değişmemiş taslak"), null);
  });

  it("uses authorised attachment metadata instead of a raw storage URL", () => {
    const downloads: string[] = [];
    render(
      <PublishedReportView
        onDownloadAttachment={(attachmentId) => downloads.push(attachmentId)}
        revision={{
          id: "revision-2",
          report_id: "report-1",
          revision_number: 2,
          source_draft_version: 4,
          published_at: "2026-08-08T10:00:00Z",
          change_note: null,
          content: {
            short_summary: "Özet",
            topics_discussed: "Konu",
            student_progress: "İlerleme",
            next_priorities: "Öncelik",
            study_recommendations: "Öneri",
            focus_until_next_meeting: "Odak",
            recommended_resources: [
              {
                title: "Fonksiyon föyü",
                attachment: {
                  id: "attachment-1",
                  original_name: "fonksiyonler.pdf",
                  mime_type: "application/pdf",
                },
              },
            ],
          },
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "fonksiyonler.pdf" }));
    assert.deepEqual(downloads, ["attachment-1"]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTutorSubjectLabels } from "./tutorSubjectLabels";

describe("buildTutorSubjectLabels", () => {
  it("renders exam and subject together in stable exam order", () => {
    const labels = buildTutorSubjectLabels([
      { id: "4", name: "Matematik", exam_type: "AYT" },
      { id: "2", name: "Fizik", exam_type: "TYT" },
      { id: "3", name: "Matematik", exam_type: "TYT" },
      { id: "1", name: "Fizik", exam_type: "AYT" },
    ]);

    assert.deepEqual(
      labels.map((item) => item.label),
      ["TYT Fizik", "TYT Matematik", "AYT Fizik", "AYT Matematik"]
    );
  });

  it("deduplicates normalized final labels instead of ids", () => {
    const labels = buildTutorSubjectLabels([
      { id: "1", name: "Matematik", exam_type: "TYT" },
      { id: "2", name: "  matematik  ", exam_type: "tyt" },
    ]);

    assert.deepEqual(labels.map((item) => item.label), ["TYT Matematik"]);
  });

  it("falls back to the subject when exam or level data is absent", () => {
    const labels = buildTutorSubjectLabels([
      { id: "1", name: "Fizik", exam_type: null },
    ]);

    assert.deepEqual(labels.map((item) => item.label), ["Fizik"]);
  });
});

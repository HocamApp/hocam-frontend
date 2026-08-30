import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

function source(relativePath: string) {
  return fs.readFileSync(path.resolve(root, relativePath), "utf-8");
}

describe("removed question system", () => {
  it("does not ship question runtime modules or UI", () => {
    const removedPaths = [
      "src/lib/questionsApi.ts",
      "src/components/questions/QuestionLibrary.tsx",
      "src/components/questions/LessonQuestionPanel.tsx",
      "src/components/questions/useLessonQuestionSession.ts",
      "src/components/tutorial/MockQuestionPanel.tsx",
      "src/app/(main)/cikmis-sorular/page.tsx",
      "src/app/(main)/cikmis-sorular/[id]/page.tsx",
      "src/app/(main)/dashboard/student/learning/yanlis-sorular/page.tsx",
    ];

    for (const relativePath of removedPaths) {
      assert.equal(fs.existsSync(path.resolve(root, relativePath)), false, relativePath);
    }
  });

  it("removes question controls and API paths from live lesson surfaces", () => {
    const liveSession = source("src/app/session/[bookingId]/page.tsx");
    const materials = source("src/components/lessons/LessonMaterialsDialog.tsx");
    const lessonApi = source("src/lib/lessonsApi.ts");
    const profileApi = source("src/lib/profileApi.ts");
    const apiTypes = source("src/types/api.ts");

    for (const text of [liveSession, materials, lessonApi, profileApi]) {
      assert.doesNotMatch(text, /question-session|question-performance|booking-questions/);
    }
    assert.doesNotMatch(liveSession, /Canlı soru|LessonQuestion/);
    assert.doesNotMatch(materials, /çözülmüş sorular|Derste çözülmüş sorular/);
    assert.doesNotMatch(apiTypes, /solved_question/);
  });

  it("keeps the tutorial at nine steps without a question target", () => {
    const tutorial = source("src/lib/liveLessonTutorialSteps.ts");
    const mock = source("src/components/tutorial/MockLessonScreen.tsx");

    assert.doesNotMatch(tutorial, /live-question|control-question/);
    assert.doesNotMatch(mock, /live-question|control-question|MockQuestionPanel|Canlı soru/);
  });
});

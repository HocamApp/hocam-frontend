import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/home/TutorAuthenticatedHome.tsx"),
  "utf8",
);

test("authenticated tutor home uses canonical workspace routes", () => {
  assert.doesNotMatch(source, /dashboard\/tutor\?tab=(availability|students|earnings|reviews|packages)/);
  for (const href of [
    "/dashboard/tutor/calendar",
    "/dashboard/tutor/classroom",
    "/dashboard/tutor/statistics?tab=income&amp;period=30",
    "/dashboard/tutor/statistics?tab=reviews&amp;period=90",
  ]) {
    assert.ok(source.includes(href.replaceAll("&amp;", "&")), `missing ${href}`);
  }
});

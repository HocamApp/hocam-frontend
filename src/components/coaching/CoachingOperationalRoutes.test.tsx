import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTES = [
  ["src/app/(main)/dashboard/tutor/coaching/upcoming/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/students/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/reports/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/complaints/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/time-requests/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/reschedule-requests/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/service-periods/[servicePeriodId]/program/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/sessions/[id]/prepare/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/tutor/coaching/sessions/[id]/report/page.tsx", "tutor"],
  ["src/app/(main)/dashboard/student/coaching/page.tsx", "student"],
  ["src/app/(main)/dashboard/student/coaching/upcoming/page.tsx", "student"],
  ["src/app/(main)/dashboard/student/coaching/program/page.tsx", "student"],
  ["src/app/(main)/dashboard/student/coaching/reports/page.tsx", "student"],
  ["src/app/(main)/dashboard/student/coaching/schedule/page.tsx", "student"],
  ["src/app/(main)/dashboard/student/coaching/complaints/page.tsx", "student"],
] as const;

describe("Coaching operational route shells", () => {
  it("keeps every operational page inside a location-aware Coaching shell", () => {
    for (const [file, audience] of ROUTES) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.match(source, /<CoachingPageShell/, `${file} must use the Coaching shell`);
      assert.match(source, /currentHref=/, `${file} must identify its Coaching location`);
      assert.match(source, new RegExp(`audience=["']${audience}["']`), `${file} must use the ${audience} subnav`);
    }
  });

  it("uses the composed empty-state component instead of generic record-not-found UI", () => {
    const EMPTY_ROUTES = ROUTES.filter(([file]) => !file.includes("sessions/") && !file.includes("service-periods/") && !file.endsWith("/upcoming/page.tsx"));
    for (const [file] of EMPTY_ROUTES) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      assert.match(source, /CoachingEmptyState|<EmptyState/, `${file} must use the Coaching empty state`);
    }
  });
});

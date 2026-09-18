import assert from "node:assert/strict";
import test from "node:test";

import robots from "@/app/robots";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
import {
  cleanSeoText,
  fetchPublicTutor,
  jsonLdStringify,
  tutorFullName,
  tutorSeoDescription,
} from "@/lib/seo";
import {
  isBlockedByRobots,
  PRIVATE_CRAWL_PATHS,
  PUBLIC_CRAWL_EXAMPLES,
} from "@/lib/seoRoutes";
import {
  directoryFiltersFromRecord,
  homeDirectoryCanonical,
  homeDirectoryMetadata,
  parseDirectoryPage,
  tutorDirectoryQueryKey,
} from "@/lib/directorySeo";
import type { TutorProfile } from "@/types";

const tutor: TutorProfile = {
  id: "tutor-1",
  user: "user-1",
  name: "Ada",
  surname: "Yılmaz",
  profile_picture: "",
  intro_video_url: "",
  bio: "Matematiği adım adım anlatırım.",
  university: "Boğaziçi Üniversitesi",
  department: "Matematik",
  yks_rank: 1250,
  hourly_price: 600,
  rating: 4.9,
  total_reviews: 12,
  is_verified: true,
  is_public: true,
  teaching_styles: ["foundations_patient"],
  is_online: true,
  subjects: [
    {
      id: "subject-1",
      name: "Matematik",
      exam_type: "TYT",
    },
  ],
  created_at: "2026-07-01T12:00:00Z",
};

test("SEO text helpers produce stable, truthful profile copy", () => {
  assert.equal(tutorFullName(tutor), "Ada Yılmaz");
  assert.match(tutorSeoDescription(tutor), /TYT Matematik özel ders/);
  assert.match(tutorSeoDescription(tutor), /1\.250/);
  assert.equal(cleanSeoText("  çok   boşluk  "), "çok boşluk");
});

test("JSON-LD serialization cannot close the script element", () => {
  const serialized = jsonLdStringify({
    description: "</script><script>alert(1)</script>",
  });
  assert.equal(serialized.includes("</script>"), false);
  assert.match(serialized, /\\u003c\/script>/);
});

test("public tutor fetch distinguishes a missing profile from an API outage", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(null, { status: 404 });
    assert.equal(await fetchPublicTutor("missing-tutor"), null);

    globalThis.fetch = async () => new Response(null, { status: 503 });
    await assert.rejects(
      fetchPublicTutor("temporarily-unavailable"),
      /Public API request failed with 503/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("robots exposes public pages while protecting account and lesson routes", () => {
  const result = robots();
  const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
  assert.equal(rules?.allow, "/");
  assert.ok(
    Array.isArray(rules?.disallow) && rules.disallow.includes("/dashboard")
  );
  assert.ok(
    Array.isArray(rules?.disallow) && rules.disallow.includes("/session")
  );
  assert.match(String(result.sitemap), /\/sitemap\.xml$/);
  assert.deepEqual(rules?.disallow, [...PRIVATE_CRAWL_PATHS]);
  for (const path of PUBLIC_CRAWL_EXAMPLES) {
    assert.equal(isBlockedByRobots(path), false, `${path} must remain crawlable`);
  }
  assert.equal(isBlockedByRobots("/tutor/setup"), true);
  assert.equal(isBlockedByRobots("/tutors/public-tutor-id"), false);
});

test("directory pages share query keys and indexing policy", () => {
  const filters = directoryFiltersFromRecord({
    exam_type: "TYT",
    subject: "Matematik",
    page: "2",
  });
  assert.deepEqual(filters, { exam_type: "TYT", subject: "Matematik" });
  assert.deepEqual(tutorDirectoryQueryKey(filters, 2), ["tutors", filters, 2]);
  assert.equal(parseDirectoryPage("invalid"), 1);
  assert.equal(parseDirectoryPage("999999"), 100);

  const pageTwo = homeDirectoryMetadata({ page: "2" });
  assert.equal(pageTwo.alternates, undefined);
  assert.equal(
    homeDirectoryCanonical({ page: "2" }),
    "https://www.hocamozelders.com/?page=2",
  );
  assert.deepEqual(pageTwo.robots, { index: true, follow: true });

  const filtered = homeDirectoryMetadata({ subject: "Matematik", page: "2" });
  assert.equal(
    homeDirectoryCanonical({ subject: "Matematik", page: "2" }),
    "https://www.hocamozelders.com/",
  );
  assert.deepEqual(filtered.robots, { index: false, follow: true });

  const gated = homeDirectoryMetadata({ page: "3" });
  assert.equal(
    homeDirectoryCanonical({ page: "3" }),
    "https://www.hocamozelders.com/",
  );
  assert.deepEqual(gated.robots, { index: false, follow: true });

  assert.equal(
    directoryFiltersFromRecord({ search: "x".repeat(200) }).search?.length,
    80,
  );

  const campaign = homeDirectoryMetadata({ utm_source: "newsletter" });
  assert.equal(
    homeDirectoryCanonical({ utm_source: "newsletter" }),
    "https://www.hocamozelders.com/",
  );
  assert.deepEqual(campaign.robots, { index: true, follow: true });
});

test("llms.txt is plain text, factual, and excludes private URLs", async () => {
  const response = getLlmsTxt();
  const body = await response.text();
  assert.match(response.headers.get("content-type") || "", /^text\/plain/);
  assert.match(body, /Doğrulanmış hocaları incele/);
  assert.match(body, /Hesap, mesajlaşma, rezervasyon/);
  assert.equal(body.includes("/dashboard"), false);
});

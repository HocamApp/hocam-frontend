import assert from "node:assert/strict";
import test from "node:test";

import robots from "@/app/robots";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
import {
  cleanSeoText,
  jsonLdStringify,
  tutorFullName,
  tutorSeoDescription,
} from "@/lib/seo";
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
});

test("llms.txt is plain text, factual, and excludes private URLs", async () => {
  const response = getLlmsTxt();
  const body = await response.text();
  assert.match(response.headers.get("content-type") || "", /^text\/plain/);
  assert.match(body, /Doğrulanmış hocaları incele/);
  assert.match(body, /Hesap, mesajlaşma, rezervasyon/);
  assert.equal(body.includes("/dashboard"), false);
});

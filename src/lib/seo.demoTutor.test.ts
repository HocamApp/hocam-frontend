import assert from "node:assert/strict";
import test from "node:test";

import { fetchPublicTutor } from "./seo";
import type { TutorProfile } from "@/types";

const ibrahim: TutorProfile = {
  id: "728ab84a-01dd-47ad-8b4b-2aec211d0679",
  user: "user-ibrahim",
  name: "İbrahim",
  surname: "Koç",
  profile_picture: "old.jpg",
  intro_video_url: "",
  bio: "ODTÜ Matematik öğrencisiyim.",
  university: "Orta Doğu Teknik Üniversitesi",
  department: "Matematik",
  yks_rank: 490,
  hourly_price: 1070,
  rating: 4.9,
  total_reviews: 38,
  is_verified: true,
  is_public: true,
  teaching_styles: [],
  is_online: false,
  subjects: [],
  created_at: "2026-07-01T12:00:00Z",
};

test("server-fetched demo tutor matches the public card presentation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(ibrahim), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  try {
    const tutor = await fetchPublicTutor(ibrahim.id);
    assert.deepEqual(
      tutor && {
        name: tutor.name,
        surname: tutor.surname,
        image: tutor.profile_picture,
      },
      {
        name: "Nazlı",
        surname: "Koç",
        image: "/images/tutors/demo-woman-4.jpg",
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

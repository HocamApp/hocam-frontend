/**
 * Proves the /tutors and /home retirement did not take the dynamic tutor
 * routes with it.
 *
 * Run against a server: `npm run check:routes` with `npm run dev` up, or
 * `ROUTE_CHECK_BASE_URL=https://… npm run check:routes` against a deployment.
 *
 * Why a script and not a unit test: `next/experimental/testing/server` — the
 * utility that can evaluate a `redirects()` config in isolation — does not
 * exist in Next 14.2. The redirect only becomes real when a server routes a
 * request, so the only honest check is to make requests. The config's *shape*
 * is unit-tested separately in `src/app/nextConfigRedirects.test.ts`.
 */

const BASE = process.env.ROUTE_CHECK_BASE_URL ?? "http://localhost:3000";

type Check = { label: string; path: string; expect: "migrated" | "untouched" };

/*
 * The two "untouched" rows carry the weight here. They deliberately do NOT
 * assert 200: a made-up id is a legitimate 404, and checkout may answer with
 * an auth redirect. Asserting 200 would make the test fail for reasons that
 * have nothing to do with the migration and pass only where a real fixture
 * happens to exist.
 *
 * The invariant that matters is narrower and exact: these paths must not be
 * swallowed by the directory redirect. Anything the underlying route says for
 * itself is fine.
 */
const SAMPLE_TUTOR_ID = "d4c3fa5d-3b99-45b1-b964-7a496a3dc56b";

const CHECKS: Check[] = [
  { label: "eski dizin", path: "/tutors", expect: "migrated" },
  { label: "eski dizin + favoriler", path: "/tutors?favorites=1", expect: "migrated" },
  { label: "eski dizin + arama", path: "/tutors?search=matematik", expect: "migrated" },
  { label: "eski girişli ana sayfa", path: "/home", expect: "migrated" },
  { label: "hoca profili", path: `/tutors/${SAMPLE_TUTOR_ID}`, expect: "untouched" },
  {
    label: "hoca profili ödeme",
    path: `/tutors/${SAMPLE_TUTOR_ID}/checkout`,
    expect: "untouched",
  },
  {
    label: "koçluk ödeme",
    path: `/tutors/${SAMPLE_TUTOR_ID}/checkout/coaching`,
    expect: "untouched",
  },
];

function migrationTargetOf(status: number, location: string | null): string | null {
  if (status !== 307 && status !== 308) return null;
  if (!location) return null;
  const path = location.startsWith("http") ? new URL(location).pathname : location;
  // Only a redirect that lands on the root, query and all, is this migration.
  // An auth bounce to /login is a different mechanism and not our business.
  return path === "/" || path.startsWith("/?") ? location : null;
}

async function main() {
  const failures: string[] = [];

  for (const check of CHECKS) {
    const res = await fetch(`${BASE}${check.path}`, { redirect: "manual" });
    const location = res.headers.get("location");
    const migrated = migrationTargetOf(res.status, location);

    if (check.expect === "migrated") {
      if (!migrated) {
        failures.push(
          `${check.label}: ${check.path} -> ${res.status} ${location ?? "(yönlendirme yok)"}`
        );
        continue;
      }
      // The query has to survive. A page-level redirect() would drop it, and
      // `?favorites=1` pointing at an unfiltered directory is a silent bug
      // rather than a visible one.
      const sentQuery = check.path.includes("?") ? check.path.split("?")[1] : "";
      const gotQuery = migrated.includes("?") ? migrated.split("?")[1] : "";
      if (sentQuery !== gotQuery) {
        failures.push(
          `${check.label}: query kayboldu — gönderilen "${sentQuery}", gelen "${gotQuery}"`
        );
        continue;
      }
      console.log(`  ok  ${check.label.padEnd(24)} ${check.path} -> ${migrated} (${res.status})`);
    } else {
      if (migrated) {
        failures.push(
          `${check.label}: ${check.path} göç yönlendirmesine yakalandı -> ${migrated}`
        );
        continue;
      }
      console.log(
        `  ok  ${check.label.padEnd(24)} ${check.path} -> ${res.status}, göçe yakalanmadı`
      );
    }
  }

  if (failures.length > 0) {
    console.error("\nBAŞARISIZ:");
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
  }
  console.log(`\n${CHECKS.length} kontrolün hepsi geçti (${BASE}).`);
}

main().catch((error) => {
  console.error(`${BASE} adresine ulaşılamadı:`, error instanceof Error ? error.message : error);
  process.exit(1);
});

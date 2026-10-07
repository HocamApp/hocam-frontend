/**
 * Fails the build while any homepage fact is still `TODO`.
 *
 * `ysHomeFacts.ts` marks every sentence the owners have not settled yet (price
 * range, commission, payout timing, policy answers, company details) with the
 * `TODO` sentinel. In development those render as `[label]`; this check is
 * what stops one from reaching production.
 *
 * Runs as `prebuild`, and only matters when the rebuilt homepage is in the
 * build: with NEXT_PUBLIC_HOME_V2 off, `/` renders the pre-rebuild homepage,
 * none of these facts are on it, and the check passes. With the flag on it
 * fails unless `ALLOW_HOME_TODOS=1`, which Vercel Preview sets so the rebuild
 * can be reviewed. Production sets neither variable.
 *
 *   npx tsx scripts/check-home-facts.ts
 */
import * as facts from "../src/components/yemeksepeti/ysHomeFacts";
import { homeV2EnabledFromEnv } from "../src/lib/featureFlags";

if (!homeV2EnabledFromEnv(process.env.NEXT_PUBLIC_HOME_V2)) {
  console.log("check-home-facts: NEXT_PUBLIC_HOME_V2 is off, the rebuilt homepage is not in this build.");
  process.exit(0);
}

const todos = Object.entries(facts)
  .filter(([name, value]) => name !== "TODO" && facts.isTodo(value))
  .map(([name]) => name);

if (todos.length === 0) {
  console.log("check-home-facts: every homepage fact is decided.");
  process.exit(0);
}

const allowed = process.env.ALLOW_HOME_TODOS === "1";
const header = `check-home-facts: ${todos.length} homepage fact(s) still TODO in src/components/yemeksepeti/ysHomeFacts.ts:`;
const list = todos.map((name) => `  - ${name}`).join("\n");

if (allowed) {
  console.warn(`${header}\n${list}\nALLOW_HOME_TODOS=1, continuing. Do not promote this build to production.`);
  process.exit(0);
}

console.error(`${header}\n${list}\nNEXT_PUBLIC_HOME_V2 is on. Fill them in, or set ALLOW_HOME_TODOS=1 for a non-production build.`);
process.exit(1);

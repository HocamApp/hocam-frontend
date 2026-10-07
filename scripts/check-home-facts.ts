/**
 * Fails the build while any homepage fact is still `TODO`.
 *
 * `ysHomeFacts.ts` marks every sentence the owners have not settled yet (price
 * range, commission, payout timing, policy answers, company details) with the
 * `TODO` sentinel. In development those render as `[label]`; this check is
 * what stops one from reaching production.
 *
 * Runs as `prebuild`. Set `ALLOW_HOME_TODOS=1` to skip it: CI and Vercel
 * Preview builds do, so work in progress can still be reviewed. Never set it
 * on the Vercel Production environment.
 *
 *   npx tsx scripts/check-home-facts.ts
 */
import * as facts from "../src/components/yemeksepeti/ysHomeFacts";

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

console.error(`${header}\n${list}\nFill them in, or set ALLOW_HOME_TODOS=1 for a non-production build.`);
process.exit(1);

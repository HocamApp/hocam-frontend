/**
 * Builds a before/after HTML review board for the V3 visual polish.
 *
 * Pairs the baseline captures in `screenshots/home-v3-baseline/` with the new
 * captures in `screenshots/home-v3-review/` and writes
 * `screenshots/home-v3-review/index.html`. Run after home-v3-review-shots.ts:
 *
 *   npx tsx scripts/home-v3-review-board.ts
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASELINE_DIR = path.join(ROOT, "screenshots", "home-v3-baseline");
const REVIEW_DIR = path.join(ROOT, "screenshots", "home-v3-review");

/** Baseline file -> review file(s) that continue the same capture. */
const PAIRS: Array<{ title: string; before: string; after: string }> = [
  {
    title: "Ana sayfa — populated, desktop (baseline 1280px / v3 1440px)",
    before: "home_populated__desktop.png",
    after: "home_populated__1440.png",
  },
  {
    title: "Ana sayfa — populated, mobil (baseline 375px / v3 390px)",
    before: "home_populated__mobile.png",
    after: "home_populated__390.png",
  },
  {
    title: "Ana sayfa — empty, desktop (baseline 1280px / v3 1440px)",
    before: "home_empty__desktop.png",
    after: "home_empty__desktop.png",
  },
  {
    title: "Ana sayfa — empty, mobil (baseline 375px / v3 390px)",
    before: "home_empty__mobile.png",
    after: "home_empty__mobile.png",
  },
];

const RESPONSIVE = ["390", "768", "1024", "1440"];
const DETAILS = ["explore", "goals", "teacher-card"];

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const reviewFiles = new Set(await readdir(REVIEW_DIR));
  const baselineFiles = new Set(await readdir(BASELINE_DIR));

  const sections: string[] = [];

  sections.push(`<h2>Önce / Sonra</h2>`);
  for (const pair of PAIRS) {
    const hasBefore = baselineFiles.has(pair.before);
    const hasAfter = reviewFiles.has(pair.after);
    sections.push(`<section>
  <h3>${esc(pair.title)}</h3>
  <div class="pair">
    <figure>${hasBefore ? `<img src="../home-v3-baseline/${pair.before}" loading="lazy">` : "<p>baseline yok</p>"}<figcaption>Önce</figcaption></figure>
    <figure>${hasAfter ? `<img src="${pair.after}" loading="lazy">` : "<p>yeni capture yok</p>"}<figcaption>Sonra</figcaption></figure>
  </div>
</section>`);
  }

  sections.push(`<h2>Responsive (populated)</h2>`);
  for (const vp of RESPONSIVE) {
    const file = `home_populated__${vp}.png`;
    sections.push(`<section>
  <h3>${vp}px</h3>
  ${reviewFiles.has(file) ? `<img class="full" src="${file}" loading="lazy">` : "<p>capture yok</p>"}
</section>`);
  }

  sections.push(`<h2>Detay kırpımlar (1440px)</h2>`);
  for (const detail of DETAILS) {
    const file = `detail_${detail}__1440.png`;
    sections.push(`<section>
  <h3>${esc(detail)}</h3>
  ${reviewFiles.has(file) ? `<img class="full" src="${file}" loading="lazy">` : "<p>capture yok</p>"}
</section>`);
  }

  const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hocam — Home V3 görsel inceleme panosu</title>
<style>
  :root { color-scheme: light; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; background: #f6f6f4; color: #1c1917; }
  header { padding: 24px 32px 8px; }
  main { padding: 0 32px 48px; max-width: 1600px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0; }
  h2 { font-size: 16px; margin: 32px 0 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #57534e; }
  h3 { font-size: 14px; margin: 0 0 8px; }
  section { margin-bottom: 28px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  figure { margin: 0; }
  figcaption { font-size: 12px; color: #57534e; padding: 6px 2px; }
  img { width: 100%; height: auto; display: block; background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; }
  img.full { max-width: 1100px; }
  .meta { font-size: 13px; color: #57534e; margin-top: 4px; }
</style>
</head>
<body>
<header>
  <h1>Hocam ana sayfa — V3 görsel polish inceleme panosu</h1>
  <p class="meta">Üretim: ${new Date().toISOString()} — branch: feature/homepage-visual-polish-v3</p>
</header>
<main>
${sections.join("\n")}
</main>
</body>
</html>`;

  const out = path.join(REVIEW_DIR, "index.html");
  await writeFile(out, html);
  console.log(`wrote ${out}`);
}

main();

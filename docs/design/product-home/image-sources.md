# Home V3 — Image Sources

Every photograph used by the V3 homepage visual polish, with its verified
source. Files live under `public/images/home-v3/` and are referenced from
`src/components/home/homeShowcaseContent.ts`.

- **Platform:** [Pexels](https://www.pexels.com) (unless noted otherwise)
- **License basis:** [Pexels License](https://www.pexels.com/license/) — free to
  use and modify for commercial and non-commercial purposes, no attribution
  required, no permission needed. Creator names are recorded here anyway.
- **Verification:** each asset page was opened and the creator name and
  `images.pexels.com/photos/<id>` file were confirmed before download. Pexels
  blocks direct page fetches with HTTP 403, so pages were read through a
  reader proxy or, where that also failed, an archived Wayback Machine
  snapshot of the exact asset page; the CDN files themselves were fetched
  directly from `images.pexels.com` and every final file was visually
  reviewed after download.
- **Optimization (all files):** center-cropped to 4:3, resized to 1200×900,
  JPEG quality 82, progressive + Huffman-optimized. Served through
  `next/image`, so the browser receives an appropriately sized variant.

## Explore — "Sınav hedeflerini keşfet"

| Card | File | Creator | Source page | Subject |
|---|---|---|---|---|
| TYT Matematik | `explore/tyt-matematik.jpg` | MART PRODUCTION | https://www.pexels.com/photo/a-student-doing-homework-8472944/ | Öğrenci defterine matematik notları yazıyor; cetvel, pergel ve hesap makinesi masada |
| AYT Matematik | `explore/ayt-matematik.jpg` | Vitaly Gariev | https://www.pexels.com/photo/close-up-of-complicated-equations-written-on-a-blackboard-22690748/ | Kara tahtada el yazısı ileri matematik (integral, sin x/x) |
| Geometri | `explore/geometri.jpg` | Tima Miroshnichenko | https://www.pexels.com/photo/close-up-photo-of-a-diagram-with-drawing-compass-6615086/ | Çizim pergeli ve geometrik diyagram yakın çekim |
| Paragraf / Türkçe | `explore/paragraf.jpg` | Pixabay | https://www.pexels.com/photo/pile-of-books-159866/ | Üst üste açık kitaplar, sıcak tonlar |
| Fizik | `explore/fizik.jpg` | RF._.studio | https://www.pexels.com/photo/photo-of-person-deriving-formula-on-white-board-3825462/ | Beyaz tahtada formül türeten öğrenci |
| KPSS Matematik | `explore/kpss-matematik.jpg` | RDNE Stock project | https://www.pexels.com/photo/student-answering-his-examination-7092334/ | Sınav salonunda sınav kağıdı cevaplayan öğrenci |
| DGS Sayısal | `explore/dgs-sayisal.jpg` | Karolina Kaboompics | https://www.pexels.com/photo/blackboard-with-handwritten-calculations-6256066/ | Kara tahtada el yazısı trigonometri ve geometri hesaplamaları |
| Çıkmış sorular | `explore/cikmis-sorular.jpg` | Kindel Media | https://www.pexels.com/photo/a-close-up-shot-of-paper-clipped-documents-7054757/ | Ataçlarla gruplanmış doküman yığını, arşiv hissi |

## Goals — "Hedefine göre ilerle"

| Card | File | Creator | Source page | Subject |
|---|---|---|---|---|
| Tıp hedefleyenler | `goals/tip.jpg` | Tima Miroshnichenko | https://www.pexels.com/photo/stethoscope-and-notebook-on-desk-5407246/ | Ahşap masada steteskop, spiral defter ve gözlük flat-lay |
| Mühendislik isteyenler | `goals/muhendislik.jpg` | Tima Miroshnichenko | https://www.pexels.com/photo/person-people-building-desk-6615235/ | Teknik çizimler, blueprint, pergel ve iletki ile çalışma masası |
| Hukuk hedefleyenler | `goals/hukuk.jpg` | Sora Shimazaki | https://www.pexels.com/photo/close-up-photo-of-wooden-gavel-5668473/ | Yargıç tokmağı, masa ve dosya klasörleri |
| Öğretmenlik hedefi | `goals/ogretmenlik.jpg` | Repo asset (existing) | `public/images/home/blackboard.jpg` (in-repo) | Kara tahta başında ders anlatan öğretmen — projenin mevcut görseli yeniden kullanıldı |

## Rejected candidates

- **tip PRIMARY (Pınar Türkmen, photo 8621905)** — verified, but the
  handwritten notes in frame are prominently readable English; replaced with
  the backup above.
- **ayt-matematik first pick (photo 6238297)** — asset page could not be
  opened (Cloudflare challenge), creator unverifiable; replaced with 22690748.
- **dgs-sayisal first pick (Pixabay, photo 220301)** — prominent Casio brand
  close-up, reads as a brand shot; rejected on review.
- **dgs-sayisal alternate (Kampus Production, photo 7799574)** — jigsaw
  puzzle, off-topic for numerical reasoning.
- **dgs-sayisal alternate (Nataliya Vaitkevich, photo 6863180)** — finance
  flat-lay with readable "TAXES" lettering; off-topic and English text.
- Several portrait-orientation candidates (8617870, 8472938, 5238080,
  1132577, 3150555, 4069090, 4737237, 9617896, 8470810, 5582599, 5668882,
  5669619) were verified but rejected on orientation — they crop poorly to
  4:3.

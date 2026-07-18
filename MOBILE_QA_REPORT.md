# Mobile-10 QA Raporu

Ölçüm + minimum-değişiklik düzeltme paketi. Branch: `agent/mobile-10-qa`.
Ölçümler: production build (`next build` + `next start`), mobil form-factor.
**Önemli sınır:** Lighthouse **masaüstü Chrome** (headless, mobil emülasyon) ile alındı;
auth-arkası sayfalar **oturumsuz** ölçüldü (RouteGuard fallback'i dahil olabilir). Gerçek
iOS Safari doğrulaması için `MOBILE_QA_CHECKLIST.md`.

---

## 1. Responsive overflow (`npm run responsive:check`)

**Önce:** `/tutors` her viewport'ta yatay taşma (mobile 378>375, tablet 771>768, desktop 1283>1280).
**Neden:** `FavoriteButton` tooltip'i (`absolute left-1/2 -translate-x-1/2 whitespace-nowrap`,
`opacity-0` gizli olsa da layout genişliği veriyor) en sağdaki kartta viewport'u ~3px aşıyordu.
**Düzeltme:** `/tutors` içerik sarmalayıcısına `overflow-x-clip` (scroll-container oluşturmaz,
sticky/bottom-sheet etkilenmez; masaüstünde 3px `px-4` padding içinde kaldığı için görünür
tooltip kesilmez, mobilde tooltip zaten dokunmada görünmez).
**Sonra:** tüm sayfalar × 3 viewport **0 FAIL**. Tekil kontrol: hoca profili de temiz.

## 2. Lighthouse mobil — Performance + Accessibility

| Sayfa | Perf | A11y (önce→sonra) | LCP | CLS | TBT |
|---|---|---|---|---|---|
| `/` (login) | 75 | 94 → **100** | 3.8s | **0.199** | 240ms |
| `/home` | 84 | 90 → 100* | 4.5s | 0 | 0ms |
| `/tutors` | 74 | 100 | 5.7s | 0.023 | 240ms |
| hoca profili | 78 | 97 → 100* | 5.7s | 0.003 | 110ms |

*Login bileşenleri (contrast + `<main>`) paylaşıldığı için diğer auth-render'lı sayfalar da
düzelmeden faydalanır; root'ta 100 doğrulandı.

**Uygulanan ucuz A11y düzeltmeleri:**
- `color-contrast`: auth ince-yazı `text-neutral-500` → `text-neutral-400` (koyu `neutral-950`
  panel üzerinde kontrast artışı) — `GoogleSignInButton.tsx`.
- `landmark-one-main`: `AuthSplitScreen` form sütunu `<section>` → `<main>` (login/kayıt/reset
  ekranlarına tek `main` landmark).

**LCP > 2.5s (tüm sayfalar):** localhost + `simulate` throttling LCP'yi şişirir; gerçek CDN/
prod'da daha düşük beklenir. Ana ağırlıklar: `unused-css-rules` (~16KB), `unused-javascript`
(~30KB). Ucuz kazanç sınırlı; kod-bölme/route-level lazy-load ayrı iş.

**CLS 0.199 yalnız login'de:** Lighthouse tekil shift-element atfetmedi → muhtemelen web-font
swap veya `BrandMark` logo/`LoginBrandAnimation` yüklenirken reflow. Ucuz-ve-kesin düzeltme
tespit edilemedi (kör değişiklik riskli); "Sonraki adımlar"a taşındı.

## 3. Dokunma hedefi denetimi (<44px)

**Düzeltildi (kesin, düşük risk):**
- `FavoriteButton` kalp ikonu 32×32 → görsel aynı, `::after -inset-1.5` ile hit-area 44px.
- Sayfalama butonları (`SlidingPagination`) 38-41×40 → `min-h-11 min-w-11` (44px).

**Listelendi, kasıtlı düzeltilmedi (spec/altyapı gerekçesi):**
- Sıralama chip'leri & "Profili Gör" CTA: h36 — WCAG 2.5.8 **AA (≥24px) geçiyor**, 44px AAA
  hedefinin altında. Paylaşılan `Button` boyutunu değiştirmek tüm uygulamayı+masaüstünü
  etkiler = "büyük refactor" kapsamı; önerilere taşındı.
- Kart içi metin linkleri (puan/fiyat, h20-28): kart yüksekliğini bozmadan 44px yapılamaz;
  kartın tamamı zaten "Profili Gör" ile tıklanabilir.
- Login: `rememberMe` checkbox 16px ama `<label py-3>` sarmalı → gerçek hedef ~40px+ (sorun yok).
  "Hesap oluştur" cümle-içi metin link → WCAG 2.5.8 **inline istisnası** (sorun yok).

## 4. iOS Safari checklist
`MOBILE_QA_CHECKLIST.md` yazıldı (dvh, 16px input-zoom, safe-area, momentum/scroll-lock,
hover-dokunma, medya/CLS, regresyon). Arda iPhone + iPad'de dolduracak.

---

## Kalan bilinen sorunlar
1. **Login CLS 0.199** — kaynak kesinleşmedi (font swap / logo reflow şüphesi).
2. **LCP tüm sayfalarda > 2.5s** (localhost-şişme payı var; gerçek prod'da doğrulanmalı).
3. **h36 dokunma hedefleri** (sıralama chip'leri, "Profili Gör") 44px altında ama AA-uyumlu.
4. **Profil sayfası** ikon-butonları (`size-9`=36) ve `amber-500/10` üzerine amber rozet metni:
   Lighthouse contrast/size uyarısı; oturumlu ölçüm gerektirir (bu pass'te oturumsuz ölçüldü).
5. Ölçümler oturumsuz — auth-arkası gerçek içerik metrikleri eksik.

## Önerilen sonraki adımlar
1. **CLS avı (login):** `next/font` ile self-host + `display: swap` yerine `optional`/preload;
   `BrandMark` logo'ya sabit `width/height`; video kabına `aspect-ratio` rezervasyonu. Sonra
   gerçek cihazda ölç.
2. **Oturumlu Lighthouse:** auth cookie enjekte edip (`--extra-headers`) `/dashboard/student`,
   `/tutors`, `/profile`, `/messages` gerçek metriklerini al.
3. **Bundle küçültme:** `unused-javascript`/`unused-css` için route-level dynamic import;
   `blackboard.jpg` → `next/image` + AVIF/WebP + doğru `sizes`.
4. **Dokunma hedefi kararı:** `Button` `sm`/`icon` varyantlarını mobilde 44px'e çıkarmak
   isteniyorsa ayrı, kapsamı net bir PR (masaüstü regresyonu test edilerek).
5. **Profil contrast/hedef** maddelerini oturumlu ölçümle doğrulayıp düzelt.
6. `responsive-check.ts` PAGES listesine hoca profili + `/messages` + `/profile` ekleyip
   CI'da koşmayı değerlendir (kalıcı overflow koruması).

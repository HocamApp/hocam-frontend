# Rebrand + app shell — devir notu

Bu belge `experiment/hocam-rebrand` dalında yapılan işi devralacak kişi (veya ajan) için
yazıldı. Amacı ne yapıldığını listelemek değil — onu `git log` zaten söylüyor — **neden öyle
yapıldığını ve kodu okuyarak görülemeyecek tuzakları** aktarmak.

**Son commit:** `e1bc931` · **28 commit** · çalışma ağacı temiz.

---

## 0 · Dal ve merge hedefi

```
main
 └── experiment/yemeksepeti-homepage     ← MERGE HEDEFİ
      └── experiment/hocam-rebrand       ← burada çalışıyoruz
```

⚠️ **`main`'e merge edilmeyecek.** Beğenilirse `experiment/yemeksepeti-homepage` üstüne
gider. Bu kural sahibi tarafından açıkça konuldu.

Yerel kurulum:

```bash
cd Hocam_frontend_yemeksepeti && npm run dev
```

`.env.local` production Railway API'sine bakıyor (yerel Django'ya değil — yerel sqlite'ta
sadece 1 hoca profili var, ekran doldurmaz). İçinde ayrıca
`NEXT_PUBLIC_COACHING_ENABLED=true` var; olmadan Koçluk sekmesi bayrakla kapanıp kayboluyor.

---

## 1 · Bağlayıcı kaynaklar, öncelik sırasıyla

1. **Sahibinin o anki talimatı.** DESIGN.md'yi ezer. Bunun canlı bir örneği var: bildirim
   kartları (§6) referans tasarımın emoji'lerini ve dört hex rengini kullanıyor, DESIGN.md
   ikisini de yasakladığı halde. Bu bilinçli, dosyanın başında yazıyor, **geri "düzeltilmeyecek".**
2. **`AI_AGENT_RULES.md`** (repo kökü) — ödeme/checkout kuralları ve "bu bug değil, kasıtlı"
   listesi.
3. **`/Users/ardagg/Desktop/DESIGN.md`** — renk, tipografi, radius, elevation, ikon, layout,
   kopya. 806 satır. Repoda değil, masaüstünde.
4. **`docs/current-product-and-technical-state.md`** — güncel ürün yönü.

### DESIGN.md'den en sık kırılan kurallar

| Kural | Neden önemli |
|---|---|
| Altın **yüzeydir, asla yazı rengi değil** | `#FFD100` kağıt üstünde ~1.6:1 |
| Tint dolgu + aynı tonda doygun yazı **yasak** | `bg-red-100/text-red-700` deseni |
| Rozet ya dolu+ters yazı, ya outline, ya **kapsayıcısız** | üçüncü seçenek çoğu zaman doğrusu |
| Gölge sadece **gerçekten havada duran** şeye | akıştaki kart gölge almaz |
| Uyarı rengi **yok** — uyarılar mürekkep | palet 3 ton + nötr ile sınırlı |
| Emoji, em dash, ünlem **yasak** | (bildirimlerde sahibi bunu ezdi) |
| Sayfa **asla saf beyaz değil** | `--paper` tuval, `--white` üstüne oturan |
| `sen`, her yerde | 15-18 yaş, akran güvenilirliği |
| Para birimi **sayıdan sonra**: `240 ₺` | prototiplerin hepsi ters yapmıştı |

---

## 2 · Mimari: tek layout, tek navbar instance

**Bu dalın en önemli tek kararı.** Kabuk `src/app/(main)/layout.tsx` tarafından render
ediliyor ve **başka hiçbir yerde**.

Sebep, Next.js dokümanından: *"On navigation, layouts preserve state, remain interactive,
and do not rerender"* ve *"routes outside of the group will not share the layout."*

İlk kurgu navbar'ı hem `src/app/page.tsx`'ten hem layout'tan render ediyordu. `/` `(main)`'in
dışında olduğu için bu **aynı bileşenin iki ayrı instance'ı** demekti — `/` → `/dashboard`
geçişinde biri unmount olup diğeri mount oluyordu. Düzeltme tek dosya taşımasıydı:

```
src/app/page.tsx  →  src/app/(main)/page.tsx
```

`(main)` zaten kabuk grubuydu; kabuksuz kalması gerekenler (`(auth)`, `(checkout)`,
`hoca-bul`, `kvkk`, `session`, `tutor/tutorial`) çoktan dışındaydı. Kırk rotayı yeni bir
gruba taşımaya gerek yoktu.

**Kabul kriteri (kanıtlandı):** navbar aramasına commit etmeden yaz, `/` → `/dashboard/student`
→ `/messages` gez, taslak hayatta kalıyor **ve input aynı DOM düğümü**. Mount sayacı
kullanma — `reactStrictMode` Next 14'te varsayılan açık, effect'leri çift çalıştırıp yanıltır.

### Zincirleme sonuçlar

- Kök adres `(main)`'in yan etkilerini devraldı: `TutorActivationGate`, `MainLayoutShell`,
  `MobileTabBar`, `PresenceHeartbeat`, `AccountDeletionBanner`.
  ⚠️ **Doğrulanmamış hoca artık pazarlama sayfasını göremiyor** — kapı onu
  `/tutor/onboarding`'e atıyor. Bilinçli.
- Navbar `<MainLayoutShell>`'in **üstünde kardeş** kalmalı. Shell, doğrulanmamış hoca
  yönlendirilirken tüm alt ağaç için `null` dönüyor; içine konursa header da kaybolur.
- Arama ve favoriler prop yerine URL'den yürüyor (`/?search=`, `/?favorites=1`).

---

## 3 · Kodu okuyarak bulunamayacak tuzaklar

Hepsi bu dalda gerçekten kırıldı ve düzeltildi.

**`.ys-root` namespace.** `src/styles/yemeksepeti.css` başta tamamen `.ys-root` altındaydı ve
iki iş yapıyordu: `--ys-*` token'larını *tanımlamak* ve sayfayı *boyamak*. Token'lar `:root`'a
çıkarıldı, boya `.ys-root`'ta kaldı. Boyayı `:root`'a çıkarmak 80+ sayfayı iki temada da
yeniden boyar ve `body`'yi ezerdi.

**CSS import sırası yük taşıyor.** `yemeksepeti.css` `src/app/layout.tsx`'te `globals.css`'ten
hemen **sonra** import ediliyor. `.ys-from-md`'nin Tailwind'in `hidden`'ını yenmesi buna bağlı.
Test: kayıt pili 375px'te gizli, 1280'de görünür olmalı.

**`bg-ink text-white` karanlık temada çöküyor.** "Koyu pil, açık yazı" diye okunur ama
`--ink` karanlıkta *açık* değerdir — beyaz üstüne beyaz olur. Doğru eşleşme `text-paper`;
`--ink`'in her iki temada da gerçek zıddı odur. On satır böyle düzeltildi.

**`bg-white` iki temalı sistemde çalışmaz.** Literal. Rebrand edilmiş yüzeyler `bg-surface`
kullanıyor (`--surface` token'ı). İstisnalar bilerek literal: pembe bandın üstündeki pil ve
promo başlığındaki çip — bant iki temada da pembe, onlar ters çevrilmiş primary, kart değil.

**`useSearchParams` sınırsızsa build'i kırar,** degrade etmez —
`missing-suspense-with-csr-bailout`. İki okuyucu var: layout'taki navbar ve
`YsTutorDirectory`. İkisi de `<Suspense>` içinde. Sınırı hook'un yanına koymak ana sayfayı
`○ (Static)` olarak prerender edilebilir tutuyor.

**Sunucu component'i client-only modül import edemez.** `YsFooter`'da `"use client"` yoktu;
hep bir client component'ten çağrıldığı için gizli kalmıştı. Sunucu layout'undan çağrılınca
`@phosphor-icons/react`'in `createContext`'i patladı, rota 500 verdi.

**`height: 100%` ebeveyne bağlıdır.** `.ys-tab`'a yazdım; üst satır `align-items: center`
olduğu için şerit içeriğe büzülüyor ve yüzde 56 yerine **21px**'e çözülüyordu — alt çizgi
yazının dibine yapıştı. Token'ı doğrudan oku: `height: var(--app-header-row-2-h)`.

**Alt dize çakışması.** `l-earning_plan_proposed` içinde "earning" geçiyor; para kuralı onu
yakalayıp altın boyuyordu. `_earning` kullanılıyor artık, testi var. **Bunu kodu okuyarak
değil, 26 tipin hepsini bir ızgarada render ederek buldum.**

**Rota var görünüp 404 dönebilir.** İlk public sekme seti `/rehber` ve `/cikmis-sorular`'a
bakıyordu; ilkinin kendi sayfası yok, ikincisi kapılı. `ysAppNav.test.ts` artık her public
href'i **çalışan sunucuya soruyor** — dosya sistemi kontrolü ikisinden birini kaçırırdı.

**`_` ile başlayan klasör rota olmaz.** Next.js onları private sayıyor. Geçici sahne
`__notif-preview` adıyla 404 verdi; `zz-notif-preview` çalıştı.

**Dev sunucusu ayaktayken `.next` silinmez.** Sunucu o klasörden çalışıyor, altından
çekilince her rota 404 döner. Build almadan önce sunucuyu durdur.

**Tarayıcı paneli rAF'ı donduruyor.** Claude Browser panelinde `document.hidden = true`
kalıyor, CSS animasyonları ve rAF ilerlemiyor (ölçüldü: 1864ms duvar saati, 0 kare). Görsel
doğrulama için **Playwright MCP** kullan.

---

## 4 · Kabuk (navbar + footer)

**Dosyalar:** `src/components/yemeksepeti/YsNavbar.tsx`, `YsNavIcons.tsx`, `ysAppNav.ts`,
`YsFooter.tsx`.

Prop almıyor. Auth, rota ve bayraklardan türeyen her şeyi içeriden okuyor — tek instance'ın
layout'ta yaşayabilmesinin sebebi bu.

**Dört durum:** `loading` (iskelet, giriş butonu **değil**), `anon`, `app`, `admin`.
Admin'e öğrenci sekmeleri verilemez — `RouteGuard` onu `/admin-control`'e geri fırlatır;
impersonation istisnası var.

**Sekme seti `ysAppNav.ts`'te, `navItems.ts`'te değil.** Eski set "Ana Sayfa `/home`" +
"Hocalar `/tutors`" diye iki hedef açıyor; yeni sitede bunlar **tek şey** — kök adres hem
ana sayfa hem hoca listesi. `navItems.ts`'e dokunulmadı ki `navItems.test.ts` yeşil kalsın ve
eski kabuk geri çağrılabilir olsun.

⚠️ **Hocalar sekmesi `exact: true`.** href'i `/`, yani uygulamadaki her yolun öneki — önek
eşleşmesi onu her sayfada yakardı.

**İkonlar:** Mesajlar `/messages`, Bildirimler (popover), Favoriler `/?favorites=1`. Navbar
içinde `useFavorites()` **çağrılmıyor** — bir kalbi boyamak için her sayfada `/favorites/`
isteği atmak olurdu.

**Header yüksekliği tek token:** `--app-header-h` (`globals.css`). Navbar satır
yüksekliklerini token'dan *alıyor*, yani token geometrinin sebebi, kopyası değil. Altı yer
onu çıkarıyor (`/messages` ×2, `MainLayoutShell`, `(main)/layout`, `dashboard/tutor/edit`
sticky başlık). `md` altında şerit gizli, header tek satır.

Mobilde alt `MobileTabBar` kalıyor, üstteki şerit gizleniyor — ikisi birden aynı menüyü iki
yere koyardı.

---

## 5 · Dark tema

DESIGN.md'de dark mode **yok**, "open decisions"da bile geçmiyor. Türetildi, uygulanmadı.

Dokümanın kendi elevation ilkesi yolu veriyor: *"in-flow yüzeyler değer farkı + saç teli
çizgiyle ayrışır"*. Tersine çevir: koyu tuval, bir değer açık kart, bir değer daha açık
çizgi. Material'ın elevation-by-tint'i ve Linear'ın yüzey rampası da aynı yere varıyor.

`globals.css` `.dark` bloğunda: `--paper #0f1719`, `--surface #182225`, `--line #2a3639`,
`--ink #ece6e6`, `--ink-mid #9baaac`. Pembe ve altın dokunulmadı — koyu üstünde tutuyorlar ve
zaten kendi mürekkepleriyle yüzey olarak kullanılıyorlar.

Ölçülen kontrastlar: aktif sekme 13.2:1, pasif sekme 6.8:1, footer linki 7.4:1 (eski slate
değerlerinde ~2.4:1 idi), gövde 7.6:1.

**Kapsam:** kabuk + kök sayfa. 55 dosyadaki mevcut `dark:` varyantları zaten çalışıyor;
sayfa zeminlerinin kağıda geçmesi ayrı iş.

---

## 6 · Bildirimler — DESIGN.md'nin bilinçli olarak ezildiği yer

**Dosyalar:** `src/components/shared/notificationAppearance.ts`,
`NotificationPopoverContent.tsx`, `src/components/ui/animated-list.tsx`.

Sahibi Magic UI'ın animated-list bileşenini verdi ve **olduğu gibi kullanılmasını** istedi.
İlk denemede DESIGN.md'den geçirdim (Phosphor ikonlar, üç tonlu palet) — reddedildi, iki kez.

Şimdi referansın kendi emoji'leri ve hex'leri kullanılıyor:

| İkon | Renk | Aile |
|---|---|---|
| 💬 | `#FF3D71` | mesaj, konuşma |
| 💸 | `#00C9A7` | paket, iade, kazanç |
| 👤 | `#FFB800` | ders talebi |
| 🗞️ | `#1E86FF` | ders, koçluk, plan + **fallback** |
| ✅ | `#22C55E` | onay, kabul, tamamlandı *(eklendi)* |
| ⚠️ | `#FF5630` | iptal, itiraz, arıza *(eklendi)* |

Son ikisi referansta yok, aynı dilde üretildi.

**Eşleme isme değil aileye göre.** Backend **57 ayrı tip** üretiyor ve her sürümde birkaç
ekliyor; birebir tablo bir ayda bayatlar. Sıra önemli — itiraz da `coaching_*`, iptal de
`booking_*`, o yüzden sorunlu durumlar önce.

**`AnimatedList` sarmalayıcısı kullanılmıyor,** `AnimatedListItem` kullanılıyor. Sarmalayıcı
çocukları interval'le teker teker gösterip başa sarıyor — pazarlama demosu için doğru, gerçek
bildirim listesinde zamanlayıcıyla damlatma olur.

`animated-list.tsx` verildiği gibi duruyor, tek fark `type: "spring" as const` — framer-motion
v12 onu literal union olarak tipliyor.

**Mekanikler hiç değişmedi:** iyimser önbellek, sayaç yeniden hesabı, hata geri alma, derin
linkler ve **mesaj gövdesini maskeleyen gizlilik kuralı** (`CLAUDE.md`'de bağlayıcı).

---

## 7 · Eski adresler ve SEO

`/tutors` ve `/home` emekli. Sayfaları silindi, adresler `next.config.js`'te `/`'e
yönlendiriliyor.

⚠️ **`source` tam eşleşme olmalı.** `/tutors/:path*` her hoca profilini ve altındaki
checkout'u ana sayfaya gönderir. Bu, bu değişikliğin ürünü çökertebileceği tek yol.

⚠️ **Yönlendirme config'de olmalı, sayfa içi `redirect()` ile değil.** Next config
redirect'leri orijinal query'yi olduğu gibi geçiriyor (`resolve-routes.ts`,
`appendParamsToQuery: false`); sayfa içi olan geçirmiyor. `/tutors?favorites=1`'in
`/?favorites=1` olarak varması buna bağlı.

**Kalıcılık:** `permanent: process.env.VERCEL_ENV === "production"`. Preview'de 307 (308
tarayıcıda agresif cache'lenir, hata geri alınsa bile yönlendirmeye devam eder), production'da
308 (eski URL'in arama değerini yeni rotaya taşıyan sinyal budur).

**Taşınan SEO:** `sitemap.ts` artık `/` gönderiyor, canonical + OG + Service JSON-LD kök
sayfada, `llms.txt` güncellendi, kök sayfanın `noindex`'i kaldırıldı.

**`(main)/tutors/layout.tsx` silinmeden önce sınıflandırıldı** — o layout `/tutors/[id]`'yi de
sarıyordu. Profil kendi title/canonical/OG/robots'unu kuruyor, prefetch edilen anahtarları
(`["tutors"]`, `["subjects"]`) hiç okumuyor. Kaybettiği tek şey her profilde basılan Service
JSON-LD bloğu — bilinçli düzeltme. `<head>` diff'i alınarak doğrulandı.

**İki katman doğrulama:**
- `src/app/nextConfigRedirects.test.ts` — config şeklini koruyor (wildcard yok, production
  dışında kalıcı değil)
- `npm run check:routes` — çalışan sunucuya soruyor; `next/experimental/testing/server`
  Next 14.2'de yok

---

## 8 · Doğrulama

```bash
npx tsc --noEmit && npm run lint && npm run test:unit
npm run check:routes     # dev sunucusu ayaktayken
npm run build            # dev sunucusu KAPALIYKEN
```

**Testler: 727 geçiyor, 6 kalıyor.** Altısı bu daldan **önceki** bir commit'ten:
`formatPrice` DESIGN.md'ye göre `₺400` → `400 ₺` yapıldı, testler hâlâ eski biçimi bekliyor.
Kapsam dışı bırakıldı, hâlâ açık.

**Görsel doğrulama Playwright MCP ile.** Oturum gerektiren yüzeyler (bildirim popover'ı,
profil menüsü) için fikstürlerle geçici bir rota kurup bakıp silme deseni kullanıldı.

---

## 9 · Açık kalanlar

**Production readiness gate — go-live'ı bloklar, geliştirmeyi bloklamaz.** Git bunların
hiçbirini kanıtlayamaz; kanıtlanamayan hiçbir şey "güvenli" varsayılmaz:

| Panel | Ne kontrol edilecek |
|---|---|
| Vercel | proje ayarlarında elle tanımlı redirect/rewrite var mı |
| Google Search Console | `/tutors` için sitemap, kaldırma talebi, indeks durumu |
| iyzico | panelde tanımlı callback/return URL (kodda entegrasyon yok) |
| Google Cloud | OAuth authorized redirect URI origin seviyesinde mi |

**Ayrı ürün kararı bekleyen mevcut SEO hatası:** `src/app/robots.ts` `Disallow: /tutor`
yazıyor. robots.txt önek eşleşmesi yaptığı için bu `/tutors/<id>`'yi de kapsıyor görünüyor —
aynı anda `sitemap.ts` o URL'leri gönderirken. Hoca profillerinin indekslenmesi isteniyorsa
daraltılmalı; istenmiyorsa sitemap'in onları göndermeyi bırakması gerekiyor. **Bu göçün sebep
olmadığı bir durum, bilerek dahil edilmedi.**

**Ayrı iş olarak öneriliyor:**
- Koçluk checkout'u `(main)`'de, normal checkout `(checkout)`'ta → biri markalı kabukla,
  diğeri minimal header'la açılıyor. Ödeme akışlarının navigasyondan arınması standart.
- 170 dosya hâlâ Lucide import ediyor, ~80 sayfa eski token'larda
- `navItems.ts` + `MobileTabBar` hâlâ eski nav modelinde; eski navbar dosyaları "artık mount
  edilmiyor" notuyla duruyor, üçü birlikte silinmeli
- Testimonial'lar gerçek öğrenci değil (DESIGN.md md.12 çatışması, sahibi tutmayı seçti)
- *"Ders ücreti piyasanın 3'te 1'i"* — elimizde piyasa verisi yok, karşılaştırmalı reklam
  iddiası. Sahibine bildirildi, kullanılmasına o karar verdi.

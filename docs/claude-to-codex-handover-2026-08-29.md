# Claude → Codex devir raporu

**Tarih:** 29 Ağustos 2026
**Kapsam:** Çalışma programı takvimi, favoriler sayfası, ana sayfa hero galerisi ve bölüm sırası, giriş promosyonu
**Önce okunacak belgeler:** [`DESIGN.md`](../../DESIGN.md) (repo kökünün bir üstünde, `~/Desktop/DESIGN.md`), [`docs/rebrand-handover.md`](./rebrand-handover.md)

Bu dosya sohbet geçmişini değil **kod durumunu** devrediyor. Aşağıdaki her madde
çalışan koda karşılık geliyor; hiçbir yerde "şunu düşünmüştük" yok.

---

## 1. Depo durumu

- Dal: `main`. `origin/main`'in **6 commit önünde**, çalışma ağacı temiz.
- `codex/checkout-design-md` dalı main'e merge edildi (`b84c36e`), sonra
  `origin/main`'in 19 commitlik KVKK/HttpOnly-auth işi de merge edildi (`9c4d19e`).
  İkisi de push edildi.
- Push edilmemiş 6 commit:

```
a0a5f87 chore: stop tracking Impeccable's local hook cache
139dd5d fix: drop the promo's second dismiss button
19cece7 fix: let the redrawn promo reach people who dismissed the old one
525e868 feat: open the entry promo on engagement, and redraw it
024ebdd refactor: put the tutor list straight under the hero
afbb9db feat: turn a ring of campuses beside the hero headline
```

**Push kararı kullanıcıya ait.** Her seferinde önce `git fetch` çek: bu depoya
başka ajanlar da push ediyor, bir kez 19 commit geriye düştük.

---

## 2. Bu turda ne yapıldı

### 2.1 Çalışma programı takvimi (`src/components/schedule/`)

- **Bloklar artık saat satırının içinde.** Eskiden dakika bazlı `absolute` konum +
  süreye orantılı yükseklik vardı; 01:58 başlayan bir ders 02:00 çizgisini kesiyordu.
  Günlük ve haftalık görünüm artık saat başına bir satır çiziyor, blok başladığı
  saatin hücresine giriyor. Aynı saatte iki şey varsa yan yana sütuna bölünmüyor,
  hücrede alt alta diziliyor ve satır büyüyor.
- **`dayLayout.ts` ve testi silindi.** Sütun paketleme mantığı artık kullanılmıyor.
  `visibleHourWindow` `scheduleDates.ts`'e taşındı. `package.json`'daki `test:unit`
  listesinden de çıkarıldı.
- **Kartlar dolu renkli, beyaz yazılı, 10px köşeli.** Ders/koçluk eskiden outline
  (bg-surface + 4px renkli kenar) idi. Artık hepsi dolu. "Ders, öğrencinin kendi
  yazdığı bloğa benzemesin" kuralını **dolgu taşımıyor**; üç taşıyıcı var ve
  `scheduleTheme.test.ts` bunları test ediyor:
  1. mezuniyet külahı / koçluk kilidi ikonu
  2. "Hocam Dersi" / "Koçluk Görüşmesi" yazısı
  3. checkbox, düzenle ve sil butonlarının hiç olmaması
- İçerik sırası: isim üstte, altında saat aralığı, altında tür etiketi.
  Hover'da kart büyüyor + gölge alıyor, dar hücrede tür yazısı açılıyor.

### 2.2 Favoriler (`/favoriler`)

- Yeni route: `src/app/(main)/favoriler/page.tsx` + `YsFavoritesPage.tsx`.
  Header'daki kalp, mobil menüdeki kalp ve öğrenci panelindeki kısayol buraya bakıyor.
  Eski `/?favorites=1` bağlantısı hâlâ çalışıyor (ana sayfada favori listesi).
- `YsTutorDirectory` artık `favoritesOnly` prop'u alıyor.
- **Favori filtreleri tarayıcıda çalışıyor** (`src/lib/favoriteTutorFiltering.ts`,
  13 testli). Sebebi: favoriler endpoint'i filtre ve sayfa parametresi almıyor,
  listeyi bütün döndürüyor. Uygunluk gün/saat ve konu filtreleri liste yanıtında
  olmayan veriye ihtiyaç duyduğu için **sessizce yok sayılıyor**;
  `FAVORITE_UNSUPPORTED_FILTERS` bunları isimlendiriyor.

### 2.3 Ana sayfa

- **Bölüm sırası** (`YemeksepetiHome.tsx`): hero → hocalar listesi → pembe diagonal
  → üniversite logo şeridi → testimonials → SSS. Her bölüm kendi `mt-16 md:mt-24`
  boşluğunu taşıyor, diagonal kendi `mt-12 md:mt-28`'ini; sıra değişirken hiçbir
  bölümün içine dokunulmadı.
- **Hero'nun sağında dönen kampüs halkası** (`src/components/ui/circular-gallery.tsx`).
  21st.dev'in circular-gallery komponentinden uyarlandı, iki farkla: scroll'a bağlı
  dönme kaldırıldı (sabit 6°/sn), açı React state yerine ref'te tutulup doğrudan
  DOM'a yazılıyor. Altı üniversite `ysCampusGallery.ts`'te.
- **Sayfalama artık listenin başına iniyor**, sayfanın en üstüne değil: header
  yüksekliği + 32px altına. `window.scrollTo({top:0})` gitti.
- **Header'daki arama kutusu yalnızca `/` rotasında.** Başka sayfalarda ekranı
  filtrelermiş gibi görünüp ana sayfaya götürüyordu.

### 2.4 Giriş promosyonu (`YsEntryDialog.tsx`, `homeEntryPromo.ts`)

- Artık paint'ten 700ms sonra değil, **etkileşimde** açılıyor: 12 sn kalma,
  %25 scroll veya exit intent (yalnız `pointer: fine`).
- Gizlilik kartına 8 saniye kadar yol veriyor, sonra yine de açılıyor. Sınırsız
  bekleme, karta hiç cevap vermeyen ziyaretçide promosyonu tamamen gizliyordu.
- Storage anahtarı `hocam:home-entry-promo:v2`. Sürüm, diyalog yeniden çizildiği
  için yükseltildi; v1 kayıtları geçersiz.
- Tasarım: illüstrasyon paneli (`public/images/home/entry-promo-illustration.png`),
  altın "20 dakika ücretsiz" pill'i, tek CTA. İkincil "Şimdi değil" butonu
  kaldırıldı — kapatma çarpı, Escape ve karartma.

---

## 3. Bilinçli olarak delinen DESIGN.md kuralları

Bunlar kullanıcının açık talebiyle yapıldı, kazara değil. Geri almadan önce sor.

| Kural | Nerede | Karşılığında ne verildi |
|---|---|---|
| §5 dekoratif hareket yasak | Kampüs halkasının kendi kendine dönmesi | `prefers-reduced-motion`'da hiç dönmüyor; sekme gizliyken ve halka ekran dışındayken duruyor |
| Madde 1: gradient yasak | Kampüs kartlarının alt karartması | Siyah değil ink tonunda, kartın ortasına varmadan bitiyor; alternatifi kullanıcının reddettiği dolu bant |
| §5 hover'da transform yok | Takvim kartları ve kampüs kartları | `motion-reduce` scale'i düşürüyor, gölge kalıyor |

---

## 4. Sıradaki iş (kullanıcı kendi yapacak, sen dokunma demedikçe)

**"Nasıl çalışır" step-by-step bölümü.** Yeri belli: pembe diagonal ile üniversite
logo şeridi arasına girecek. Kullanıcı bunu kendisi yapmak istediğini söyledi.

---

## 5. Tuzaklar — bunlara çarptım, sen çarpma

1. **Dev sunucusu açıkken `npm run build` çalıştırma.** İkisi aynı `.next`
   klasörünü kullanıyor; build o klasörü yeniden yazınca dev sunucusu yarım CSS
   servis etmeye başlıyor. Belirti: Tailwind sınıfları hesaplanmıyor
   (`overflow-hidden` → `visible`, `h-[300px]` → 4061px), 3B kartlar dev gibi
   büyüyor. Çözüm: sunucuyu durdur, `rm -rf .next`, yeniden başlat.
2. **Railway API'si CORS'ta yalnız `http://localhost:3000`'e izin veriyor.**
   Frontend'i 3001'de çalıştırırsan gerçek veri gelmez, "Network Error" alırsın.
   Gerçek hocalarla çalışacaksan port 3000 olmalı.
3. **Local backend'in `DATABASE_URL`'ü göreliydi** (`sqlite:///db.sqlite3`).
   Sunucu kendi klasörü dışından başlatılırsa Django o dizinde bomboş yeni bir
   veritabanı yaratıp ona bağlanıyor, her istek `no such table` ile 500 dönüyor.
   `Hocam_backend/.env` içinde mutlak yola çevrildi; başka worktree'lerde hâlâ göreli.
4. **`Hocam_frontend` worktree'sinde `npm install` gerekiyordu** — branch
   `@phosphor-icons/react` ekliyor. Yapıldı, ama başka bir worktree'ye geçersen tekrar gerekir.
5. **`.impeccable/` artık gitignore'da.** `git add src` ile tekrar commit'e girmesin.

---

## 6. Doğrulama komutları

```bash
npm run test:unit          # 725 test
npm run test:coaching      # 102
npm run test:messages-panel
npm run test:privacy-cookies
npx tsc --noEmit -p tsconfig.json
npx next lint --dir src
```

Son durum: 725/725 birim testi geçiyor, `tsc` temiz, `next lint` hatasız,
`next build` derleniyor. `ysAppNav.test.ts` içindeki bir test 3000 portunda
sunucu yoksa kendini atlıyor (`skipped 1`); sunucu ayaktayken çalışıyor.

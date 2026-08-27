# Codex → Claude devir raporu

**Tarih:** 27 Ağustos 2026  
**Kapsam:** Mesaj paneli, mesaj sayfası kabuğu, checkout görsel sistemi, hoca profili sadeleştirmeleri ve öğrenci paneli  
**Önce okunacak belge:** [`docs/rebrand-handover.md`](./rebrand-handover.md)

Bu rapor, `a33c738` tarihli rebrand devir notundan sonra yapılan işleri Claude'a devretmek
için hazırlandı. Önceki rapordaki mimari ve ürün uyarıları hâlâ bağlayıcıdır; bu dosya onları
tekrarlamak yerine sonraki commit zincirini ve güncel çalışma durumunu ekler.

---

## 1. Hızlı durum özeti

### Frontend

- Repo: `/Users/ardagg/Desktop/Hocam/Hocam_frontend_yemeksepeti`
- Aktif dal: `codex/checkout-design-md`
- Kod HEAD'i: `1f95799` — `fix: use white text on lesson button`
- Dal tabanı: `41772e5` — `experiment/hocam-rebrand`
- Çalışma ağacı rapor yazılmadan önce temizdi.
- Dal için upstream tracking ayarlanmamış.
- Bu raporu ekleyen docs commit'i `1f95799` commit'inin hemen üstündedir; güncel hash için
  `git log -1 --oneline` çalıştır.

Dal zinciri:

```text
experiment/yemeksepeti-homepage @ 7ffb0f6   ← nihai rebrand merge hedefi
└── experiment/hocam-rebrand @ 41772e5      ← Codex dalının doğrudan tabanı
    └── codex/checkout-design-md @ 1f95799  ← uygulama değişikliklerinin ucu
```

`main` dalına doğrudan merge etme. Önce `experiment/hocam-rebrand`, sonra önceki devir
notunda tanımlandığı şekilde `experiment/yemeksepeti-homepage` hedeflenmeli.

### Backend

- Repo: `/Users/ardagg/Desktop/Hocam/Hocam_backend`
- Aktif dal: `codex/messages-panel`
- HEAD: `848100d` — `feat: expose latest conversation activity`
- Taban: `e7a9524` — `main`
- Dal için upstream tracking ayarlanmamış.
- Çalışma ağacı temiz değil; aşağıdaki **önceden var olan ve izlenmeyen** klasörlere
  dokunulmadı:

```text
docs/superpowers/
output/
tmp/
```

Mesaj paneli birlikte yayınlanacaksa frontend `873fec3` ile backend `848100d` eşleşir.
Backend commit'i olmadan panel açılır, fakat gerçek son mesaj önizlemesi ve son etkinliğe göre
sıralama API'den gelmez.

---

## 2. Talimat ve kaynak önceliği

1. Kullanıcının o anki açık talimatı.
2. Repo kökündeki `AI_AGENT_RULES.md`.
3. `/Users/ardagg/Desktop/DESIGN.md`.
4. [`docs/rebrand-handover.md`](./rebrand-handover.md).
5. Bu rapor ve commit geçmişi.

Kullanıcı talimatı DESIGN.md'yi ezebilir. En önemli canlı örnek bildirim ikonlarıdır:
bildirimlerdeki emoji ve hex renkler bilinçli olarak korunuyor. Bunları "tasarım sistemine
uydurmak" için yeniden Phosphor ikonlara veya token renklere çevirme.

---

## 3. Commit zinciri ve yapılan işler

Bu liste `a33c738` sonrasını kapsar ve kronolojik sıradadır.

### `94b53e0` — `docs: specify compact messages panel`

- Onaylanan panel davranışı yazılı hale getirildi.
- Kaynak: [`docs/superpowers/specs/2026-08-26-messages-panel-design.md`](./superpowers/specs/2026-08-26-messages-panel-design.md)
- Preply yalnızca davranış referansıydı; görsel kimlik Hocam ve DESIGN.md olarak kaldı.

### `873fec3` — `feat: add compact messages panel`

- Masaüstü navbar mesaj ikonu artık URL değiştirmeden sağda kompakt mesaj paneli açıyor.
- Panelde yalnızca `Tümü` ve `Okunmamış` sekmeleri var.
- Konuşma seçilince aynı panel içinde tam işlevli yazışma alanı açılıyor.
- Büyütme düğmesi `/messages` veya `/messages/{conversationId}` rotasına gidiyor.
- Kapatma, dışarı tıklama ve Escape paneli kapatıyor; URL değişmiyor.
- Mobilde panel mount edilmiyor; mevcut tam ekran mesaj rotaları kullanılmaya devam ediyor.
- Tam ekran ve kompakt görünüm aynı `ConversationWorkspace` bileşenini kullanıyor. Gönderme,
  görsel/dosya ekleme, cevaplama, silme, yazıyor durumu, engelleme, rezervasyon ve mevcut
  yetki kuralları iki ayrı implementasyona bölünmedi.
- Mesaj listesi mevcut `unread_count` değerini kullanıyor; yeni okunma veya arşiv durumu yok.

Ana dosyalar:

- `src/components/messaging/MessagesPanel.tsx`
- `src/components/messaging/ConversationWorkspace.tsx`
- `src/components/messaging/ConversationList.tsx`
- `src/components/messaging/conversationPresentation.ts`
- `src/components/messaging/threadPresentation.ts`
- `src/components/yemeksepeti/YsNavIcons.tsx`
- `src/app/(main)/messages/[conversationId]/page.tsx`

**Kesin sınır:** Arşiv mekanizması ekleme. Kullanıcı açıkça mevcut sistemde arşiv olmadığını
ve yeni mekanik istemediğini söyledi.

### Backend `848100d` — `feat: expose latest conversation activity`

- `ConversationSerializer` içine nullable `latest_message` alanı eklendi.
- Metin, görsel, dosya, eski sesli mesaj ve silinmiş mesaj için güvenli önizleme üretiliyor.
- Konuşmalar son etkinliğe göre sıralanıyor.
- Liste isteği mesajları okundu yapmıyor.
- N+1 thread isteği yerine bounded queryset annotation/subquery kullanılıyor.
- Veritabanı modeli veya migration eklenmedi.

Ana dosyalar:

- `apps/messaging/serializers.py`
- `apps/messaging/views.py`
- `apps/messaging/tests.py`

Deploy etkisi:

- Normal Railway backend deploy'u gerekir.
- Normal Vercel frontend deploy'u gerekir.
- Dockerfile, domain, URL rewrite, environment variable, WebSocket veya veritabanı migration
  değişikliği yok.

### `41772e5` — `fix: hide footer on messages routes`

- `/messages` ve `/messages/*` rotalarında global footer render edilmiyor.
- Büyütme düğmesiyle açılan tam ekran konuşma, footer yüzünden aşağı kaydırma gerektirmeden
  kullanılabiliyor.
- Diğer sayfalarda footer aynen kalıyor.

Ana dosya: `src/components/yemeksepeti/YsFooter.tsx`

### `3d7c410` — `feat: align checkout with Hocam design system`

- Birebir ders checkout'u DESIGN.md renk, tipografi, radius ve yüzey sistemine geçirildi.
- Cambly'den alınan yerleşim mantığı korunurken görsel kimlik Hocam'a çevrildi.
- Sol ürün seçimi ve sağ paket süresi/karar rayının ana yerleri değiştirilmedi.
- Küçük Grup, Birebir ve Hocam Pro ayrımı; haftalık ders seçimi; süre akordeonları; indirim,
  bekleyen paket talebi, güven metni ve indirim kodu mekanikleri korundu.
- Checkout minimal header'ı ayrı route group içinde kalıyor. Uygulama navbar'ının checkout'ta
  gizlenmesi kasıtlı.
- Önceki görsel versiyona dönüş gerekirse bu commit `git revert 3d7c410` ile geri alınabilir;
  reset kullanma.

Ana dosyalar:

- `src/app/(checkout)/checkout.css`
- `src/app/(checkout)/tutors/[id]/checkout/page.tsx`
- `src/components/checkout/CheckoutProductPicker.tsx`
- `src/components/checkout/CheckoutSummary.tsx`
- `src/components/checkout/ComparePlansDialog.tsx`
- `src/components/checkout/MinimalCheckoutHeader.tsx`
- `src/components/checkout/checkoutPalette.ts`

### `c074b89` — `fix: keep checkout actions and comparison readable`

- Ücretsiz tanışma dersi seçeneğindeki görünmez/kaybolmuş düğme içeriği düzeltildi.
- Plan karşılaştırma modalının yüksekliği artırıldı ve içerik bounded scroll alanında tutuldu;
  en alttaki `Gerçek hoca soru desteği` satırı artık kesilmiyor.

### `3149ed2` — `fix: remove redundant tutor profile summaries`

- Profildeki büyük `Genel değerlendirme` kartı kaldırıldı.
- `Anlatım`, `Hazırlık`, `İlerleme` ve `Motivasyon` kriter kartları korundu.
- Sağ rezervasyon kartındaki genel puan, değerlendirme sayısı ve ders bazlı puan popover'ı
  korundu.
- YKS sıralaması altındaki genel `TYT` / `AYT` çipleri kaldırıldı.
- Sağ rezervasyon kartındaki ayrıntılı ders çipleri (`TYT Matematik`, `AYT Kimya` vb.) kaldı.
- `SubjectRatingBreakdown` bileşeni silinmedi; tutor dashboard'daki diğer tüketici için hâlâ
  gerekli.

Ana dosyalar:

- `src/app/(main)/tutors/[id]/page.tsx`
- `src/components/tutors/ReviewSummary.tsx`
- `src/components/tutors/ReviewSummary.test.tsx`
- `src/components/tutors/publicTutorReviewsSection.test.ts`

### `cc384da` — `feat: align student dashboard with design system`

- `/dashboard/student` DESIGN.md sistemine geçirildi.
- Sayfa tuvali `paper`, kartlar `surface`, ayırıcılar `line`, metinler `ink` / `ink-mid`.
- Eski slate sınıfları, ham hex renkler, dekoratif emoji, yapay kart gölgeleri ve hover
  transformları kaldırıldı.
- Lucide yerine Phosphor ikonları kullanıldı.
- Öğrenci selamlaması, sıradaki ders, sonraki dersler, geçmiş dersler, paket durumu, boş
  durumlar ve işlem gereken ders alanları yeniden düzenlendi.
- Veri sorguları ve tüm aksiyonlar korundu: dersi görüntüleme, hocaya yazma, takvim, geçmiş
  ders içeriği, paket detay sheet'i, ders materyali dialog'u ve confirm/dispute kartı.
- 375px için içerik tek kolona düşüyor; masaüstünde asimetrik iki kolon korunuyor.

Ana dosyalar:

- `src/app/(main)/dashboard/student/page.tsx`
- `src/app/(main)/dashboard/student/studentDashboardDesign.test.ts`

### `1f95799` — `fix: use white text on lesson button`

- Öğrenci panelindeki pembe `Dersi görüntüle` düğmesinin yazısı normal ve hover durumunda
  beyaz yapıldı.

---

## 4. Değiştirilmemesi gereken kararlar

1. **Mesaj paneline arşiv ekleme.** Mevcut üründe arşiv state'i yok; kullanıcı bunu özellikle
   reddetti.
2. **Tam ekran mesaj rotalarını silme.** Mobil deneyim ve paneldeki büyütme düğmesi
   `/messages` ile `/messages/{conversationId}` rotalarına bağlı.
3. **Mesaj rotalarında footer'ı geri getirme.** Tam ekran konuşmanın viewport'a oturması için
   footer yalnızca bu rotalarda gizleniyor.
4. **Navbar'ı `<MainLayoutShell>` içine taşıma.** Önceki handover'daki doğrulanmamış hoca
   yönlendirme tuzağı hâlâ geçerli.
5. **`/tutors` redirect'ini wildcard yapma.** `source` tam eşleşme olmalı; aksi halde profil
   ve checkout rotaları köke gider.
6. **Bildirim emoji ve hex renklerini "düzeltme".** Kullanıcı bunları verilen referansla aynı
   ailede özellikle seçti.
7. **Checkout yerleşimini büyük ölçüde değiştirme.** Kullanıcı komponent konumlarını koruyup
   DESIGN.md görsel sistemine geçilmesini istedi.
8. **Profilde kaldırılan genel TYT/AYT ve genel değerlendirme bloklarını geri getirme.** Aynı
   bilgi ayrıntılı ve işlevsel yüzeylerde zaten mevcut.

---

## 5. Test ve doğrulama durumu

27 Ağustos 2026'da bu rapor yazılırken yeniden çalıştırıldı:

| Alan | Komut | Sonuç |
|---|---|---|
| Mesaj paneli + footer + nav | `npm run test:messages-panel` | 66 geçti, 0 kaldı, 1 atlandı |
| Checkout | `npm run test:checkout` | 12/12 geçti |
| Profil değerlendirme özeti | `npm run test:review-summary` | 18/18 geçti |
| Öğrenci paneli tasarım sözleşmesi | `node --test --import tsx 'src/app/(main)/dashboard/student/studentDashboardDesign.test.ts'` | 5/5 geçti |
| Backend mesajlaşma | `.venv/bin/python manage.py test apps.messaging` | 193 geçti, 8 atlandı |
| TypeScript | `npx tsc --noEmit` | Hata yok |
| Frontend production build | `npm run build` | Başarılı, 75 rota üretildi |
| Frontend lint | `npm run lint` | 0 hata; kapsam dışı tek `<img>` uyarısı var |

Mesaj paneli testindeki tek skip, çalışan sunucuyu probelayan anonim rota kontrolünün test
sırasında `localhost:3000` bulamadığını raporlamasıdır. Panel, footer ve mesaj davranış
testleri geçti.

Tam `npm run test:unit` bu son turda tekrar çalıştırılmadı. Önceki rebrand handover'ında
belgelenen altı eski `formatPrice` beklenti hatası (`₺400` beklenirken `400 ₺`) hâlâ ayrı ve
kapsam dışı iş olarak kabul edilmelidir.

---

## 6. Yerel çalışma durumu ve ortam

Rapor yazıldığı anda:

- Frontend port `3000`: açık (`node`, PID 63853).
- Backend port `8000`: açık (`Python`, PID 48869).
- `http://127.0.0.1:3000/dashboard/student` HTTP 200 döndü.
- Frontend `.env.local` içindeki `NEXT_PUBLIC_API_URL`, yerel 8000 yerine production Railway
  API'sini gösteriyor:

```text
https://web-production-22415.up.railway.app/api
```

- `NEXT_PUBLIC_COACHING_ENABLED=true`.

Yani yerel backend açık olsa da frontend varsayılan olarak onu kullanmıyor. Backend
değişikliklerini yerelde frontend üzerinden test etmek için API URL'ini bilinçli şekilde
yerel adrese almak gerekir; secret veya production config'i yanlışlıkla commit etme.

Başlatma komutları:

```bash
cd /Users/ardagg/Desktop/Hocam/Hocam_frontend_yemeksepeti
npm run dev

cd /Users/ardagg/Desktop/Hocam/Hocam_backend
.venv/bin/python manage.py runserver
```

Bu çalışma ortamında `/Users/ardagg/Desktop/Hocam/AGENTS.md`,
`/Users/ardagg/.codex/RTK.md` dosyasını import ediyor. Terminal komutlarının önünde `rtk`
kullanılması gerekiyor.

---

## 7. Bilinen riskler ve açık noktalar

### Disk alanı kritik

`/System/Volumes/Data` yaklaşık `%99` dolu ve yalnızca `3.1 GiB` boş alan var. Bir production
build sırasında webpack cache yazımı `ENOSPC` uyarısı verdi; build yine tamamlandı. Büyük
build/test öncesinde güvenli disk temizliği gerekebilir. Kullanıcı dosyalarını veya repo
köklerini topluca silme.

### Backend çalışma ağacı

Backend'deki `docs/superpowers/`, `output/` ve `tmp/` kullanıcıya ait olabilecek izlenmeyen
dosyalardır. İçeriğini doğrulamadan silme, stage etme veya commit'e alma.

### Browser oturumu

Codex'in in-app browser'ında authenticated öğrenci oturumu yoktu. Dashboard'un görsel
doğrulaması kullanıcı ekran görüntüleri, kaynak kod sözleşme testi, TypeScript ve production
build ile yapıldı. Claude Browser'da giriş varsa gerçek veriyle 1440px ve 375px son görsel
kontrolü yapmak yararlı olur.

### Mevcut uyarılar

- `src/app/(main)/tutors/[id]/page.tsx:1358` içinde kapsam dışı `<img>` lint uyarısı var.
- Tailwind build, repoda yaygın kullanılan `duration-[--duration-state]` sınıfı için ambiguity
  uyarısı veriyor. Öğrenci paneline eklenen yeni süreler açık `[transition-duration:120ms]`
  biçiminde yazıldı; global uyarı bu işten önceki kullanımlardan geliyor.

### Go-live panelleri

Önceki [`docs/rebrand-handover.md`](./rebrand-handover.md) dosyasındaki Vercel, Search
Console, iyzico ve Google Cloud panel kontrolleri hâlâ yapılmalı. Bu repo içinden kanıtlanamaz.

---

## 8. Claude için önerilen ilk adımlar

1. Frontend'de `git switch codex/checkout-design-md` ve `git log -10 --oneline` ile zinciri
   doğrula.
2. Backend mesaj önizlemesiyle çalışacaksan `git switch codex/messages-panel` ve
   `git show 848100d` çalıştır.
3. Önce bu raporu, sonra eski `docs/rebrand-handover.md` dosyasını oku.
4. Devam isteğinin hangi yüzeye ait olduğunu belirle; checkout, mesajlar, profil ve öğrenci
   paneli ayrı commit sınırlarında tutuldu.
5. Geri dönüş istenirse `git revert` kullan; kullanıcı değişikliklerini korumak için
   `reset --hard` veya toplu checkout kullanma.
6. Mesaj paneli yayınlanacaksa frontend ve backend commit'lerini birlikte planla.
7. Yeni görsel değişiklikte DESIGN.md'yi uygula; ancak bu rapordaki açık kullanıcı
   istisnalarını DESIGN.md adına geri alma.

---

## 9. Hızlı geri dönüş noktaları

| İstenen geri dönüş | Revert edilecek commit |
|---|---|
| Yalnızca beyaz dashboard düğme yazısı | `1f95799` |
| Öğrenci paneli DESIGN.md dönüşümü | `cc384da` ve gerekirse `1f95799` |
| Profil sadeleştirmeleri | `3149ed2` |
| Checkout okunabilirlik düzeltmeleri | `c074b89` |
| Checkout DESIGN.md dönüşümü | `3d7c410` ve `c074b89` |
| Mesaj sayfalarında footer gizleme | `41772e5` |
| Kompakt mesaj paneli | frontend `873fec3`, backend `848100d` |

Revert sırası bağımlılıklarda tersten uygulanmalı. Özellikle `873fec3` geri alınırken
`ConversationWorkspace` hem panel hem tam ekran rota tarafından kullanıldığı için commit'in
tamamını atomik geri almak, dosyaları elle parçalamaktan daha güvenlidir.

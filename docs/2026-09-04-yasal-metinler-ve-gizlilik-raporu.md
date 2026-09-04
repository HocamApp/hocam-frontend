# Yasal metinler, gizlilik sayfası ve kamu sayfaları — 4 Eylül 2026

Bu oturumda yapılan işin kaydı. Üç başlık altında toplanıyor: yasal metinlerin
yayına alınması, gizlilik ayarları sayfasının onarılması, ve kamuya açık SEO
sayfalarının sadeleştirilmesi.

İlgili PR'lar: `hocam-frontend` ve `hocam-backend` üzerinde
`agent/yasal-metinler-20260904`.

---

## 1. Yasal metinler

### Yayına alınan yeni belgeler

| Belge | Rota | Kaynak |
|---|---|---|
| Kullanım Koşulları | `/kullanim-kosullari` | Kodda uygulanan kurallar |
| Mesafeli Satış Sözleşmesi | `/mesafeli-satis-sozlesmesi` | 6502 s.K. + Mesafeli Sözleşmeler Yönetmeliği |
| İptal ve İade Koşulları | `/iptal-ve-iade` | `apps/lessons` + `apps/payments` sabitleri |
| Hoca Aydınlatma Metni | `/kvkk/hoca-aydinlatma-metni` | `docs/kvkk/00-kisisel-veri-isleme-envanteri.md` |
| Saklama ve İmha Politikası | `/kvkk/saklama-ve-imha-politikasi` | `apps/privacy/retention.py` |

Önceden yayında olan altı belge (`aydinlatma-metni`, `hoca-dogrulama`,
`cerez-politikasi`, `analitik`, `ogrenci-gelisim-kayitlari`, `veli-onayi`)
korundu; gövde metinlerine dokunulmadı.

### Yazılan metinlerin dayanağı

Sözleşmelerdeki her sayı, backend'de uygulanan bir sabitten geliyor:

| Metinde yazan | Kaynak |
|---|---|
| 12 saat ücretsiz iptal penceresi | `CANCELLATION_FREE_WINDOW` |
| 15 dakika katılım beklemesi | `NO_SHOW_GRACE_PERIOD` |
| 24 saat itiraz süresi | `STUDENT_ABSENCE_DISPUTE_WINDOW` |
| 24 saat otomatik ders onayı | `AUTO_CONFIRM_HOURS` |
| 3 gün değerlendirme penceresi | `REVIEW_WINDOW_DAYS` |
| 3 katılmama → profil gizlenir | `NO_SHOW_AUTO_HIDE_THRESHOLD` |
| Ayda 3 deneme, hoca başına bir kez | `MONTHLY_TRIAL_LIMIT`, `unique_active_trial_booking_per_tutor` |
| 14 gün hesap silme bekleme süresi | `ACCOUNT_DELETION_GRACE_DAYS` |
| 18 yaş sınırı | `KVKK_AGE_OF_MAJORITY` |
| %15 komisyon | `TUTOR_ESTIMATED_COMMISSION_BPS` |
| İade formülü | `compute_refund_amounts()` |
| Mesajlaşma ders talebine bağlı | `Conversation.lesson_request` OneToOne |
| Saklama süreleri tablosu | `apps/privacy/retention.py` |

Bu bağ dört test dosyasıyla kilitlendi: `cancellationPolicy.test.ts`,
`termsOfService.test.ts`, `distanceSalesContract.test.ts`,
`privacyNotices.test.ts`. Backend sabiti değişirse test kırılır; sayfa sessizce
eskiyemez.

Negatif testler de var: metinler "otomatik iade edilir" diyemez (ödeme
sağlayıcısı bağlı değil), uydurma bir destek adresi geçemez, ve mesafeli satış
sözleşmesi cayma hakkının asgarinin üstünde olduğunu iddia edemez.

### Mevzuat kararları

**Cayma hakkı bildirimi.** Mesafeli Sözleşmeler Yönetmeliği m.15 hizmetin
ifasına başlanmasıyla cayma hakkını düşürüyor, ama m.5(h) gereği tüketiciye
bunun önceden bildirilmiş olması şartıyla. Bildirim yapılmazsa 14 günlük süre
hiç işlemiyor ve hak bir yıl yaşıyor. Sözleşmenin 7. maddesi bu uyarıyı içeriyor.

**Tek taraflı değişiklik yasağı.** 6563 s.K., aracılık sözleşmesine "geçmişe
yönelik veya tek taraflı, hizmet sağlayıcı aleyhine değişiklik" hükmü konmasını
yasaklıyor. Şablon sözleşmelerin çoğunda bu madde var. Kullanım Koşulları §18
bunun tersini söylüyor: değişiklikler geçmişe yürümez, aleyhe esaslı değişiklik
önceden duyurulur.

**Komisyon oranı.** 6563 s.K. aracılık sözleşmesinde belirtilen hizmet bedelinin
gerçek bedel olmasını şart koşuyor, bu yüzden %15 açıkça yazıldı. Kod tarafında
`AI_AGENT_RULES §2` hâlâ geçerli: bu oran hoca kazanç göstergesine
uygulanmıyor.

**Tüketici hakları saklı.** Sorumluluk sınırı maddesine "tüketici mevzuatının
tanıdığı ve sözleşmeyle daraltılamayan haklar etkilenmez" cümlesi eklendi;
bu olmadan sınırlama tüketici karşısında zaten geçersiz sayılırdı.

### İade politikası — düzeltilen hata

İlk yazımda mesafeli satış sözleşmesine "kullanılmamış kredi iadesi mevzuatın
asgari korumasının ötesindedir" yazılmıştı. **Bu yanlıştı.**

`PackagePlan` haftalık ders sayısı × süre (14/30/90/180 gün) matrisi üzerine
kurulu. Ticaret Bakanlığı'nın tanımı — *"sürekli veya düzenli aralıklarla
yararlanma"* — bunu abonelik sözleşmesi yapıyor. Abonelik sözleşmesinde tüketici
istediği zaman fesheder ve sunulmayan hizmetin bedeli **kesintisiz** iade edilir.
Yani kullanılmamış kredi iadesi cömertlik değil, asgari yükümlülük.

Dahası, metin mevzuatın **altındaydı**: yönetmelik iadeyi 15 gün içinde şart
koşuyor, sözleşmede hiç süre yoktu. İki sözleşmeye de 15 günlük süre eklendi.

### Paket ek süresi kaldırıldı

`PACKAGE_GRACE_PERIOD_DAYS = 14` sabiti sıfırlansaydı mevcut paketlerin de ek
süresi anında uçardı — Kullanım Koşulları §18'in ve tüketici mevzuatının
yasakladığı geriye yürüme. Bunun yerine değer satın alma anında donduruldu:

- `PackagePurchase.grace_period_days` alanı eklendi, varsayılan 0
- Migration `0023` mevcut tüm satırlara 14 yazıyor
- Süre kontrolü `duration_days + purchase.grace_period_days` üzerinden

Bugünden sonra satılan paket süresiyle biter; daha önce satılanlar hakkını korur.

### E-posta adresi

`kvkk@hocamozelders.com` hiç var olmayan bir kutuydu. İki repoda 20 yerde
`iletisim@hocamozelders.com` ile değiştirildi. Backend'de `settings.py`'deki
`KVKK_PUBLIC_CONTACT_EMAIL` varsayılanı da güncellendi — bu adres gizlilik
e-postalarında ve API yanıtlarında kullanıcıya gidiyor.

### Footer ve sayfa düzeni

Footer'daki `KVKK ve gizlilik` başlığı `Yasal Metinler` oldu; 6 link + 3
tıklanamaz metin yerine **5 gerçek link** kaldı. Footer'da artık tıklanamaz
yasal metin yok.

`/kvkk/*` sayfaları `(main)` route group'una taşındı: navbar, footer ve solda
sabit belge listesi kazandılar. URL'lerin hiçbiri değişmedi. 6 dosyaya
kopyalanmış `max-w-3xl` sarmalayıcı ve iki kez tekrar eden `Section` helper'ı
tek paylaşılan bileşen setine indi. Gövde metni 14px'ten 16px'e çıktı.

`/kvkk` hub sayfası kaldırıldı; `next.config.js` onu ilk belgeye yönlendiriyor
(kalıcı değil — hub geri getirilebilsin diye). Hub'ın tek içeriği sidebar'ın
zaten gösterdiği listeydi.

**Kritik detay:** `(main)`'e taşıma `/kvkk`'yı iki auth kapısının arkasına
sokuyordu. `VerificationForm` tam olarak `/kvkk/hoca-dogrulama`'ya link veriyor,
yani doğrulama metnine ihtiyacı olan tek kitle erişimini kaybedecekti. Her iki
kapıya da muafiyet eklendi ve regresyon testi yazıldı.

---

## 2. Gizlilik ve Verilerim sayfası

`/profile/gizlilik` sayfasında dört gerçek bug bulundu ve düzeltildi.

**`RouteGuard` yoktu.** Sayfa giriş yapmamış herkese açıktı; API çağrıları
düşüyor, sayfa "Yükleniyor…" üzerinde takılı kalıyordu.

**Hata durumunda sonsuz yükleme.** Kod `if (isLoading || !data)` diyordu; istek
başarısız olduğunda `isLoading` false oluyor ama `data` undefined kalıyordu, yani
yükleme satırı hiç kaybolmuyordu. Artık iskelet yükleme, ardından hata kutusu ve
tekrar deneme butonu var.

**Onay listesi boş görünüyordu.** Toplama kapalıyken yalnızca verilmiş onaylar
listeleniyordu; hiçbiri verilmemiş olduğu için sayfa boştu. Artık dört onayın
hepsi durumuyla listeleniyor. Buton davranışı değişmedi: toplama kapalıyken
"Onay ver" pasif, **"Onayı geri al" her zaman aktif**.

**E-posta elle yazılıydı.** Backend zaten `contact_email` dönüyordu; artık
frontend onu kullanıyor.

Uçtan uca doğrulandı: DB'den bir onay verildi, sayfa "4 onaydan 1 tanesi etkin"
dedi, butona basıldı, onay geri alındı. `ConsentRecord` zinciri doğru:
`R5 True (admin)` → `R5 False (settings)`. Kayıtlar üzerine yazılmıyor, ekleniyor.

---

## 3. Kamu sayfaları

`/hocalar-nasil-dogrulaniyor`, `/nasil-calisir` ve `/ucretsiz-deneme-dersi`
sayfalarından breadcrumb'lar, etiketler ve doldurma metinleri kaldırıldı.
Breadcrumb'lar silinirken JSON-LD breadcrumb verisi de kaldırıldı — Google
yapısal verinin görünen içeriği yansıtmasını şart koşuyor.

Üç bileşen yeniden tasarlandı:

**Tik listesi.** Her satır kendi kutusundaydı ve tik `bg-primary/10 text-primary`
ile işaretliydi — DESIGN.md'nin 31 numaralı yasaklı deseni. Artık tek yüzey,
hairline satırlar, ink renkli tik.

**"İki kart + bir tam genişlik kart" gridleri.** Bu şekil, üç eşit kart yasağının
etrafından dolaşma denemesiydi ve kaza gibi görünüyordu. `PublicSeoRows` ile
değiştirildi: tek yüzey, hairline satırlar, başlık kendi sütununda.

**Gizlilik sınırı bölümü.** Giriş paragrafı ve altındaki kutu aynı kuralı iki kez
söylüyor, ama çizginin iki tarafında ne olduğunu hiç söylemiyordu. Başlık
`Profilde ne görünür, ne görünmez?` oldu ve iki sütuna bölündü.

Ayrıca "hoca dizini" ifadesi dokuz yerde "hoca listesi" olarak düzeltildi —
footer zaten "Hoca Listesi" diyordu, ikisi çelişiyordu.

Hakkımızda sayfasındaki kurucu fotoğrafları bölümü kaldırıldı.

---

## Doğrulama

**Frontend:** `tsc` temiz, `lint` 0 hata, build 74/74 sayfa. Testler: yasal 50/50,
messages-panel 73/73, unit 744/744, seo 8/8, privacy-cookies 12/12.

**Backend:** `apps.payments` + `apps.lessons` + `apps.privacy` + `apps.support`
484/484. `makemigrations --check` temiz.

Tarayıcıda 375 / 768 / 1440 genişliklerinde gezildi; yatay taşma yok. Bir gerçek
bug bu sırada yakalandı: mobilde çerez sayfası 1195px'e yayılıyordu, grid
track'i `auto` olduğu için 900px'lik tablo tüm sütunu itiyordu.

---

## Açık kalanlar

**Şirket kuruluşu bekleyen alanlar.** Kullanım Koşulları §1 ve §19, Mesafeli
Satış Sözleşmesi §1: unvan, adres, MERSİS ve yetkili mahkeme yeri. Metinler bunu
açıkça söylüyor, uydurma bilgi yok.

**Avukat incelemesi.** `AI_AGENT_RULES §4`, ders ve iade politikalarının tek
doğru kaynağının proje sahiplerindeki `DERS_POLITIKALARI_RAPORU.md` olduğunu
söylüyor. Kod ile o doküman çelişirse doküman kazanıyor. Yayına almadan önce
karşılaştırılmalı.

**Veri Sahibi Başvuru Formu.** Zorunlu değil — Tebliğ (RG 30356) formu şart
koşmuyor, e-posta kanalı yeterli ve mevcut. `/profile/gizlilik`'teki çevrimiçi
kanal `KVKK_OPERATIONS_EMAIL` dolduğunda bu işlevi görecek.

**Taahhütlü abonelik.** Abonelik Sözleşmeleri Yönetmeliği taahhütlü aboneliklerde
cayma bedeli mahsubuna izin veriyor. `discount_percent` zaten süreye bağlı;
erken çıkışta yararlanılan indirim farkı mahsup edilebilir. Backend işi ve satın
alma ekranında açık bildirim gerektirir.

**Çevrimiçi başvuru ve onay toplama kapalı.** `KVKK_CONSENT_COLLECTION_ENABLED`
ve `KVKK_OPERATIONS_EMAIL` boş; sayfalar bu duruma hazır, açılması hukuki
inceleme kararına bağlı.

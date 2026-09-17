# HOCAM PayTR — Görsel Ekran Sözleşmesi (S0-V)

**Tarih:** 17 Eylül 2026\
**Frontend referansı:** `dbf385f42315172617c95305f1f0bba566ad3ed3`\
**Kapsam:** S3–S7 için uygulanabilir ekran, bileşen, durum ve metin kararları. Bu teslimat Markdown'dır; çalışan ödeme arayüzü veya PayTR entegrasyon testi değildir.

[Plan](PAYTR_FRONTEND_PLAN.md) → [API sözleşmesi](PAYTR_CONTRACT.md) → bu belge → [devir](PAYTR_HANDOFF.md). Ürün ve API kuralları görsel kararlardan önce gelir. Aşağıdaki boyutlar hedef CSS px değerleridir; rem karşılığıyla uygulanır.

## 1. Referanslar ve tasarım yönü

| Kaynak | İnceleme / erişim sınırı | HOCAM'a alınan karar |
| --- | --- | --- |
| [Cambly açık paket ekranı](https://www.cambly.com/en/subscribe) | 17 Eylül, S0 tarayıcı incelemesi; açık plan seçimi | Bilgi ile karar alanını ayır; süre/fiyat ve ana eylemi okunur tut |
| [Preply açık öğretmen sayfası](https://preply.com/en/online/english-tutors) | 17 Eylül, S0 tarayıcı incelemesi; oturum içi checkout görülmedi | Öğretmen kimliği, belirgin başlık ve rahat boşluk |
| [Preply ödeme açıklaması](https://help.preply.com/en/articles/15432866-how-and-when-will-i-be-charged) | 17 Eylül, resmî yardım metni S0-V'de yeniden okundu | Kullanıcı ödeme öncesinde toplam dökümünü görür |
| [Cambly ödeme açıklaması](https://studentsupport.cambly.com/hc/en-us/articles/360000300923-How-to-subscribe-payment-options) | 17 Eylül, resmî yardım metni S0-V'de yeniden okundu | Paket seçimi ile ödeme adımını ayır |
| [W3C metin kontrastı](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | 17 Eylül, resmî açıklama okundu | Normal metin için en az 4.5:1; aşağıdaki yerel CTA düzeltmesi |

Referanslar bir endüstri sertifikasyonu değildir. Rakip abonelik/yenileme politikaları, marka varlıkları ve ekran görüntüleri ürüne taşınmaz. HOCAM tek seferlik paket modeli korunur. S0'nın tarayıcı gözlemleri ile bu bölümün kaynak okuması ayrı kanıtlardır; Preply'nin özel ödeme arayüzü incelenmiş gibi sunulmaz.

Görsel yön: açık sıcak zemin, koyu okunur metin, beyaz form, soluk pembe özet, tek belirgin pembe ana eylem. Büyük kampanya başlığı, indirim sayacı, ek satış, güvenlik rozeti koleksiyonu veya yeni palet yok. Öğrenci önce ne aldığını ve toplamı, ardından gereken alanları görür.

## 2. Mevcut sistem ve yerel uyarlamalar

Kaynaklar: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(checkout)/checkout.css`, `src/components/checkout/MinimalCheckoutHeader.tsx`, `CheckoutShell.tsx`, `src/components/ui/button.tsx`, `input.tsx`, `src/components/shared/InlineError.tsx`. Kod yorumlarının atıf yaptığı DESIGN.md bu checkout'ta bulunmadı; kararlar mevcut kaynak ve bu belgeden uygulanır.

| Rol | Mevcut kaynak / hedef kullanım |
| --- | --- |
| Font | Poppins, mevcut `--font-poppins`; yeni font yüklenmez |
| Sayfa / metin | `--checkout-page-surface` #fbf6f6 / `--checkout-page-ink` #02171a |
| Form | `--checkout-card-surface` #fff; 1 px `--checkout-soft-line` #e6dddd |
| Özet | `--checkout-right-surface` #fce5f1 / `--checkout-right-ink` #02171a |
| İkincil metin | `--ink-mid-on-light` #5c6b6d; beyazda 5.557:1 |
| Ödeme CTA | Yerel `--pink-deep` #d70f64 üstüne beyaz; 5.070:1 |
| Başarı / hata | #1c7a55 / #b33a24, beyazda 5.297:1 / 5.920:1; ikon ve metin eşlik eder |
| Input sınırı / focus | #5c6b6d sınır; focus 2 px #02171a ring + 2 px beyaz offset |
| Ayırıcı | #e6dddd; dekoratif, input sınırı veya tek durum göstergesi olarak kullanılmaz |
| Köşeler | Mevcut input 10 px, kart 20 px, CTA pill; yeni modal yok |
| Aralıklar | 4 / 8 / 12 / 16 / 24 / 32 / 48 px |
| Hareket | Renk geçişi 120 ms; reduced-motion'da hareket/shimmer/spinner dönüşü kapalı |

Kontrastlar sRGB göreli luminance formülüyle beyaza karşı hesaplandı; uygulama ekranından ölçülmüş sonuç değildir. Mevcut #fa0050 + beyaz 4.054:1 olduğu için 16 px normal CTA metninde yeterli değil. **Yalnız yeni ödeme bileşeninin** varsayılan/hover/active dolgusu mevcut koyu pembe token olur; hover alt çizgiyle, active 2 px iç sınırla belirtilir. Global Button veya seçim ekranının paleti değiştirilmez. Disabled: nötr zemin, metin ve neden açıklaması; pembe opacity azaltılmaz.

Checkout paleti 01 sabittir; query parametresiyle diğer keşif paletleri seçilmez. Açık ödeme yüzeyinde açık temaya ait foreground/background çifti birlikte kullanılır; gece teması beyaz yüzeye beyaz metin taşımamalı. `--ink`, `--surface`, `--line` gibi tema değiştiren token'lar burada körlemesine miras alınmaz. İkon, form placeholder ve focus da bu eşleştirmeye dahildir.

| Metin rolü | Masaüstü | Mobil |
| --- | --- | --- |
| Sayfa H1 | 32/40 px, 600 | 26/34 px, 600 |
| Kart H2 / durum başlığı | 22/30 px, 600 | 20/28 px, 600 |
| Toplam ödeme | 28/36 px, 600 | 24/32 px, 600 |
| Gövde / input / CTA | 16/24 px, 400–500 | Aynı |
| Etiket / yardımcı / fiyat satırı | 14/20 px, 400–500 | Aynı |

Uzun Türkçe metin sarılır. Başlıklar ve para değerleri ellipsis ile kesilmez. CTA `min-height:48px`, gerekirse iki satır; mevcut Button'ın `whitespace-nowrap` sınıfı yerelde geçersiz kılınır.

## 3. Ekran mimarisi

### Ödeme sayfası: /package-purchases/[purchaseId]/pay

MinimalCheckoutHeader'ın marka ve skip-link dili korunur. Ödeme/sonuç ekranında geri bağlantısı “Paketlerim” → `/profile/payments`; tarayıcı geçmişiyle eski iframe'e dönülmez. Mevcut seçim ekranının hoca profiline dönüşü değişmez. Header sabit değildir; mobil alt menü, pazarlama footer'ı ve büyük site navbar'ı ödeme alanını sıkıştırmaz.

İçerik maksimum 1120 px, ortalı. Dış boşluk 320–767 px'te 16 px, 768 px üstünde 24 px. Header sonrası 32 px (mobil 24), sayfa altında 48 px + safe-area. 1024 px ve üstü `minmax(0,1fr) 360px`, 32 px gap. 1024 altı tek sütun, 24 px gap. Kart padding masaüstü 24, mobil 16. Özet ve form normal akışta; sticky CTA/özet kullanılmaz.

```text
Masaüstü ≥1024
[HOCAM]                                           [Paketlerim]
Ödemeyi tamamla
Paketini kontrol et, ardından ödeme bilgilerini gir.

┌───────────────────────────────────┐  ┌──────────────────────┐
│ Ödeme için gereken bilgiler       │  │ [Avatar] Hoca adı     │
│ Ad soyad                          │  │ Paket / ders sayısı   │
│ [...............................] │  │ Süre                  │
│ Telefon                           │  │                      │
│ [...............................] │  │ Ara toplam       ... │
│ Adres                             │  │ İndirim          ... │
│ [...............................] │  │ Promosyon        ... │
│ [...............................] │  │ ──────────────────── │
│ Hukuki bağlantılar                │  │ Toplam ödeme     ... │
│ [ Güvenli ödemeye geç            ] │  │ Tek seferlik ödeme   │
│ Kart bilgileri PayTR'de girilir.   │  └──────────────────────┘
└───────────────────────────────────┘
```

```text
Mobil <1024
[HOCAM]                 [Paketlerim]
Ödemeyi tamamla
┌──────────────────────────────────┐
│ [Avatar] Hoca adı                │
│ Paket / ders sayısı / süre       │
│ Toplam ödeme                 ... │
│ Tek seferlik ödeme               │
│ [ Fiyat ayrıntıları          v ] │
└──────────────────────────────────┘
┌──────────────────────────────────┐
│ Ödeme için gereken bilgiler      │
│ Ad soyad [.....................] │
│ Telefon  [.....................] │
│ Adres    [.....................] │
│          [.....................] │
│ Hukuki bağlantılar               │
│ [ Güvenli ödemeye geç           ] │
└──────────────────────────────────┘
```

DOM okuma sırası: H1 → purchase summary → form/durum/iframe. CSS grid-area masaüstünde özeti sağa yerleştirir; anlamı değiştiren pozitif tabindex kullanılmaz. Tek summary DOM'u vardır. `main id="checkout-content"`; özet etiketli section/aside, form başlığı H2. Geri ikonunun hit alanı en az 44×44 px.

### Sonuç sayfaları: /odeme/basarili ve /odeme/basarisiz

Aynı minimal header ve 640 px maksimum tek sütun. Durum kartı → sahipliği doğrulanmış kompakt paket özeti → ana eylem. URL hangi adla açılırsa açılsın ilk metin “Ödeme sonucu doğrulanıyor”. Final durum tabloya göre seçilir; sayfa adı veya yeşil ikon ödeme kanıtı değildir. Başlık ekranın üst bölümündedir; düşük ekranlarda dikey ortalama yok.

## 4. Bileşen sözleşmeleri

### PurchaseSummary

- Avatar 40×40 px; isim yanında görsel dekoratif ise boş alt. Yoksa harf fallback; broken image yok.
- Hoca adı tam sarılır. Satın almadan doğrulanmış plan adı/ders sayısı/süre gösterilir; eksik program eski URL veya seçili checkout state'inden üretilmez.
- Satırlar: ara toplam → pozitifse paket indirimi → pozitifse promosyon indirimi → ayırıcı → **Toplam ödeme**.
- Sayılar purchase alanlarından mevcut para format helper'ıyla gelir; toplam yeniden hesaplanmaz. Para uzun ise değer ayrı satıra geçer; tutar kesilmez.
- Yakın açıklama: “Tek seferlik ödeme. Otomatik yenilenmez.”
- Mobil ayrıntılar varsayılan kapalı; toplam, öğretmen ve paket daima açık. Disclosure en az 44 px, `aria-expanded`/`aria-controls`. Açılması ödeme isteği yaratmaz.
- Form, iframe, bekleme ve sonuçta aynı purchase verisi; kişisel adres/telefon sonuç özetine taşınmaz.
- Yetki veya kayıt doğrulanmadıysa boş fiyat yerine skeleton/güvenli hata; sıfır tutar, örnek fiyat veya önceki kullanıcının verisi gösterilmez.

### CustomerForm

Sıra: ad soyad → telefon → adres. Üç alan da zorunlu; kalıcı label ve “Tüm alanlar zorunludur.” açıklaması. Placeholder label'ın yerini tutmaz.

| Alan | HTML / ölçü | Doğrulama / güvenli mesaj |
| --- | --- | --- |
| Ad soyad | text, autocomplete=name; min-height 48 px | Trim sonrası 2–60; “Ad soyad 2–60 karakter olmalı.” |
| Telefon | tel, inputmode=tel, autocomplete=tel; min-height 48 px | Sözleşmedeki normalize işlemi sonrası zorunlu/en fazla 20; “Geçerli bir telefon numarası gir.” |
| Adres | textarea, autocomplete=street-address; min-height 112 px, resize vertical | Trim sonrası 5–400; “Adres 5–400 karakter olmalı.” |

Alan gap 20 px; label–input 8 px; input–yardım/hata 8 px. Uluslararası telefonları dışlayan yeni ülke/regex kuralı icat edilmez. Paste engellenmez, değer sessiz kesilmez. Input'ların mevcut 40 px yüksekliği yeni formda 48 px ve 16 px metne override edilir.

İlk submit'te bütün alanları doğrula, ilk hatalı alana focus ver; sonra ilgili alanı blur/değişimde yeniden doğrula. Hata `aria-invalid`, label ilişkisi, `aria-describedby` ve InlineError ile bağlanır. Sürekli assertive anons yerine submit hata özeti bir kez duyurulur; alan hatalarında InlineError'ın varsayılan alert rolü uygun biçimde override edilir.

Hukuki linkler CTA'dan önce normal akışta:
“Kullanım koşulları” → `/kullanim-kosullari`, “Mesafeli satış sözleşmesi” → `/mesafeli-satis-sozlesmesi`, “İptal ve iade” → `/iptal-ve-iade`. Yeni sekmede açılır; görünür “Yeni sekmede açılır” açıklaması ve `rel="noopener noreferrer"`. Backend'in kaydetmediği sözleşme sürümü/onay checkbox'ı eklenmez.

CTA “Güvenli ödemeye geç”. Alt metin: “Kart bilgilerini PayTR ödeme ekranında gireceksin.” Kart/CVV/OTP alanı HOCAM formuna eklenmez. Eksik alanlar için açıklamasız disabled CTA yerine submit doğrulaması; uygunluk sorgulanırken ve POST sürerken disabled.

### Başlatma ve iframe

Başlatma sırasında CTA aynı boyutta “Ödeme ekranı hazırlanıyor…”; form değerleri görünür ancak değiştirilemez, in-flight kilidi vardır. Bu metin tahsilat başarı mesajı değildir. `aria-busy` ilgili bölgeye; spinner dekoratif. Tek kullanıcı eylemi tek POST.

Geçerli yanıt sonrası sol kart form yerine “Kartla ödeme” başlığı + PayTR iframe olur. HOCAM submit CTA kaldırılır. Iframe title “PayTR güvenli ödeme”, width 100%, başlangıç min-height 600 px; sağlayıcının doğrulanmış resize entegrasyonu ile içerik büyür. Sabit max-height, crop, scale küçültme ve banka kontrolünün üstüne overlay yok. Mobilde normal sayfa kaydırması; 3DS klavye/viewport testi S4/S8 kapısıdır. iframe load olayı paid kanıtı değildir.

Iframe yükleme bilgisi başlık altında normal akışta; önceden monte edilmiş iframe polling/loading render'ında yeniden mount edilmez. Resize mesajları kaynak/origin kontrolüyle kabul edilir; sağlayıcının gerekli izinleri S4'te resmî entegrasyondan doğrulanır. Varsayımsal sandbox kısıtlarıyla banka yönlendirmesi bozulmaz.

45 saniye hızlı sorgulama sınırı dolunca iframe korunur. Altında “Ödeme sonucu henüz doğrulanmadı. Durumu yeniden kontrol edebilirsin.” ve **GET yapan** “Durumu kontrol et” bulunur. Banka süresi bitti, ödeme başarısız veya tekrar öde mesajı verilmez. Kullanıcı checkout'tan ayrılırsa ödeme iptal edildiği iddia edilmez.

## 5. Durum, metin ve eylem matrisi

Her durum ikon + başlık + kısa açıklama taşır. İkonlar 24 px, dekoratif `aria-hidden`; sonuç ikon alanı 48 px. Nötr Clock/Info, başarı Check, hata WarningCircle; anlam yalnız renkten gelmez. Bir kartta en fazla bir dolu ana eylem, bir ikincil bağlantı.

Öncelik: sahiplik/veri kontrolü → purchase terminal durumları → doğrulanmış girişim/review bilgisi → acceptance/koçluk/flag uygunluğu → form. Aktif veya sonucu belirsiz girişim varsa uygunluk yeniden form açmaz. S7 verisi yokken failed/review tahmin edilmez.

| Durum / gerçek koşul | Başlık ve gövde | Eylem / görünüm |
| --- | --- | --- |
| İlk yükleme | “Paket bilgileri yükleniyor” | Summary/form boyutunda skeleton; ödeme CTA yok |
| Acceptance pending, girişim yok | “Hoca onayı bekleniyor” / “Hoca talebini onayladığında ödeme adımına geçebilirsin.” | Nötr kart; Paketlerim; form/iframe yok |
| Acceptance rejected | “Paket talebi kabul edilmedi” / “Bu talep için ödeme başlatılamaz.” | Paketlerim; ödeme yok |
| Acceptance expired | “Talebin süresi doldu” / “Bu talep için ödeme başlatılamaz.” | Paketlerim; uydurma otomatik yeni talep yok |
| Acceptance withdrawn/cancelled | “Paket talebi kapatıldı” / “Bu talep için ödeme başlatılamaz.” | Paketlerim |
| Form ready | “Ödeme için gereken bilgiler” | Pending + doğrulanmış uygunluk + desteklenen paket; form ve summary |
| Starting | “Ödeme ekranı hazırlanıyor…” | CTA disabled, form kilitli; ikinci POST yok |
| Iframe active | “Kartla ödeme” / “Kart bilgilerini PayTR ekranında gir.” | Iframe ve summary; ayrı HOCAM ödeme CTA yok |
| Callback pending / unknown | “Ödeme sonucu doğrulanıyor” / “Sonuç henüz kesinleşmedi. Yeniden ödeme başlatmadan durumu kontrol et.” | Hızlı sorgu sonrası Durumu kontrol et (GET), Paketlerim; iframe varsa korunur |
| Paid | “Ödemen onaylandı” / “Paketinin güncel durumunu Paketlerim'de görebilirsin.” | Başarı ikonu; Paketlerime git; mevcut gerçek purchase özeti. Ders rezervasyonu otomatik yaratılmaz |
| Failed attempt, yalnız S7 | “Ödeme tamamlanamadı” / “Bu ödeme girişimi tamamlanamadı.” | Önce GET kontrolü; yalnız backend retry uygunluğu doğrulanırsa “Yeniden ödeme başlat”; aynı purchase |
| Manual review, yalnız S7 | “Ödeme inceleniyor” / “Sonuç kontrol ediliyor. Bu paket için yeniden ödeme başlatma.” | Nötr kart, Durumu kontrol et ve Paketlerim; süre/iade sözü yok |
| Purchase cancelled | “Paket iptal edildi” / “Bu paket için ödeme başlatılamaz.” | Paketlerim; form, iframe ve retry yok |
| Purchase refunded | “Paket iade durumunda” / “Paket kaydı iade durumunda. Güncel bilgileri Paketlerim'den kontrol edebilirsin.” | Paketlerim; paranın bankaya ulaştığı iddiası yok |
| Owned kayıt yok / 404 | “Paket görüntülenemiyor” / “Paket bilgilerine erişilemiyor.” | Paketlerim; özel veri ve ödeme yok |
| Sorgu hatası | “Paket bilgileri alınamadı” / “Bağlantını kontrol edip yeniden deneyebilirsin.” | “Bilgileri yeniden yükle” yalnız GET; uygunluk varsayılmaz |
| Return recovery kaydı yok | “Ödeme sonucu burada doğrulanamıyor” / “Paketlerim'den güncel durumu kontrol edebilirsin.” | Paketlerime git; başarı/hata ikonu ve uydurma paket yok |
| Yeni ödeme flag kapalı | “Ödeme şu anda kullanılamıyor” | Yeni form yok; başlamış girişim kurtarma/sonuç yolu erişilebilir |
| Koçluk tahsilatı doğrulanmamış / tür belirsiz | “Bu paket için ödeme henüz kullanılamıyor” | Seçim/hold sessiz değiştirilmez; Paketlerim; toplam yeniden birleştirilmez |

“Paketlerim” bağlantısı `/profile/payments`. Destek kanalı doğrulanmadığı için yeni e-posta/telefon/WhatsApp adresi üretilmez. S7 failed ve manual-review tasarımları **hazır hedef**, mevcut endpoint özelliği değildir.

### Başlatma hataları

| Kanıt | Formun davranışı |
| --- | --- |
| 400 güvenli alan eşlemesi | İlgili alanın altında onaylı hata, değerler bellekte korunur, ilk hata focus |
| 400 eşlenemeyen/IP hatası | Form üstünde “Ödeme başlatılamadı. Bilgilerini kontrol edip yeniden dene.”; ham sunucu mesajı yok |
| 409 | “Paketin güncel durumu kontrol ediliyor.”; purchase/acceptance GET; sonuç netleşmeden submit açılmaz |
| 503 doğrulanmış başlatma reddi | “Ödeme hizmeti şu anda kullanılamıyor.”; durum kontrolü sonrası uygunsa manuel tekrar; otomatik POST yok |
| Ağ kopması / yanıt kaybı | Callback pending/unknown; “Tekrar öde” yok, yalnız GET ile recovery |
| Geçersiz iframe URL / bozuk yanıt | “Ödeme ekranı güvenli şekilde açılamadı.”; token tekrar yaratma yok, GET recovery |

Auth/session-expiry ortak auth akışına bırakılır. Login dönüşü aynı purchase'ı yeniden doğrular; form veya POST otomatik devam etmez. Form kişisel verisi, iframe URL/token'ı log/analytics/storage'a yazılmaz; yalnız sözleşmedeki purchaseId, merchantOid, tutorId, startedAt recovery alanları kullanılabilir.

## 6. Giriş noktaları ve geçişler

- Mevcut checkout seçim ekranının kompozisyonu korunur. S6 yalnız başarılı purchase oluşturma sonrasında uygun yeni ödeme route'una geçişi bağlar; promo, schedule, koçluk ve deneme dersi akışı yeniden tasarlanmaz.
- Paketlerim kartında pending + doğrulanmış uygunluk + girişim engeli yoksa “Ödemeye geç”; acceptance bekliyorsa “Hoca onayı bekleniyor”; bilinmeyen girişimde “Ödeme durumunu kontrol et”.
- Paid/cancelled/refunded kartlarında ödeme/retry CTA yok. Her kartın durum metni korunur; yalnız pembe nokta yeterli değil.
- Pending acceptance accepted'e döndüğünde form açılabilir, otomatik token POST yapılmaz. Focus açıklama/başlığa bir kez taşınır; kullanıcının yazdığı alandan polling nedeniyle kaçırılmaz.
- Başlamış/belirsiz girişimde unpaid cancellation gösterilmez. `can_cancel_unpaid` tek başına aktif girişim güvenliği kanıtı değildir (B04).
- Başarısız return URL + purchase paid → paid ekranı; başarılı return URL + pending → nötr doğrulama ekranı.
- Yeni ödeme flag'i kapanması sürmekte olan iframe'i sökmez ve return recovery'yi kilitlemez.

## 7. Erişilebilirlik ve yükleme

- Tek H1, sıralı H2; skip link görünür focus alır. Tab sırası görsel mantığı izler; iframe'e giriş/çıkış klavyeyle denenir.
- Tüm yeni eylemler en az 44×44 px; ana CTA 48 px. Küçük hukuki linklerde block padding, sarılınca yeterli aralık.
- Gövde, placeholder, yardımcı metin ve CTA kontrast hedefi en az 4.5:1. Form sınırı/focus hedefi en az 3:1. Renkler yalnız beyazda hesaplanmışsa pembe yüzey eşleşmesi ayrıca ölçülür.
- Durum değişimleri tek `role=status` / polite live region ile; her polling'de aynı metin yeniden anons edilmez. Ödeme finali başlığına bir defa focus; input sırasında otomatik odak atlama yok.
- Skeleton `aria-hidden`, üst bölge busy ve tek yükleme metni. Gerçek tutar gelene kadar sahte sayılar yok; card yüksekliği yakın tutulur.
- 200% metin büyütme ve 400% zoom/reflow; 320 px genişlikte yatay taşma yok. Body/iframe alanında sonucu gizleyen sabit height yok.
- Mobile keyboard açıkken aktif alan ve CTA kaydırılarak erişilebilir. Modal, autofocus klavyesi ve body scroll lock eklenmez.
- Reduced-motion: sabit yükleme simgesi/metni, shimmer/transform yok; bilgiyi yalnız animasyon taşımaz.
- Dark theme'de açık checkout yüzeyinin bütün foreground çiftleri doğrulanır. PayTR iç UI'ı HOCAM CSS ile yeniden renklendirilmez.

## 8. Uygulama kabul senaryoları ve sorumlular

Bunlar S0-V'de çalıştırılmış browser testleri değildir; ekranlar kodlandığında zorunlu kanıt listesi. S0-V wireframe/spec teslimidir, gerçek ekran görüntüsü onayı yerine geçmez.

| Senaryo | Beklenen görsel / davranış | Bölüm |
| --- | --- | --- |
| 320×568, 375×812 | Tek sütun, toplam açık, detay katlanır, CTA sarılır; yatay taşma yok | S3 |
| 768×1024, 1440×900 | 768 tek sütun; 1440 form + 360 px özet; hizalı kart başlangıçları | S3 |
| Çok uzun öğretmen adı / 1.234.567,89 ₺ / çok satırlı hata | İçerik kesilmez, değer ayrı satıra geçebilir, kart büyür | S3 |
| Boş/yanlış form; yalnız klavye; 200% metin | İlk hataya focus, label ve hata ilişkisi, görünür ring | S3 |
| Hızlı çift tıklama / Enter | Tek request; aynı yükseklikte starting CTA | S3–S4 |
| Iframe 3DS / mobil klavye / uzun banka içeriği | Kontroller örtülmez, resize ve scroll erişilebilir | S4/S8 |
| 45 saniye geçmesi | Iframe kalır, GET kontrol eylemi; başarısızlık/retry iddiası yok | S4 |
| Return success + pending; return fail + paid | Sırasıyla nötr ve başarı; URL sonucu belirlemez | S5 |
| Reload / login dönüşü / metadata yok / başka kullanıcı | Yeniden sahiplik kontrolü; kişisel veri sızıntısı veya otomatik POST yok | S4–S5 |
| Acceptance pending/rejected/expired/withdrawn/cancelled | Matristeki engelli durum; ödeme formu yok | S4/S6 |
| Query error / 400 / 404 / 409 / 503 / network unknown | Onaylı farklı hata yolları; generic ham backend hatası yok | S4–S5 |
| Paid / cancelled / refunded | Doğru ikon/metin, ödeme kontrolü yok | S4–S6 |
| Failed / review | Yalnız doğrulanmış S7 sözleşmesiyle; review'da retry yok | S7 |
| Flag kapalı / koçluk engeli | Yeni ödeme kapalı, başlamış girişim kurtarılabilir | S4/S6 |
| Gece teması / reduced-motion / screen reader | Okunur renk çiftleri, hareket azaltma, tek durum anonsu | S3–S8 |

Browser kanıtı yalnız sentetik fixture veya doğrulanmış staging test hesabıyla üretilir; ad/adres/telefon/kart/token içermez. Her viewport için form-ready, hata, iframe kabuğu ve sonuç durumlarının screenshot yolu + commit SHA + test sonucu S8 kaydına eklenir. Mock iframe görüntüsü gerçek PayTR/3DS testi diye etiketlenmez.

## 9. Devredilecek kararlar

S1 API/tip/kapalı bayrakla devam eder; bu bölüm ödeme route'u veya global tasarım değişikliği gerektirmez. S2 bu matrisin koşullarını saf durum mantığına taşır. S3 form/summary/yerel erişilebilir CTA, S4 iframe/uygunluk, S5 sonuç, S6 giriş noktaları, S7 gerçek attempt verisiyle ilerler.

B01–B06 backend bağımlılıkları [sözleşmede](PAYTR_CONTRACT.md) açık kalır. S0-V bunları çözülmüş saymaz; endpoint, finansal hak, iade süresi veya yeni ödeme yöntemi yaratmaz. Sonraki uygulayıcı mod/model/branch için [plan tablosunu](PAYTR_FRONTEND_PLAN.md), mevcut commit/PR ve testler için [devir kaydını](PAYTR_HANDOFF.md) kullanır.

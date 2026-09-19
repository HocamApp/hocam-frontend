# HOCAM PayTR Frontend Uygulama Planı

**Hazırlanma:** 17 Eylül 2026\
**Kapsam:** PayTR frontend entegrasyonu, görsel kalite, test ve operasyon devri.\
**Araçlar:** Claude Code veya Codex.\
**S0 başlangıcı:** frontend `f90874d01b5b83facbac9bfb4a3be2f20bc6ba44`.\
**Backend referansı:** [PR #163](https://github.com/HocamApp/hocam-backend/pull/163), `e1e36966eed5690957fa36018216ef9dcb765011`; S0 incelemesinde açık.

Bu belge 17 Eylül konuşmasında kabul edilen planın tarihsel temelidir. S0/S0-V ve S1–S6 main'de;
S8/S9 gerçek staging/operasyon kabulü kapanmadı. Kullanıcı 19 Eylül kalan işlerin uygulanmasını
yetkilendirdi: güncel sıra ve bölüm kapıları [kalan işler planında](PAYTR_REMAINING_WORK.md),
backend teslimleri [K4 paketinde](PAYTR_BACKEND_HANDOFF.md). Teslimat/PR durumu devir
kaydındadır. Belgede yazan hedef davranışlar mevcut üründe uygulanmış sayılmaz.

## Okuma sırası ve kaynaklar

1. Repo kökündeki `AGENTS.md`, `AI_AGENT_RULES.md` ve [güncel ürün durumu](../current-product-and-technical-state.md).
2. Bu plan.
3. [Doğrulanmış API sözleşmesi ve bağımlılıklar](PAYTR_CONTRACT.md).
4. [İlerleme, test ve devir kaydı](PAYTR_HANDOFF.md).
5. [Yayın ve operasyon devri](PAYTR_RELEASE_RUNBOOK.md).
6. [Arkadaşın gönderdiği kaynak yol haritası](PAYTR_FRONTEND_SOURCE_ROADMAP.md).
6. [S0-V görsel ekran sözleşmesi](PAYTR_VISUAL_SPEC.md): ölçüler, wireframe, bileşenler, metinler ve durum matrisi.

Kaynak yol haritası tarihsel referanstır. Bu planın nötr sonuç metni, belirsiz ağ hatasında retry ve koçluk tahsilat kapısı gibi açık kararları uygulanır. API'nin gerçekte sunduğu davranış için commit'e sabitlenmiş sözleşme esas alınır. Hiçbir belge backend'de olmayan endpoint'i var kabul etme yetkisi vermez.

## 1. Amaç ve sınırlar

Öğrenci mevcut checkout'ta paket talebi oluşturur. Öğretmen onayı gerekiyorsa bekler; onay gerekmiyorsa veya kabul geldiyse aynı satın alma için `/package-purchases/[purchaseId]/pay` adresine gider. PayTR iframe'i üzerinden ödeme yapar. Sonuç yalnız backend satın alma durumundan doğrulanır.

Bölümler **devredilebilir fakat bağımlılık sırasına bağlıdır**. Araç değişikliği yeni ürün kararı, yeni branch veya işin yeniden uygulanması anlamına gelmez.

### Değişmez ödeme kuralları

- Başarı yalnız `purchase.status === "paid"` olduğunda gösterilir. Return URL, iframe olayı, yerel kayıt ve kalan kredi tek başına ödeme kanıtı değildir.
- Son tutar oluşturulmuş satın almanın `total_price` alanından gelir; hoca fiyatından tekrar hesaplanmaz.
- Onay gerekiyorsa sunucudan `accepted` doğrulanmadan ödeme başlamaz. Onay sorgu hatası ödeme izni değildir.
- Retry aynı purchase ID için yeni PayTR girişimidir; paket oluşturma POST'u değildir.
- Timeout, ağ kopması ve pencere kapatma belirsiz sonuçtur. Otomatik tahsilat tekrarı yapılmaz.
- Kart, CVV, OTP ve 3D Secure bilgileri yalnız PayTR iframe'inde kalır.
- Merchant key/salt frontend'e gelmez. Ad, telefon, adres, iframe URL/token'ı log, analytics ve browser storage'a yazılmaz.
- Token POST'u yalnız açık kullanıcı eylemiyle çalışır; mount, focus, render veya otomatik mutation retry ile çalışmaz.
- Başlamış girişimlerin kurtarması frontend yeni-ödeme bayrağı kapansa bile erişilebilir kalır.
- Desteklenmeyen ödeme yöntemi, sözleşme kaydı, fatura, vergi veya iade vaadi eklenmez.

### Korunacak akışlar

Promosyon önizleme ve invalidation, koçluk quote/hold/idempotency ve fiyat değişimi, schedule serialization, login returnUrl, deneme dersi, mevcut kredi rezervasyonu ve admin test kredileri korunur. Genel API/auth modülü yeniden tasarlanmaz. Öğretmen kazancı para gibi gösterilmez.

**Kapsam dışı:** backend callback geliştirme, payout/komisyon, refund yürütme, fatura/vergi hesabı, genel site redesign'ı ve alakasız refactor.

### Backend bağımlılıkları ve varsayılanlar

Frontend mevcut API ile ilerler. Öğrenciye açık girişim durumu; eşzamanlı girişim/paket oluşturma; belirsiz sonuç sonrası retry; aktif ödeme sırasında unpaid cancellation; koçluk toplamı ve aktivasyonu backend sahibinin bağımlılıklarıdır. Ayrıntılar sözleşme belgesindedir.

**Koçluk:** mevcut seçim ve hold korunur. Koçluk içeren paketin tahsilat/aktivasyon sözleşmesi doğrulanana kadar o satın almada PayTR başlatılmaz. Koçluk sessizce çıkarılmaz; toplam istemcide birleştirilmez. Bilginin eksikliği “lesson-only” diye yorumlanmaz.

## 2. Görsel sözleşme

### Referanslar ve kanıt sınırı

17 Eylül 2026'da Cambly'nin açık paket ekranı ve Preply'nin açık tutor sayfası tarayıcıda incelendi. Preply'nin oturum içi son ödeme ekranı doğrudan doğrulanmadı.

- [Cambly paket ekranı](https://www.cambly.com/en/subscribe): içerik ve süre/fiyatın ayrılması, seçili seçeneğin ve CTA'nın belirginliği.
- [Preply açık arayüz](https://preply.com/en/online/english-tutors): başlık hiyerarşisi, öğretmen kimliği, boşluk ve belirgin ana eylem.
- [Preply ödeme açıklaması](https://help.preply.com/en/articles/15432866-how-and-when-will-i-be-charged): ödeme öncesinde tutar dökümünü gösterme.
- [Cambly ödeme açıklaması](https://studentsupport.cambly.com/hc/en-us/articles/360000300923-How-to-subscribe-payment-options): plan seçimi ve ödeme adımı.

Bunlar ürün referanslarıdır; resmî bir endüstri sertifikasyonu değildir. Abonelik/yenileme kuralları HOCAM'a aktarılmaz. Rakip marka/varlıkları ürün içine kopyalanmaz.

| Alan | Karar |
| --- | --- |
| Marka | Mevcut HOCAM fontu, pembe CTA, açık zemin ve checkout token'ları |
| Masaüstü ödeme | En fazla 1120 px içerik; solda form/iframe, sağda yaklaşık 360 px özet |
| Dar ekran | 1024 px altında tek sütun; yan boşluklar 320 px ekranda taşma yaratmaz |
| Mobil özet | Öğretmen, paket ve toplam üstte; ayrıntılı döküm açılabilir |
| Fiyat | “Toplam ödeme” en güçlü tutar; indirimler ikincil; otomatik yenilenmeme açıklaması yakınında |
| Form | Kalıcı etiket, en az 16 px input metni, en az 44 px etkileşim hedefi |
| CTA | Token isteği: “Güvenli ödemeye geç”; gerçek kart işlemi PayTR içinde |
| Iframe | Kontrolleri kapatan overlay veya sabit HOCAM ödeme butonu yok |
| Durum | İkon + başlık + açıklama + uygun eylem; anlam yalnız renge bağlı değil |
| Hareket | Sakin kısa geçiş, reduced-motion; ödeme başlatan gösterişli animasyon yok |

Sabitlenmiş global font/palet değiştirilmez. Yeni ödeme düzeni mevcut shell/token'ları kullanır; ödeme sayfası için gereken yerleşim, mevcut seçim ekranını zorla iki sütuna çevirmez. PayTR'nin iç UI'ı sağlayıcının kontrolündedir.

**Görsel kabul:** 320×568, 375×812, 768×1024, 1440×900; uzun hoca adı, büyük tutar, çok satırlı hata, loading ve tüm sonuç durumları. Yatay taşma, kesilen iframe, örtülen CTA olmamalı. Mobil klavye, focus, ekran okuyucu durumları ve banka/3D Secure erişimi incelenmeli. Ekran görüntüsü kontrolü yapılmadan görsel iş tamamlanmaz.

## 3. Mod, model, branch ve sıra

Plan modu inceleme/karar içindir. Dosya, kod, test, commit ve PR işlemleri normal modda yapılır. Her bölümde tek araç yeterlidir; alternatif sütunlar iki aracı birden kullanma zorunluluğu değildir.

Kritik ödeme mantığında GPT-6 Astra High veya Claude Opus 5 High; sınırlı API/form işinde Astra Medium veya Sonnet 5 High önerilir. Hesaptaki erişim farklı olabilir; gerçek kullanılan model devir kaydına yazılır. [Claude model seçimi](https://code.claude.com/docs/en/model-config), [OpenAI model rehberi](https://developers.openai.com/api/docs/guides/latest-model).

| Bölüm | Teslimat | Mod | Codex / Claude | Branch |
| --- | --- | --- | --- | --- |
| S0 | Sözleşme, başlangıç, devir belgeleri | Plan → normal | Astra High / Opus High | `agent/paytr-00-contract-20260917` |
| S0-V | Görsel ekran sözleşmesi | Plan → normal | Astra High / Opus High | `agent/paytr-00-visual-20260917` |
| S1 | API, tipler, bayrak | Normal | Astra Medium / Sonnet High | `agent/paytr-01-api-20260917` |
| S2 | Durum mantığı, kurtarma | Normal | Astra High / Opus High | `agent/paytr-02-state-20260917` |
| S3 | Form, paket özeti, hukuki linkler | Normal | Astra Medium / Sonnet High | `agent/paytr-03-form-20260917` |
| S4 | Ödeme route'u, iframe, polling | Normal | Astra High / Opus High | `agent/paytr-04-checkout-20260917` |
| S5 | Dönüş sayfaları | Normal | Astra High / Opus High | `agent/paytr-05-return-20260917` |
| S6 | Checkout/Paketlerim bağlantıları | Normal | Astra High / Opus High | `agent/paytr-06-entrypoints-20260917` |
| S7 | Backend girişim durumu, retry | Plan → normal | Astra High / Opus High | `agent/paytr-07-attempt-state-20260917` |
| S8 | İnceleme, regresyon, staging | Plan inceleme → normal test/düzeltme | Astra High / Opus High | `agent/paytr-08-verification-20260917` |
| S9 | Yayın ve operasyon devri | Plan → yetkili uygulama | Astra High / Opus High | `agent/paytr-09-release-20260917` |

Varsayılan sıra: S0 → S0-V → S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9. S7 backend beklerse S8'in temel akış kontrolleri yapılabilir; tam kabul verilmez.

## 4. Bölüm teslimatları

### S0 — Sözleşme ve başlangıç

**Girdi:** kaynak roadmap, güncel main, repo kuralları, backend PR #163.\
**Dosyalar:** bu plan, `PAYTR_CONTRACT.md`, `PAYTR_HANDOFF.md`, `PAYTR_FRONTEND_SOURCE_ROADMAP.md` (hepsi `docs/payments/` altında).

- Repo/main/PR durumunu ve çalışma ağacını doğrula; mevcut çalışma branch'ini koru.
- Güncel origin/main'den ayrı worktree ve S0 branch'i aç.
- Kaynak yol haritasını kalıcı olarak sakla; yerel attachment'a bağımlılığı kaldır.
- Gerçek API sözleşmesini, referans commit'lerini, mevcut/önerilen davranış farkını yaz.
- Backend bağımlılıklarını ve test ortamı bilgisinin doğrulama durumunu kaydet. Secret okuma/kopyalama.
- Yeni worktree'de lint, typecheck ve checkout baseline'ını doğrula.
- Doküman bağlantılarını ve diff kapsamını kontrol et; repo PR/CI/merge akışını tamamla.

**Çıkış:** başka araç konuşmaya gerek duymadan devam edebilir. Frontend/backend runtime davranışı ve bayraklar değişmez.

### S0-V — Görsel teslimat

**Bağımlılık:** S0.\
**Çıktı:** [PAYTR_VISUAL_SPEC.md](PAYTR_VISUAL_SPEC.md) ve devir kaydı. Yeni ödeme CTA'sında normal metin kontrastı için mevcut koyu pembe token yerel olarak kullanılır; global palet değişmez.

- Kaynak, inceleme tarihi ve erişim sınırlarını kaydet.
- Bölüm 2'ye göre masaüstü/mobil ekran düzenini ve bileşen hiyerarşisini tanımla.
- Acceptance pending, form ready, starting, iframe, callback pending, paid, failed, review, unavailable, cancelled/refunded görünümlerini eşle.
- CTA, spacing, fiyat, focus ve loading davranışlarını somutlaştır.
- Referans görüntüleri uygulama varlığına dönüştürme; kullanıcıya ait veri içeren capture üretme.

**Çıkış:** S3–S6 uygulayıcısı tasarım yönünü yeniden seçmez.

### S1 — API, tipler ve kapalı bayrak

**Bağımlılık:** S0.\
**Alan:** `src/lib/paymentsApi.ts`, `src/types/api.ts`, PayTR flag helper, `package.json` test script'i ve ilgili belgeler.

```ts
interface StartPayTRCheckoutRequest {
  user_name: string;
  user_address: string;
  user_phone: string;
}
interface StartPayTRCheckoutResponse {
  merchant_oid: string;
  iframe_url: string;
}
declare function startPayTRCheckout(
  purchaseId: string,
  payload: StartPayTRCheckoutRequest
): Promise<StartPayTRCheckoutResponse>;
```

- Ortak axios kullan; baseURL zaten /api içerir. UI içine endpoint/fetch yerleştirme.
- `fetchPurchaseAcceptanceState` yeniden kullan; mevcut onay tiplerini toplu taşımaya girişme.
- `NEXT_PUBLIC_PAYTR_ENABLED` yalnız "true" iken açık; eksik/false kapalı.
- 400 alan, 404 unavailable, 409 state refetch, 503 hizmet ve network unknown ayrımı için PayTR'ye özel güvenli hata eşlemesi ekle.
- Ham backend exception'ını gösterme/loglama; genel hata davranışını değiştirme.
- Mevcut Node/TSX altyapısıyla `test:paytr` ekle; yeni test framework'ü kurma.
- AI_AGENT_RULES ve ürün belgesinde geliştirme/canlı aktivasyon ayrımını dar kapsamda güncelle.

**Test:** URL/metot/payload, ortak auth/CSRF instance'ı, hata eşlemesi, flag default off.

### S2 — Saf durum mantığı ve kurtarma

**Bağımlılık:** S1.\
**Alan:** `src/components/payments/paytr/paytrCheckoutState.ts`, kurtarma yardımcısı, browser storage envanteri ve testleri.

- Loading, unavailable, query error, acceptance pending/rejected, ready, starting, iframe, callback pending, paid, cancelled ve refunded durumlarını ayır.
- `paid/cancelled/refunded` ödeme kontrollerini kapatır; pending + onay sağlandıysa form açılır.
- Bilinmeyen/başarısız onay sorgusu izin vermez. Eski ready cache, yeni hata üzerine tahsilat açmaz.
- Failed dönüş, backend paid sonucunu geçersiz kılamaz.
- `attempt_failed/manual_review` yalnız S7 doğrulanmış verisiyle oluşur.
- Recovery yalnız `purchaseId, merchantOid, tutorId, startedAt` içerir; merchantOid yanıt öncesi null olabilir.
- POST'tan önce kayıt aç; yanıt gelince OID güncelle. Kayıt hesaba göre ayrılır, sahiplik backend'den doğrulanır.
- Bozuk/engellenmiş storage çökmeye yol açmaz. Eski timestamp failure kanıtı değildir.
- Ad/telefon/adres/token/iframe URL persistence ve telemetry'ye girmez. Query/mutation verisi de kalıcı depolamaya aktarılmaz.
- Yeni recovery anahtarı ve PayTR embed'i mevcut storage envanterine eklenir.

**Test:** precedence, eksik onay, bozuk storage, hesap değişimi, kaybolan token yanıtı, yalnız izinli metadata.

### S3 — Müşteri formu, özet ve hukuki açıklama

**Bağımlılık:** S0-V, S1–S2.\
**Bileşenler:** `PayTRCustomerForm`, `PayTRPurchaseSummary`, `PayTRLegalNotice`, `PayTRProcessingState`, `PayTRResultState`.

- React Hook Form + Zod; trim sonrası ad 2–60, adres 5–400 karakter.
- Telefon zorunlu; boşluk/parantez/tire temizlenir; isteğe bağlı tek baştaki + ve rakamlar kalır. Normalize uzunluk en fazla 20; ülke kodu uydurulmaz.
- Kalıcı etiket, autocomplete name/tel/street-address, bağlı hata ve ilk invalid alana focus.
- Form verisi navigasyon/reload sonrası uygulama tarafından restore edilmez.
- Pending submission disable ve ortak kilit; görsel sözleşmeye uygun responsive form.
- Öğretmen, plan, krediler, subtotal, paket/promosyon indirimi ve total purchase yanıtından gelir.
- Eksik fiyatı yeniden hesaplama; ödeme eylemini engelleyip güvenli hata göster.
- Schedule yalnız satın almaya ait server verisi mevcutsa; eski URL parametresi kesinleşmiş program değildir.
- “Tek seferlik ödeme; otomatik yenilenmez.”
- CTA öncesi /kullanim-kosullari, /mesafeli-satis-sozlesmesi, /iptal-ve-iade.
- Version/timestamp kaydetmeyen backend için sözleşme kabul checkbox'ı yok; satıcı/vergi/fatura vaadi ekleme.

**Test:** validation sınırları, Türkçe telefon biçimleri, authoritative toplam, legal link sırası, a11y ve çift submit.

### S4 — Ödeme route'u, iframe ve polling

**Bağımlılık:** S3.\
**Route:** `src/app/(checkout)/package-purchases/[purchaseId]/pay/page.tsx`.\
**Bileşen:** `PayTRFrame`; ortak React Query/state katmanı.

- Öğrenci oturumu, ownership, satın alma ve onayı doğrula; mevcut login/session expiry/returnUrl düzenini koru.
- Tek kullanıcı gönderimi → recovery metadata → token POST; retry:false ve senkron in-flight kilidi.
- Iframe URL'sini URL parser ile kontrol et: https, tam www.paytr.com origin'i, /odeme/guvenli/ yolu, boş olmayan token yolu, credentials yok.
- Geçersiz URL iframe üretmez; token/URL yalnız bellekte tutulur ve loglanmaz.
- Erişilebilir title, tam genişlik ve mobil güvenli yükseklik; gerektiğinde resmi resizer tek next/script instance'ı.
- Doğrulanmamış sandbox kısıtı ekleme. İleride CSP eklenirse gerekli frame/script izinlerini ayrıca doğrula.

**Polling:** aktif girişimde 2 saniye; purchase pending dışına çıkınca dur; 45 saniye sonra hızlı polling'i bırak, iframe'i zorla kapatma ve sonucu başarısız sayma. Manuel kontrol ve focus refetch; focus/render timer'ı sınırsız resetlemez. Unmount cleanup. Paid geldiğinde iframe yerine success, package/history invalidation. Reload kayıtlı girişimde önce refetch; otomatik token yok.

**Hata:** 400 alan/form; 404 unavailable; 409 purchase+acceptance refetch; bilinen 503 durum yeniden kontrol edildikten sonra manuel retry; network/yanıt kaybında sonuç kontrolü, kör POST yok.

**Test:** allowlist, tek iframe, double click, 45 saniye, cleanup, paid geçişi, refresh, 409/503/network.

### S5 — Başarılı/başarısız return

**Bağımlılık:** S4.\
**Route'lar:** `src/app/(checkout)/odeme/basarili/page.tsx`, `src/app/(checkout)/odeme/basarisiz/page.tsx`.

- Aynı recovery/result katmanı; route adı sonuç belirlemez.
- Metadata → owned purchase refetch → backend sonucu.
- Callback bekleniyorsa iki route'da da “Ödeme sonucu doğrulanıyor”.
- Paid ise “Ödemen onaylandı”, package/paid amount/aktif kredi ve “Paketlerime git”.
- Cancelled/refunded sonuçları başarı değildir.
- Metadata eksikse sonuç iddia etmeden Paketlerim'e güvenli çıkış.
- Metadata yalnız terminal server sonucu veya açık recovery kapatma eyleminde silinir. Paketlerim'e gitmek tek başına silme değildir.
- Auth süresi bitince girişten sonra recovery devam eder.
- Doğrulanmamış failure için “çekilmedi” veya “tekrar öde” gösterilmez.

**Test:** return/callback sıraları, failed URL + paid, delayed callback, dört route durumunda reload, kayıtsız dönüş ve yeniden giriş.

### S6 — Mevcut checkout ve Paketlerim

**Bağımlılık:** S4–S5.\
**Alan:** tutor checkout, CheckoutSummary/CheckoutSuccess, PackageRequestStatus/PackagePurchaseCard, profile/payments ve paymentHistoryCopy.

- Create success'te purchase ID sakla, acceptance sorgula; ready → pay route; bekleyen onay → mevcut pending ekranı.
- Acceptance read hatası yeni purchase POST'u üretmez.
- Aynı hoca+plan pending varsa mevcut kayda devam; yeni seçim ile eski içeriği aynıymış gibi sunma.
- Belirsiz create yanıtı sonrası listeyi kontrol et; otomatik tekrar POST yok.
- Frontend çift tıklama kilidi kullan; server yarış güvenliğini sağladığını iddia etme.
- Acceptance gerekli olduğu biliniyorsa “Paketi hocaya gönder”; gerekmiyorsa “Ödemeye devam et”; henüz bilinmiyorsa nötr mevcut CTA.
- Mobil/masaüstü CTA aynı kuralla; “Kartından anlık ödeme alınmaz” yalnız doğru aşamada.

**Paketlerim:** accepted+pending veya onay gerektirmeyen uygun pending → devam; açık/belirsiz attempt → durum kontrolü; paid → kredi/tarih, unpaid cancel yok; rejected/expired/withdrawn/cancelled/refunded → ödeme yok. Bilinen aktif girişimde çakışan unpaid cancellation sunma; global güvence backend bağımlılığıdır.

**Test:** promo, coaching hold/price_changed, schedule serialization, login returnUrl, trial, mevcut kredi, QA ve responsive CTA regresyonları.

### S7 — Öğrenciye açık girişim durumu ve retry

**Bağımlılık:** S6 + backend payment-state endpoint'i. Backend yoksa “bağımlılık bekliyor”; mock failure ile tamamlandı sayılmaz.

Önerilen wire shape sözleşme belgesindedir; gerçek endpoint yayımlanınca karşılaştır ve sabitle. `fetchPurchasePaymentState(purchaseId)` ortak API katmanına eklenir.

- pending + doğrulanmış failed + manual_review false → aynı satın alma için manuel retry.
- created/token_issued → otomatik ikinci attempt yok.
- manual_review → yeni ödeme engelli.
- attempt succeeded fakat purchase pending → doğrulama sürer, kredi/başarı uydurulmaz.
- Retry öncesi fresh state; eski attempt paid yaptıysa retry kaldırılır.
- Yeni attempt eski iframe/OID'nin yerini alır; package POST'u yapılmaz.
- Endpoint olmayan dağıtımda temel package polling ve nötr UX çalışır.
- Serbest provider failure mesajı yerine güvenli onaylı metinler; HTML injection yok.
- Manual review bilgisinin satın almadaki çözülmemiş olayları kapsaması backend ile doğrulanır.

**Test:** failed retry/same ID, geç paid, OID replacement, review, endpoint yokluğu ve çelişkili ara durumlar.

### S8 — Bağımsız inceleme ve uçtan uca kanıt

**Bağımlılık:** temel kapsam S1–S6; tam kapsam S7.

```bash
rtk npm run lint
rtk npm run typecheck
rtk npm run test:paytr
rtk npm run test:checkout
rtk npm run test:unit
rtk npm run build
```

- Yeni oturumda kritik akışı salt okunur incele; düzeltmeler bu bölümle sınırlı.
- Mock API ile tüm state/route'lar; ownership, acceptance, callback sırası, reload/back, network, double click ve auth expiry.
- Dört viewport'ta screenshot, focus, keyboard, live region, kontrast ve mobil keyboard kontrolü.
- Flag kapalıyken yeni ödeme başlatma yok; aktif girişim recovery erişilebilir.
- HTTPS staging'de PayTR test modu gerçek işlem; gerçek kart kullanılmaz.
- Onay gerekmeyen ve gereken paket, delayed callback, mobile/3DS; backend sahibi duplicate callback sonrası tek ledger/aktivasyon kanıtını doğrular.
- Koçluk ancak sözleşme bağımlılığı çözüldüyse test edilir.
- Kanıt purchase ID, OID, zaman ve sonuç içerir; secret/kart/OTP/adres/telefon içermez.

**Çıkış:** otomatik + görsel + gerçek test modu kanıtı. Mock başarı staging kanıtı değildir.

### S9 — Yayın ve operasyon devri

**Bağımlılık:** S8, tam deneyim için S7 ve açık finansal backend kapılarının çözümü.

- Belgeleri son davranışla güncelle; endpoint/flag/paket türü sınırlarını yaz.
- Staging secret/callback yapılandırması backend sahibi tarafından doğrulanır; secrets frontend'e gelmez.
- Production açılması ayrı aktivasyon kararıdır; bölüm merge'i otomatik ödeme açma yetkisi değildir.
- Backend hazır → frontend flag etkin + yeni build/deploy. NEXT_PUBLIC flag build-time'dır.
- Token hatası, uzun pending, review ve duplicate callback izleme sorumluluğu/kanıtı kaydedilir.
- Gerekli credential rotation backend/deployment sahibi tarafından yapılır; değerler rapora yazılmaz.

**Rollback:** frontend yeni girişleri kapat ve redeploy; açık girişimler için recovery ile backend callback çalışır kalsın. Maksimum attempt/retry penceresi ve uzlaştırma tamamlanınca tam provider kapatma değerlendirilir. Paid purchase/ledger değiştirilmez.

## 5. Git, test ve devir düzeni

### Her bölümün kapanış kapısı

- Başlamış bölümde aynı branch/PR; yeni bölümde bağımlılık merge'i ardından güncel origin/main.
- Tek aktif yazıcı; ayrı worktree; eski frontend kopyasında çalışma yok.
- Küçük diff; yalnız ilgili dosyaları stage et. Kör git add -A/. yok.
- İlgili testler + lint + typecheck; route/render/build değişiminde build.
- Test/CI kırmızıysa bölüm tamamlandı sayılmaz. Alakasız hata düzeltmesiyle kapsam büyütülmez.
- Repo politikasına göre PR → green checks → merge commit; main'e doğrudan commit/push yok.
- Geliştirme PR'ları boyunca production PayTR kapalı kalır.
- Main merge/deploy durumu canlı endpoint veya test işlemi kanıtı olarak sunulmaz.

### Token/araç değişiminde kayıt

```text
Bölüm ve durum:
Repo/worktree:
Branch:
Başlangıç main SHA:
Son commit SHA:
PR URL / merge SHA:
Araç ve gerçek model:
Tamamlanan adımlar:
Kalan ilk somut adım:
Değişen dosyalar:
Testler, sonuçları ve çalıştırılmayanlar:
Backend sözleşme commit'i:
Engeller:
Commit edilmemiş değişiklik:
Sonraki bölüm:
```

Doğrulanmış alt adımları commit/push et; HANDOFF'u güncelle. Bozuk/doğrulanmamış işi taşımak için tamamlanmış commit gibi sunma. Aynı makinede diğer araç worktree'den devam edebilir. Cloud'a gönderilmemiş dosyalar kendiliğinden taşınmaz: gerekiyorsa yalnız ilgili tracked diff ve yeni dosyalar açık bir paketle aktarılır. .env/secrets/node_modules taşınmaz. Ani kesintide yeni araç önce git status/diff/log ile gerçek durumu uzlaştırır.

Kendi commit SHA'sı dosyanın içine kendini referanslayamaz: devir belgesi bir önceki doğrulanmış checkpoint'i ve PR'ı tutar; nihai belge commit'i ve merge SHA Git/PR'dan doğrulanır. Eksik bilgiye hayalî SHA yazılmaz.

### Yeni oturuma verilecek talimat

```text
HOCAM PayTR planının yalnız belirtilen bölümünü ele al.
AGENTS.md, AI_AGENT_RULES.md, güncel ürün durumu ve docs/payments altındaki
PLAN, CONTRACT, HANDOFF belgelerini oku. Kaynak roadmap'i gerektiğinde aç.
Git durumunu, branch'i, commit'i ve PR'ı doğrula.
Başlamış bölümde aynı branch/PR'dan devam et; yenisinde bağımlılık merge'ini kontrol et.
Yalnız bölüm kapsamını uygula. Backend kodunu/production flag'lerini değiştirme.
Mevcut koçluk/promo/schedule/trial/kredi davranışlarını ve görsel sözleşmeyi koru.
Plan modunda incele; normal modda uygulama, test ve repo PR akışını tamamla.
HANDOFF'u güncelle. Test edilmemiş işi tamamlandı sayma.
Sonraki bölümü kendiliğinden başlatma.
```

## Genel tamamlanma ölçütü

Öğrenci paket oluşturur, gerekli onayı bekler, aynı satın almaya ödeme yapar ve sonucu backend'den doğrular. Retry yeni paket üretmez. Backend fiyatı ve kredi aktivasyonu otoritedir. Hassas ödeme verileri sızmaz; mevcut ders/koçluk akışları korunur. Mobil, erişilebilirlik, görsel inceleme, otomatik kontroller ve gerçek PayTR test modu işlemi kanıtlanır. S0 dokümantasyonu bu ürün kabulünü tek başına sağlamaz.

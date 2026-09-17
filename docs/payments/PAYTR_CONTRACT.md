# PayTR Frontend — Doğrulanmış API Sözleşmesi

**Doğrulama tarihi:** 17 Eylül 2026\
**Frontend baz SHA:** `f90874d01b5b83facbac9bfb4a3be2f20bc6ba44`\
**Backend baz SHA:** `e1e36966eed5690957fa36018216ef9dcb765011`\
**Backend PR:** [HocamApp/hocam-backend #163](https://github.com/HocamApp/hocam-backend/pull/163), incelemede **OPEN**, merge commit yok.\
**Yöntem:** yerel frontend ve GitHub'daki sabit backend commit'inin kaynak kodu okundu. Canlı ödeme API'sine istek gönderilmedi; deploy/staging doğrulanmadı.

Bu belge **mevcut kod**, **frontend hedefi** ve **backend bağımlılığını** ayırır. API'nin PR'da bulunması test veya production ortamında mevcut olduğunu göstermez.

## 1. Kaynaklar ve taşıma katmanı

- [Backend URL'leri](https://github.com/HocamApp/hocam-backend/blob/e1e36966eed5690957fa36018216ef9dcb765011/apps/payments/urls.py)
- [Başlatma ve acceptance view'ları](https://github.com/HocamApp/hocam-backend/blob/e1e36966eed5690957fa36018216ef9dcb765011/apps/payments/views.py)
- [Token payload ve return URL'leri](https://github.com/HocamApp/hocam-backend/blob/e1e36966eed5690957fa36018216ef9dcb765011/apps/payments/paytr.py)
- [Backend ayar varsayılanları](https://github.com/HocamApp/hocam-backend/blob/e1e36966eed5690957fa36018216ef9dcb765011/config/settings.py)
- Frontend: `src/lib/api.ts`, `src/lib/paymentsApi.ts`, `src/lib/coachingApi.ts`, `src/types/api.ts`.

Frontend'in ortak axios `baseURL`'i /api içerir. Helper'lar `/payments/...` kullanır; tam endpoint aşağıda /api ile gösterilmiştir. React Query UI veri akışını yürütür. Mevcut cookie/token, CSRF ve session-expiry davranışı korunur; sayfada doğrudan fetch/axios instance'ı açılmaz.

## 2. Paket oluşturma ve authoritative satın alma

### POST /api/payments/package-purchases/

Mevcut `createPackagePurchase(payload)` kullanılır. Tutor ve plan ID zorunludur; mevcut promotion_code ve schedule sözleşmesi korunur. Koçluk seçimi mevcut checkout'taki koşullu `coaching: {}` akışı üzerinden gelir; boş obje “koçluk istenmiyor” diye yorumlanmaz. S0 yeni create alanı/header/idempotency sözleşmesi icat etmez.

Mevcut kod aynı öğrenci+hoca+plan için pending kaydı kontrol eder. Bu kontrolün varlığı, eşzamanlı çoklu istek için tam yarış/idempotency garantisi olarak sunulmaz.

### GET /api/payments/package-purchases/

Mevcut `fetchPackagePurchases(): Promise<PackagePurchase[]>` öğrencinin listesini okur. Hedef ödeme route'u owned kaydı ID ile bulur; liste sorgusunun hatası “satın alma yok” sonucuna çevrilmez.

Ödeme özeti ve sonucu için mevcut alanlar:

```ts
type PackagePurchaseStatus = "pending" | "paid" | "cancelled" | "refunded";
// Tam tip src/types/api.ts içindedir:
type PaymentRelevantPurchase = Pick<
  PackagePurchase,
  | "id" | "student" | "tutor" | "plan" | "status"
  | "total_credits" | "remaining_credits" | "unit_price"
  | "subtotal_price" | "discount_amount" | "promo_discount_amount"
  | "total_price" | "created_at" | "paid_at" | "promotion_code"
>;
```

Bu alıntı belge gösterimidir; S0 yeni TypeScript tipi eklemez. Fiyatlar mevcut purchase para birimi/format helper'larıyla sunulur. Backend PayTR için `purchase.total_price * 100` kullanır; frontend tutarı tekrar hesaplamaz. Schedule purchase tipinde geri okunabilir alan olarak doğrulanmadı; yazma payload'ı veya eski URL gerçek satın alma programı yerine kullanılmaz.

Purchase için tekil GET endpoint'i bu çalışmada varsayılmaz. Girişim durumu package listesinden türetilmez.

## 3. Öğretmen onayı

### GET /api/payments/package-purchases/{purchaseId}/acceptance-status/

Frontend mevcut `fetchPurchaseAcceptanceState(purchaseId)` ve `["purchase-acceptance", purchaseId]` query ailesini kullanır. Fonksiyon coachingApi'dedir fakat URL payments altındadır; lesson-only paketlerde de kullanılır.

Mevcut frontend tipi:

```ts
interface PurchaseAcceptanceState {
  requires_tutor_acceptance: boolean;
  acceptance: {
    id: string;
    status: "pending" | "accepted" | "rejected" | "expired" | "withdrawn" | "cancelled";
    expires_at: string;
    responded_at: string | null;
    includes_coaching: boolean;
  } | null;
  purchase_status?: string;
  coaching_service_status?: string | null;
  can_withdraw?: boolean;
  can_cancel_unpaid?: boolean;
}
```

Backend, acceptance kaydı yoksa yalnız şu yanıtı verir:

```json
{"requires_tutor_acceptance": false, "acceptance": null}
```

Acceptance varsa expires_at reconciliation yapar ve yukarıdaki durumu döndürür. `purchase_status` ve iptal/withdraw alanları her yanıtta mevcut kabul edilmez.

**Frontend ödeme uygunluğu:** purchase pending ve (requires false veya requires true + accepted). Bu sonuç token POST'unun backend kontrolünü geçersiz kılamaz.

**B06 uyumsuzluk notu:** acceptance kaydı bulunmadığında read endpoint doğrudan requires false döndürüyor; token endpoint purchase.requires_tutor_acceptance true ve acceptance eksikse 409 dönüyor. Frontend 409'u refetch + güvenli engelli duruma çevirir; otomatik tekrar döngüsü kurmaz. Backend sahibi read/init tutarlılığını değerlendirmelidir.

`can_cancel_unpaid` mevcut kodda accepted + pending'e dayanır. Aktif ödeme olmadığına dair bir garanti değildir.

## 4. PayTR başlatma — PR'da mevcut

### POST /api/payments/package-purchases/{purchaseId}/paytr-checkout/

Backend authenticated kullanıcıya ait satın almayı bulur; başkasının/olmayan satın alma 404. Purchase pending değilse veya gerekli acceptance accepted değilse 409.

Frontend hedef isteği:

```ts
interface StartPayTRCheckoutRequest {
  user_name: string;    // frontend trim + 2–60
  user_address: string; // frontend trim + 5–400
  user_phone: string;   // zorunlu; normalize edilmiş, en fazla 20
}
interface StartPayTRCheckoutResponse {
  merchant_oid: string;
  iframe_url: string;
}
```

**Gerçek backend farkı:** mevcut kod boş alanları 400 ile reddeder; değerleri string'e çevirip trim eder, ad/adres/telefonu 60/400/20 karakterde **keser**. Uzunluğu aşan girişin 400 döneceği iddia edilmez. Frontend daha erken doğrular. Email oturumdaki kullanıcıdan, IP request metadata'sından gelir; frontend IP/email/amount göndermez.

Backend her uygun POST'ta yeni attempt oluşturur. Bu endpoint'te istemciye tanımlanmış idempotency header'ı veya aktif-attempt tekrar kullanım sözleşmesi yoktur.

**Yanıt:** merchant_oid ve `https://www.paytr.com/odeme/guvenli/{token}`. Token kısa ömürlü hassas veridir; response'u loglama veya persist etme.

| HTTP / durum | Kodda görülen davranış | Frontend hedefi |
| --- | --- | --- |
| 400 alan | Eksik/boş user_name/address/phone | Güvenli inline alan hatası |
| 400 IP | Geçersiz müşteri IP'si | Genel güvenli form hatası; altyapı ayrıntısı gösterme |
| 404 | Owned purchase bulunamadı | Unavailable; retry loop yok |
| 409 | Payable değil veya acceptance gerekli | Purchase/acceptance refetch; sonucu göster |
| 503 | PayTRError/ImproperlyConfigured; attempt failed kaydı | Güvenli hizmet metni; durum kontrolünden sonra manuel retry |
| Network/yanıt kaybı | İsteğin işlenip işlenmediği bilinmiyor | Nötr recovery; otomatik POST yok |

503'te mevcut backend ham `str(exc)` döndürebilir. Frontend bunu doğrudan göstermek/loglamak yerine onaylı mesaj setini kullanır. Network hatası 503 gibi kesin sınıflandırılmaz. Backend hata biçimi değişirse güvenli generic fallback çalışır.

## 5. Return URL, callback ve timeout

PR'daki return adresleri backend `FRONTEND_URL` üzerinden:
- `/odeme/basarili`
- `/odeme/basarisiz`

Return URL'lerinde purchaseId/OID query parametresi bulunmuyor. Hedef frontend yalnız izinli session recovery kaydını okur ve sahipliği yeniden doğrular. Kayıt yoksa Paketlerim'e güvenli çıkış; sonuç tahmini yok.

Callback yolu `POST /api/payments/paytr/callback/` backend içindir. Frontend callback'i çağırmaz, imza üretmez, paid state/ledger yazmaz.

**Ayarların kod varsayılanları (deploy değeri değildir):**
- `PAYTR_ENABLED=False`
- `PAYTR_TEST_MODE=True`
- `PAYTR_TIMEOUT_MINUTES=30`
- `PAYTR_MAX_INSTALLMENT=0`
- credentials boş varsayılan; gerçek değerler incelenmedi.

Frontend'in 45 saniyelik hızlı polling sınırı, backend'in 30 dakikalık token timeout varsayılanı değildir. 45 saniye geçmesi iframe'i sonlandırmaz, ödeme başarısızlığı veya güvenli retry izni oluşturmaz.

## 6. Eksik endpoint — S7 bağımlılığı

`GET /api/payments/package-purchases/{purchaseId}/payment-state/` bu referans PR'ın URL/view kodunda yoktur. Aşağıdaki yapı yalnız kaynak roadmap önerisidir:

```ts
interface PurchasePaymentState {
  purchase_id: string;
  purchase_status: "pending" | "paid" | "cancelled" | "refunded";
  latest_attempt: null | {
    merchant_oid: string;
    status: "created" | "token_issued" | "succeeded" | "failed";
    failure_message: string | null;
    created_at: string;
    completed_at: string | null;
  };
  manual_review: boolean;
}
```

S1–S6 bunu mevcutmuş gibi çağırmaz veya bir pending purchase'tan latest_attempt üretmez. Endpoint gelene kadar success purchase polling ile, çözülmemiş durum nötr UX ile gösterilir. S7 gerçek wire shape'i doğrular ve sözleşmeyi günceller.

Retry için failed + pending + review yok yeterliliği backend tarafından netleştirilmeli; eski aktif girişimler ve farklı sekmeler de hesaba katılmalıdır. Sadece “son attempt” bilgisi global yarış güvenliği kanıtı değildir.

## 7. Backend sahibine devir gereksinimleri

Bunlar bu S0'da gönderilmiş mesaj/issue veya uygulanmış backend değişikliği değildir.

| ID | Bağımlılık / kanıt | Frontend sınırı | Kapanış ölçütü |
| --- | --- | --- | --- |
| B01 | Öğrenciye açık attempt durumu yok | S7 bekler; nötr pending | Ownership-safe endpoint, wire shape ve staging yanıtları doğrulanır |
| B02 | Init her uygun POST'ta attempt yaratır | Otomatik retry yok; yerel in-flight kilit; unknown recovery | Aktif/önceki girişim ve eşzamanlı init davranışı testle belgelenir |
| B03 | Koçluk ayrı alanlar taşır; init purchase.total_price tahsil eder | Includes-coaching PayTR kapalı, seçim korunur | Gösterilen toplam = tahsilat ve doğru hak aktivasyonu kanıtı |
| B04 | can_cancel_unpaid accepted+pending; aktif attempt'i hesaba katmıyor | Bilinen girişimde iptal sunulmaz | Init/cancel/callback yarışı backend'de doğrulanır |
| B05 | Pending duplicate kontrolü tek başına concurrency garantisi değil | Create çift submit kilidi; belirsiz yanıtta liste kontrolü | Paralel create istekleri için sunucu garantisi/testi |
| B06 | Acceptance read ve init, eksik acceptance'da farklı karar verebilir | 409 refetch, loop yok | Read/init invariant'ı backend sahibi tarafından uzlaştırılır |

B03'te “tutar yanlış” diye kanıtlanmamış sonuç çıkarılmaz; kombine tahsilat/aktivasyon henüz doğrulanmamıştır. Production kabulünde çözülmemiş finansal bağımlılık “frontend butonu engelliyor” gerekçesiyle kapatılmaz.

## 8. Ortam ve doğrulama durumu

| Ortam/kanıt | S0 durumu |
| --- | --- |
| Yerel frontend | Güncel origin/main worktree; baseline sonuçları HANDOFF'ta |
| Backend PR kaynak incelemesi | Doğrulandı, PR açık |
| Staging frontend HTTPS adresi | Bu oturumda doğrulanmadı |
| Staging backend HTTPS adresi | Bu oturumda doğrulanmadı |
| PayTR panel callback yapılandırması | Bu oturumda doğrulanmadı |
| Deploy secret'ları / aktif flag değerleri | Okunmadı, değiştirilmedi |
| Gerçek PayTR test işlemi | Yapılmadı; S8 kabul kapısı |

Frontend kodundaki production API fallback adresi staging kanıtı değildir. Canlı siteye ödeme isteği göndererek test ortamı keşfi yapılmaz. Test ortamı adresleri ve deploy SHA'ları uygulama/deployment sahibi tarafından doğrulanınca bu tablo güncellenir. Ortamın hazır olmaması S0 dokümantasyonunu veya S1–S6 mock geliştirmesini engellemez; gerçek entegrasyon kabulünü engeller.

## 9. S0 değişiklik kapsamı

Yalnız Markdown dokümanları. API fonksiyonu, UI bileşeni, test runner, runtime bayrak, secret, ödeme kaydı, kredi ve backend kodu değiştirilmedi. Sonraki uygulayıcı [HANDOFF](PAYTR_HANDOFF.md) üzerinden S0-V'ye geçer; PR/commit durumunu yeniden doğrular.

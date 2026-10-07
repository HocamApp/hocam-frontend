# PayTR FE-2 — Staging gerçek test kartı planı

**Hazırlanma:** 7 Ekim 2026 · **Kapsam:** ödeme sayfası iframe'i, 3D Secure dönüşü, reload,
oturum düşmesi, iki sekme, mobil, iframe yüksekliği, erişilebilirlik.

Bu belge bir **plan**dır; içindeki hiçbir adım henüz koşulmadı. Bu tarihe kadar FE-2'de
yapılan her şey **mock ile kanıtlandı** (jsdom testleri + yerel production build üzerinde
sahte PayTR sayfasıyla Chromium; `evidence/fe2/`). "Doğrulandı" kelimesi yalnız bu planın
gerçek test kartıyla koşulan adımları için kullanılır.

## Ön koşullar (bu PR yapmaz; sahipleri)

| Koşul | Sahibi |
| --- | --- |
| Staging backend: `PAYTR_ENABLED=True`, `PAYTR_TEST_MODE=True`, `PAYTR_CHECKOUT_ALLOWLIST` içinde isimli test öğrencisi | Backend / Emin |
| Koçluk adımı (11) için ayrıca `PAYTR_COACHING_ENABLED=True` | Backend / Emin |
| PayTR panel bildirim (callback) adresi staging backend'e | Backend / Emin |
| Staging frontend `NEXT_PUBLIC_PAYTR_ENABLED=true` ile **yeniden build** + deploy (env değişikliği tek başına yetmez) | Deployment / Arda |
| Test kartları: PayTR test modu dokümanındaki kartlar; numaralar bu belgeye ve kanıta **yazılmaz** | Test sorumlusu |
| Callback/ledger sayımı: backend `python manage.py audit_paytr_payments` çıktısı | Backend / Emin |

## Cihaz / tarayıcı matrisi

| Cihaz | Tarayıcı | Genişlik |
| --- | --- | --- |
| iPhone (güncel iOS) | Safari | 375–430 |
| Android | Chrome | 360–412 |
| macOS | Safari, Chrome | 1440 |
| Windows veya macOS | Chrome, Firefox | 1440 |

Her satırda en az 1, 2, 3 ve 4. adımlar; 13. adım 2. adımla birlikte her koşuda ölçülür; 5–11 en az bir mobil + bir masaüstü satırında.

## Adımlar

| # | Adım | Beklenen | Toplanacak kanıt |
| --- | --- | --- | --- |
| 1 | Onay gerektirmeyen paket → "Ödemeye devam et" → form → "Güvenli ödemeye geç" | Tam olarak **bir** `paytr-checkout` POST; iframe açılır; odak "Kartla ödeme" başlığında | Ekran görüntüsü; DevTools Network'te POST sayısı |
| 2 | Başarılı test kartı + 3D Secure | 3DS ekranı iframe içinde açılır. Dönüş `/odeme/basarili`: **iframe içinde mi üst pencerede mi açıldığını kaydet** (iframe içindeyse sayfa kendini üst pencereye taşımalı). "Ödemen onaylandı" yalnız `payment-status` `purchase_status: "paid"` iken | Ekran görüntüleri; `GET …/payment-status/` yanıtı (PII'siz); `audit_paytr_payments`: callback sayısı, ledger kaydı 1, kredi aktivasyonu 1 |
| 3 | Başarısız kart, ardından ayrı denemede 3DS iptal | `/odeme/basarisiz`; sonuç sunucudan (`attempt_failed` veya "doğrulanıyor"); "başarılı" yok; tekrar deneme yalnız `can_retry_checkout` iken | Ekran görüntüsü; `payment-status` |
| 4 | iframe açıkken sayfayı yenile | Aynı siparişe devam formu ya da "Ödeme sonucu doğrulanıyor"; ikinci sipariş yok | `latest_attempt.merchant_oid` yenileme öncesi/sonrası aynı |
| 5 | iframe açıkken başka sekmede çıkış yap | iframe kalır (yeniden yüklenmez); "Oturumun kapandı…" notu ve "Yeniden giriş yap"; ödeme tamamlanırsa giriş sonrası sonuç görünür | Ekran görüntüsü; `payment-status` |
| 6 | Ödeme sırasında sekmeyi kapat, yeni sekmede Paketlerim | Kartta "Ödeme durumunu kontrol et"; "Paketi iptal et" yok | Ekran görüntüsü |
| 7 | İki sekmede aynı paket | İkinci sekmede ikinci "Ödemeye devam et" yok; tek tahsilat | `audit_paytr_payments` callback/ledger sayısı |
| 8 | Mobil: kart alanında klavye açık; 3DS için banka uygulamasına geçip geri dön | Alanlar ve PayTR butonu görünür kalır; dönüşte sekme odağıyla durum yenilenir | Cihaz ekran kaydı |
| 9 | Geç callback (callback'in birkaç dakika gecikmesi) | 45 sn sonra "Doğrulama beklenenden uzun sürüyor. Yeniden ödeme yapma; durumu kontrol et."; "Durumu kontrol et" ile `paid` | Ekran görüntüsü; zaman damgaları |
| 10 | VoiceOver (iOS) / TalkBack (Android) | iframe "PayTR güvenli ödeme" olarak okunur; sonuç duyurulur; odak sonuç başlığına gelir | Not veya ekran kaydı |
| 11 | Koçluklu paket (yalnız `PAYTR_COACHING_ENABLED=True`) | Gösterilen toplam = ders + koçluk; tek tahsilat | `payment-status` `amount_minor`, `lesson_amount_minor`, `coaching_amount_minor` |
| 12 | iframe yüksekliği ve kaydırma (her cihaz satırında) | **Resizer yok:** iframe 600 px tabanında; PayTR içeriği uzunsa iframe kendi içinde kayar. Kart alanları, 3DS ekranı ve PayTR'ın ödeme butonu kaydırarak erişilebilir olmalı. Yükseklik yetersizse veya sayfa + iframe çift kaydırma ödemeyi zorlaştırıyorsa sonucu kaydet ve resizer PR'ına ([#292](https://github.com/HocamApp/hocam-frontend/pull/292)) dön | Ekran görüntüsü/kaydı (mobilde klavye açıkken de) |
| 13 | 3DS başarısından "Ödemen onaylandı" ekranına geçen süre — 2. adımın her koşusunda ölçülür, **ödeme sayfası** (`/package-purchases/[id]/pay`, iframe yerini sonuca bırakır) ve **`/odeme/basarili`** için ayrı. Başlangıç: banka 3DS onayının gönderildiği an (OTP/uygulama onayı); bitiş: "Ödemen onaylandı" başlığının göründüğü an. Sonucu hangi ekranın gösterdiği de kaydedilir | Süre ≤ 45 sn (`PAYTR_FAST_POLL_WINDOW_MS`; bu pencereden sonra otomatik poll durur ve öğrenci "Durumu kontrol et"e basana ya da sekmeye dönene kadar "Ödeme sonucu doğrulanıyor"da kalır). **/odeme/basarili'de 45 sn aşılırsa dönüş ekranında yavaş polling (pencereden sonra seyrek otomatik yenileme) kararı açılır**; ödeme sayfasında aşılırsa aynı not oraya da düşülür | Saatli ekran kaydı; her ekran için ayrı süre (sn) ve koşu sayısı; süreyi ikiye ayırmak için `audit_paytr_payments` callback zaman damgası (3DS → callback) ve DevTools'ta `paid` dönen ilk `GET …/payment-status/` zamanı (callback → ekran). Bir ekran hiçbir koşuda sonucu göstermediyse o ekran için **Koşulmadı** |

## Kanıt kuralları

Runbook §5'e uyulur: purchase ID, merchant OID, zaman, sonuç, ledger/kredi sayısı, ortam.
Kart numarası, CVV, OTP, 3DS şifresi, iframe token'ı/URL'i, ad, telefon, adres **yazılmaz**.
Her adımın sonucu: **Doğrulandı** (gerçek kartla beklenen görüldü) / **Başarısız** (ne
görüldü) / **Koşulmadı**.

## Mock ile kanıtlananlar ve kanıtlanamayanlar

| Konu | Durum |
| --- | --- |
| Tek checkout POST, hiç paket POST'u; flag kapalıyken markup/istek/header main ile aynı | Mock ile kanıtlandı |
| `/odeme/*` flag açıkken `SAMEORIGIN` + `frame-ancestors 'self'`; çerçeve içindeki dönüş ekranının üst pencereye geçmesi | Mock ile kanıtlandı (sahte PayTR sayfasıyla) |
| Oturum düşünce aynı iframe öğesinin kalması, not ve returnUrl'li link | Mock ile kanıtlandı |
| payment-status'un önbelleğe güvenmemesi, sekme odağında yenilenmesi | Mock ile kanıtlandı |
| Odak ve canlı bölge davranışı | Mock ile kanıtlandı (jsdom + Chromium) |
| PayTR'ın dönüşü iframe içinde mi üst pencerede mi açtığı | Doğrulanmadı (dokümanda yazmıyor) |
| 3DS/ACS sayfalarının iframe'de çalışması | Doğrulanmadı |
| 600 px + iframe içi kaydırmanın gerçek PayTR içeriğiyle yeterli olması (resizer yok; gerekirse #292) | Doğrulanmadı |
| Fiziksel mobil klavye, ekran okuyucunun gerçek duyurusu | Doğrulanmadı |
| Callback zamanlaması, tek ledger/tek aktivasyon, aynı token'ın iki sekmede davranışı | Doğrulanmadı |
| 3DS başarısından "Ödemen onaylandı"ya geçen sürenin 45 sn poll penceresine sığması (ödeme sayfası ve /odeme/basarili ayrı) | Doğrulanmadı (13. adım) |

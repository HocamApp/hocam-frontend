# PayTR — Yayın ve Operasyon Devri (S9)

**Hazırlanma:** 18 Eylül 2026\
**Frontend referansı:** `4a61d332971fb81ed6f7835a5b4bc5f39acc67fa` (S8 merge)\
**Backend referansı:** [PR #163](https://github.com/HocamApp/hocam-backend/pull/163), `e1e36966eed5690957fa36018216ef9dcb765011` — **18 Eylül 2026 itibarıyla hâlâ OPEN**

Bu belge yayın kararını **vermez** ve hiçbir bayrağı açmaz. Frontend tarafında ödeme akışı
kodlanmış ve kapalı bayrak arkasında duruyor; bu dosya, canlıya alma sırasını, kimin neyi
doğrulayacağını, izleme listesini ve geri alma adımlarını yazar.

**Bu bölüm merge edilmesi ödemeyi açma yetkisi değildir.** Production aktivasyonu ayrı, sahibi
belli bir karardır (Arda/Emin), ve aşağıdaki ön koşullar kapanmadan başlatılamaz.

## 1. Bugünkü durum

| Alan | Durum |
| --- | --- |
| Frontend API katmanı, durum mantığı, form, route, iframe, dönüş sayfaları, giriş noktaları | Tamam (S1–S6), main'de |
| `NEXT_PUBLIC_PAYTR_ENABLED` | Tanımlı, **varsayılan kapalı**; production'da açılmadı |
| Backend PayTR başlatma ve callback | PR #163, **açık** — merge/deploy edilmedi |
| Öğrenciye açık attempt durumu (`payment-state`) | Yok (B01). S7 bu yüzden başlatılmadı |
| Gerçek PayTR test modu işlemi | Yapılmadı (S8 kapısı açık) |
| Staging URL'leri, PayTR panel callback, merchant secret'ları | Doğrulanmadı; bu oturumda okunmadı |
| Koçluk içeren paketlerde ödeme | Frontend kasıtlı olarak engelliyor (B03) |

## 2. Ön koşullar (hepsi kapanmadan aktivasyon yok)

| # | Koşul | Sahibi | Kapanma kanıtı |
| --- | --- | --- | --- |
| P1 | Backend PR #163 merge edildi ve staging'e deploy edildi | Backend sahibi | Merge SHA + deploy kaydı |
| P2 | Merchant key/salt yalnız deploy secret'ı olarak tanımlı; frontend'e hiçbir değer taşınmadı | Deployment sahibi | Secret adları (değerleri değil) + frontend env listesi |
| P3 | PayTR panelindeki callback adresi deploy edilmiş HTTPS backend'in `/api/payments/paytr/callback/` yoluna bakıyor | Backend sahibi | Panel ekran kaydı veya yazılı teyit |
| P4 | Staging'de `PAYTR_ENABLED=True`, `PAYTR_TEST_MODE=True` | Backend sahibi | Ayar dökümü (secret'sız) |
| P5 | Staging frontend `NEXT_PUBLIC_PAYTR_ENABLED=true` ile **yeniden build** edilip deploy edildi | Deployment sahibi | Build/deploy kaydı |
| P6 | Gerçek test modu işlemi uçtan uca tamamlandı (S8'in kapanmayan kapısı) | Frontend + backend sahibi | Aşağıdaki kanıt formatı |
| P7 | Duplicate callback sonrası tek ledger kaydı ve tek kredi aktivasyonu doğrulandı | Backend sahibi | Sorgu çıktısı (purchase ID + ledger sayısı) |
| P8 | Koçluk içeren paketin tahsilat ve hak aktivasyonu sözleşmesi netleşti (B03) | Backend sahibi | Yazılı sözleşme; aksi hâlde koçluk kapalı kalır |
| P9 | Kurulum sırasında herhangi bir merchant bilgisi açığa çıktıysa rotasyon yapıldı | Backend/deployment sahibi | Rotasyon tarihi (değerler raporlanmaz) |

P1–P5 ve P7 frontend'in yapabileceği işler değildir. Frontend ajanı bunları **doğrulanmış kabul
etmez**, yalnız kaydı okur.

## 3. Aktivasyon sırası

Sıra önemlidir: backend ödemeyi kabul edebilmeden frontend'in ödeme girişi açması, öğrenciyi
503'e sürer.

1. **Backend staging açılır** (P1, P4). Frontend hâlâ kapalı: kimse ödeme başlatamaz.
2. **Frontend staging açılır** (P5). `NEXT_PUBLIC_*` build-time inline edilir — env değişkenini
   değiştirmek yetmez, **yeniden build ve deploy şarttır**.
3. **Gerçek test modu işlemi** (P6): onay gerektirmeyen bir paket ve onay gerektiren bir paket
   ile; kart bilgileri yalnız PayTR iframe'inde. Gerçek kart kullanılmaz.
4. **Kanıt yazılır** (bkz. §5) ve P7 backend tarafında doğrulanır.
5. **Production kararı** proje sahiplerince verilir. Bu adım otomatik değildir.
6. **Production backend** açılır (`PAYTR_ENABLED=True`, test modu kapalı).
7. **Production frontend** `NEXT_PUBLIC_PAYTR_ENABLED=true` ile yeniden build edilip deploy edilir.
8. İlk 24 saat izleme listesi (§4) aktif takip edilir.

Araya giren her deploy sırayı bozmaz: frontend bayrağı kapalıyken merge edilen kod ödeme açmaz.

## 4. İzleme listesi

| İzlenecek | Neden | Kim bakar |
| --- | --- | --- |
| Token isteği hataları (503 / ImproperlyConfigured) | Yanlış secret veya kapalı sağlayıcı ilk burada görünür | Backend sahibi |
| 30 dakikadan uzun `pending` kalan satın almalar | Callback gelmemiş olabilir; öğrenci "doğrulanıyor" ekranında bekler | Backend sahibi |
| `manual_review` işaretli kayıtlar | Otomatik çözülmeyen ödeme; müşteriye yeni girişim açılmamalı | Backend sahibi |
| Aynı merchant OID için birden fazla callback | Tek aktivasyon garantisi (P7) burada sınanır | Backend sahibi |
| Token verilmiş ama hiç callback almamış attempt'ler | Terk edilmiş girişim oranı; 3DS sorunlarının erken işareti | Backend sahibi |
| Ödeme sayfasında JS hatası / iframe açılmama şikâyeti | Frontend regresyonu | Frontend sahibi |

Uyarı eşiği ve alarm kanalı bu belgede belirlenmedi; izleme aracı seçimi operasyon sahibinindir.

## 5. Kanıt formatı

Test ve canlı doğrulama kayıtlarında **bulunabilir**: purchase ID, merchant OID, işlem zamanı,
sonuç (paid/failed/pending), ledger kaydı sayısı, aktive edilen kredi sayısı, ortam adı.

**Bulunamaz**: merchant key/salt, iframe token'ı veya URL'i, kart numarası, CVV, OTP, 3DS şifresi,
müşterinin adı, telefonu, adresi.

Örnek satır: `staging | purchase 8f3c… | OID HOCAM… | 18.09.2026 14:12 | paid | 1 ledger | 12 kredi`

## 6. Geri alma (rollback)

Sırayla, en hafiften ağıra:

1. **Frontend yeni girişleri kapat.** `NEXT_PUBLIC_PAYTR_ENABLED=false` + yeniden build/deploy.
   Yeni ödeme başlatılamaz; başlamış girişimlerin kurtarma ve sonuç ekranları erişilebilir kalır
   (durum eşleyicisi bunu bilerek bayraktan önce değerlendirir).
2. **Backend callback'i açık bırak.** Sağlayıcıyı hemen kapatmak, iframe'in içindeki müşterinin
   meşru callback'ini de reddeder. Callback işleme, açık girişimler uzlaştırılana kadar çalışır.
3. **Uzlaştır.** Maksimum attempt/token penceresi (varsayılan 30 dakika) geçtikten sonra açık
   girişim kalmadığını doğrula.
4. **Gerekirse sağlayıcıyı tamamen kapat.** `PAYTR_ENABLED=False`.

Her durumda: ödenmiş satın almalar ve ledger kayıtları değiştirilmez, silinmez. Geri alma bir
iade mekanizması değildir.

## 7. Açık kalan bağımlılıklar

- **B01** — öğrenciye açık `payment-state` endpoint'i yok. S7 bekliyor; doğrulanmış "başarısız
  girişim" ve "inceleniyor" ekranları o gelene kadar üretilemez, frontend nötr kalır.
- **B02** — her uygun POST yeni attempt yaratıyor; eşzamanlı girişim davranışı testle belgelenmedi.
- **B03** — koçluk tahsilatı ve hak aktivasyonu doğrulanmadı; frontend o paketlerde ödemeyi kapalı
  tutuyor.
- **B04** — `can_cancel_unpaid` aktif girişimi hesaba katmıyor; frontend yalnız kendi sekmesinin
  bildiği girişimi koruyabiliyor.
- **B05** — paralel paket oluşturma için sunucu garantisi doğrulanmadı.
- **B06** — acceptance okuma ile token başlatma, eksik acceptance kaydında farklı karar verebiliyor.

Ayrıntı ve kaynak: [API sözleşmesi](PAYTR_CONTRACT.md). Bu bağımlılıklar "frontend engelliyor"
gerekçesiyle kapatılmış sayılmaz.

## 8. Devralacak ekibe kısa özet

Ödeme akışının tamamı `src/components/payments/paytr/` altında ve iki route'ta
(`/package-purchases/[purchaseId]/pay`, `/odeme/basarili`, `/odeme/basarisiz`). Değişmez kurallar:
başarı yalnız backend `purchase.status === "paid"` ile gösterilir; token isteği yalnız kullanıcı
gönderimiyle yapılır; belirsiz sonuç yeniden ödeme daveti değildir; kart verisi yalnız PayTR
iframe'inde kalır; tarayıcıda yalnız dört kişisel olmayan alan saklanır. Bunlardan birini
değiştirmek isteyen, önce [planı](PAYTR_FRONTEND_PLAN.md) ve
[görsel sözleşmeyi](PAYTR_VISUAL_SPEC.md) okumalı.

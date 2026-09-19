# PayTR — Backend teslim ve kabul paketi (K4)

**Kontrol:** 19 Eylül 2026. **Kapsam:** frontend ve yazılı devir; backend kodu,
deployment ayarları ve production ödeme bayrakları değiştirilmedi. Dışarıya mesaj gönderilmedi.

[Backend PR #163](https://github.com/HocamApp/hocam-backend/pull/163) OPEN,
head `e1e36966eed5690957fa36018216ef9dcb765011`, merge SHA yok.
[URL kaynağında](https://github.com/HocamApp/hocam-backend/blob/e1e36966eed5690957fa36018216ef9dcb765011/apps/payments/urls.py)
öğrenciye açık payment-state endpoint'i bulunmuyor. Bu kaynak incelemesi deploy kanıtı değildir.
Mevcut wire shape ve kod bağlantıları [sözleşmede](PAYTR_CONTRACT.md).

## Teslimat matrisi

Her satır AÇIK. Sorumlu roller aşağıda; isim ataması henüz doğrulanmadı.
Frontend düğmesinin kilitli olması sunucu garantisi değildir.

| Kapı | Sorumlu rol | İstenen teslimat ve kabul testi | Bugünkü kanıt / engel |
| --- | --- | --- | --- |
| B01 | Backend API sahibi (isim bekleniyor) | Ownership kontrollü payment-state GET; yetkili/yetkisiz kullanıcı ve bilinmeyen purchase testleri; pending, aktif, failed, paid, manual_review, attempt yokluğu için gerçek JSON örnekleri, null/opsiyonel alanlar ve hata kodları; merge/deploy SHA | Endpoint yok; S7 wire shape sabitlenemez |
| B02 | Backend ödeme sahibi (isim bekleniyor) | Aynı purchase'a iki sekmeden eşzamanlı init testi; aktif ve belirsiz girişimde ikinci tahsilatı önleme; açık retry izninin anlamı, geç callback ve eski OID davranışı | Init kaynağı tek başına concurrency/idempotency kanıtı değil; retry kapalı |
| B03 | Backend ödeme + ürün sahibi (isim bekleniyor) | Koçluk dahil toplamın para birimi/kuruş hesabı, tek tahsilat, ders/koçluk haklarının atomik aktivasyonu, başarısızlık ve tekrar callback testleri | Sözleşme doğrulanmadı; ilk yayın lesson-only, koçluk kapalı |
| B04 | Backend ödeme sahibi (isim bekleniyor) | init/cancel/callback yarışını gerçek transaction/concurrency testiyle doğrula; aktif/belirsiz attempt'te iptal kararı, can_cancel_unpaid anlamı ve geç paid sonucu | Mevcut iptal kararı aktif attempt yokluğunu garanti etmiyor |
| B05 | Backend paket sahibi (isim bekleniyor) | Paralel package create ile tek amaçlanan purchase; duplicate/idempotency stratejisi, tekrar istek yanıtı ve farklı meşru satın almaları koruyan test | Pending ön kontrolü atomik duplicate koruması kanıtı değil |
| B06 | Backend acceptance sahibi (isim bekleniyor) | Read ve init aynı uygunluk kararını vermeli; eksik acceptance, pending, accepted, rejected, expired ve aradaki durum değişimi için test | Eksik acceptance read tarafında requires=false, init tarafında 409 olabiliyor |

## Ortam teslimi — değer değil kanıt

- PR #163 merge SHA, backend staging deploy SHA ve deployment kaydı.
- HTTPS frontend/backend staging adresleri ve test hesabının yetkili erişim yöntemi.
- Callback'in deploy edilmiş backend `/api/payments/paytr/callback/` yoluna baktığı teyidi.
- Backend staging `PAYTR_ENABLED=True`, `PAYTR_TEST_MODE=True` teyidi; secret değerleri yok.
- Frontend staging `NEXT_PUBLIC_PAYTR_ENABLED=true` ile üretilmiş build SHA.
- Test modu senaryo sonuçları ve duplicate callback sonrası **tek ledger + tek aktivasyon** kanıtı.

Bu teslimler henüz yok. Merchant key/salt, iframe token/URL, gerçek kart, OTP ve kişisel veri
bu belgeye veya test çıktısına alınmaz. Doğrulanmamış URL'ye ödeme POST'u gönderilmez.

## S7 uygulama kapısı

B01 gerçek response ve B02 retry garantisi geldiğinde sözleşme incelemesi yapılır.
Ardından ortak API katmanına `fetchPurchasePaymentState` ve gerçek tipler eklenir.
Öneri JSON'u gerçek API sayılmaz. Review/aktif/belirsiz girişim yeni ödemeyi kilitler.

Retry ancak fresh purchase + acceptance, açık frontend bayrağı, desteklenen paket ve
backend'in doğrulanmış yeniden girişim izni birlikte varsa açılır. Failed tek başına yetmez.
Aynı purchase kullanılır; yeni package POST'u yoktur; eski OID/iframe yeni attempt ile değiştirilir.
Endpoint olmayan deployment nötr purchase polling'e düşer; retry/review sonucu uydurulmaz.

Zorunlu frontend regresyonları: geç paid, failed + flag kapalı, failed + acceptance reddi,
manual_review, eski aktif attempt ve endpoint yokluğu. Bunlar bugün uygulanmış sayılmaz.

## Kanıt kaydı şablonu

Her B/P kapısı için: kapı ID, isimli sorumlu, tarih, ortam, kaynak/merge/deploy SHA,
test adı ve sonucu, temizlenmiş kanıt bağlantısı, açık engel ve sonraki adım.
Kanıt bağlantısı yoksa durum AÇIK kalır; rol ataması isimli operasyon nöbeti yerine geçmez.

Yayın kapıları, izleme ve rollback için [runbook](PAYTR_RELEASE_RUNBOOK.md);
bölüm/branch sırası için [kalan işler](PAYTR_REMAINING_WORK.md).

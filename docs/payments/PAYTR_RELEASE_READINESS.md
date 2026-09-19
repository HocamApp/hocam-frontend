# PayTR — S9-R yayın karar kaydı

**19 Eylül 2026 — Karar: BEKLE (NO-GO).** Bu karar kaydı frontend hazırlığıdır,
production aktivasyonu veya operasyon kabulü değildir. İlk yayın kapsamı lesson-only;
koçluk kapalı kalır. Arda/Emin'in ayrıca vereceği karar olmadan production açılmaz.

## Kanıt özeti

K1/K2 ödeme kilidi ve recovery düzeltmeleri main'de. K3 test koşucusu eksik/yarım
test dosyalarını başarı saymaz. K4 backend teslim paketi hazır. S8-R yerel tarayıcı
kanıtı, gerçek staging işlemiyle aynı şey değildir. Güncel PR/merge/main CI/deploy
kayıtları [devir kaydında](PAYTR_HANDOFF.md) tutulur.
Teslimat ayrıntıları [K4 backend paketinde](PAYTR_BACKEND_HANDOFF.md), operasyon sırası
[yayın runbook'unda](PAYTR_RELEASE_RUNBOOK.md), bölüm/branch/mod bilgileri
[kalan işler planında](PAYTR_REMAINING_WORK.md) bulunur.

## Yayını engelleyen kapılar

| Kapı | Durum | İstenen kapanış |
| --- | --- | --- |
| P1 | AÇIK | Backend #163 merge + staging deploy SHA |
| P2 | DOĞRULANMADI | Secret'ların yalnız backend'de tutulduğuna dair deployment sahibinin teyidi; değerler paylaşılmaz |
| P3 | DOĞRULANMADI | HTTPS backend callback yapılandırması teyidi |
| P4 | DOĞRULANMADI | Staging backend enabled + test-mode teyidi |
| P5 | DOĞRULANMADI | Doğrulanmış staging URL ve frontend enabled build SHA |
| P6 | AÇIK | Gerçek test modu: onaylı/onaysız paket, 3DS, geç callback, reload, auth expiry ve güvenli retry |
| P7 | AÇIK | Duplicate callback sonrası tek ledger ve tek hak aktivasyonu |
| P8 / B03 | KOŞULLU KAPSAM DIŞI | Lesson-only yayın; koçluk kapalı kalır. Koçluk sözleşmesi çözülmüş sayılmaz |
| P9 | KOŞULLU | İfşa yokluğu teyidi; varsa rotasyon tarihi. Bu çalışmada secret okunmadı |
| B01/B02 | AÇIK | Gerçek attempt response ve aktif/belirsiz girişim concurrency/retry garantileri |
| B04/B05/B06 | AÇIK | İptal yarışı, duplicate package ve acceptance read/init tutarlılığı testleri |
| S8 erişilebilirlik/sağlayıcı | AÇIK | Gerçek ekran okuyucu, fiziksel mobil klavye ve sağlayıcı iframe resize kabulü |
| Operasyon | AÇIK | İsimli sorumlu/yedek, mevcut alarm kanalı ve staging rollback provası |

## Operasyon teslim formu

Bu alanlar henüz sağlanmadı; varsayılan isim/kanal uydurulmadı.

- Yayın sorumlusu ve yedeği: ATANMADI.
- Backend callback/ledger inceleme sorumlusu: ATANMADI.
- Frontend hata ve iframe inceleme sorumlusu: ATANMADI.
- Mevcut alarm kanalı ve nöbet erişimi: DOĞRULANMADI.
- 30 dakikadan uzun pending taramasının sıklığı ve müdahale süresi: KARAR BEKLİYOR.
- Manual_review ve callback almayan attempt escalation yolu: KARAR BEKLİYOR.
- Staging rollback provası: YAPILMADI; eski/yeni build SHA, saat ve uygulayan bekleniyor.
- Arda/Emin production kararı, tarih ve onaylanan SHA: VERİLMEDİ.

Pending süresi frontend'in 45 saniyelik polling penceresinden ayrıdır; iki süre de
ödemenin failed olduğuna veya tekrar tahsilat yapılabileceğine kanıt değildir.

## Bir sonraki uygulama sırası

1. Backend sahibi K4 teslim paketindeki gerçek response/test/deploy kanıtlarını sağlar.
2. S7 gerçek sözleşmeye bağlanır; aynı purchase retry ve eski iframe/OID değişimi test edilir.
3. HTTPS staging'de S8 gerçek sağlayıcı ve erişilebilirlik kabulü kayıt altına alınır.
4. Backend tek ledger/aktivasyon kanıtını; operasyon sahibi alarm/nöbet/rollback kanıtını ekler.
5. Uygulanabilir P/B kapıları kapanınca Arda/Emin lesson-only production kararını verir.
6. Ancak ayrıca yetkilendirilmiş operasyon, runbook sırasıyla aktivasyonu uygular.

Bu çalışmada backend kodu, production env/bayrakları veya ödeme kayıtları değiştirilmedi;
gerçek ödeme ve dış ekibe mesaj gönderimi yapılmadı.

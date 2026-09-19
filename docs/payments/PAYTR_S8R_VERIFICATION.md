# S8-R — Yerel görsel ve etkileşim kanıtı

**19 Eylül 2026. Branch:** `agent/paytr-08-final-verification-20260919`.
**Baz:** `1fa4bbb37a77be7b5b438a76323f335e1f89bda5`.
Bu belge ve kanıtlar aynı PR'daki UI/betik değişiklikleriyle üretildi.
Normal mod, Codex; kesin model sürümü çalışma zamanında doğrulanamadı.

## Sonuç ve düzeltmeler

12 mock Chromium senaryosu başarılı. 320/375/768/1440 hazır form; 375 genişlikte
onay bekleme, koçluk engeli, paid, cancelled, refunded, unavailable, GET hatası ve gece teması.
Gerçek backend ve PayTR istekleri yok; tüm veriler sentetik. Harici ağ istekleri engellenir;
beklenmeyen istek, POST, sayfa hatası ve yatay taşma testi başarısız yapar.

- Checkout'un sabit açık renk yüzeyinde avatar fallback rengi artık gece temasından etkilenmez.
- Paket özeti masaüstünde kendi yüksekliğinde durur; görsel sözleşmeye uygun olarak sticky değildir.
- Ödeme/dönüş sayfasındaki geri/ana sayfa bağlantıları ve hukuk bağlantıları en az 44 px.
- Form klavyeyle erişilir; ilk alanın focus göstergesi vardır. Boş gönderim üç alan hatası
  oluşturur ve ad soyada odaklanır; init POST'u oluşmaz.
- Mobil fiyat dökümü Enter ile açılır ve aria-expanded güncellenir.
- Reduced-motion tercihi açık, pozitif tabindex yok. 200% CSS yazı büyütmede yatay taşma yok.
- Gece teması DOM'da gerçekten açıktır; checkout'un mevcut açık renk tasarımı korunur.

Yerel PayTR testleri 168/168, checkout testleri 10/10; lint/typecheck başarılı.
Build/PR/main kontrol durumunun kaynağı branch'in PR kaydı ve PAYTR_HANDOFF.md'dir.

## Görseller ve ham kanıt

| Görünüm | Kanıt |
| --- | --- |
| 320 mobil | [Hazır form](evidence/2026-09-19-s8r/ready-320-light.png) |
| 375 mobil | [Hazır form](evidence/2026-09-19-s8r/ready-375-light.png) |
| 768 tablet | [Hazır form](evidence/2026-09-19-s8r/ready-768-light.png) |
| 1440 masaüstü | [Hazır form](evidence/2026-09-19-s8r/ready-1440-light.png) |
| Gece teması + alan hataları | [Görsel](evidence/2026-09-19-s8r/validation-375-dark.png) |
| GET hatası | [Görsel](evidence/2026-09-19-s8r/error-375-light.png) |
| Paid sonucu | [Görsel](evidence/2026-09-19-s8r/paid-375-light.png) |

Tüm ölçümler, tarayıcı sürümü ve kayıt zamanı [results.json](evidence/2026-09-19-s8r/results.json)
içindedir. [ARIA snapshot](evidence/2026-09-19-s8r/accessibility-375-dark.txt) semantik
ağaç kontrolüdür; VoiceOver/NVDA ile dinleme testi değildir. Diğer durum/validation PNG'leri
aynı kanıt klasöründedir. Kanıtların kaynak dosya hash'leri
[source-sha256.txt](evidence/2026-09-19-s8r/source-sha256.txt) içindedir.

## Tekrarlama

Repo bağımlılıkları ve Playwright Chromium kurulu olmalıdır. Ayrı terminalde:

```sh
NEXT_PUBLIC_PAYTR_ENABLED=true NEXT_PUBLIC_API_URL=http://127.0.0.1:3999/api npm run dev -- --hostname 127.0.0.1 --port 3299
```

Ardından:

```sh
PAYTR_QA_OUTPUT=/tmp/paytr-s8r-evidence node scripts/paytr-browser-check.cjs
```

Yerel 3999 API portu route interception ile mock edilir; backend çalıştırılmaz.
Betik yalnız 127.0.0.1 taban adresini kabul eder, service worker'ları ve dış ağı engeller.
Env değerleri yalnız bu komutlara aittir; repo/production bayrakları değiştirilmez.

## Açık kabul kapıları

| Kontrol | Durum / ilk somut adım |
| --- | --- |
| VoiceOver/NVDA gerçek okuma sırası ve duyurular | YAPILMADI; staging'de isimli test sorumlusu kaydı gerekir |
| Fiziksel iOS/Android klavye, kaydırma ve görünür CTA | YAPILMADI; headless viewport fiziksel klavye kanıtı değildir |
| Gerçek PayTR iframe yükseklik/resize ve 3DS | BLOKE; doğrulanmış HTTPS staging + test modu teslimi gerekir |
| Onaylı/onaysız paket, gecikmiş callback, reload, auth expiry | Gerçek staging kabulü AÇIK; mock regresyonları yeterli değildir |
| Güvenli retry | BLOKE; B01 gerçek endpoint + B02 izin sözleşmesi gerekir |
| Duplicate callback tek ledger/aktivasyon | BLOKE; backend test/sorgu kanıtı gerekir |
| S9 operasyon kapanışı | AÇIK; isimli nöbet, mevcut alarm kanalı, pending takip ve rollback provası yok |

Bu PR yerel görsel/etkileşim bölümünü tamamlar. S8 gerçek ödeme kabulü ve S9 yayın
hazırlığı tamamlanmış değildir. Backend kodu ve production ödeme bayrakları değişmedi.

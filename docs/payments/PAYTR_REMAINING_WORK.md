# PayTR — Kalan işler ve taşınabilir bölüm planı

**19 Eylül 2026.** Yetkili kapsam frontend uygulaması + backend sahibine somut devir.
Backend kodu ve production ödeme bayrakları değiştirilmez. S0/S0-V, S1–S6 main'de;
S8 mock kontrolleri ve S9 yayın belgesi gerçek staging kabulü değildir.

## Bölümler

Branch öneki her satırda `agent/paytr-`. Her bölüm ayrı PR; araç değişince aynı
branch/PR sürdürülür. Tamamlanmış bölüm tekrar yapılmaz.

| Bölüm | Mod | Model önerisi | Branch son eki | Durum / sonraki somut adım |
| --- | --- | --- | --- | --- |
| K1 ödeme uygunluğu | Normal | Codex yüksek / Claude Opus | k1-payment-guards-20260919 | PR #278 merged, 95d8875; cached GET hatası ve 409/503/404 korumaları |
| K2 recovery/polling | Normal | Codex orta / Claude Sonnet | k2-recovery-polling-20260919 | PR #279 merged, 1fa4bbb; 45 saniye ortak deadline, terminal duruş |
| K3 test tamamlanması | Normal | Codex yüksek / Claude Opus | k3-test-completeness-20260919 | PR #280 merged, a48c616; son PR CI/Vercel başarılı |
| K4 backend devri | Sözleşme inceleme → normal belge | Codex yüksek / Claude Opus | k4-backend-handoff-20260919 | PR #281 merged, 9f5933e; main CI/Vercel başarılı; B01–B06 teslim matrisi hazır |
| S7 attempt/retry | Sözleşme inceleme → normal | Codex yüksek / Claude Opus | 07-attempt-state-20260919 | B01 endpoint yok, B02 retry garantisi yok; gerçek response teslimini bekle |
| S8-R doğrulama | Normal test/düzeltme | Codex yüksek / Claude Opus | 08-final-verification-20260919 | PR #282: 12 yerel mock/görsel senaryo başarılı; gerçek staging, fiziksel klavye ve ekran okuyucu açık |
| S9-R yayın hazırlığı | Plan → ayrıca yetkili operasyon | Codex yüksek / Claude Opus | 09-release-readiness-20260919 | PR #283: BEKLE karar kaydı hazır; operasyon kapıları ve production kararı açık |

K1/K2 main kanıtı: [CI 35437617890](https://github.com/HocamApp/hocam-frontend/actions/runs/35437617890)
başarılı; merge `1fa4bbb37a77be7b5b438a76323f335e1f89bda5` Vercel status SUCCESS.
K3 [PR #280](https://github.com/HocamApp/hocam-frontend/pull/280) son CI #35456979892
ve Vercel başarılı; önceki farklı takım deployment hatasının kök nedeni doğrulanmadı.
K4 main CI #35456940060 başarılı. Devralırken güncel checkpoint'i HANDOFF'tan oku.

Model önerisi hesapta erişilebilir eşdeğerle uygulanır. Bu çalışma Codex normal modunda;
çalışma zamanı kesin model sürümünü sunmadığından sürüm adı tahmin edilmedi.

## Kabul ve bağımlılıklar

- K1: cached pending + GET hatası yeni ödeme açmaz; 409 iki başarılı GET'e kadar,
  503 manuel GET'e kadar kilitli; 404 unavailable; çalışan iframe korunur.
- K2: reload aynı startedAt'i kullanır; 44/45 saniye, ileri saat, eski/geçersiz kayıt,
  terminal sonuç ve flag kapalı recovery korunur. Timeout ödeme sonucu değildir.
- K3: enqueue/start başarı değildir; dosya özeti, child kapanışı ve alt testler tamamlanmalı.
  Crash, erken exit, iptal ve yarım suite kırmızı; explicit skip ayrı raporlanır.
- K4: [B01–B06 teslim paketi](PAYTR_BACKEND_HANDOFF.md); gerçek response/test/deploy kanıtı
  olmadan backend garantisi varsayılmaz.
- S7: failed tek başına retry izni değil; purchase/acceptance/flag/paket/backend izin
  koşulları birlikte aranır. Endpoint yoksa nötr polling; yeni package POST'u yok.
- S8-R: 320/375/768/1440 görseller, klavye/focus, ekran okuyucu, gece teması,
  reduced-motion ve mobil klavye. HTTPS staging'de onaylı/onaysız paket, 3DS, geç callback,
  reload, auth expiry, güvenli retry ve sağlayıcının gerçek iframe resize davranışı.
  Backend duplicate callback sonrası tek ledger/aktivasyon kanıtını verir.
- S9-R: [P1–P9](PAYTR_RELEASE_RUNBOOK.md), uygulanabilir B kapıları, isimli izleme sahibi,
  mevcut alarm kanalı ve rollback provası. İlk yayın lesson-only. Production kararı Arda/Emin'de.

## Kesintiden devam

1. `PAYTR_HANDOFF.md`, mevcut branch/PR head ve check'lerini oku. Yeni araç yeni branch nedeni değil.
2. Başlanmamış bölüm için güncel origin/main'den ayrı worktree aç; başka kişinin değişikliklerini koru.
3. İlgili testleri, lint/typecheck ve gerektiğinde build çalıştır. Yeşil PR check'lerinden
   sonra merge commit; main CI/deploy'u ayrıca doğrula.
4. Devirde branch, checkpoint, PR, değişenler, testler, açık engel ve ilk somut adımı yaz.

K3 dış servis kontrolü beklerken K4 belgeleri ve S8-R yerel kontrolleri ilerleyebilir;
bu bağımsız ilerleme K3'ün tamamlandığı anlamına gelmez.
Gerçek staging ve operasyon kapıları kapanmadan “PayTR tamamlandı/canlıya hazır” denmez.
[S9-R karar kaydı](PAYTR_RELEASE_READINESS.md) açık kapıları ve isimli operasyon
teslim alanlarını toplar. PR #282/#283 güncel check/merge durumları devralırken okunur;
belge veya yerel test başarısı gerçek ödeme kabulü değildir.

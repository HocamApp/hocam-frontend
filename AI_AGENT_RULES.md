# AI Ajanları İçin Kritik Kurallar — Hocam Frontend

> Bu dosya, bu repoda çalışan herhangi bir AI kodlama ajanının (Claude Code, Codex, Cursor,
> vb.) **ilk okuması gereken dosyadır** — hem Arda hem Emin için, hangi ajanla çalışılırsa
> çalışılsın. Amaç: iki kişi paralel farklı ajanlarla çalışırken, daha önce bilinçli alınmış
> kararların yanlışlıkla geri alınmasını/bozulmasını önlemek. Bu repodaki `CLAUDE.md` /
> `AGENTS.md` dosyaları genel mimari özeti içerir ama bu dosya kadar güncel değildir —
> çelişki olursa **bu dosya kazanır**.

## 1. Ödeme / checkout — kritik

- Gerçek bir ödeme sağlayıcısı (iyzico vb.) henüz entegre değil. Checkout bir "paket talebi"
  oluşturuyor, kart bilgisi almıyor; backend'de admin manuel onaylıyordu — bu manuel onay şu
  anda geçici olarak **kapalı** (G0/G1 denetimi sürüyor, bkz. backend `AI_AGENT_RULES.md`).
  UI'da hiçbir yerde IBAN/banka/havale bilgisi **gösterme veya isteme**.
- Tek satın alma modeli: haftalık ders sayısı (2-6) × paket süresi (14/30/90/180 gün)
  matrisi. Tekli ders alımı ve "10'luk paket" kavramları tamamen kaldırıldı — `types/api.ts`'e
  `term_months` gibi eski alanları geri **ekleme**.
- Fiyat hesaplamaları backend'in Python `round()` davranışını (banker's rounding,
  round-half-to-even) birebir yansıtmalı — düz `Math.round` **kullanma**, `roundHalfToEven`
  helper'ını kullan (`src/lib/lessonPricing.ts`).
- `/admin-control` QA ekranındaki test kredisi gerçek ödeme/paket değildir. UI bunu daima
  "TEST CREDIT / ödeme alınmadı" olarak etiketler. Bu akışı checkout'a, ödeme geçmişine veya
  hoca kazanç göstergesine bağlama; yalnız server'ın `is_test_account` olarak işaretlediği
  hesaplarda kullanılır.

## 2. Kazanç/earnings gösterimi — asla ₺ olarak gösterme

- `TutorEarningsSummary.total` (backend `/api/payments/tutor/earnings/`) paket derslerinde
  HER ZAMAN 0'dır — gerçek para hareketi yok, iyzico entegrasyonu tamamlanmadan gerçek kazanç
  hesaplanamaz. **Bu alanı `formatPrice()` ile ₺ olarak asla gösterme.** Tutor dashboard'da
  (`src/app/(main)/dashboard/tutor/page.tsx`) bunun yerine `lesson_count` kullanılıyor — bu
  "eksik özellik" değil, "bilerek yanlış para göstermiyoruz" kararı. (11 Temmuz 2026'da bu
  kural bir commit'te yanlışlıkla ihlal edilip `formatPrice(earnings...)` geri gelmişti,
  merge sırasında tekrar düzeltildi — bir daha eklenmemeli.)

## 3. Kasıtlı davranışlar — bug değil, "düzeltmeye" çalışma

- Hoca kendi booking'ini tamamlandı olarak işaretleyemiyor (buton yok) — kasıtlı, tek taraflı
  öğrenci onayı + 24 saat oto-onay modeli gereği (bkz. backend kuralları).
- Paket satın alma geçmişi olmayan öğrenciye tutor profilinde gösterilen paket teaser paneli
  (`PackageOfferPanel`), ana "Ders Rezervasyonu Yap" butonuyla aynı checkout adresine gider —
  bu kasıtlı (tek ödeme yolu checkout), iki ayrı akış değil.

## 4. Kaynak dokümanlar (daha fazla detay gerekirse)

- Ders/itiraz/no-show/iade politikalarının **tek doğru kaynağı**: `DERS_POLITIKALARI_RAPORU.md`
  (proje sahiplerinde, repo dışında). Kod ile bu dokümanın açıklaması çelişirse doküman kazanır.
- Hukuk/finans/iyzico yol haritası: `2026-07-10-hocam-legal-finance-iyzico-roadmap.md` (proje
  sahiplerinde).
- Bu repodaki `CLAUDE.md` / `AGENTS.md`: genel mimari özeti var ama **güncel değil** — çelişkide
  bu dosya kazanır.
- Backend'deki eşdeğer kritik kurallar: `hocam-backend` reposunda `AI_AGENT_RULES.md`.

## 5. Genel çalışma kuralı

- Ödeme/checkout ekranına dokunan her değişiklik: küçük diff, kendi branch'i, kendi PR'ı.
  Büyük, çok-özellikli tek commit'lerin içine bu tür değişiklikleri gömmeyin.
- `main`'e push etmeden önce `git fetch origin` ile diğer kişinin paralel commit'i olup
  olmadığını kontrol edin — bu repoda sık oluyor (aynı dosyada aynı anda çalışmak özellikle
  `dashboard/tutor/page.tsx` ve `dashboard/student/page.tsx` gibi paylaşılan büyük dosyalarda
  gerçek çakışmaya yol açtı).

## 6. Git / PR akışı (Claude Code, Codex, vb. — yerel `git`/`gh` erişimi olan ajanlar)

Bu makinede zaten oturum açmış `git`/`gh` var — token istemeyin, yazdırmayın, `gh auth token`
çalıştırmayın. Cowork gibi yerel `git`/`gh` erişimi olmayan bir Claude oturumu bu işi
planlayıp görev tanımını yazabilir, ama push/merge'i burada, yerel ajan yapar; Cowork
sonrasında GitHub üzerinden bağımsızca (merge commit'i çekerek) doğrular — rapor edilen
sonuca körü körüne güvenmez, siz de öyle davranın.

Her değişiklik için:

1. `which gh && gh auth status && git remote -v` ile önce yerel ortamı doğrulayın.
2. `git fetch origin --prune`, ardından `origin/main`'den `agent/<kısa-açıklama>-<tarih>`
   branch'i açın. **Asla doğrudan `main`'e commit/push etmeyin.**
3. Yalnız istenen değişikliği yapın.
4. Commit'ten önce `npm run lint`, `npx tsc --noEmit`, ve dokunulan alan için varsa
   `npm run build`/ilgili test komutunu çalıştırın. Bir şey kırılıyorsa **durun ve rapor
   edin** — bozuk/doğrulanmamış kodu commit etmeyin.
5. `git add <dosyalar>` (asla körü körüne `git add -A`/`.` — önce `git status`/`git diff`
   bakın), açıklayıcı commit mesajı.
6. `git push -u origin agent/<kısa-açıklama>-<tarih>`.
7. `gh pr create --base main --head agent/<kısa-açıklama>-<tarih> --title "..." --body "..."`.
8. `gh pr checks --watch` — kırmızı check varken merge etmeyin.
9. Checkler yeşilse `gh pr merge --merge --delete-branch` (merge commit, squash/rebase değil).
10. `git fetch origin main && git log origin/main -1` ile merge'in gerçekten indiğini
    doğrulayın.
11. Rapor: PR URL'i, merge commit SHA'sı, ne değişti (kısa), çalıştırılan lint/test
    sonucu, deploy durumu (Vercel).

---
Son güncelleme: 24 Temmuz 2026 — Git/PR akışı (§6) eklendi. Bu dosyayı güncel tutmak Arda ve
Emin'in ortak sorumluluğu — büyük bir karar/kısıt değiştiğinde buraya da eklenmeli.

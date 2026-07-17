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
- Tek satın alma modeli: haftalık ders sayısı (1-5) × paket süresi (14/30/90/180 gün)
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

---
Son güncelleme: 11 Temmuz 2026. Bu dosyayı güncel tutmak Arda ve Emin'in ortak sorumluluğu —
büyük bir karar/kısıt değiştiğinde buraya da eklenmeli.

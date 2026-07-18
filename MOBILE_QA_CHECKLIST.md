# Mobile QA Checklist — iOS Safari (gerçek cihaz)

> Amaç: Simülatör/DevTools yakalayamadığı iOS Safari'ye özgü davranışları **gerçek
> iPhone ve iPad** üzerinde doğrulamak. Arda bu listeyle test edecek.
> Emülatör bu maddelerin çoğunu yalan söyler — mutlaka gerçek cihaz.

**Test cihazları:** iPhone (Safari) + iPad (Safari, hem portrait hem landscape).
**Test hesabı:** bir öğrenci + bir hoca hesabı (auth arkası sayfalar için).
Her madde: ✅ geçti / ❌ kaldı (not düş) / — uygulanmıyor.

---

## 1. Viewport yüksekliği (dvh / adres çubuğu)
Safari'de adres çubuğu kaydırınca büzülür; `100vh` yanlış, `100dvh` doğru. Kod artık
`h-dvh-safe` / `min-h-dvh-safe` kullanıyor (fallback `100vh` → `100dvh`).

- [ ] **Login ekranı** (`/`): sayfa tam ekran, alt boşluk/çift-scroll yok. Adres çubuğu
      görünür/gizliyken form dikey ortalı kalıyor.
- [ ] **Video seansı** (`/session/[bookingId]`): siyah alan tam ekran; alt kısımda
      Safari toolbar arkasında buton/gömülü video kesilmiyor.
- [ ] **AI destek widget'ı** (sağ alt buton → aç): mobilde tam ekran açılıyor, üst/alt
      kesim yok, klavye açılınca input görünür kalıyor.
- [ ] Adres çubuğunu göster/gizle (yukarı-aşağı kaydır) — layout zıplaması minimal.

## 2. Input odak zoom'u (16px kuralı)
iOS Safari, font-size < 16px olan input'a odaklanınca sayfayı otomatik zoom yapar.
Kontrol: her form alanına dokun, **sayfa zoom yapmamalı**.

- [ ] Login: e-posta + şifre alanları — odakta zoom yok.
- [ ] Kayıt (`Hesap oluştur`): tüm alanlar + OTP/kod alanı — zoom yok.
- [ ] Hoca arama (`/tutors` → "Hoca ara"): arama input'u — zoom yok.
- [ ] Mesaj yazma (`/messages/[id]`): mesaj kutusu — zoom yok; klavye kutuyu itmiyor/örtmüyor.
- [ ] Şifre sıfırlama alanları — zoom yok.
- [ ] Not: zoom oluyorsa ilgili input `text-base` (16px) mi? `text-sm` mobilde zoom yapar.

## 3. Safe-area (çentik / home indicator)
iPhone çentik + alt home çubuğu. `env(safe-area-inset-*)` / `.pt-safe`/`.pb-safe`
utility'leri mevcut. Kontrol: sabit (fixed/sticky) öğeler çentik/çubuk **arkasında kalmıyor**.

- [ ] Alt navigasyon barı (Ana Sayfa / Hocalar / Mesajlar…) — home indicator ile çakışmıyor,
      dokunulabilir.
- [ ] Üst Navbar — çentik/status bar ile çakışmıyor.
- [ ] Filtre bottom-sheet (`/tutors` → Filtrele) — alt kısım home çubuğu arkasında kalmıyor.
- [ ] AI widget tam ekranken üst kapat butonu çentik altında kalmıyor.
- [ ] **Landscape (iPhone yatay):** sol/sağ çentik boşluğu içeriği kesmiyor.

## 4. Momentum / smooth scroll & scroll kilitleri
- [ ] Uzun listeler (hoca listesi, mesajlar) — akıcı momentum scroll, takılma yok.
- [ ] Bottom-sheet / modal açıkken **arka plan scroll kilitli** (body arkada kaymıyor).
- [ ] Modal içi scroll çalışıyor; kapanınca sayfa eski konumuna dönüyor.
- [ ] Yatay scroll satırları (sıralama chip'leri `/tutors`) parmakla kayıyor, sayfa
      genelinde yatay taşma YOK (bkz. overflow düzeltmesi).
- [ ] Pull-to-refresh sayfayı bozmuyor (özellikle seans/mesaj ekranı).

## 5. Dokunma & etkileşim (iOS'a özgü)
- [ ] `:hover` durumuna bağlı hiçbir içerik/aksiyon dokunmada erişilemez değil
      (ör. mesaj balonu yanıtla/sil — dokunmada görünür olmalı; `touch-visible` utility).
- [ ] Butonlarda "sticky hover" yok (dokunduktan sonra hover tint takılı kalmıyor).
- [ ] Çift-dokun zoom istemsiz tetiklenmiyor; buton hedefleri ≥44px (favori kalp,
      sayfalama düzeltildi).
- [ ] Tap gecikmesi (300ms) hissedilmiyor.
- [ ] Kalp/favori, tema değiştirici, akordeon başlıkları — dokunmada görsel geri bildirim
      (`active:` tint) var.

## 6. Medya & performans (gerçek cihaz + hücresel)
- [ ] Login marka animasyonu (video `hocam-login-animation.mp4`) — iOS'ta `playsInline`
      ile inline oynuyor, tam ekrana zıplama yok; oynamazsa final görsele düşüyor.
- [ ] `blackboard.jpg` arka planlı hero — yüklenme sırasında layout kayması (CLS) yok.
- [ ] Görseller yüklenirken kart yükseklikleri zıplamıyor.
- [ ] Yavaş bağlantıda (Ayarlar → Developer → Network Link Conditioner / 3G) sayfa
      kullanılabilir sürede açılıyor.

## 7. Genel regresyon (hızlı gezinti)
- [ ] `/` login → giriş → `/dashboard/student` akışı sorunsuz.
- [ ] `/tutors` liste + filtre + hoca profili + rezervasyon modalı.
- [ ] `/messages` → konuşma → mesaj gönder.
- [ ] Tema değiştir (açık/koyu) — iOS'ta renkler ve kontrast doğru.
- [ ] `prefers-reduced-motion` açık (Ayarlar → Erişilebilirlik → Hareket → Hareketi Azalt):
      animasyonlar sakinleşiyor, işlev bozulmuyor.

---

### Notlar / bilinen sınırlar
- Lighthouse/DevTools ölçümleri **masaüstü Chrome** üzerinden alındı; gerçek iOS Safari
  sonuçları (özellikle LCP/CLS ve video davranışı) farklı olabilir — bu liste onu kapatıyor.
- Login ekranında ölçülen CLS ~0.199: muhtemelen web-font swap / logo yüklenmesi. Gerçek
  cihazda madde 6'daki layout-kayması kontrolleriyle doğrula.

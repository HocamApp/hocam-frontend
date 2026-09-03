# Footer ve kamu sayfaları merge raporu

Tarih: 3 Eylül 2026

## Kapsam

- Footer’dan Kariyer ve Giriş yap bağlantıları kaldırıldı.
- Hoca Listesi, ana sayfadaki mevcut hoca bölümüne yönlendirildi; ayrı bir `/hocalar` sayfası oluşturulmadı.
- YKS, TYT Matematik ve AYT Matematik footer bağlantıları aynı listenin ilgili filtrelerine gider.
- Ücretsiz deneme dersi açıklama sayfası eklendi.
- Ders süreci, hoca doğrulama, ücretsiz deneme dersi ve iletişim sayfalarına birer destek illüstrasyonu eklendi.
- İletişim formu, doğrudan e-posta bağlantısı ve merkezdeki destek kartı korundu.
- Hoca listesindeki “En alakalı” sıralaması tüm giriş yollarında görünür hale getirildi. Masaüstünde sıralama seçenekleri satıra sarılır; seçili seçenek gizlenmez.

## YKS filtre düzeltmesi

Backend PR #144, `83041122b917db04927e7e511fd6cb04ec6903b7` merge commit’iyle ana dala alındı. `exam_type=YKS` artık TYT ve AYT hocalarının birleşimini döndürür; ders adı varsa sınav ve ders aynı Subject satırında eşleşir.

Canlı API doğrulamasında YKS filtresi tüm sayfalarda 42 tekil hoca döndürdü. Her sonuçta en az bir TYT veya AYT ders kaydı bulundu. TYT Matematik için footer ve normal filtre aynı 8 sonucu, AYT Matematik için aynı 11 sonucu aynı sırayla döndürdü.

## Frontend değişiklikleri

Frontend çalışması PR #218’de toplandı. Bu dal, footer yönlendirmeleri, ücretsiz deneme dersi, kamu sayfası illüstrasyonları, iletişim iyileştirmeleri ve sıralama görünürlüğü düzeltmesini içerir.

## Doğrulama

- Backend sınav/ders filtreleme: 6 test geçti.
- Frontend URL, sıralama ve mobil filtre kontrolleri: 7 test geçti.
- `npm run lint`, `npx tsc --noEmit` ve production build geçti.
- 375, 768 ve 1440 px kontrollerinde görseller yüklendi; yatay taşma görülmedi.
- Vercel preview kontrolü başarılı.

Mevcut ilgisiz uyarılar: tutor profilindeki eski `<img>` kullanımı, Browserslist verisi ve bazı Tailwind süre sınıfları. Bu çalışma bunlara dokunmadı.

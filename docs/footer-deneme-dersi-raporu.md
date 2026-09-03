# Footer bağlantıları ve ücretsiz deneme dersi

Tarih: 3 Eylül 2026

## Uygulanan plan

1. Footer'dan Kariyer ve Giriş yap öğeleri kaldırıldı. Üst menüdeki giriş bağlantısı korundu.
2. Hoca dizini, **Hoca Listesi** olarak değiştirildi. Yeni `/hocalar` sayfası oluşturulmadı.
3. Liste bağlantıları ana sayfanın mevcut `#ys-tutor-list-title` bölümüne gider. Başlık sabit menünün altında görünür; sayfanın başına dönülmez.
4. YKS, TYT Matematik ve AYT Matematik bağlantıları ilgili filtreleri URL'de taşır. Mevcut filtre bileşeni bu URL'yi okur; kontroller, yenileme ve tarayıcı geçmişi aynı durumu kullanır.
5. `/ucretsiz-deneme-dersi` açıklama sayfası eklendi. Masaüstü, mobil, klavye ve azaltılmış hareket davranışı doğrulandı.

## Bağlantılar

| Footer öğesi | Hedef |
| --- | --- |
| Hoca Listesi | `/#ys-tutor-list-title` |
| YKS özel ders | `/?exam_type=YKS#ys-tutor-list-title` |
| TYT Matematik özel ders | `/?subject=Matematik&exam_type=TYT#ys-tutor-list-title` |
| AYT Matematik özel ders | `/?subject=Matematik&exam_type=AYT#ys-tutor-list-title` |
| Ücretsiz deneme dersi | `/ucretsiz-deneme-dersi` |

Eski YKS/matematik bilgi sayfaları silinmedi; bu çalışma footer'ın hedeflerini değiştirir. Ücretsiz deneme sayfası canonical metadata ve public sitemap listesine eklendi.

## Filtre uygulaması

`src/lib/tutorDirectoryLinks.ts` bağlantı üretimini, URL okuma ve filtre güncellemelerini ortaklaştırır. Üst menünün arama terimi korunur; filtre temizleme işleminde ders/sınav/diğer filtreler ve eski sayfalama parametresi çıkarılır. Mevcut ana sayfa listesi kullanılır.

YKS bu bağlantıda kullanıcının istediği **TYT veya AYT** kapsamını ifade eder. Backend `GET /api/tutors/?exam_type=YKS` isteğini iki sınavın birleşimi olarak işler; ders adı varsa aynı Subject satırında eşleşmesi gerekir. KPSS/DGS/YDT bu kısayola dahil değildir. Normal TYT/AYT filtre davranışı korunur. Frontend'in sınav seçicisinde YKS (TYT ve AYT) seçeneği görünür; konu ve ders seçenekleri de bu kapsamı kullanır. Paylaşılan favori filtresi aynı sınav/ders eşleşmesini uygular.

## Deneme sayfası

- Başlık: **Hocanı tanı. Derse birlikte karar ver.**
- Dokunulabilir örnek ders akışı: Tanış / Birlikte çalış / Sorularını sor. Açıklama ve süre göstergesi seçilen adıma göre geçiş yapar. Bu alan gerçek ders sayacı değildir, açıkça örnek akış olarak etiketlenir.
- Dört rezervasyon adımı: hocayı incele, saat seç, onayı bekle, derse katıl.
- Aylık deneme hakları ve beş açılır soru.
- İki eylem bağlantısı doğrudan ana sayfadaki mevcut hoca listesine gider.

Ürün bilgileri `apps/lessons/models.py`, `apps/lessons/serializers.py`, `apps/lessons/pricing.py` ve frontend `ysHomeFacts.ts` üzerinden kontrol edildi:

- Deneme 20 dakika ve ücretsiz; ödeme/paket hakkı gerekmez.
- Her takvim ayında en fazla 3 deneme talebi; talebin oluşturulduğu ay sayılır.
- Aynı hocayla bir deneme; mevcut/önceki ders ilişkisi uygunluğu etkiler.
- Bekleyen talepler limitten sayılır; iptal edilen veya süresi dolan talepler sayılmaz.
- Hoca denemeyi açmış olmalı, müsait saat seçilmeli ve talep onaylanmalıdır.

Tasarım kaynağı kullanıcının verdiği `Hocam_Design_System_Logo_System_Added.md` dosyasıdır. Poppins, kağıt zemin, koyu yazı, ikincil gri, pembe CTA, sade kenarlık ve mevcut logo korunur. Kullanıcının açık animasyon isteği doğrultusunda giriş ve içerik geçişleri eklenmiştir; hover hareketi yoktur, azaltılmış hareket tercihinde giriş/geçiş hareketleri kapatılır. Yeni bağımlılık eklenmedi.

## Doğrulama

- Frontend lint, TypeScript ve production build geçti.
- Footer, URL filtreleri, favoriler, SEO ve mobil sınav seçimi: **27 test geçti**.
- Backend sınav/ders filtreleme ve ders listesi: **6 test geçti**, iki yeni YKS testi dahil. Testler birleşim, yinelenmeme ve dersin doğru sınav satırında eşleşmesini kapsar.
- 375/768/1440 px: yatay taşma yok; örnek akış ve açılır sorular çalışıyor.
- Klavyeden örnek akış seçimi ve FAQ açma; azaltılmış hareket tercihi doğrulandı.
- 375 px doğrudan filtreli bağlantı, yenileme ve tarayıcı geri tuşu doğrulandı.
- İzinli localhost:3000 üzerinden gerçek API ile TYT Matematik 8, AYT Matematik 11 sonuç döndü; dönen her profilin ilgili sınav ve ders eşleşmesi kontrol edildi. Sayılar test anına aittir, ürün metninde kullanılmaz.
- YKS bağlantısının URL ve listeye inişi tarayıcıda doğrulandı. Mevcut canlı backend henüz YKS birleşimini desteklemediği için 0 sonuç döndü; yeni backend'in doğru sonuç kümesi yerel API testleriyle doğrulandı.

İlk build denemesi disk doluluğu nedeniyle durdu. Yalnız bu worktree'nin yeniden üretilebilir `.next/cache` klasörü temizlendi; tekrar build başarılı oldu. Mevcut tutor `<img>`, Tailwind duration ve Browserslist uyarıları devam ediyor.

## Yayın ve yerel önizleme

Önce backend `codex/yks-liste-filtresi` dalı merge edilip yayınlanmalı; ardından frontend `codex/footer-deneme-dersi` dalı yayınlanmalıdır. YKS birleşik filtresi backend yayınına bağlıdır. Yeni migration veya ortam değişkeni yoktur.

Mevcut API CORS politikası `localhost:3000` adresine izin verir, `localhost:3107` adresine izin vermez. Bu çalışma üretim CORS ayarını değiştirmedi. Bu nedenle listeyi gerçek API ile doğrulamak için aynı frontend ayrıca **http://localhost:3000** adresinde çalıştırıldı. Deneme sayfası **http://localhost:3000/ucretsiz-deneme-dersi** üzerinden incelenebilir. 3107 önizlemesi de açık tutuldu.

Ödeme, ders hakkı ve rezervasyon kuralları değiştirilmedi; deneme sayfası mevcut kuralları açıklar. Yeni hoca listesi sayfası yoktur.

## Ek çalışma: dört sayfada illüstrasyonlar

Kullanıcının sağladığı **Thank You X Pack** içinden dört siyah çizgi illüstrasyonu seçildi. `/Users/ardagg/Desktop/DESIGN.md` doğrultusunda mevcut kağıt zemin, Poppins ve pembe eylem renkleri korundu. Her sayfada bir görsel kullanıldı:

| Sayfa | Kaynak görsel | Yerleşim ve amaç |
| --- | --- | --- |
| Ders süreci | `Day 48.PNG` | Bilgisayarla çalışan figür, başlığın yanında çevrim içi öğrenmeyi destekler. |
| Hoca doğrulama | `Day 31 (2).png` | İnceleyen gözler, belge incelemesini anlatan başlığın yanında. |
| Ücretsiz deneme dersi | `Day 31 (3).png` | Selamlaşan eller, ilk derse giden adımlar bölümünün solunda. |
| İletişim | `Day 47.PNG` | Mektup çizimi, giriş metninin yanında. Form ve ortalanmış destek kartı yerini korur. |

Kaynak PNG dosyaları `src/assets/illustrations/` altında aynen saklanır. `PublicPageIllustration`, Next Image ile ekran boyutuna uygun görsel sunar; en-boy oranını korur, görsel alanını yükleme öncesinde ayırır. Mobilde en fazla 240 px, masaüstünde en fazla 400 px kullanılır; deneme bölümündeki çizim 280 px ile sınırlandırılır. İlk ekrandaki görseller öncelikli, aşağıdaki deneme görseli lazy yüklenir. Görsellerin anlattığı bilgi bitişik metinde bulunduğu için dekoratif olarak işaretlenir. Yeni animasyon veya bağımlılık eklenmedi.

Doğrulama: lint, TypeScript ve production build geçti. Dört sayfa 375/768/1440 px genişliklerinde tarayıcıdan kontrol edildi: 12 görünümde görseller yüklendi, yatay taşma veya JavaScript sayfa hatası görülmedi. Masaüstü ve mobil ekran görüntüleri gözden geçirildi. Deneme akışındaki seçimler ve açılır sorular, iletişim formunun etkin alanları ve destek bağlantısı kontrol edildi. Bu görsel çalışma sırasında gerçek e-posta gönderilmedi; formun backend akışı değiştirilmedi.

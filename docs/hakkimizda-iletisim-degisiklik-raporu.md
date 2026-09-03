# Hakkımızda, iletişim ve genel sayfalar — çalışma raporu

Tarih: 3 Eylül 2026

## Kapsam ve teslim durumu

Bu rapor, bu çalışma boyunca Hakkımızda sayfasında yapılan yenilemeyi ve sonraki kullanıcı geri bildirimleriyle şekillenen iletişim, footer ve genel bilgi sayfası değişikliklerini toplar. Aşağıdaki açıklamalar uygulamanın son halini anlatır.

| Alan | Depo | Dal |
| --- | --- | --- |
| Arayüz, sayfalar ve bu rapor | HocamApp/hocam-frontend | `codex/hakkimizda-yenileme` |
| İletişim e-postası API'si | HocamApp/hocam-backend | `codex/iletisim-formu` |

Çalışma ayrı git worktree'lerinde yapıldı. Uygulama değişiklikleri yerel olarak doğrulandı. Bu teslim, iki depoda `main` hedefli PR üzerinden incelenmek üzere hazırlanmıştır; merge ve canlı yayın bu raporun yazımı sırasında yapılmadı. Frontend, backend endpoint'inin yayınlanmasına bağlıdır.

## 1. Hakkımızda sayfası

Yenilenen sayfa `/hakkimizda-v2` adresindedir. Mevcut `/hakkimizda` adresinin yerine otomatik geçirilmedi; önizleme sayfasının metadata ve `noindex` davranışı korundu.

Son bölüm sırası:

1. Başlık, açıklama, hoca dizinine yönlendiren buton ve kurucular.
2. Kuruluş hikâyesinin dört adımlı zaman çizelgesi.
3. Hocam'ı farklı kılan dört özellik.
4. Geri bildirim ve e-posta iletişim daveti.

### Giriş ve kurucular

- Yeni bileşen: `src/components/ui/about-section-1.tsx`.
- Üst etiket: **Hakkımızda**.
- Son başlık: **Aynı sıralardan, senin yanına**.
- Açıklama, üç kurucunun YKS hazırlığından ve uygun hocayı ararken yaşadıkları deneyimden söz eder.
- **Hocaları incele** butonu `/tutors` adresine gider.
- Fotoğraf sırası: Arda (gece), Bahadır (kampüs), Emin (şehir/açık renk kazak).
- Kullanıcının son tercihi doğrultusunda SVG kesimler yerine daha küçük, yuvarlatılmış dikdörtgen çerçeveler kullanılır. Orijinal fotoğrafların oranı ve kadrajı korunur; yüzlere ek yakınlaştırma yapılmaz.
- Fotoğraflar `public/images/about/` altında yereldir; `next/image` ile, yeniden sıkıştırma yapmayan `unoptimized` seçeneğiyle sunulur. Yapay kalite artırımı yapılmadı.
- Altlarında isimler ve **Co-founder** metni yer alır; gri renk ve Poppins yazı karakteri üst etiketle uyumludur.
- Masaüstünde fotoğraflar yan yana, mobilde tek sütundadır.
- Kelime ve fotoğraf giriş animasyonları Framer Motion ile korunur. İsim/unvan fotoğraf animasyonundan sonra yumuşakça görünür. Azaltılmış hareket tercihinde içerik doğrudan gösterilir.

### Zaman çizelgesi

- **Hikâyemiz** pill etiketi kaldırıldı.
- Başlık **Hocam'ın temelleri nerede atıldı?** olarak değiştirildi.
- Dört adım korundu: Mersin Eyüp Aygar Fen Lisesi, üniversite, 2026 kuruluşu, 2028 hedefi.
- Tamamlandı / mevcut / hedef durumları görsel ve erişilebilir etiketlerle ayrılır. 2028 hedefi gerçekleşmiş bir sonuç gibi sunulmaz.
- İlk lise açıklaması sonraki metin düzenlemesinde sadeleştirildi: uygun hocaya erişimin sınava hazırlık sürecindeki etkisini anlatır. Dört adımlı hikâye yapısı korunur.
- Tipografi ve renkler sayfaya özel stillerle DESIGN.md'ye uyarlandı; paylaşılan timeline bileşeni değiştirilmedi.
- Eski giriş, Misyon & Vizyon, Değerlerimiz ve Neden varız blokları bu önizleme sayfasından kaldırıldı.

### Hocam'ı farklı kılan özellikler

`AboutPrinciples` son halinde dört kart içerir:

- **İlk 15.000'e giren hocalar:** sıralama ve öğrencilik bilgileri belgelerle doğrulanır.
- **Hocanı tanı, kendin seç:** profil ve dersleri inceleyerek hoca seçimi.
- **Tanışma dersi ücretsiz:** deneme dersi sunan hocalarda 20 dakika ücretsiz görüşme.
- **Ders hocan, aynı zamanda koçun:** koçluk sunan hocadan ders paketine eklenen koçluk.

Sıralama ve deneme süresi mevcut ürün sabitlerinden alınır. Deneme ve koçluk metinleri, hizmeti sunan hocalara bağlı olduklarını açıkça söyler. Rakip ekran görüntülerindeki metin ve tasarım birebir kopyalanmadı.

### İletişim daveti

- Açık pembe zeminde **Hocam'ı birlikte geliştirelim.** alanı eklendi.
- Kenarlıklı e-posta pill'i `iletisim@hocamozelders.com` adresini gösterir.
- E-posta uygulaması tanımlı olmayan tarayıcılarda da seçenek sunmak için Gmail'de açma, varsayılan e-posta uygulamasını kullanma ve adresi kopyalama menüsü eklendi. Kopyalama kullanılamazsa adresi elle seçme olanağı vardır.

## 2. Çalışan iletişim formu

`/iletisim` sayfasındaki pasif **Bize yaz / Form çok yakında** alanı kaldırıldı. Kullanıcının verdiği ContactSimpleForm örneği, mevcut proje bileşenleri ve tasarım sistemiyle uyarlandı; yeni bir UI paketi kurulmadı.

Sayfa başlığı **Seni dinliyoruz.**; açıklama soru, öneri ve iş birliği taleplerini davet eder.

| Alan | Davranış |
| --- | --- |
| Ad, soyad | Zorunlu; 2–80 karakter |
| E-posta | Zorunlu; e-posta biçimi kontrol edilir |
| Telefon | İsteğe bağlı; ülke kodu seçimi, varsayılan Türkiye +90 |
| Sen kimsin? | Öğrenci, veli, hoca, kurum, diğer |
| Bizi nasıl buldun? | İsteğe bağlı; sosyal medya, Google, tanıdık önerisi, diğer |
| Mesaj | Zorunlu; 10–5000 karakter |
| Aydınlatma metni | Mevcut metne bağlantı ve okundu onayı |

Gönderim boyunca alanlar ve buton kilitlenir. Başarı yalnız API olumlu yanıt verdikten sonra gösterilir; form sıfırlanır ve durum mesajına odak taşınır. Hata halinde yazılanlar korunur ve tekrar denenebilir. Hız sınırı ve gönderim hatası için Türkçe geri bildirim vardır.

Form, sayfada ortalı ve en fazla 560 px genişliğindedir. Altında doğrudan iletişim e-postası bulunur. Kullanıcının talebiyle **Kişisel verilerinle ilgili talepler** kartı kaldırıldı. Kalan **Hesabınla ilgili bir konu mu?** destek kartı formla aynı genişliğe getirildi ve ortalandı; gereksiz ayırıcı çizgi ve fazla boşluk kaldırıldı. Destek bağlantısı `/support` adresine gider. Bu kartın kaldırılması footer'daki mevcut KVKK sayfalarını etkilemez.

## 3. E-posta backend'i

Yeni endpoint: `POST /api/support/contact/`.

- Giriş gerektirmeyen JSON endpoint'i; eski oturum/Authorization bilgisi anonim formu engellemez.
- Sunucu alanları, seçenekleri ve uzunlukları doğrular.
- Sabit alıcı `CONTACT_RECIPIENT_EMAIL`; varsayılanı **iletisim@hocamozelders.com**.
- Gönderen mevcut `DEFAULT_FROM_EMAIL`; ziyaretçinin biçimi doğrulanmış e-posta adresi yalnız `Reply-To` alanındadır. Ziyaretçinin posta kutusu sahipliği doğrulaması yapılmaz.
- Mevcut `EMAIL_*` SMTP yapılandırması kullanılır. İstemciye anahtar veya SMTP bilgisi gönderilmez.
- Konu satırı `Hocam iletişim · <kullanıcı tipi>` biçimindedir. Alanlar düz metin e-postasına eklenir.
- IP başına saatte 5 istek sınırı ve gizli honeypot alanı vardır. Limit mevcut DRF cache/proxy altyapısını kullanır.
- Sağlayıcı kabulü: HTTP 200. Geçersiz form: 400. Hız sınırı: 429. Gönderim hatası: 503.
- Console, dummy, file ve memory e-posta backend'leri gerçek gönderim yapmadığı için başarılı sonuç dönmez.
- Mesajlar uygulama veritabanına kaydedilmez; endpoint mesaj içeriğini ve iletişim bilgilerini loglamaz.
- Yeni veritabanı migration'ı veya paket bağımlılığı yoktur.

200 yanıtı sağlayıcının mesajı kabul ettiğini gösterir; gelen kutusuna teslim garantisi değildir. Teknik kullanım ayrıntıları: [contact-form.md](contact-form.md).

## 4. Kaldırılan içerikler ve diğer tasarım düzenlemeleri

- `/rehber/online-ozel-ders-ucretleri` sayfası ve içeriği silindi.
- `/basari-hikayeleri` sayfası ve içeriği silindi.
- Blog'un gerçek bir sayfası yoktu; footer'daki pasif Blog girdisi kaldırıldı.
- Bu alanlara ait footer ve ilgili sayfa referansları temizlendi. Ücret rehberi sitemap/SEO kaynak listesinden ve `llms.txt` içinden çıkarıldı. Emekliye ayrılan adresler 404 döner; yönlendirme eklenmedi.
- Ders fiyatının nerede görülebileceği hakkındaki geçerli bilgilendirme, hoca profillerine yönlendirecek şekilde korundu.
- Ders süreci, hoca doğrulama ve YKS/matematik bilgi sayfalarının ortak sunumu DESIGN.md'ye uyarlandı: kağıt zemin, koyu başlık, ikincil gri metin, pembe buton, sade kenarlıklı kartlar, Phosphor ikonları ve içerik genişliği.
- Footer'daki Sıkça sorulan sorular bağlantısı `/#merak-edilenler` olarak düzeltildi.
- Ortak navigasyon ve footer korundu. Ödeme, checkout, ders yaşam döngüsü ve kimlik doğrulama politikaları değiştirilmedi.

## 5. Tasarım ve erişilebilirlik

Poppins 400/500/700 ve mevcut tokenlar kullanıldı. Kağıt zemin `#FBF6F6`, koyu yazı `#02171A`, ikincil yazı `#5C6B6D`, pembe `#FA0050`, açık pembe `#FCE5F1` temel alınır. Form alanları ve kartlar mevcut yüzey/çizgi/radius tokenlarını kullanır.

Başlıklarda Türkçe karakterler, formda görünür etiketler, klavye odağı, durum geri bildirimi ve ilgili bağlantılar korundu. Referans tasarımdaki mavi renk, buton parlaması ve dekoratif arka plan ızgarası kullanılmadı.

## 6. Doğrulama sonuçları

| Kontrol | Sonuç |
| --- | --- |
| Frontend lint | Geçti; mevcut, ilgisiz tutor sayfası `<img>` uyarısı devam ediyor |
| TypeScript | Geçti; silinen sayfaların eski `.next` tipleri build ile yenilendi |
| Production build | Geçti; son destek kartı hizalaması dahil |
| SEO testleri | 8 test geçti |
| Footer ve ana sayfa FAQ testleri | 8 test geçti; son FAQ bağlantısı değişimi sonrası footer testleri tekrar geçti |
| Backend support testleri | 18 test geçti; 8 yeni iletişim testi dahil |
| Responsive | 375, 768, 1440 px form/sayfa kontrollerinde yatay taşma görülmedi |
| Son destek kartı hizalaması | Tarayıcıda kart ve form 560 px, merkez farkı 0 px; yatay taşma yok |
| Form gönderimi | Yerel frontend → yerel backend → gerçek SMTP sağlayıcısı, 200 yanıtı |
| Backend ulaşılamıyor | Hata gösterildi; form içeriği korundu ve tekrar gönderim açıldı |
| Silinen sayfalar | HTTP 404; footer, sitemap ve llms referansları kontrol edildi |
| About | Fotoğraf yüklenmesi, bağlantı, klavye odağı ve azaltılmış hareket davranışı kontrol edildi |

Bir adet açıkça test olarak işaretlenmiş e-posta 3 Eylül 2026'da gönderildi. Sağlayıcı kabulü doğrulandı; kullanıcının gelen kutusu/spam klasöründen teslim teyidi henüz alınmadı. Yeni bir test e-postası bu rapor hazırlanırken gönderilmedi.

Build sırasında görülen Browserslist veri yaşı ve mevcut Tailwind duration uyarıları bu çalışmanın kapsamı dışında kaldı. Bu uyarılar build'i engellemedi.

Backend PR: [HocamApp/hocam-backend#143](https://github.com/HocamApp/hocam-backend/pull/143).

## 7. Merge ve yayın sırası

1. Backend PR'ını incele ve merge et; Railway'de API yayınının tamamlanmasını bekle.
2. `EMAIL_*` ve `DEFAULT_FROM_EMAIL` mevcut işlem e-postası yapılandırmasının kullanıldığını doğrula. Alıcı varsayılanı iletişim adresidir; ihtiyaç halinde `CONTACT_RECIPIENT_EMAIL` ile değiştirilir.
3. Frontend PR'ını merge et ve Vercel yayınının tamamlanmasını bekle.
4. Yerel `NEXT_PUBLIC_CONTACT_API_URL=http://localhost:8107/api/support/contact/` değerini canlı ortama taşımayın. Normal yayında form mevcut API temel adresinin `/support/contact/` yolunu kullanır.
5. Canlı ortamda iletişim sayfasını açıp gönderim geri bildirimini ve gelen kutusuna teslimi doğrula.

Yerel önizleme frontend için `http://localhost:3107/iletisim` ve `http://localhost:3107/hakkimizda-v2`, backend için `http://localhost:8107` kullanır. Yerel `.env`/`.env.local`, kimlik bilgileri ve yerel test veritabanı PR'a dahil edilmez.

Hakkımızda yenilemesi hâlâ `/hakkimizda-v2` önizleme adresindedir. `/hakkimizda` adresine taşıma ve arama motoruna açma bu teslimde yapılmamıştır.

Geri alma gerektiğinde ilgili PR'ın merge commit'i revert edilebilir. API'yi kaldırmadan önce form kullanan frontend sürümünün geri alınması gerekir; veritabanı migration geri alma adımı yoktur.

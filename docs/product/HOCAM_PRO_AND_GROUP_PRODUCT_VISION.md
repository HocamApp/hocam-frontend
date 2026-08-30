# Hocam Pro ve Küçük Grup ürün vizyonu

> **Durum:** Product vision — implementation deferred  
> **Son güncelleme:** 29 Ağustos 2026

## 1. Yönetici özeti ve ürün ailesi

Hocam ürün ailesi üç öğrenme biçimini aynı çatı altında sunmayı hedefler:

1. **Birebir Özel Ders:** Bugün çalışan, öğrencinin seçtiği hocayla kullandığı paket ürünü.
2. **Küçük Grup:** Aynı hocayla 2–4 öğrencinin ortak programda çalışacağı gelecek ürün.
3. **Hocam Pro:** Birebir dersi soru desteği, koçluk ve gelişim takibiyle genişletecek gelecek ürün.

Checkout yalnız Birebir Özel Ders için satın alınabilir fiyat ve paket talebi gösterir. Küçük Grup ve Hocam Pro lansmana kadar kullanıcı arayüzünde tamamen gizlidir; `Yakında` etiketi, plan kartları ve karşılaştırma girişi gösterilmez.

### Geçici görünürlük kararı

Küçük Grup, Hocam Pro ve plan karşılaştırma mekanikleri kod tabanında korunur; silinmez veya ürün kapsamından çıkarılmaz. Checkout görünürlüğü `src/components/checkout/CheckoutProductPicker.tsx` içindeki `FUTURE_CHECKOUT_PLANS_VISIBLE` kararıyla kapalıdır. Ürünlerden biri gerçekten kullanıma açılmadan bu karar değiştirilmez ve arayüzde ön duyuru yapılmaz. Açılış sırasında planların fiyat, kapasite, güvenlik ve operasyon koşulları yeniden doğrulanmalı; ardından görünürlük kontrollü olarak etkinleştirilmelidir.

## 2. Aktif Birebir ürün

Bugün doğrulanmış kapsam:

- Seçilen hocayla canlı birebir ders
- Hoca müsaitliğine göre ders planlama
- Hoca ile doğrudan mesajlaşma
- Haftada 2–6 ders seçimi
- 14, 30, 90 veya 180 günlük paket süresi
- Hocaya bağlı toplam ders hakkı
- Paket süresine göre ders başına fiyat avantajı

Birebir ürün bugün AI soru çözümü, gerçek hoca soru platformu, koçluk, haftalık çalışma programı, gelişim raporu, veli görüşmesi, ödev takibi, otomatik geri bildirim, ders kaydı veya transkript vaat etmez.

## 3. Hocam Pro konumlandırması

**Ürün konumu:** Birebir özel dersleri sürekli soru desteği, haftalık koçluk ve gelişim takibiyle birleştiren kapsamlı öğrenci planı.

Planlanan özellikler:

- Sınırsız AI soru çözümü
- Sınırsız gerçek hoca soru desteği
- Haftada 1 Pro’ya dahil koçluk görüşmesi
- Aylık AI destekli gelişim özeti
- Haftada 1 veli görüşmesi hakkı
- Hoca taleplerinde öncelikli değerlendirme

Bu maddeler aktif özellik değil, ürün yönüdür. Üretime kadar fiyat, kapasite ve operasyon politikaları ayrıca onaylanmalıdır.

## 4. AI soru çözücü

- Yalnız Pro kullanıcılarına açıktır.
- Genel amaçlı sohbet ürünü olarak değil, akademik soruyu çözen ve öğreten araç olarak konumlanır.
- Metin, fotoğraf veya ekran görüntüsü kabul edebilir.
- Ders, sınav ve konu bağlamını dikkate alır.
- Sonuçla birlikte adım adım çözüm ve öğrencinin hatasının açıklamasını sunar.
- Aynı soru bağlamında devam sorularına izin verir.
- Güveni düşükse bunu açıklar ve insan soru desteğine yönlendirir.
- Yanlış cevap bildirimi ve kalite geri bildirimi sağlar.
- Doğrulanmış çözüm geçmişi gelişim özetine veri sağlayabilir.

Üretim öncesi açık gereksinimler: fair-use, rate limit, bot önleme, görsel limitleri, model maliyeti, desteklenen dersler, yaş güvenliği, çözüm doğrulama, insan hocaya eskalasyon ve AI tarafından kullanılabilecek öğrenci verisinin sınırı.

## 5. Gerçek hoca soru platformu

Pro öğrencileri akademik sorularını ders, sınav ve konu bilgisiyle gerçek öğretmenlere iletebilir. Çözüm yazılı, görselli veya ileride videolu olabilir; cevaplayan hocanın kimliği ve uzmanlığı görünür, geçmiş çözümlere yeniden erişilebilir ve yetersiz AI çözümü insan desteğine aktarılabilir.

Üretim öncesi açık kararlar: hedef cevap süresi, eşzamanlı açık soru sınırı, hoca hakedişi, sıra yönetimi, kalite kontrolü, itiraz, yoğunluk, spam, tekrar sorular, fair-use ve desteklenen dersler.

## 6. Pro talep önceliği

Doğru ürün dili **“Öncelikli değerlendirme”**dir. Pro talepleri hoca ekranında daha görünür veya aynı uygunluk düzeyindeki talepler arasında daha üst sırada olabilir. Hoca son kararı verir; uygunluk koşulları değişmez ve normal talepler gizlenmez.

“Garantili kabul”, “kesin rezervasyon”, “otomatik kabul” veya hocayı zorunlu tutan bir dil kullanılmaz. Birden fazla Pro talebinin sıralama kuralı implementasyon öncesinde tanımlanmalıdır.

## 7. Aylık gelişim özeti

Özet yalnız platformda doğrulanabilen verilere dayanır: tamamlanan dersler, devamlılık, AI/insan soru çözümleri, ders-konu dağılımı, koçluk notları, öğretmen geri bildirimleri, hedefler ve çalışma düzeni.

İçerik: o ay yapılanlar, çalışılan ve zorlanılan konular, gelişim alanları, ders/soru sayıları, gelecek ay öncelikleri ve koçla değerlendirme noktaları. AI eksik veriyi uyduramaz.

## 8. Haftalık veli görüşmesi hakkı

- Pro’ya dahil haftada en fazla 1 rezervasyon hakkıdır; gerçekleşme garantisi değildir.
- Yalnız uygun öğrenci hesabında ve veli bağlantısı varsa görünür.
- Koç, danışman veya belirlenen yetkili kişiyle yapılabilir.
- Gizlilik, öğrenci rızası ve yaş politikalarına tabidir.

Açık kararlar: görüşmeyi yapacak rol, süre, hak devri, veli hesabı, paylaşılacak veriler, iptal ve yeniden planlama.

## 9. Haftada bir koçluk

Doğru kullanıcı dili **“Haftada 1 koçluk görüşmesi Pro’ya dahil”**dir. Görüşme çalışma planı, hedef belirleme, konu önceliği, performans değerlendirmesi, motivasyon, sınav stratejisi ve gerektiğinde öğretmen koordinasyonunu kapsayabilir.

Açık kararlar: koç ataması/seçimi, görüşme süresi, hak devri, iptal, uygunluk, hakediş ve Pro iptalinde mevcut görüşmeler.

## 10. Küçük Grup vizyonu

Küçük Grup webinar veya büyük sınıf değildir. Aynı hocanın canlı dersine 2–4 öğrenci katılır. Kişi başı ücret birebirden düşük olabilir; hocanın toplam brüt geliri tek birebir derse göre anlamlı biçimde artabilir. Öğretmen grubu, katılımcıları, paketi ve programı kabul eder.

Planlanan özellikler:

- 2–4 kişilik canlı ders
- Arkadaşlarla grup oluşturma
- Uygun öğrencilerle eşleşme
- Ortak paket süresi ve haftalık sıklık
- Ortak program
- Öğretmen onayı
- Birebire göre daha avantajlı kişi başı fiyat

## 11. Arkadaş koduyla grup oluşturma

Kullanıcı paylaşılabilir güvenli kod, kullanıcı adı veya güvenli aramayla arkadaşını bulur ve davet eder. Grup 2–4 kişidir. Her üye ortak süre, sıklık ve programı kendi hesabından kabul eder; her öğrenci kendi ödeme/paket talebini onaylar. Grup sahibi başkası adına satın alma yapamaz. Hoca grubun tamamını onaylar.

## 12. Otomatik grup eşleştirme

Arkadaş getirmeyen öğrenci; ders, sınav, seviye, hoca, haftalık sıklık, paket süresi ve uygun saatlere göre eşleşebilir. Yalnız aynı süre ve sıklığı isteyen öğrenciler aynı gruba alınır. Minimum 2 öğrenci olmadan grup aktive edilmez, maksimum 4 öğrenci kabul edilir. Bekleme ve iptal koşulları önceden gösterilir; hoca eşleşen grubu onaylar.

## 13. Ortak süre ve sıklık kararı

**Karar:** Aynı gruptaki öğrenciler farklı paket süreleriyle katılamaz. Tüm grup üyeleri aynı süreyi, haftalık ders sayısını, başlangıç-bitiş tarihini ve ortak programı kabul eder. Karma süreli ve dinamik koltuk modeli mevcut ürün yönünden çıkarılmıştır.

Farklı süre isteyen kullanıcı mevcut gruba katılamaz; uygun başka grup bulur, yeni grup talebi oluşturur veya arkadaşlarıyla yeni ortak süre belirler.

## 14. Tutor grup onay akışı

Hoca ekranı ders, konu, sınav/seviye, katılımcı profilleri, ortak sıklık ve süre, başlangıç-bitiş, önerilen program, brüt gelir ve ders başına toplam geliri gösterir. Hoca kabul edebilir, değişiklik önerebilir veya reddedebilir.

## 15. Grup fiyatlandırması ve platform komisyonu

- Kişi başı ücret birebirden düşük olmalıdır.
- Hocanın toplam brüt geliri tek birebire göre avantajlı olmalıdır.
- Platform komisyonu açıkça hesaplanır ve korunur.
- İndirim bütünüyle platform komisyonundan karşılanmaz.
- 2, 3 ve 4 kişi için farklı katsayılar olabilir.
- Grup büyüdükçe kişi başı ücret azalabilir, toplam hoca geliri artabilir.
- Hoca fiyatı ve grubu kabul etmeden grup başlamaz.
- Bütün para hesaplarının source of truth’u backend’dir.

Kesin katsayılar: **TBD — ayrı finans ve ürün kararı.**

## 16. Açık grup politikaları

Minimum katılımcının altına düşme, başladıktan sonra ayrılma, iptal, yeniden planlama, iade, eksik ödeme, hoca ayrılması ve grup kontratının sona ermesi implementasyon öncesinde tanımlanmalıdır.

## 17. Kötüye kullanım, güvenlik, veri ve yaş politikaları

Pro ve Küçük Grup; fair-use, spam/otomasyon koruması, içerik moderasyonu, çocuk güvenliği, öğrenci/veli rızası, veri minimizasyonu, erişim kayıtları ve silme/retention politikaları tamamlanmadan üretime açılmaz.

## 18. MVP ve sonraki fazlar

Checkout MVP’si yalnız planları doğru durumlarıyla tanıtır. Gelecek ürünlerin fiyatlandırması, rezervasyonu, soru altyapısı, koç/veli akışları veya grup eşleştirmesi bu checkout çalışmasının kapsamında değildir.

Sonraki fazlar ayrı ürün, finans, güvenlik, backend, frontend ve operasyon planlarıyla açılacaktır.

## 19. Açık sorular

- Pro fair-use ve kapasite sınırları
- İnsan soru desteği SLA ve hoca hakedişi
- Koç atama ve hak devri politikası
- Veli hesabı, rıza ve görüşme operasyonu
- Grup fiyat katsayıları ve komisyon
- Grup minimum katılımcı/iptal/iade politikası
- Pro ve grup planlarının kesin fiyatları

## 20. Karar günlüğü

- 1 Ağustos 2026: Birebir aktif; Küçük Grup ve Hocam Pro görünür fakat seçilemez `Yakında` planları olarak tasarlandı.
- 1 Ağustos 2026: Gelecek özellikler aktif checkmark yerine `Planlanan` olarak gösterilir.
- 1 Ağustos 2026: Küçük Grup 2–4 öğrencidir.
- 1 Ağustos 2026: Karma süreli grup üyeliği reddedildi; ortak süre, sıklık ve program zorunludur.
- 1 Ağustos 2026: Pro talep avantajı kabul garantisi değil, öncelikli değerlendirmedir.
- 29 Ağustos 2026: Ön duyurudan vazgeçildi. Küçük Grup, Hocam Pro ve plan karşılaştırma girişi lansmana kadar tamamen gizlenecek; mevcut mekanikler kodda korunacaktır.

## 21. Uygulanmayacak veya reddedilen fikirler

- Aynı grupta farklı paket süreleri
- Dinamik, üyeye göre ayrı bitiş tarihli koltuk modeli
- Pro için garantili hoca kabulü veya otomatik rezervasyon
- Gelecek özellikleri bugün aktifmiş gibi sunmak
- Frontend’in grup fiyatı, indirim katsayısı veya komisyon uydurması

import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

export const metadata = legalPageMetadata("hoca-aydinlatma-metni");

/**
 * The tutor-facing notice. Derived from
 * hocam-backend/docs/kvkk/00-kisisel-veri-isleme-envanteri.md — its data
 * categories (§2), processing activities and legal bases (§3), transfers (§4)
 * and retention rules, restricted to what a tutor account touches.
 *
 * Why this exists as its own text: the general notice carried tutors inside a
 * single "Öğretmensen" paragraph, which is thin for the population whose
 * documents, income and public profile the platform actually handles.
 * Separate notices per data subject group is the expected practice, and the
 * Kurul's 18.02.2026 / 2026/347 decision requires consent to sit apart from
 * information — this text informs and asks for nothing.
 *
 * /kvkk/hoca-dogrulama stays as the layered notice shown at the point the
 * documents are collected; §9 links to it rather than repeating it.
 */
export default function TutorPrivacyNoticePage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="hoca-aydinlatma-metni" />

      <div className="mt-6">
        <LegalNote>
          Bu metin, HOCAM’da ders veren hocaları bilgilendirir; senden onay
          istemez. Onayın gereken durumlarda ayrıca ve açıkça sorarız. Verdiğin
          onayları{" "}
          <LegalLink href="/profile/gizlilik">Gizlilik ve Verilerim</LegalLink>{" "}
          sayfasından yönetebilirsin.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Veri sorumlusu">
          <p>
            HOCAM, YKS’ye hazırlanan öğrencilerle doğrulanmış üniversite
            öğrencisi hocaları buluşturan çevrimiçi bir özel ders platformudur.
            Platform işletmecisinin tam yasal kimliği ve tebligata elverişli
            adresi, işletme kuruluş işlemleri tamamlandıktan sonra yayımlanır.
            Bu sürede kişisel veri başvuruları için
            iletisim@hocamozelders.com adresi kullanılır.
          </p>
        </LegalSection>

        <LegalSection title="2. Hangi verilerini işliyoruz">
          <p>
            <strong>Hesap ve kimlik:</strong> adın ve soyadın, e-posta adresin,
            hesap tercihlerin, bildirim ayarların, referans kodun.
          </p>
          <p>
            <strong>Herkese açık profilin:</strong> üniversiten, bölümün, YKS
            sıralaman, profil görselin, tanıtım videon, tanıtım yazın, verdiğin
            dersler ve sınav türleri, saatlik ücretin.
          </p>
          <p>
            <strong>Doğrulama:</strong> üniversite e-posta adresin, eşleştirilen
            kurumsal alan adı, doğrulama kodunun geri döndürülemez özeti, deneme
            ve doğrulama zamanları; öğrenci belgen ve YKS sonuç belgen ile bu
            belgelerin güvenli önizlemeleri, dosya özetleri ve inceleme kararı.
            Ayrıntısı dokuzuncu maddededir.
          </p>
          <p>
            <strong>Ders işleyişi:</strong> müsaitlik takvimin, ders talepleri ve
            rezervasyonlar, ders durumları, derse katılım kayıtların, erken
            bitirme ve itiraz kayıtları, katılmama kayıtların ve ceza puanların.
          </p>
          <p>
            <strong>İletişim:</strong> öğrencilerle mesajların ve paylaştığın
            görseller, ders materyalleri, öğrenciler hakkında tuttuğun özel
            notlar, destek talepleri.
          </p>
          <p>
            <strong>Finans:</strong> paket satışlarına bağlı hak ediş ve kredi
            kayıtları, iade talepleri, kampanya kayıtları.
          </p>
          <p>
            <strong>Değerlendirme ve güven:</strong> öğrencilerin sana bıraktığı
            değerlendirmeler, hakkındaki şikâyet kayıtları ve bunlara ilişkin
            kararlar.
          </p>
          <p>
            <strong>Güvenlik:</strong> giriş ve işlem güvenliği kayıtların,
            aydınlatma metnini görüntülediğine ilişkin teyit kaydı, yönetici
            erişim ve hesap geçişi denetim kayıtları.
          </p>
          <p className="font-medium">
            Canlı derslerin ses ve görüntü kaydını almıyoruz. Yalnızca derse
            kimin ne zaman katıldığını tutuyoruz.
          </p>
        </LegalSection>

        <LegalSection title="3. Neden işliyoruz">
          <p>
            Hesabını oluşturmak ve güvenliğini sağlamak; doğrulama başvurunu
            incelemek ve sahte başvuruları önlemek; profilini yayımlamak;
            derslerini planlamak ve yürütmek; öğrencilerle iletişimini mümkün
            kılmak; hak edişini hesaplamak ve mali kayıtları kanunun zorunlu
            kıldığı süre boyunca saklamak; şikâyet ve uyuşmazlıkları incelemek;
            platformu güvende tutmak ve işleyişe dair sana bilgi vermek için.
          </p>
        </LegalSection>

        <LegalSection title="4. Hukuki sebepler">
          <p>
            Hesap, doğrulama, ders, rezervasyon ve zorunlu bildirim işlemleri
            sözleşmenin kurulması veya ifası için gereklidir (m.5/2-c). Sahte
            başvuruların önlenmesi, platform güvenliği ve değerlendirme sistemi
            meşru menfaate dayanır (m.5/2-f). Mali kayıtların saklanması hukuki
            yükümlülüktür (m.5/2-ç). Şikâyet ve uyuşmazlık kayıtları bir hakkın
            tesisi ve korunması için işlenir (m.5/2-e).
          </p>
          <p>
            <strong>Profilinin herkese açık yayımlanması açık rızana bağlıdır.</strong>{" "}
            Bu rızayı geri aldığında profilin listeden çıkarılır; mevcut
            derslerin ve hak edişin etkilenmez. Açık rıza, başka bir işleme
            şartının yerine veya hizmetin zorunlu koşulu olarak kullanılmaz.
          </p>
        </LegalSection>

        <LegalSection title="5. Kimlerle paylaşıyoruz">
          <p>
            Ders ilişkisi kurduğun öğrenci, yalnızca o ilişki için gereken
            bilgilerini görür. Herkese açık profilin, rızan olduğu sürece tüm
            ziyaretçilere gösterilir ve arama motorlarınca dizinlenebilir.
          </p>
          <p>
            Hizmet sağlayıcılarımız: Railway (uygulama ve veri tabanı), Supabase
            (belge ve görsel depolama), Vercel (web sitesi), 8x8/JaaS (görüntülü
            ders), Google (Google ile giriş) ve Resend (e-posta). Ayrıca kanunen
            talep edilmesi halinde yetkili kurumlarla.
          </p>
        </LegalSection>

        <LegalSection title="6. Yurt dışına aktarım">
          <p>
            Yukarıdaki sağlayıcıların bazı altyapı, destek ve alt-işleyenleri
            Türkiye dışında olabilir; bu hizmetler kullanıldığında verilerin
            yurt dışındaki altyapıya aktarılabilir veya oradan erişilebilir.
          </p>
          <p>
            KVKK’nın 9. maddesi bu aktarımlar için uygun güvenceler öngörür. Her
            hizmetteki gerçek aktarım zinciri, taraf rolleri, ülke veya region ve
            uygulanabilir mekanizma doğrulanmaktadır. Standart sözleşme ancak
            ilgili akış için uygun yöntem olarak seçilirse doğru taraf modülüyle
            imzalanır ve süresinde Kurul’a bildirilir. Bu doğrulama tamamlanmadan
            kesin bir uygunluk beyanında bulunmuyor ve dışa veri gönderen yeni
            özellikleri açmıyoruz.
          </p>
        </LegalSection>

        <LegalSection title="7. Ne kadar saklıyoruz">
          <ul className="list-disc space-y-2 pl-5">
            <li>Hesap ve profil bilgilerin: hesabın açık olduğu sürece.</li>
            <li>
              Ders ve rezervasyon kayıtların: 10 yıl. Derse katılım kayıtların:
              2 yıl.
            </li>
            <li>Mesajların: hesap kapanışından itibaren 1 yıl.</li>
            <li>
              Doğrulama ham belgeleri ve güvenli önizlemeleri: onaydan sonra 7
              gün; ret veya bekleyen başvuruda en fazla 30 gün. Üniversite
              e-posta ispatı ve alan adı inceleme kaydı hesap süresince tutulur.
            </li>
            <li>
              <strong>Mali kayıtlar: 10 yıl.</strong> Vergi ve ticaret mevzuatı
              gereği silme talebiyle kaldırılamaz.
            </li>
            <li>
              Şikâyet ve güven kayıtları: karar tarihinden itibaren 10 yıl,
              ardından anonim hale getirilir.
            </li>
            <li>
              Değerlendirmeler: süresiz kalır; öğrenci kimliği anonim hale
              getirilir.
            </li>
          </ul>
          <p>
            Süre dolduğunda veriler silinir, yok edilir veya anonim hale
            getirilir. Ayrıntılı süreler ve imha yöntemleri{" "}
            <LegalLink href="/kvkk/saklama-ve-imha-politikasi">
              Kişisel Veri Saklama ve İmha Politikası
            </LegalLink>{" "}
            metnindedir.
          </p>
        </LegalSection>

        <LegalSection title="8. Hakların">
          <p>
            Verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, amaca
            uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü
            kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme,
            şartları oluşmuşsa silinmesini isteme, otomatik analiz sonucu
            aleyhine bir sonuç çıkmasına itiraz etme ve zararın giderilmesini
            talep etme haklarına sahipsin.
          </p>
          <p>
            Başvurunu her zaman iletisim@hocamozelders.com adresine; çevrimiçi
            kanal etkinse ayrıca{" "}
            <LegalLink href="/profile/gizlilik">
              Gizlilik ve Verilerim
            </LegalLink>{" "}
            sayfasından iletebilirsin. En geç 30 gün içinde cevaplarız.
            Cevabımızı yetersiz bulursan Kişisel Verileri Koruma Kurulu’na
            şikâyette bulunabilirsin.
          </p>
        </LegalSection>

        <LegalSection title="9. Doğrulama sürecine özel bilgilendirme">
          <p>
            Öğrenci belgen, YKS sonuç belgen ve üniversite e-posta adresinle
            yürütülen doğrulama süreci, belgeleri göndermeden önce ayrıca
            bilgilendirilmen için katmanlı bir metinde açıklanmıştır:{" "}
            <LegalLink href="/kvkk/hoca-dogrulama">
              Hoca Doğrulama Süreci Aydınlatma Metni
            </LegalLink>
            .
          </p>
        </LegalSection>

        <LegalSection title="10. Özel nitelikli veriler ve güvenlik">
          <p>
            Sağlık, inanç, etnik köken gibi özel nitelikli verilerini toplamıyor
            ve istemiyoruz. Öğrenci notu, mesaj ve destek talebi gibi serbest
            yazı alanlarına bu tür bilgileri yazmamanı rica ederiz.
          </p>
          <p>
            Rol bazlı erişim denetimi, şifreleme, şifrelerin geri döndürülemez
            saklanması, belgelere yalnızca kısa süreli imzalı bağlantılarla
            erişim ve yönetici işlemlerinin denetim kaydı gibi tedbirleri
            uygularız. Bir ihlal yaşanırsa 72 saat içinde Kurul’a, sana ise en
            kısa sürede bildiririz.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

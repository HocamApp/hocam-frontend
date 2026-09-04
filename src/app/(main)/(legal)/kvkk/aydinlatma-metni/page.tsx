import Link from "next/link";

import {
  LegalArticle,
  LegalDocHeader,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

// Kept in sync with hocam-backend/docs/kvkk/01-genel-aydinlatma-metni.md.
// The document is the source of truth; this page renders it.
export const metadata = legalPageMetadata("aydinlatma-metni");

export default function AydinlatmaMetniPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="aydinlatma-metni" />

      <div className="mt-6">
        <LegalNote>
        Bu metin seni bilgilendirir, senden onay istemez. Onayın gereken
        durumlarda ayrıca ve açıkça sorarız. Daha önce verdiğin onayları{" "}
        <Link href="/profile/gizlilik" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Gizlilik ve Verilerim
        </Link>{" "}
        sayfasından yönetebilirsin.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Kimiz">
          <p>
            HOCAM, YKS’ye hazırlanan öğrencilerle doğrulanmış üniversite
            öğrencisi öğretmenleri buluşturan çevrimiçi bir özel ders
            platformudur. Platform işletmecisinin tam yasal kimliği ve
            tebligata elverişli adresi işletme kuruluş işlemleri tamamlandıktan
            sonra bu bölümde yayımlanacaktır. Bu sürede kişisel veri
            başvuruları için iletisim@hocamozelders.com adresi kullanılır.
          </p>
        </LegalSection>

        <LegalSection title="2. Hangi verilerini işliyoruz">
          <p>
            <strong>Herkes için:</strong> e-posta adresin, adın ve soyadın,
            hesap tercihlerin, bildirim ayarların, giriş ve işlem güvenliği
            kayıtların.
          </p>
          <p>
            <strong>Öğrenciysen:</strong> okulun, sınıfın, hedeflediğin sınav ve
            sıralama, tanıtım yazın, profil görselin, ders taleplerin ve
            rezervasyonların, öğretmeninle mesajların, çözdüğün sorular ve
            sonuçları, öğrenme hedeflerin, satın aldığın paketler ve ödeme
            kayıtların, yaptığın değerlendirmeler.
          </p>
          <p>
            <strong>Öğretmensen:</strong> bunlara ek olarak üniversiten,
            bölümün, YKS sıralaman, tanıtım videon, saatlik ücretin, müsaitlik
            takvimin; doğrulama için ilettiğin üniversite e-posta adresin,
            e-posta/admin inceleme kayıtların, öğrenci belgen ile YKS sonuç
            belgen. Dosya güvenlik sonuçları, güvenli önizlemeler, dosya
            özetleri ve yetkili erişim kayıtları da bu kapsamdadır.
          </p>
          <p className="font-medium">
            Görüntülü derslerinin ses ve görüntü kaydını almıyoruz. Yalnızca
            derse kimin ne zaman katıldığını tutuyoruz.
          </p>
        </LegalSection>

        <LegalSection title="3. Neden işliyoruz">
          <p>
            Hesabını oluşturmak, dersini gerçekleştirmek, ödeme ve iade
            işlemlerini yürütmek, faturaları kanunun zorunlu kıldığı süre
            boyunca saklamak, şikayet ve uyuşmazlıkları incelemek, platformu
            güvende tutmak ve işleyişe dair sana bilgi vermek için.
          </p>
          <p>
            Hesap, rezervasyon, ders, zorunlu bildirim ve ödeme işlemleri;
            sözleşmenin kurulması veya ifası, hukuki yükümlülük, bir hakkın
            tesisi ve meşru menfaat gibi KVKK’nın 5. maddesindeki uygun işleme
            şartlarına dayanır. Açık rıza, başka bir işleme şartının yerine
            veya hizmetin zorunlu koşulu olarak kullanılmaz.
          </p>
          <p>
            Onaya bağlı keşif analitiği yalnızca aktif tercihinle çalışır.
            Öğrenme profillemesi, dış hizmete veri gönderen yapay zekâ işleme
            ve ticari tanıtım iletileri için hukuki ve operasyonel koşullar
            tamamlanmadan bu işlemler etkinleştirilmez. Yeni açık rıza toplama,
            her faaliyet için doğru hukuki dayanak doğrulanana kadar kapalıdır.
          </p>
        </LegalSection>

        <LegalSection title="4. Kimlerle paylaşıyoruz">
          <p>
            Ders ilişkisi kurduğun öğretmen veya öğrenci, yalnızca o ilişki için
            gereken bilgilerini görür. Öğrenciler birbirinin verisini görmez.
          </p>
          <p>
            Hizmet sağlayıcılarımız: Railway (uygulama ve veri tabanı),
            Supabase (belge ve görsel depolama), Vercel (web sitesi), 8x8/JaaS
            (görüntülü ders), Google (Google ile giriş; ayrıca etkinleştirilmesi
            halinde yapay zekâ asistanı) ve Resend (e-posta). Ayrıca kanunen
            talep edilmesi halinde yetkili kurumlarla.
          </p>
        </LegalSection>

        <LegalSection title="5. Yurt dışına aktarım">
          <p>
            Yukarıdaki sağlayıcıların bazı altyapı, destek ve alt-işleyenleri
            Türkiye dışında olabilir; bu hizmetler kullanıldığında verilerin
            yurt dışındaki altyapıya aktarılabilir veya oradan erişilebilir.
          </p>
          <p>
            KVKK’nın 9. maddesi bu aktarımlar için uygun güvenceler öngörür.
            Her hizmetteki gerçek aktarım zinciri, taraf rolleri, ülke veya
            region ve uygulanabilir mekanizma doğrulanmaktadır. Standart
            sözleşme ancak ilgili akış için uygun yöntem olarak seçilirse doğru
            taraf modülüyle imzalanır ve süresinde Kurul’a bildirilir. Bu
            doğrulama tamamlanmadan kesin bir uygunluk veya mekanizma beyanında
            bulunmuyor ve dışa veri gönderen yeni özellikleri açmıyoruz.
          </p>
        </LegalSection>

        <LegalSection title="6. Ne kadar saklıyoruz">
          <p>
            Hesap bilgilerin hesabın açık olduğu sürece; ders ve rezervasyon
            kayıtların 10 yıl; mesajların hesap kapanışından itibaren 1 yıl;
            hoca doğrulama ham belgeleri ve güvenli önizlemeleri onaydan sonra
            7 gün, ret veya bekleyen başvuruda en fazla 30 gün; analitik veriler
            12 ay saklanır. Üniversite e-posta ispatı ve alan adı inceleme kaydı
            hesap süresince tutulur.
          </p>
          <p>
            <strong>Fatura ve mali kayıtlar 10 yıl saklanır</strong> ve vergi ve
            ticaret mevzuatı gereği silme talebiyle kaldırılamaz. Süre dolduğunda
            veriler silinir, yok edilir veya anonim hale getirilir.
          </p>
        </LegalSection>

        <LegalSection title="7. Haklarım neler">
          <p>
            Verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, amaca
            uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü
            kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme,
            şartları oluşmuşsa silinmesini isteme, otomatik analiz sonucu
            aleyhine bir sonuç çıkmasına itiraz etme ve zararın giderilmesini
            talep etme haklarına sahipsin.
          </p>
          <p>
            Başvurunu her zaman iletisim@hocamozelders.com adresine; çevrimiçi kanal
            etkinse ayrıca{" "}
            <Link href="/profile/gizlilik" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
              Gizlilik ve Verilerim
            </Link>{" "}
            sayfasından iletebilirsin. En geç 30 gün içinde cevaplarız.
            Cevabımızı yetersiz bulursan Kişisel Verileri Koruma Kurulu’na
            şikâyette bulunabilirsin.
          </p>
        </LegalSection>

        <LegalSection title="8. 18 yaşından küçüksen">
          <p>
            Çocuk kullanıcıların hesap sahipliği, yaş tespiti ve veli/vasi
            doğrulama yöntemi hukuki inceleme altındadır. Bu yöntem
            kesinleşmeden yeni veli/vasi onayı toplanmaz ve buna bağlı isteğe
            bağlı özellikler açılmaz.
          </p>
          <p>
            Dersin yürütülmesi ve bunun için gerekli mesajlaşma gibi temel
            işlevler korunur. Velin veya vasin, yetkisini doğruladıktan sonra
            senin adına KVKK kapsamındaki hakları kullanabilir.
          </p>
        </LegalSection>

        <LegalSection title="9. Özel nitelikli veriler">
          <p>
            Sağlık, inanç, etnik köken gibi özel nitelikli verilerini toplamıyor
            ve istemiyoruz. Mesaj, destek talebi veya yapay zekâ asistanı gibi
            serbest yazı alanlarına bu tür bilgileri yazmamanı rica ederiz.
          </p>
        </LegalSection>

        <LegalSection title="10. Güvenlik">
          <p>
            Rol bazlı erişim denetimi, şifreleme, şifrelerin geri döndürülemez
            saklanması, belgelere yalnızca kısa süreli imzalı bağlantılarla
            erişim ve yönetici işlemlerinin denetim kaydı gibi tedbirleri
            uygularız. Bir ihlal yaşanırsa 72 saat içinde Kurul’a, sana ise en
            kısa sürede bildiririz.
          </p>
        </LegalSection>
      </div>


      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-small">
        <Link href="/kvkk/cerez-politikasi" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Çerez Politikası
        </Link>
        <Link href="/kvkk/analitik" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Analitik Aydınlatma Metni
        </Link>
        <Link href="/kvkk/hoca-dogrulama" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Hoca Doğrulama Aydınlatma Metni
        </Link>
        <Link href="/" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Hocam’a dön
        </Link>
      </div>
    </LegalArticle>
  );
}

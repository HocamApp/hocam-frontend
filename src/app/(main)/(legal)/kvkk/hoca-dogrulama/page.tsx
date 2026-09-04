import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

// Kept in sync with
// hocam-backend/docs/kvkk/06-hoca-dogrulama-aydinlatma-metni.md.
export const metadata = legalPageMetadata("hoca-dogrulama");

export default function TutorVerificationNoticePage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="hoca-dogrulama" />
      <div className="mt-6">
        <LegalNote>
        Bu metin, doğrulama bilgilerini göndermeden önce seni bilgilendirir; açık
        rıza veya genel işlem onayı değildir. Veri sorumlusu HOCAM’dır. İletişim:{" "}
          <LegalLink href="mailto:iletisim@hocamozelders.com">
            iletisim@hocamozelders.com
          </LegalLink>
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="Hangi veriler işlenir?">
          <p>
            Üniversiten, bölümün ve beyan ettiğin YKS sıralaman; üniversite e-posta
            adresin, kurumsal alan adı, doğrulama kodunun geri döndürülemez özeti,
            deneme ve doğrulama zamanları işlenir.
          </p>
          <p>
            Alan adı otomatik tanınmazsa e-posta adresin, üniversite beyanın, sorun
            nedeni, admin inceleme durumu/notu ve inceleyen personelin işlem zamanı
            kaydedilir. Bu durum otomatik ret anlamına gelmez.
          </p>
          <p>
            Öğrenci belgen ve ÖSYM/YKS sonuç belgen için dosya güvenlik sonuçları,
            güvenli önizlemeler, belgeyi geri üretmeyen dosya özeti, inceleme kararı
            ve yetkili erişim kayıtları tutulur. Kodun açık değeri saklanmaz; belge
            ve üniversite e-postan herkese açık profilinde yayımlanmaz.
          </p>
        </LegalSection>

        <LegalSection title="Amaç, yöntem ve hukuki sebep">
          <p>
            Bu veriler üniversite gelen kutusu kontrolünü doğrulamak, beyan edilen
            kimlik/YKS bilgisini incelemek, sahte veya tekrarlanan başvuruları önlemek
            ve tutor kabul sürecini yürütmek için elektronik ortamda toplanır.
          </p>
          <p>
            İşleme; KVKK m.5/2-c kapsamındaki sözleşmenin kurulması veya ifası için
            gereklilik ile m.5/2-f kapsamındaki platform güvenliğine ilişkin meşru
            menfaat şartlarına dayandırılır.
          </p>
        </LegalSection>

        <LegalSection title="Kimlere aktarılır?">
          <p>
            E-posta gönderimi için Resend/SMTP, uygulama ve veri tabanı için Railway,
            özel belge depolaması için Supabase kullanılır. Belgeler yalnız gerekli
            yetkiye sahip ve erişimi kaydedilen inceleme personeline açılır; hukuken
            zorunlu olduğunda yetkili kamu kurumlarıyla paylaşılabilir.
          </p>
          <p>
            Bu sağlayıcılar yurt dışında hizmet sunabilir. KVKK m.9 kapsamındaki
            aktarım güvencelerinin mevcut durumu ve devam eden standart sözleşme
            çalışması{" "}
            <LegalLink href="/kvkk/aydinlatma-metni">
              genel aydınlatma metninde
            </LegalLink>{" "}
            açıklanır.
          </p>
        </LegalSection>

        <LegalSection title="Ne kadar saklanır?">
          <ul className="list-disc space-y-2 pl-5">
            <li>Ham belgeler ve güvenli önizlemeler onaydan sonra 7 gün içinde silinir.</li>
            <li>Reddedilen veya bekleyen başvurularda belge saklama üst sınırı 30 gündür.</li>
            <li>Üniversite e-posta ispatı ve alan adı inceleme kaydı hesap süresince tutulur.</li>
            <li>
              Belgeyi geri üretmeyen özet, karar ve erişim kayıtları tekrar kullanımı
              önleme, denetim ve hakkın korunması için gerekli süreyle sınırlı tutulur.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Hakların">
          <p>
            KVKK m.11 kapsamındaki bilgi, düzeltme, silme/yok etme, aktarım yapılan
            kişileri öğrenme, otomatik analiz sonucuna itiraz ve zarar giderimi
            taleplerini{" "}
            <LegalLink href="/profile/gizlilik">
              Gizlilik ve Verilerim
            </LegalLink>{" "}
            alanından veya iletisim@hocamozelders.com adresinden iletebilirsin. Başvurular
            en geç 30 gün içinde cevaplanır.
          </p>
        </LegalSection>
      </div>


      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-small">
        <LegalLink href="/kvkk">Tüm KVKK metinleri</LegalLink>
      </div>
    </LegalArticle>
  );
}

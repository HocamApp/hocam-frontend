import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

export const metadata = legalPageMetadata("mesafeli-satis-sozlesmesi");

/**
 * Formal contract register, like /kullanim-kosullari and /iptal-ve-iade.
 *
 * The two clauses that carry the legal weight:
 *
 * Cayma hakkı — Mesafeli Sözleşmeler Yönetmeliği gives 14 days, counted from
 * the day the contract is formed for a service. m.15 removes the right once
 * performance has begun with the consumer's consent, but only if m.5(h) was
 * satisfied: the consumer must have been told beforehand that consenting
 * costs them the right. §7 below is that notice. Without it the 14 days never
 * start and the right survives for a year.
 *
 * What happens after the right lapses — a package part-used past day 14 — is
 * governed by /iptal-ve-iade, which refunds the unused credits. That is not a
 * courtesy: a weekly lesson package is a periodic service over a fixed term,
 * so the Abonelik Sözleşmeleri Yönetmeliği line applies — the consumer may
 * terminate at any time and the unperformed part is refunded without
 * deduction within fifteen days. §8 states that window.
 *
 * No payment provider is connected (AI_AGENT_RULES §1), so §5 describes the
 * manual process rather than a card flow that does not exist.
 */
export default function DistanceSalesPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="mesafeli-satis-sozlesmesi" />

      <div className="mt-6">
        <LegalNote>
          İşbu sözleşme, HOCAM üzerinden ders paketi satın alan Alıcı ile
          Satıcı arasında, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
          Mesafeli Sözleşmeler Yönetmeliği uyarınca elektronik ortamda
          kurulmuştur. Alıcı, paket talebini onaylamadan önce bu koşulları ve
          altıncı maddedeki bilgileri okuduğunu kabul eder.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Taraflar">
          <p>
            <strong>Satıcı:</strong> HOCAM platformunu işleten taraf. Tam yasal
            unvan, adres, ticaret sicil numarası ve MERSİS bilgileri, işletme
            kuruluş işlemleri tamamlandığında bu bölümde yayımlanır. Bu süre
            boyunca tebligata elverişli iletişim kanalı on birinci maddede
            gösterilmiştir.
          </p>
          <p>
            <strong>Alıcı:</strong> HOCAM üzerinde öğrenci hesabı bulunan ve
            ders paketi satın alan kişi. Alıcının adı, e-posta adresi ve sipariş
            bilgileri, siparişin oluşturulduğu anda hesabına kaydedilir.
          </p>
        </LegalSection>

        <LegalSection title="2. Sözleşmenin konusu">
          <p>
            İşbu sözleşmenin konusu, Alıcının HOCAM üzerinden elektronik ortamda
            satın aldığı ders paketine ilişkin olarak tarafların hak ve
            yükümlülüklerinin belirlenmesidir.
          </p>
        </LegalSection>

        <LegalSection title="3. Sözleşme konusu hizmetin nitelikleri">
          <p>
            Sözleşme konusu hizmet, Alıcının seçtiği hoca ile Platform üzerinden
            çevrim içi olarak yapılan özel derstir. Paket, belirli sayıda ders
            kredisi ve belirli bir geçerlilik süresi içerir.
          </p>
          <p>
            Paketin içerdiği ders sayısı, geçerlilik süresi, bağlı olduğu hoca,
            ders süresi ve toplam bedel, sipariş ekranında Alıcıya gösterilir ve
            siparişin oluşturulduğu anda kaydedilir. Bu bilgiler işbu
            sözleşmenin ayrılmaz parçasıdır.
          </p>
          <p>
            Ders kredileri yalnızca paketin bağlı olduğu hocadan alınacak
            dersler için kullanılır ve başka bir hocaya devredilemez.
          </p>
        </LegalSection>

        <LegalSection title="4. Bedel">
          <p>
            Paketin toplam bedeli, vergiler dahil ve Türk lirası olarak sipariş
            ekranında gösterilir. Gösterilen tutar dışında Alıcıdan ek bir bedel
            talep edilmez. Hizmet çevrim içi sunulduğundan teslimat veya kargo
            bedeli doğmaz.
          </p>
          <p>
            İndirim veya kampanya uygulanması halinde, indirimli birim ders
            bedeli sipariş ekranında ayrıca gösterilir. İade hesaplaması bu
            indirimli birim bedel üzerinden yapılır.
          </p>
        </LegalSection>

        <LegalSection title="5. Ödeme ve siparişin kesinleşmesi">
          <p>
            Platform üzerinde{" "}
            <strong>otomatik tahsilat yapılmamaktadır</strong>. Alıcı sipariş
            ekranında paket talebini oluşturur; ödemeye ilişkin işlemler destek
            ekibi tarafından elle yürütülür.
          </p>
          <p>
            Paket talebi oluşturmak tek başına ödeme yapıldığı anlamına gelmez.
            Sözleşme, ödemenin teyit edilmesi ve paketin Alıcının hesabında
            kullanıma açılmasıyla ifa edilmeye başlanır.
          </p>
        </LegalSection>

        <LegalSection title="6. Ön bilgilendirme">
          <p>
            Alıcı, siparişi onaylamadan önce aşağıdaki bilgilerin kendisine
            sunulduğunu kabul eder:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Satıcının kimliği ve iletişim bilgileri.</li>
            <li>
              Hizmetin temel nitelikleri: hoca, ders sayısı, ders süresi ve
              paketin geçerlilik süresi.
            </li>
            <li>Vergiler dahil toplam bedel ve ödeme şekli.</li>
            <li>
              Cayma hakkının kullanım şartları, süresi, usulü ve bu hakkın hangi
              halde ortadan kalktığı.
            </li>
            <li>
              Uyuşmazlık halinde başvurulabilecek Tüketici Hakem Heyeti ve
              Tüketici Mahkemesi bilgisi.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="7. Cayma hakkı">
          <p>
            Alıcı, sözleşmenin kurulduğu tarihten itibaren{" "}
            <strong>on dört gün</strong> içinde hiçbir gerekçe göstermeksizin ve
            cezai şart ödemeksizin sözleşmeden cayabilir.
          </p>
          <p>
            Cayma bildirimi, on birinci maddede gösterilen kanallardan yazılı
            olarak iletilir. Bildirimin süresi içinde gönderilmiş olması
            yeterlidir. Cayma halinde ödenen bedel, bildirimin Satıcıya
            ulaşmasından itibaren <strong>on dört gün</strong> içinde Alıcının
            ödeme yaptığı yöntemle iade edilir.
          </p>
          <p>
            <strong>Cayma hakkının ortadan kalktığı hal:</strong> Alıcı, on dört
            günlük süre dolmadan önce paketten ders alarak hizmetin ifasına
            başlanmasına onay verirse, Mesafeli Sözleşmeler Yönetmeliği uyarınca
            cayma hakkı sona erer. Alıcı, ilk dersi almakla bu sonucu kabul
            etmiş sayılır. İşbu madde, Alıcının onay vermeden önce
            bilgilendirilmesi amacıyla düzenlenmiştir.
          </p>
        </LegalSection>

        <LegalSection title="8. Cayma süresinden sonra iade">
          <p>
            Cayma hakkının sona ermesi, Alıcının iade talebinde bulunma hakkını
            ortadan kaldırmaz. Paketin kullanılmamış kredileri bakımından
            uygulanacak iade koşulları{" "}
            <LegalLink href="/iptal-ve-iade">İptal ve İade Koşulları</LegalLink>{" "}
            metninde düzenlenmiştir ve işbu sözleşmenin ayrılmaz parçasıdır.
          </p>
          <p>
            Anılan metin, kullanılmamış ders kredileri için bedel iadesi
            öngörür. İadeye konu tutar, talebin kabul edildiği tarihten
            itibaren <strong>on beş gün</strong> içinde Alıcının ödeme yaptığı
            yöntemle iade edilir.
          </p>
        </LegalSection>

        <LegalSection title="9. Tarafların yükümlülükleri">
          <p>
            Satıcı, sipariş ekranında gösterilen nitelikte hizmetin sunulması
            için gerekli teknik altyapıyı sağlamakla yükümlüdür. Hizmetin
            sunulamaması halinde Satıcı Alıcıyı bilgilendirir ve ödenen bedeli
            iade eder.
          </p>
          <p>
            Alıcı, sipariş sırasında verdiği bilgilerin doğru olmasından
            sorumludur. Alıcı, dersin yapılabilmesi için gerekli internet
            bağlantısı ve cihazı kendisi sağlar.
          </p>
          <p>
            Ders ilişkisi Alıcı ile hoca arasında kurulur. Satıcının bu
            ilişkideki rolü ve sorumluluk sınırı{" "}
            <LegalLink href="/kullanim-kosullari">Kullanım Koşulları</LegalLink>{" "}
            metninde düzenlenmiştir.
          </p>
        </LegalSection>

        <LegalSection title="10. Uyuşmazlıklar">
          <p>
            İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı’nca her
            yıl ilan edilen parasal sınırlar çerçevesinde Alıcının yerleşim
            yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri
            ile Tüketici Mahkemeleri yetkilidir. İşbu sözleşmeye Türkiye
            Cumhuriyeti hukuku uygulanır.
          </p>
        </LegalSection>

        <LegalSection title="11. Yürürlük ve bildirim">
          <p>
            İşbu sözleşme, Alıcının siparişi onaylamasıyla kurulur ve elektronik
            ortamda kayıt altına alınır. Alıcı sözleşmenin bir örneğine hesabı
            üzerinden erişebilir.
          </p>
          <p>
            Cayma bildirimi ve sözleşmeye ilişkin diğer bildirimler için hesaba
            giriş yapıldıktan sonra destek talebi kanalı kullanılabilir. Hesabı
            bulunmayanlar{" "}
            <LegalLink href="/iletisim">iletişim sayfası</LegalLink> üzerinden
            başvurabilir.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

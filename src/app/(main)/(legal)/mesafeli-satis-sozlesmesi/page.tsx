import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { COMPANY_FIELD_LABELS, companyValue, type CompanyInfo } from "@/lib/companyInfo";
import { legalPageMetadata } from "@/lib/legalDocuments";
import { POLICY_FACTS as f } from "@/lib/policyFacts";

export const metadata = legalPageMetadata("mesafeli-satis-sozlesmesi");

const COMPANY_ROWS: (keyof CompanyInfo)[] = [
  "legalName",
  "mersisNo",
  "taxId",
  "address",
  "kepAddress",
  "supportEmail",
];

/**
 * Formal contract register, like /kullanim-kosullari and /iptal-ve-iade.
 *
 * Who the parties are. The lesson is given by the tutor, so the tutor is the
 * provider ("sağlayıcı", Mesafeli Sözleşmeler Yönetmeliği m.4(f)); HOCAM
 * mediates the contract and collects the price on the tutor's behalf, which is
 * the intermediary service provider ("aracı hizmet sağlayıcı", m.4(i)). The
 * regulation then makes HOCAM jointly responsible with the provider for the
 * pre-contract information (m.5(7), m.12/A(3)) and for refunds of a price it
 * collected (m.12(3)-(4), m.12/A(7)); sections 1, 6, 7 and 9 say so.
 *
 * Cayma hakkı. The 14 days run from the day the contract is formed for a
 * service (m.9(2)). The right is lost for a service whose performance began,
 * with the consumer's consent, before the 14 days ended (m.15(1)(h)); m.5(1)(h)
 * requires the consumer to be told that beforehand and m.6(2)(a) wants it shown
 * on its own right before the payment, which the checkout summary and its
 * consent line do. Section 7 is the same notice in contract form. If the
 * notice were missing the 14 days would not run and the right would last up to
 * a year longer (m.10).
 *
 * What happens after the right lapses is /iptal-ve-iade: HOCAM refunds the
 * unused part of a package on its own terms. That is a commitment HOCAM
 * makes, not the application of a statute, and the text does not present it
 * as one.
 *
 * Seller identity fields come from `companyInfo.ts`; while one is unknown the
 * page prints the visible marker, never a blank.
 */
export default function DistanceSalesPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="mesafeli-satis-sozlesmesi" />

      <div className="mt-6">
        <LegalNote>
          İşbu sözleşme, HOCAM üzerinden ders paketi satın alan Alıcı, dersi veren
          Sağlayıcı ve aracı hizmet sağlayıcı HOCAM arasında, 6502 sayılı
          Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
          Yönetmeliği uyarınca elektronik ortamda kurulur. Alıcı, ödemeye
          geçmeden önce{" "}
          <LegalLink href="/on-bilgilendirme-formu">Ön Bilgilendirme Formunu</LegalLink>{" "}
          ve bu sözleşmeyi okuduğunu beyan eder.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Taraflar">
          <p>
            <strong>Sağlayıcı:</strong> paketin bağlı olduğu Hoca. Hocanın adı,
            soyadı ve vergi kimlik bilgileri, Alıcıya ödemeden önce sipariş
            özetinde gösterilir ve onaylanan sözleşme nüshasında yer alır.
          </p>
          <p>
            <strong>Aracı hizmet sağlayıcı:</strong> HOCAM platformunu işleten
            taraf. HOCAM, sözleşmenin kurulmasına aracılık eder ve paket bedelini
            Sağlayıcı adına tahsil eder.
          </p>
          <dl className="max-w-[60ch] divide-y divide-line rounded-input border border-line text-body">
            {COMPANY_ROWS.map((field) => (
              <div key={field} className="grid gap-1 px-4 py-2 sm:grid-cols-[12rem_1fr]">
                <dt className="font-medium text-ink">{COMPANY_FIELD_LABELS[field]}</dt>
                <dd>{companyValue(field)}</dd>
              </div>
            ))}
          </dl>
          <p>
            <strong>Alıcı:</strong> HOCAM üzerinde öğrenci hesabı bulunan ve ders
            paketi satın alan kişi. Alıcının adı, e-posta adresi ve sipariş
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
            Sözleşme konusu hizmet, Alıcının seçtiği Hoca ile Platform üzerinden
            çevrim içi olarak yapılan özel derstir. Paket, belirli sayıda ders
            hakkı ve belirli bir geçerlilik süresi içerir; tek seferliktir ve
            otomatik yenilenmez.
          </p>
          <p>
            Paketin içerdiği ders sayısı, haftalık ders sayısı, ders süresi,
            geçerlilik süresi, bağlı olduğu Hoca ve toplam bedel, ödemeye
            geçmeden önce sipariş ekranında Alıcıya gösterilir ve siparişin
            oluşturulduğu anda kaydedilir. Bu bilgiler işbu sözleşmenin ayrılmaz
            parçasıdır.
          </p>
          <p>
            Ders hakları yalnızca paketin bağlı olduğu Hocadan alınacak dersler
            için kullanılır ve başka bir Hocaya devredilemez.
          </p>
        </LegalSection>

        <LegalSection title="4. Bedel ve ödeme">
          <p>
            Paketin toplam bedeli Türk lirası olarak sipariş ekranında gösterilir.
            Alıcı, siparişi onaylamasının ödeme yükümlülüğü anlamına geldiğini,
            ödemeye geçmeden hemen önce açıkça bildirilmesiyle kabul eder. Hizmet
            çevrim içi sunulduğundan teslimat veya kargo bedeli doğmaz.
          </p>
          <p>
            İndirim veya kampanya uygulanması halinde, uygulanan ders başı bedel
            sipariş ekranında ayrıca gösterilir. İade hesaplaması, fiilen ödenen
            bu ders başı bedel üzerinden yapılır.
          </p>
          <p>
            Ödeme, ödeme hizmeti sağlayıcısı PayTR’nin güvenli sayfasında kart ile
            yapılır; kart bilgileri HOCAM’a ulaşmaz. Taksit seçeneği sunulursa
            taksitler ve varsa maliyetleri ödeme sayfasında gösterilir.
          </p>
        </LegalSection>

        <LegalSection title="5. Siparişin kesinleşmesi ve ifa">
          <p>
            Sözleşme, Alıcının ön bilgileri edindiğini teyit etmesi ve ödemenin
            onaylanmasıyla kurulur. Seçilen saatler, ödemeye geçildiği andan
            başlayarak <strong>{f.holdMinutes} dakika</strong> boyunca Alıcı için
            ayrılır; ödeme bu sürede tamamlanmazsa saatler yeniden herkese açılır.
            Süre dolduktan sonra ulaşan bir ödeme için{" "}
            <LegalLink href="/iptal-ve-iade">İptal ve İade Koşullarının</LegalLink>{" "}
            üçüncü maddesi uygulanır.
          </p>
          <p>
            Ödeme onaylandığında paket açılır ve dersler Hocanın takvimine
            yazılır. İlk ders, ödemeden en az{" "}
            <strong>{f.firstLessonNoticeHours} saat</strong> sonra başlar. Takvime
            yazılamayan ders hakları, Alıcının hesabında yerleşmemiş hak olarak
            durur ve paketin geçerlilik süresi içinde yerleştirilebilir.
          </p>
        </LegalSection>

        <LegalSection title="6. Ön bilgilendirme">
          <p>
            Alıcı, siparişi onaylamadan önce Mesafeli Sözleşmeler Yönetmeliği’nin
            beşinci maddesinde sayılan bilgilerin tamamının kendisine{" "}
            <LegalLink href="/on-bilgilendirme-formu">Ön Bilgilendirme Formu</LegalLink>{" "}
            ile sunulduğunu ve bu bilgileri edindiğini elektronik ortamda teyit
            eder. Ön bilgiler işbu sözleşmenin ayrılmaz parçasıdır.
          </p>
          <p>
            Hizmetin nitelikleri, toplam fiyat, cayma hakkının kullanım şartları
            ile cayma hakkının hangi halde kaybedileceği, ödeme yükümlülüğü
            altına girilmeden hemen önce ödeme ekranında ayrıca gösterilir.
            Ön bilgilendirmenin yapıldığını ispat yükümlülüğü Sağlayıcıya ve
            HOCAM’a aittir. HOCAM, ön bilgilendirmenin yapılmasından Sağlayıcı ile
            birlikte müteselsilen sorumludur.
          </p>
        </LegalSection>

        <LegalSection title="7. Cayma hakkı">
          <p>
            Alıcı, sözleşmenin kurulduğu günden başlayarak{" "}
            <strong>{f.withdrawalDays} gün</strong> içinde hiçbir gerekçe
            göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayabilir.
          </p>
          <p>
            Cayma bildirimi, hesabın Ödemeler sayfasındaki iade talebi (“Paketten
            vazgeçtim”) veya destek talebi ile yazılı olarak iletilir; bildirimin
            süresi içinde gönderilmiş olması yeterlidir. Alıcı ayrıca, aşağıdaki
            örnek cayma formunu kullanabilir veya cayma kararını bildiren açık bir
            beyanda bulunabilir. HOCAM, bildirimin kendisine ulaştığını Alıcıya
            derhal teyit eder.
          </p>
          <p>
            Cayma halinde tahsil edilen tüm ödemeler, cayma bildiriminin HOCAM’a
            ulaştığı tarihten itibaren <strong>{f.withdrawalDays} gün</strong>{" "}
            içinde, Alıcının satın alırken kullandığı ödeme aracına uygun şekilde
            ve Alıcıya herhangi bir masraf yüklenmeksizin tek seferde iade edilir.
            HOCAM, bu iadeden Sağlayıcı ile birlikte müteselsilen sorumludur.
          </p>
          <p>
            <strong>Cayma hakkının ortadan kalktığı hal:</strong> İlk ders
            başladığında hizmetin ifasına başlanmış olur. Alıcı, ödemeden önce bu
            hususta bilgilendirilmiş olup ödemeye geçerek hizmetin ifasına
            başlanmasını ve bu halde cayma hakkının sona ereceğini kabul eder.
            Cayma hakkının sona ermesi, Alıcının kullanılmamış dersler için iade
            talep etme hakkını ortadan kaldırmaz.
          </p>
          <div className="max-w-[60ch] rounded-input border border-line bg-paper p-4 text-body">
            <p className="font-medium text-ink">Örnek cayma formu</p>
            <p className="mt-2">
              Kime: HOCAM (aracı hizmet sağlayıcı) ve paketin bağlı olduğu Hoca
              (Sağlayıcı).
            </p>
            <p className="mt-2">
              Bu formla, aşağıdaki hizmetin sunulmasına ilişkin sözleşmeden cayma
              hakkımı kullandığımı beyan ederim.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Sipariş tarihi:</li>
              <li>Cayma hakkına konu hizmet (paket, Hoca):</li>
              <li>Bedel:</li>
              <li>Alıcının adı ve soyadı:</li>
              <li>Alıcının adresi:</li>
              <li>Tarih:</li>
            </ul>
          </div>
        </LegalSection>

        <LegalSection title="8. Cayma süresinden sonra veya ifa başladıktan sonra iade">
          <p>
            Cayma hakkının kullanılamaması veya sona ermesi, Alıcının iade talebinde
            bulunma hakkını ortadan kaldırmaz. HOCAM, paketin kullanılmamış dersleri
            bakımından{" "}
            <LegalLink href="/iptal-ve-iade">İptal ve İade Koşulları</LegalLink>{" "}
            metninde düzenlenen iade hakkını Alıcıya ayrıca tanır; bu metin işbu
            sözleşmenin ayrılmaz parçasıdır.
          </p>
          <p>
            Anılan metne göre iade talepleri talebin oluşturulduğu tarihten itibaren
            en geç <strong>{f.refundSettleDays} gün</strong> içinde sonuçlandırılır
            ve iade, ödeme yapılan karta yapılır.
          </p>
        </LegalSection>

        <LegalSection title="9. Tarafların yükümlülükleri">
          <p>
            Sağlayıcı ve HOCAM, sipariş ekranında gösterilen nitelikte hizmetin
            sunulması için gerekli teknik altyapıyı sağlamakla yükümlüdür. Hizmetin
            ifasının imkansızlaştığı hallerde, HOCAM durumdan haberdar olur olmaz
            Alıcıyı yazılı olarak veya kalıcı veri saklayıcısı ile bilgilendirir ve
            tahsil edilen bedeli iade eder; iade, bildirim tarihinden itibaren en
            geç <strong>{f.refundSettleDays} gün</strong> içinde yapılır.
          </p>
          <p>
            Alıcı, sipariş sırasında verdiği bilgilerin doğru olmasından sorumludur.
            Alıcı, dersin yapılabilmesi için gerekli internet bağlantısını ve
            cihazı kendisi sağlar.
          </p>
          <p>
            HOCAM, platform üzerinden kurulan bu sözleşmeden doğan cayma
            bildirimlerini, fesih bildirimlerini, bedel iadesi taleplerini ve
            teslimat veya ifaya ilişkin talep ve şikayetleri Alıcının iletebilmesi
            ve takip edebilmesi için gerekli sistemi kesintisiz olarak açık tutar ve bu
            talepleri Sağlayıcıya derhal iletir. HOCAM, bu sözleşmeye ilişkin
            kayıtları mevzuatın öngördüğü süre boyunca saklar.
          </p>
          <p>
            Ders ilişkisi Alıcı ile Hoca arasında kurulur. HOCAM’ın bu ilişkideki
            rolü ve sorumluluk sınırı{" "}
            <LegalLink href="/kullanim-kosullari">Kullanım Koşulları</LegalLink>{" "}
            metninde düzenlenmiştir.
          </p>
        </LegalSection>

        <LegalSection title="10. Uyuşmazlıklar">
          <p>
            İşbu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı’nca her yıl
            ilan edilen parasal sınırlar çerçevesinde Alıcının yerleşim yerindeki
            veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetlerine başvurulabilir.
            Hakem Heyetinin görevi dışında kalan uyuşmazlıklarda, dava açılmadan önce
            arabulucuya başvurulması şartıyla Tüketici Mahkemeleri yetkilidir. İşbu
            sözleşmeye Türkiye Cumhuriyeti hukuku uygulanır.
          </p>
        </LegalSection>

        <LegalSection title="11. Yürürlük ve bildirim">
          <p>
            İşbu sözleşme, Alıcının ön bilgileri edindiğini teyit edip ödemeyi
            tamamlamasıyla kurulur ve elektronik ortamda kayıt altına alınır. Alıcı
            sözleşmenin bir örneğine hesabı üzerinden erişebilir ve sözleşmenin bir
            nüshası kalıcı veri saklayıcısı ile Alıcıya iletilir.
          </p>
          <p>
            Cayma bildirimi ve sözleşmeye ilişkin diğer bildirimler için hesaba giriş
            yapıldıktan sonra hesabın Ödemeler sayfası veya destek talebi kanalı
            kullanılabilir. Hesabı bulunmayanlar{" "}
            <LegalLink href="/iletisim">iletişim sayfası</LegalLink> üzerinden
            başvurabilir.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

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

export const metadata = legalPageMetadata("on-bilgilendirme-formu");

const COMPANY_ROWS: (keyof CompanyInfo)[] = [
  "legalName",
  "mersisNo",
  "taxId",
  "address",
  "kepAddress",
  "supportEmail",
];

/**
 * The pre-contract information form (Mesafeli Sözleşmeler Yönetmeliği m.5).
 *
 * The checkout's consent line names this document, and m.5(1) lists what it
 * must say, so the sections below follow that list in its own order:
 * (a) the main features of the service, (b)-(ç) who sells and who mediates,
 * (d) the total price, (f) payment and performance and how complaints are
 * handled, (g)-(ğ) the right of withdrawal and where to send the notice,
 * (h) when that right is lost, (k) where a dispute goes. Items that do not
 * apply to a lesson package (carriers, deposits, digital content) are left out.
 *
 * m.6(2)(a) wants (a), (d), (g) and (h) shown on their own right before the
 * consumer takes on the payment as well; the checkout summary does that, from
 * the same numbers (apps/payments/policy_copy.py).
 */
export default function PreContractInformationPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="on-bilgilendirme-formu" />

      <div className="mt-6">
        <LegalNote>
          İşbu form, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
          Mesafeli Sözleşmeler Yönetmeliği uyarınca, ders paketi satın almadan
          önce Alıcıya verilmesi gereken bilgileri içerir. Bu bilgiler{" "}
          <LegalLink href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesinin</LegalLink>{" "}
          ayrılmaz parçasıdır.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Hizmetin temel nitelikleri">
          <p>
            Hizmet, Alıcının seçtiği Hoca ile HOCAM platformu üzerinde çevrim içi
            olarak yapılan bire bir özel derstir. Satın alınan paket; belirli
            sayıda ders hakkı, haftalık ders sayısı, ders süresi ve geçerlilik
            süresi içerir. Paket tek seferliktir, otomatik yenilenmez ve yalnızca
            seçilen Hoca ile geçerlidir.
          </p>
          <p>
            Paketin içeriği, Hoca, ders saatleri ve toplam bedel ödeme öncesinde
            sipariş ekranında gösterilir. HOCAM, dersin içeriğini belirlemez ve
            belirli bir sınav sonucu taahhüt etmez.
          </p>
        </LegalSection>

        <LegalSection title="2. Sağlayıcı ve aracı hizmet sağlayıcı">
          <p>
            <strong>Sağlayıcı:</strong> dersi veren, paketin bağlı olduğu Hoca.
            Hocanın adı, soyadı ve vergi kimlik bilgileri sipariş özetinde
            gösterilir. Sağlayıcıya, aşağıda bilgileri bulunan HOCAM üzerinden
            ulaşılır.
          </p>
          <p>
            <strong>Aracı hizmet sağlayıcı:</strong> sözleşmenin kurulmasına
            aracılık eden ve paket bedelini Sağlayıcı adına tahsil eden HOCAM.
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
            Şikayetler, giriş yapıldıktan sonra hesabın destek talebi kanalıyla,
            hesabı bulunmayanlar için{" "}
            <LegalLink href="/iletisim">iletişim sayfası</LegalLink> üzerinden
            iletilir. Şikayet için ayrı bir iletişim bilgisi bulunmamaktadır.
          </p>
        </LegalSection>

        <LegalSection title="3. Toplam fiyat">
          <p>
            Paketin tüm vergiler dahil toplam fiyatı, Türk lirası olarak ödeme
            öncesinde sipariş ekranında gösterilir. Hizmet çevrim içi sunulduğundan
            teslimat veya kargo bedeli yoktur. İndirim veya kampanya varsa
            uygulanan ders başı bedel de ayrıca gösterilir.
          </p>
        </LegalSection>

        <LegalSection title="4. Ödeme, ifa ve şikayet çözümü">
          <p>
            Ödeme, ödeme hizmeti sağlayıcısı PayTR’nin güvenli sayfasında kart ile
            yapılır; kart bilgileri HOCAM’a ulaşmaz. Seçilen saatler ödemeye
            geçildiği andan başlayarak <strong>{f.holdMinutes} dakika</strong>{" "}
            boyunca Alıcı için ayrılır.
          </p>
          <p>
            Ödeme onaylandığında paket açılır ve dersler Hocanın takvimine
            yazılır. İlk ders, ödemeden en az{" "}
            <strong>{f.firstLessonNoticeHours} saat</strong> sonra başlar. Ders
            iptali, katılmama, süre uzatma ve iade kuralları{" "}
            <LegalLink href="/iptal-ve-iade">İptal ve İade Koşullarında</LegalLink>{" "}
            yer alır.
          </p>
          <p>
            Hizmetle ilgili şikayetler destek talebi kanalıyla iletilir ve destek
            ekibi tarafından incelenir. İade talepleri en geç{" "}
            <strong>{f.refundSettleDays} gün</strong> içinde sonuçlandırılır.
          </p>
        </LegalSection>

        <LegalSection title="5. Cayma hakkı">
          <p>
            Alıcı, sözleşmenin kurulduğu günden başlayarak{" "}
            <strong>{f.withdrawalDays} gün</strong> içinde hiçbir gerekçe
            göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayabilir. Cayma
            halinde tahsil edilen tüm ödemeler, bildirimin HOCAM’a ulaştığı
            tarihten itibaren <strong>{f.withdrawalDays} gün</strong> içinde iade
            edilir.
          </p>
          <p>
            Cayma bildirimi, hesabın Ödemeler sayfasındaki iade talebi (“Paketten
            vazgeçtim”) veya destek talebi ile iletilir. Hesabı bulunmayanlar için
            bildirim adresi{" "}
            <strong>{companyValue("supportEmail")}</strong> e-posta adresidir. Örnek
            cayma formu{" "}
            <LegalLink href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesinde</LegalLink>{" "}
            yer alır. Taşıyıcı ile iade söz konusu değildir; hizmet çevrim içi
            sunulur.
          </p>
        </LegalSection>

        <LegalSection title="6. Cayma hakkının kaybedilmesi">
          <p>
            İlk ders başladığında hizmetin ifasına başlanmış olur. Alıcı, ödemeye
            geçerek hizmetin ifasına başlanmasını ve bu halde cayma hakkının sona
            ereceğini kabul eder. Bu onay, ödeme öncesinde ayrıca gösterilir ve
            Alıcı tarafından işaretlenir; işaretlenmeden ödemeye geçilemez.
          </p>
          <p>
            Cayma hakkı sona erdikten sonra da Alıcı, kullanılmamış dersler için
            İptal ve İade Koşullarına göre iade talebinde bulunabilir.
          </p>
        </LegalSection>

        <LegalSection title="7. Uyuşmazlıkların çözümü">
          <p>
            Alıcı, uyuşmazlıklarla ilgili olarak Ticaret Bakanlığı’nca her yıl ilan
            edilen parasal sınırlar çerçevesinde yerleşim yerindeki veya işlemin
            yapıldığı yerdeki Tüketici Hakem Heyetine başvurabilir. Hakem Heyetinin
            görevi dışında kalan uyuşmazlıklarda, dava açılmadan önce arabulucuya
            başvurulması şartıyla Tüketici Mahkemesine başvurulabilir.
          </p>
        </LegalSection>

        <LegalSection title="8. Ödeme yükümlülüğü ve kişisel veriler">
          <p>
            Alıcı, ödemeye geçtiğinde seçtiği paketin tutarını ödemekle yükümlü
            olur. Siparişin onaylanması ödeme yükümlülüğü anlamına gelir.
          </p>
          <p>
            Sipariş sırasında verilen kişisel verilerin işlenmesine ilişkin bilgi{" "}
            <LegalLink href="/kvkk/aydinlatma-metni">Aydınlatma Metninde</LegalLink>{" "}
            yer alır.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

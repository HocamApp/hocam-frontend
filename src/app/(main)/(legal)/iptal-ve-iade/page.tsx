import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

export const metadata = legalPageMetadata("iptal-ve-iade");

/**
 * The one legal page written in formal contract register rather than the
 * "sen" address DESIGN.md §9 sets for the rest of the product. A cancellation
 * and refund policy is read as terms, and the KVKK notices around it keep
 * their existing register unchanged.
 *
 * Every period, threshold and formula below mirrors a constant the platform
 * actually enforces:
 *
 *   CANCELLATION_FREE_WINDOW = 12h      apps/lessons/services.py
 *   NO_SHOW_GRACE_PERIOD = 15m          apps/lessons/services.py
 *   STUDENT_ABSENCE_DISPUTE_WINDOW = 24h
 *   NO_SHOW_AUTO_HIDE_THRESHOLD = 3
 *   LATE_TUTOR_CANCELLATION_PENALTY_POINTS = 1
 *   AUTO_CONFIRM_HOURS = 24             apps/lessons/models.py
 *   REVIEW_WINDOW_DAYS = 3              apps/lessons/models.py
 *   PACKAGE_GRACE_PERIOD_DAYS = 0       apps/payments/services.py
 *   refund_credit = not (actor == STUDENT and is_late)
 *
 * cancellationPolicy.test.ts pins these against the backend source.
 *
 * What the text does NOT say is that money is returned automatically: no
 * payment provider is connected, refund requests are settled by hand, and
 * section 11 states that plainly.
 */
export default function CancellationAndRefundPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="iptal-ve-iade" />

      <div className="mt-6">
        <LegalNote>
          İşbu koşullar, HOCAM üzerinden oluşturulan ders rezervasyonlarının ve
          satın alınan ders paketlerinin iptali ile bedel iadesine ilişkin usul
          ve esasları düzenler. Platform üzerinden ders paketi talebi oluşturan
          Kullanıcı, bu koşulları kabul etmiş sayılır.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Kapsam ve taraflar">
          <p>
            HOCAM, YKS’ye hazırlanan öğrenciler ile doğrulanmış üniversite
            öğrencisi öğretmenleri bir araya getiren bir aracı hizmet
            sağlayıcıdır. Ders, öğrenci ile öğretmen arasında gerçekleşir;
            HOCAM bu ilişkinin kurulduğu, yürütüldüğü ve kayıt altına alındığı
            platformu sağlar.
          </p>
          <p>
            İşbu koşullar; ders rezervasyonlarının iptali, taraflardan birinin
            derse katılmaması, ders paketlerinin geçerlilik süresi ve paket
            bedelinin iadesi hallerinde uygulanır. Öğrencinin on sekiz yaşından
            küçük olması halinde bu koşullardan doğan hak ve yükümlülükler veli
            veya yasal temsilci bakımından da geçerlidir.
          </p>
        </LegalSection>

        <LegalSection title="2. Ders iptali">
          <p>
            Bir rezervasyon, yalnızca ders başlangıç saatinden önce ve
            rezervasyon “beklemede” veya “onaylandı” durumundayken iptal
            edilebilir. Ders başlangıç saati geldikten sonra rezervasyon iptal
            edilemez.
          </p>
          <p>
            Ders başlangıç saatine <strong>on iki saatten fazla</strong> süre
            varken yapılan iptaller ücretsizdir. Bu halde derse ayrılmış paket
            kredisi Kullanıcının paketine geri yüklenir ve yeniden
            kullanılabilir.
          </p>
          <p>
            Ders başlangıç saatine <strong>on iki saatten az</strong> süre
            kalmışsa:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              İptal öğrenci tarafından yapılmışsa, derse ayrılmış paket kredisi
              iade edilmez ve ilgili ders öğretmenin hak edişine konu edilir.
            </li>
            <li>
              İptal öğretmen tarafından yapılmışsa, paket kredisi öğrenciye
              iade edilir ve öğretmenin hesabına ceza puanı işlenir.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Öğretmenin rezervasyonu yanıtsız bırakması">
          <p>
            Öğretmen tarafından ders başlangıç saatine kadar yanıtlanmayan
            “beklemede” durumundaki rezervasyonlar sistem tarafından
            kendiliğinden iptal edilir. Bu halde derse ayrılmış paket kredisi
            öğrenciye iade edilir; rezervasyon ücretsiz tanışma dersi hakkı
            kullanılarak oluşturulmuşsa bu hak yeniden kullanılabilir hale
            gelir.
          </p>
        </LegalSection>

        <LegalSection title="4. Derse katılmama">
          <p>
            Katılım, ders başlangıç saatinden itibaren{" "}
            <strong>on beş dakika</strong> boyunca beklenir. Bu sürenin sonunda
            tarafların katılım durumuna göre aşağıdaki sonuçlar doğar:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Öğretmen katılmamışsa:</strong> ders iptal edilir, paket
              kredisi öğrenciye iade edilir ve öğrenciye ilave bir telafi
              kredisi tanımlanır. Katılmama kaydı öğretmenin hesabına işlenir.
            </li>
            <li>
              <strong>Öğrenci katılmamış, öğretmen katılmışsa:</strong> ders
              gerçekleşmiş sayılır ve paket kredisi kullanılmış olarak düşülür.
              Öğrenci, bu tespite karşı beşinci maddede düzenlenen süre içinde
              itiraz edebilir.
            </li>
            <li>
              <strong>Taraflardan hiçbiri katılmamışsa:</strong> ders iptal
              edilir ve paket kredisi öğrenciye iade edilir.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="5. İtiraz">
          <p>
            Öğrenci, hakkında düzenlenen katılmama tespitine, tespitin
            yapılmasından itibaren <strong>yirmi dört saat</strong> içinde
            itiraz edebilir. Süresinde yapılan itiraz üzerine rezervasyon
            uyuşmazlık durumuna alınır ve destek ekibi tarafından incelenir.
            İnceleme sonucunda paket kredisinin iadesine karar verilebilir.
          </p>
        </LegalSection>

        <LegalSection title="6. Ders onayı ve değerlendirme">
          <p>
            Tamamlanan ders, öğrencinin onayı ile kesinleşir. Öğrencinin ders
            bitiminden itibaren <strong>yirmi dört saat</strong> içinde onay
            vermemesi veya itirazda bulunmaması halinde ders kendiliğinden
            onaylanmış sayılır.
          </p>
          <p>
            Öğrenci, tamamlanan ders için değerlendirme yazma hakkını ders
            bitiminden itibaren <strong>üç gün</strong> içinde kullanabilir.
          </p>
        </LegalSection>

        <LegalSection title="7. Tekrarlanan katılmama">
          <p>
            Hakkında <strong>üç</strong> katılmama kaydı oluşan öğretmenin
            profili, inceleme tamamlanıncaya kadar herkese açık listelemeden
            kendiliğinden çıkarılır. Bu tedbir, mevcut rezervasyonların
            yürütülmesine ve işbu koşullardan doğan iade haklarına etki etmez.
          </p>
        </LegalSection>

        <LegalSection title="8. Paket geçerlilik süresi">
          <p>
            Ders paketleri, satın alma tarihinden itibaren pakette belirtilen
            süre boyunca geçerlidir. Bu süre, paket satın alınırken Kullanıcıya
            gösterilir.
          </p>
          <p>
            Sürenin dolmasıyla paket sona erer ve kalan krediler yeni
            rezervasyon oluşturmak için kullanılamaz. Süresi dolan paketin
            kullanılmamış kredileri bakımından onuncu maddedeki iade talep
            hakkı saklıdır.
          </p>
        </LegalSection>

        <LegalSection title="9. Paket bedelinin iadesi ve hesaplanması">
          <p>
            İade tutarı, paket için ödenen toplam bedelden kullanılmış derslere
            karşılık gelen tutarın düşülmesi suretiyle hesaplanır. Kullanılmış
            dersler, paketin liste fiyatından değil,{" "}
            <strong>fiilen ödenen indirimli birim ders bedeli</strong> üzerinden
            düşülür. Bu esas, iade talebinin gerekçesinden bağımsız olarak her
            halde uygulanır.
          </p>
          <p>Hesaplama aşağıdaki gibidir:</p>
          <p className="tabular-nums">
            İade tutarı = Ödenen toplam bedel − (Kullanılmış ders sayısı ×
            İndirimli birim ders bedeli)
          </p>
          <p>
            Hesaplama sonucunun sıfırdan küçük çıkması halinde iade tutarı
            sıfır olarak uygulanır. Ücretsiz tanışma dersleri ve telafi
            kredileri bedele konu olmadığından hesaplamaya dahil edilmez.
          </p>
        </LegalSection>

        <LegalSection title="10. İade talep gerekçeleri">
          <p>Öğrenci aşağıdaki hallerde iade talebinde bulunabilir:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Paketin kullanılmaya devam edilmek istenmemesi.</li>
            <li>Süresi dolan bir pakette kullanılmamış kredi bulunması.</li>
          </ul>
          <p>
            HOCAM ise aşağıdaki hallerde iade sürecini kendiliğinden başlatır:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Paketin bağlı olduğu öğretmenin platformdan ayrılması.</li>
            <li>Öğretmenin doğrulama statüsünün geri alınması.</li>
            <li>Hizmetin HOCAM’dan kaynaklanan bir nedenle sunulamaması.</li>
          </ul>
        </LegalSection>

        <LegalSection title="11. Talep usulü ve inceleme">
          <p>
            Bir paket için aynı anda yalnızca bir iade talebi açık olabilir.
            Talebin oluşturulduğu an itibarıyla kullanılmış ders sayısı ve
            hesaplanan iade tutarı kayıt altına alınır ve sonradan yapılacak
            fiyat değişikliklerinden etkilenmez. Talep açık kaldığı sürece
            ilgili paketten yeni rezervasyon oluşturulamaz.
          </p>
          <p>
            İade talepleri destek ekibi tarafından incelenerek sonuçlandırılır.
            Platform üzerinde otomatik tahsilat veya otomatik bedel iadesi
            yapılmamaktadır; ödeme ve iade işlemleri elle yürütülür. Talebin
            sonucu, hesaplanan tutar ve gerekçesiyle birlikte Kullanıcıya
            bildirilir.
          </p>
          <p>
            İadeye konu tutar, talebin kabul edildiği tarihten itibaren{" "}
            <strong>on beş gün</strong> içinde Kullanıcının ödeme yaptığı
            yöntemle iade edilir.
          </p>
          <p>
            İade ve ödeme konusundaki talepler, hesaba giriş yapıldıktan sonra
            platform üzerindeki destek talebi kanalından iletilir. Hesabı
            bulunmayanlar{" "}
            <LegalLink href="/iletisim">iletişim sayfası</LegalLink> üzerinden
            başvurabilir.
          </p>
        </LegalSection>

        <LegalSection title="12. Yürürlük ve değişiklik">
          <p>
            İşbu koşullar yayımlandığı tarihte yürürlüğe girer. HOCAM,
            koşullarda değişiklik yapma hakkını saklı tutar. Değişiklikler bu
            sayfada yayımlandığı anda geçerli olur; değişiklikten önce
            oluşturulmuş rezervasyonlar ve satın alınmış paketler bakımından,
            işlem tarihinde yürürlükte olan koşullar uygulanır.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

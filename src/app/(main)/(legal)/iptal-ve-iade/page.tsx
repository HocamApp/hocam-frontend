import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";
import {
  EXTENSION_CAPS,
  formatTlAmount,
  POLICY_FACTS as f,
} from "@/lib/policyFacts";
import { formatPlanDuration } from "@/lib/lessonPricing";

export const metadata = legalPageMetadata("iptal-ve-iade");

/**
 * The one legal page written in formal contract register rather than the
 * "sen" address DESIGN.md §9 sets for the rest of the product. A cancellation
 * and refund policy is read as terms, and the KVKK notices around it keep
 * their existing register unchanged.
 *
 * Every period, threshold and amount below is read from `policyFacts.ts`, which
 * mirrors the backend constant it names; `cancellationPolicy.test.ts` pins the
 * whole page against the backend source. The rules described:
 *
 *   hold, payment page, retries   checkout_policy.py          (section 3)
 *   first lesson notice           lessons/policy.py           (section 3)
 *   withdrawal 14 days            statute                     (section 4)
 *   cancellation, no-show         lessons/services.py         (sections 5, 6)
 *   term and its extension        payments/extensions.py      (section 8)
 *   refund amount and fault       payments/refund_calc.py     (sections 9, 10)
 *   answer time, second approval  payments/refund_policy.py   (section 11)
 *
 * What the text claims about money going back is limited to what the refund
 * process does: a staff decision with a written reason, then a refund to the
 * card through the payment provider.
 */
export default function CancellationAndRefundPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="iptal-ve-iade" />

      <div className="mt-6">
        <LegalNote>
          İşbu koşullar, HOCAM üzerinden satın alınan ders paketlerinin ve bu
          paketlerden oluşturulan derslerin iptali, paketin süresi ve bedelinin
          iadesine ilişkin usul ve esasları düzenler. Ödemeye geçen Kullanıcı,
          ödemeden önce bu koşulları okuduğunu ve kabul ettiğini beyan eder.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Kapsam ve taraflar">
          <p>
            HOCAM, YKS’ye hazırlanan öğrenciler ile doğrulanmış üniversite
            öğrencisi hocaları bir araya getiren bir aracı hizmet sağlayıcıdır.
            Ders, Öğrenci ile Hoca arasında gerçekleşir; HOCAM bu ilişkinin
            kurulduğu, yürütüldüğü ve kayıt altına alındığı platformu sağlar ve
            paket bedelini Hoca adına tahsil eder. İşbu koşullar kapsamındaki
            iade talepleri HOCAM’a iletilir ve HOCAM tarafından sonuçlandırılır.
          </p>
          <p>
            İşbu koşullar; ders saatlerinin ayrılması, cayma hakkı, ders
            iptalleri, taraflardan birinin derse katılmaması, paketin
            geçerlilik süresi ve paket bedelinin iadesi hallerinde uygulanır.
            Öğrencinin on sekiz yaşından küçük olması halinde bu koşullardan
            doğan hak ve yükümlülükler veli veya yasal temsilci bakımından da
            geçerlidir.
          </p>
        </LegalSection>

        <LegalSection title="2. Tanımlar">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Paket:</strong> belirli sayıda ders hakkı içeren ve belirli
              bir süre boyunca geçerli olan, tek seferlik ve otomatik
              yenilenmeyen hizmet alımı.
            </li>
            <li>
              <strong>Ders hakkı:</strong> paketin içerdiği her bir ders.
            </li>
            <li>
              <strong>Yerleşmiş ders:</strong> Hocanın takviminde belirli bir
              saate yazılmış ders hakkı.
            </li>
            <li>
              <strong>Yerleşmemiş hak:</strong> ödenmiş olan ancak henüz hiçbir
              saate yazılmamış ders hakkı. Ücretsiz iptalle geri dönen ders
              hakkı da yerleşmemiş hak olarak durur.
            </li>
            <li>
              <strong>Kullanılmış ders:</strong> gerçekleşmiş veya gerçekleşmiş
              sayılan ders ile geç iptal edilen ders.
            </li>
            <li>
              <strong>Telafi hakkı:</strong> Hocanın derse katılmaması halinde
              Öğrenciye ayrıca tanımlanan ek ders hakkı.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Ödeme ve ders saatlerinin ayrılması">
          <p>
            Öğrencinin seçtiği saatler, ödemeye geçtiği andan başlayarak{" "}
            <strong>{f.holdMinutes} dakika</strong> boyunca yalnızca o Öğrenci
            için ayrılır. Ödeme sayfası en çok{" "}
            <strong>{f.paymentPageMinutes} dakika</strong> açık kalır. Ödeme
            başarısız olursa saatler en çok{" "}
            <strong>{f.failedRetryHoldMinutes} dakika</strong> daha tutulur ve
            ödeme en çok <strong>{f.maxPaymentAttempts}</strong> kez denenebilir.
            Ödeme bu sürede tamamlanmazsa saatler yeniden herkese açılır ve
            seçimin baştan yapılması gerekir.
          </p>
          <p>
            Ödeme süre dolduktan sonra ulaşır ve seçilen saatler bu arada başka
            bir Öğrenciye verilmişse, ödenen tutarın tamamı iade edilir.
          </p>
          <p>
            Ödeme onaylandığında paket açılır ve dersler Hocanın takvimine
            yazılır. İlk ders, ödemeden en az{" "}
            <strong>{f.firstLessonNoticeHours} saat</strong> sonra başlar; bu
            süreye denk gelen ders kaybolmaz, programın sonuna eklenir.
          </p>
        </LegalSection>

        <LegalSection title="4. Cayma hakkı">
          <p>
            Alıcı, paketi satın aldığı günden başlayarak{" "}
            <strong>{f.withdrawalDays} gün</strong> içinde hiçbir gerekçe
            göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayabilir. Hiçbir
            ders kullanılmamışsa ödenen tutarın tamamı iade edilir. İade, cayma
            bildiriminin HOCAM’a ulaştığı tarihten itibaren{" "}
            <strong>{f.withdrawalDays} gün</strong> içinde yapılır.
          </p>
          <p>
            Cayma bildirimi, hesabın Ödemeler sayfasındaki iade talebi (“Paketten
            vazgeçtim”) veya destek talebi ile yapılır; bildirimin süresi içinde
            gönderilmiş olması yeterlidir. Talep oluşturulduğunda alındığına
            dair bildirim gönderilir.
          </p>
          <p>
            İlk ders başladığında hizmetin ifasına başlanmış olur. Alıcı,
            ödemeden önce bu hususta bilgilendirilir ve ödemeye geçerek
            hizmetin ifasına başlanmasını kabul ettiğini ve bu halde cayma
            hakkının sona ereceğini onaylar. Cayma hakkının sona ermesi, Alıcının
            kullanılmamış dersler için iade talep etme hakkını ortadan
            kaldırmaz; bu hak onuncu maddede düzenlenmiştir.
          </p>
        </LegalSection>

        <LegalSection title="5. Ders iptali">
          <p>
            Bir ders, yalnızca başlangıç saatinden önce ve “beklemede” veya
            “onaylandı” durumundayken iptal edilebilir. Başlangıç saati
            geldikten sonra ders iptal edilemez.
          </p>
          <p>
            <strong>Öğrenci iptali.</strong> Ders başlangıç saatine{" "}
            <strong>{f.freeCancelHours} saatten fazla</strong> süre varken yapılan
            iptal ücretsizdir. Bu halde ders hakkı geri döner ve yerleşmemiş hak
            olarak durur; Öğrenci bu hakkı paketin geçerlilik süresi içinde yeni
            bir saate yerleştirebilir. Başlangıç saatine{" "}
            <strong>{f.freeCancelHours} saatten az</strong> süre kalmışsa ders
            hakkı geri dönmez ve ders kullanılmış sayılır.
          </p>
          <p>
            <strong>Hoca iptali.</strong> Hoca, onaylanmış bir dersi başlangıç
            saatine <strong>{f.tutorCancelLockHours} saat ya da daha az</strong>{" "}
            kala iptal edemez. Acil bir durumda destek ekibinin onayıyla iptal
            edebilir. Hocanın iptal ettiği her ders için ders hakkı Öğrenciye
            geri döner ve paketin süresi sekizinci maddeye göre uzar.
          </p>
        </LegalSection>

        <LegalSection title="6. Derse katılmama">
          <p>
            Katılım, ders başlangıç saatinden itibaren{" "}
            <strong>{f.noShowGraceMinutes} dakika</strong> boyunca beklenir. Bu
            sürenin sonunda tarafların katılım durumuna göre aşağıdaki sonuçlar
            doğar:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Hoca katılmamışsa:</strong> ders iptal edilir, ders hakkı
              Öğrenciye geri döner, ayrıca bir telafi hakkı tanımlanır ve paketin
              süresi sekizinci maddeye göre uzar. Katılmama kaydı Hocanın
              hesabına işlenir.
            </li>
            <li>
              <strong>Öğrenci katılmamış, Hoca katılmışsa:</strong> ders
              gerçekleşmiş sayılır ve ders hakkı kullanılmış olarak düşülür.
              Öğrenci, bu tespite karşı aşağıdaki süre içinde itiraz edebilir.
            </li>
            <li>
              <strong>Taraflardan hiçbiri katılmamışsa:</strong> ders iptal
              edilir ve ders hakkı Öğrenciye geri döner.
            </li>
          </ul>
          <p>
            Öğrenci, hakkında düzenlenen katılmama tespitine, tespitin
            yapılmasından itibaren{" "}
            <strong>{f.absenceDisputeHours} saat</strong> içinde itiraz edebilir.
            Süresinde yapılan itiraz üzerine ders uyuşmazlık durumuna alınır ve
            destek ekibi tarafından incelenir; inceleme sonucunda ders hakkının
            iadesine karar verilebilir.
          </p>
          <p>
            Hakkında <strong>{f.noShowHideThreshold}</strong> katılmama kaydı
            oluşan Hocanın profili, inceleme tamamlanıncaya kadar herkese açık
            listelemeden kendiliğinden çıkarılır. Bu tedbir, mevcut derslerin
            yürütülmesine ve işbu koşullardan doğan iade haklarına etki etmez.
          </p>
        </LegalSection>

        <LegalSection title="7. Dersin tamamlanması">
          <p>
            Tamamlanan ders, Öğrencinin onayı ile kesinleşir. Öğrencinin ders
            bitiminden itibaren <strong>{f.autoConfirmHours} saat</strong> içinde
            onay vermemesi veya itirazda bulunmaması halinde ders kendiliğinden
            onaylanmış sayılır. Öğrenci, tamamlanan ders için değerlendirme yazma
            hakkını ders bitiminden itibaren{" "}
            <strong>{f.reviewWindowDays} gün</strong> içinde kullanabilir.
          </p>
        </LegalSection>

        <LegalSection title="8. Paketin süresi ve süre uzatma">
          <p>
            Paket, satın alınan planın süresi boyunca geçerlidir; bu süre ödeme
            öncesinde Alıcıya gösterilir. Dersler paketin süresi içindeki
            saatlere yerleştirilir; süre bittikten sonrasına yerleştirilemez.
            Yerleşmemiş haklar süre sonunda kullanılamaz hale gelir, ancak bu
            haklar için onuncu maddedeki iade talebi saklıdır.
          </p>
          <p>
            Hocanın dersi iptal etmesi, derse katılmaması veya talebe hiç yanıt
            vermemesi nedeniyle Öğrenci ders kaybederse paketin süresi
            kendiliğinden uzar. Uzatma, Öğrenci talepte bulunmadan yapılır ve
            bildirilir. Uzatma süresi, hoca kaynaklı kayıp ders sayısının
            haftalık ders sayısına bölünmesiyle bulunan hafta sayısı kadardır;
            kayıpların tamamı birlikte hesaplanır ve süre hiçbir zaman kısalmaz.
            Uzatma, planın süresinin yarısını ve{" "}
            <strong>{f.maxExtensionDays} günü</strong> aşamaz:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {EXTENSION_CAPS.map((cap) => (
              <li key={cap.planDays}>
                {formatPlanDuration(cap.planDays)} ({cap.planDays} gün) plan: en
                çok <strong>{cap.capDays} gün</strong>
              </li>
            ))}
          </ul>
          <p>
            Öğrencinin kendi iptali, geç kalması veya derse katılmaması paketin
            süresini uzatmaz.
          </p>
        </LegalSection>

        <LegalSection title="9. İade tutarının hesaplanması">
          <p>
            <strong>Hiçbir ders kullanılmamışsa</strong> ödenen tutarın tamamı
            iade edilir. Ders yerleştirilmiş olması veya başlangıç saatinin
            yakın olması bu sonucu değiştirmez.
          </p>
          <p>
            <strong>Bir veya daha fazla ders kullanılmışsa</strong> iade tutarı,
            ödenen toplam bedelden kullanılmış derslere karşılık gelen tutarın
            düşülmesiyle bulunur. Kullanılmış dersler, paketin liste fiyatından
            değil, <strong>fiilen ödenen ders başı bedel</strong> üzerinden
            düşülür:
          </p>
          <p className="tabular-nums">
            İade tutarı = Ödenen toplam bedel − (Kullanılmış ders sayısı × Ders
            başı ödenen bedel)
          </p>
          <p>
            Hesaplama sonucunun sıfırdan küçük çıkması halinde iade tutarı sıfır
            olarak uygulanır. Ücretsiz tanışma dersleri ve telafi hakları bedele
            konu olmadığından hesaplamaya dahil edilmez.
          </p>
          <p>
            İade talebinin oluşturulmasından sonraki{" "}
            <strong>{f.refundNearLessonHours} saat</strong> içinde başlayacak
            dersler, iptal edilseler de kullanılmış sayılır; çünkü Hocaya bu saat
            geri verilemez. Bu kural, ilk ders başlamadan yapılan taleplerde ve
            sorunun Hocadan veya HOCAM’dan kaynaklandığı hallerde uygulanmaz.
          </p>
          <p>
            <strong>Sorun Hocadan veya HOCAM’dan kaynaklanıyorsa</strong> henüz
            kullanılmamış derslerin tamamı kesinti yapılmadan iade edilir. Sorunun
            kimden kaynaklandığına destek ekibi, kayıtları inceleyerek ve
            gerekçesini yazarak karar verir; Öğrencinin talep sırasında belirttiği
            neden bir beyandır ve karar yerine geçmez.
          </p>
        </LegalSection>

        <LegalSection title="10. İade talep gerekçeleri">
          <p>Öğrenci aşağıdaki hallerde iade talebinde bulunabilir:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Paketten vazgeçilmesi (cayma dahil).</li>
            <li>Hocayla ilgili bir sorun bulunması.</li>
            <li>Teknik bir sorun yaşanması.</li>
            <li>
              Seçilen saatlerin ödeme sırasında başkasına geçmesi ve uygun başka
              saat bulunamaması.
            </li>
            <li>
              Paket süresinin dolması ve yerleşmemiş hak kalması.
            </li>
            <li>Diğer nedenler.</li>
          </ul>
          <p>HOCAM ise aşağıdaki hallerde iade sürecini kendiliğinden başlatır:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Paketin bağlı olduğu Hocanın platformdan ayrılması.</li>
            <li>Hocanın doğrulama statüsünün geri alınması.</li>
            <li>Hizmetin HOCAM’dan kaynaklanan bir nedenle sunulamaması.</li>
          </ul>
          <p>
            Hocanın ayrılması veya doğrulamasının geri alınması gibi hizmetin
            ifasının imkansızlaştığı hallerde HOCAM, durumdan haberdar olur
            olmaz Öğrenciyi bilgilendirir ve ödenen bedelin kullanılmamış
            kısmını iade eder.
          </p>
        </LegalSection>

        <LegalSection title="11. Talep usulü ve inceleme">
          <p>
            Bir paket için aynı anda yalnızca bir iade talebi açık olabilir.
            Talebin oluşturulduğu an itibarıyla kullanılmış ders sayısı ve
            hesaplanan iade tutarı kayıt altına alınır ve sonradan yapılacak
            fiyat değişikliklerinden etkilenmez. Talep onaylanıncaya kadar
            Öğrencinin hiçbir dersi iptal edilmez; ancak talep açık kaldığı
            sürece ilgili paketten yeni ders yerleştirilemez.
          </p>
          <p>
            İade talepleri HOCAM destek ekibi tarafından incelenir. Onay veya
            ret kararı gerekçesiyle birlikte yazılır ve Kullanıcıya bildirilir.{" "}
            <strong>{formatTlAmount(f.refundSecondApprovalTl)}</strong> ve üzeri
            iadelerde ikinci bir yetkilinin de onayı aranır. Talep onaylanırsa
            iade, ödeme yapılan karta ödeme hizmeti sağlayıcısı üzerinden yapılır
            ve yapıldığında ayrıca bildirilir.
          </p>
          <p>
            HOCAM, iade talebini talebin oluşturulduğu tarihten itibaren en geç{" "}
            <strong>{f.refundSettleDays} gün</strong> içinde sonuçlandırır. İadenin
            kartın ekstresine yansıma süresi kartı çıkaran bankaya göre değişir.
          </p>
          <p>
            İade ve ödeme konusundaki talepler, hesaba giriş yapıldıktan sonra
            hesabın Ödemeler sayfasındaki iade talebi veya destek talebi kanalıyla
            iletilir. Hesabı bulunmayanlar{" "}
            <LegalLink href="/iletisim">iletişim sayfası</LegalLink> üzerinden
            başvurabilir.
          </p>
        </LegalSection>

        <LegalSection title="12. Yürürlük ve değişiklik">
          <p>
            İşbu koşullar yayımlandığı tarihte yürürlüğe girer. HOCAM,
            koşullarda değişiklik yapma hakkını saklı tutar. Değişiklikler bu
            sayfada yayımlandığı anda geçerli olur; ancak değişiklikten önce satın
            alınmış paketler ve oluşturulmuş dersler bakımından, satın alma
            tarihinde yürürlükte olan koşullar uygulanır.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

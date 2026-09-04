import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

export const metadata = legalPageMetadata("kullanim-kosullari");

/**
 * Formal contract register, like /iptal-ve-iade and unlike the KVKK notices,
 * which keep the "sen" address DESIGN.md §9 sets for the product.
 *
 * Every rule below is one the platform actually enforces. The load-bearing
 * constants:
 *
 *   KVKK_AGE_OF_MAJORITY = 18            config/settings.py
 *   MONTHLY_TRIAL_LIMIT = 3              apps/lessons/models.py
 *   unique_active_trial_booking_per_tutor  apps/lessons/models.py
 *   AUTO_CONFIRM_HOURS = 24              apps/lessons/models.py
 *   REVIEW_WINDOW_DAYS = 3               apps/lessons/models.py
 *   NO_SHOW_AUTO_HIDE_THRESHOLD = 3      apps/lessons/services.py
 *   ACCOUNT_DELETION_GRACE_DAYS = 14     config/settings.py
 *   Conversation.lesson_request OneToOne apps/messaging/models.py
 *
 * termsOfService.test.ts pins these against the backend source.
 *
 * The 15% commission in §10 is the rate the founders set. 6563 s.K. requires
 * an intermediary agreement to state the real fee, so it is named here rather
 * than deferred to a separate document. It matches
 * TUTOR_ESTIMATED_COMMISSION_BPS = 1500, which the code uses only for the
 * tutor price guide — AI_AGENT_RULES §2 still forbids applying it to earnings
 * figures until the payment provider is live.
 *
 * The text deliberately does NOT reserve a right to change terms
 * retroactively or to a tutor's detriment: 6563 s.K. prohibits that clause in
 * an intermediary agreement.
 */
export default function TermsOfServicePage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="kullanim-kosullari" />

      <div className="mt-6">
        <LegalNote>
          İşbu Kullanım Koşulları, HOCAM platformuna üye olan ve platformu
          kullanan herkes ile platform işletmecisi arasındaki hak ve
          yükümlülükleri düzenler. Hesap oluşturan Kullanıcı, bu koşulları
          okuduğunu ve kabul ettiğini beyan eder.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Taraflar ve tanımlar">
          <p>
            İşbu Kullanım Koşulları, HOCAM platformunu işleten taraf ile
            platforma üye olan Kullanıcı arasında akdedilmiştir. Platform
            işletmecisinin tam yasal unvanı, adresi ve ticaret sicil bilgileri,
            işletme kuruluş işlemleri tamamlandığında bu bölümde yayımlanır. Bu
            süre boyunca tebligata elverişli iletişim kanalı yirminci maddede
            gösterilen adrestir.
          </p>
          <p>Bu koşullarda geçen terimler aşağıdaki anlamları taşır:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Platform:</strong> hocamozelders.com alan adı üzerinden
              sunulan web sitesi ve bağlı hizmetler.
            </li>
            <li>
              <strong>Kullanıcı:</strong> Platformda hesap oluşturan gerçek
              kişi.
            </li>
            <li>
              <strong>Öğrenci:</strong> ders almak üzere hesap açan Kullanıcı.
            </li>
            <li>
              <strong>Hoca:</strong> ders vermek üzere hesap açan ve doğrulama
              sürecini tamamlayan Kullanıcı.
            </li>
            <li>
              <strong>Ders:</strong> Öğrenci ile Hoca arasında Platform
              üzerinden planlanan ve çevrim içi olarak yapılan özel ders.
            </li>
            <li>
              <strong>Paket:</strong> belirli sayıda ders kredisi içeren ve
              belirli bir süre boyunca geçerli olan hizmet alımı.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="2. Sözleşmenin konusu">
          <p>
            İşbu koşulların konusu, Platformun sunduğu hizmetlerden
            yararlanmanın şartlarının, tarafların hak ve yükümlülüklerinin ve
            Platform kullanımına ilişkin kuralların belirlenmesidir.
          </p>
        </LegalSection>

        <LegalSection title="3. HOCAM’ın rolü">
          <p>
            HOCAM, YKS’ye hazırlanan öğrenciler ile doğrulanmış üniversite
            öğrencisi hocaları bir araya getiren bir aracı hizmet
            sağlayıcıdır. Ders ilişkisi Öğrenci ile Hoca arasında kurulur;
            HOCAM bu ilişkinin kurulduğu, planlandığı ve kayıt altına alındığı
            teknik altyapıyı sağlar.
          </p>
          <p>
            HOCAM, dersin içeriğini belirlemez ve dersi kendisi vermez. Hocanın
            akademik bilgileri doğrulama sürecinde incelenir; bu inceleme,
            dersin niteliğine, öğrencinin akademik başarısına veya belirli bir
            sınav sonucuna ilişkin taahhüt anlamına gelmez.
          </p>
        </LegalSection>

        <LegalSection title="4. Hesap açma ve yaş koşulu">
          <p>
            Hesap oluşturmak için geçerli bir e-posta adresi gerekir. Kayıt,
            e-posta adresine gönderilen doğrulama kodunun süresi içinde
            girilmesiyle tamamlanır. Kayıt sırasında Kullanıcıya Kişisel
            Verilerin Korunması Hakkında Aydınlatma Metni sunulur ve metni
            görüntülediğine ilişkin kayıt tutulur. Bu kayıt bilgilendirmeye
            ilişkindir; açık rıza yerine geçmez.
          </p>
          <p>
            <strong>On sekiz yaşından küçük Kullanıcılar</strong> Platformu
            veli veya yasal temsilcilerinin bilgisi ve onayı ile kullanır. Bazı
            özellikler yaş nedeniyle sınırlanabilir; ders alma ve hocayla
            mesajlaşma gibi temel işlevler bu sınırlamadan etkilenmez.
          </p>
          <p>
            Her Kullanıcı yalnızca kendi adına hesap açar. Hesap bilgilerinin
            güvenliği ve hesap üzerinden gerçekleştirilen işlemlerin sorumluluğu
            Kullanıcıya aittir. Şifrenin üçüncü kişilerle paylaşılmaması,
            yetkisiz erişim fark edildiğinde gecikmeksizin bildirilmesi
            gerekir.
          </p>
        </LegalSection>

        <LegalSection title="5. Öğrencinin yükümlülükleri">
          <ul className="list-disc space-y-2 pl-5">
            <li>Kayıt sırasında verdiği bilgilerin doğru ve güncel olması.</li>
            <li>
              Planlanan derse belirlenen saatte katılması; katılamayacağı
              durumu mümkün olan en erken zamanda bildirmesi.
            </li>
            <li>
              Hocaya ve diğer kullanıcılara saygılı davranması, ders ortamını
              ve mesajlaşmayı eğitim amacı dışında kullanmaması.
            </li>
            <li>
              Değerlendirme yazarken gerçekten aldığı derse dayalı, dürüst
              beyanda bulunması.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Hocanın yükümlülükleri ve doğrulama">
          <p>
            Hoca olarak hesap açan Kullanıcı, öğrenci kimliği, YKS sonuç
            belgesi ve <strong>.edu.tr</strong> uzantılı üniversite e-posta
            adresi ile doğrulama başvurusu yapar. Doğrulaması tamamlanmayan
            profiller herkese açık listede gösterilmez.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Profilde beyan edilen üniversite, bölüm ve YKS sıralaması
              bilgilerinin doğru olması; bilgilerde değişiklik olduğunda
              güncellenmesi.
            </li>
            <li>
              Kabul ettiği dersleri belirlenen saatte ve duyurduğu kapsamda
              vermesi.
            </li>
            <li>
              Müsaitlik takvimini gerçek duruma uygun tutması; veremeyeceği
              saatleri açık bırakmaması.
            </li>
            <li>
              Öğrenciye ait bilgileri yalnızca dersin yürütülmesi amacıyla
              kullanması, üçüncü kişilerle paylaşmaması.
            </li>
          </ul>
          <p>
            Derse katılmama kayıtları hoca hesabına işlenir. Hakkında{" "}
            <strong>üç</strong> katılmama kaydı oluşan hocanın profili,
            inceleme tamamlanıncaya kadar herkese açık listeden kendiliğinden
            çıkarılır.
          </p>
        </LegalSection>

        <LegalSection title="7. Mesajlaşma">
          <p>
            Öğrenci ile Hoca arasındaki mesajlaşma, ancak bir ders talebi
            oluşturulduktan sonra açılır. Platform üzerinde serbest mesajlaşma
            veya kullanıcı arama özelliği bulunmaz.
          </p>
          <p>
            Mesajlaşma eğitim amaçlıdır. Taciz, hakaret, tehdit, spam,
            reklam veya uygunsuz içerik paylaşımı yasaktır. Kullanıcılar, bu
            nitelikte bir mesajla karşılaştıklarında destek talebi
            oluşturabilir.
          </p>
        </LegalSection>

        <LegalSection title="8. Ders süreci">
          <p>
            Ders, Öğrencinin talebi ve Hocanın onayı ile kesinleşir. Ders,
            Platform üzerindeki çevrim içi ders odasında yapılır. Ders sırasında
            <strong> ses ve görüntü kaydı alınmaz</strong>; yalnızca derse kimin
            ne zaman katıldığına ilişkin kayıt tutulur.
          </p>
          <p>
            Tamamlanan ders, Öğrencinin onayı ile kesinleşir. Öğrencinin ders
            bitiminden itibaren <strong>yirmi dört saat</strong> içinde onay
            vermemesi veya itirazda bulunmaması halinde ders kendiliğinden
            onaylanmış sayılır. Öğrenci, tamamlanan ders için değerlendirme
            yazma hakkını ders bitiminden itibaren <strong>üç gün</strong>{" "}
            içinde kullanabilir.
          </p>
        </LegalSection>

        <LegalSection title="9. Ücretsiz deneme dersi">
          <p>
            Deneme dersi sunan hocalardan ücretsiz tanışma dersi talep
            edilebilir. Öğrenci her takvim ayında en fazla{" "}
            <strong>üç</strong> deneme talebi oluşturabilir ve her hocayla
            deneme hakkını <strong>bir kez</strong> kullanabilir. İptal edilen,
            reddedilen veya süresi dolan talepler aylık hakkı tüketmez;
            bekleyen talepler ise hakka dahildir.
          </p>
        </LegalSection>

        <LegalSection title="10. Ücretlendirme ve ödeme">
          <p>
            Ders ücretleri hoca profilinde ve paket seçim ekranında, vergiler
            dahil ve Türk lirası olarak gösterilir. Öğrenci, paket talebini
            oluşturmadan önce toplam tutarı, paketin içerdiği ders sayısını ve
            geçerlilik süresini görür.
          </p>
          <p>
            Platform üzerinde <strong>otomatik tahsilat yapılmamaktadır</strong>.
            Ödemeye ilişkin işlemler destek ekibi tarafından elle yürütülür.
            Paket talebi oluşturmak tek başına ödeme yapıldığı anlamına gelmez;
            paketin kullanıma açılması, ödemenin teyit edilmesine bağlıdır.
          </p>
          <p>
            HOCAM, sunduğu aracılık hizmeti karşılığında hoca hak edişinden{" "}
            <strong>%15</strong> oranında komisyon alır. Komisyon, öğrencinin
            ödediği ders bedeli üzerinden hesaplanır ve hocaya kalan tutar hak
            ediş olarak yansıtılır. Bu oranda yapılacak değişiklik, on sekizinci
            maddedeki usule tabidir.
          </p>
          <p>
            Platform dışında yapılan ödemeler bu koşulların kapsamı dışındadır.
            Böyle bir ödemeden doğan uyuşmazlıkta HOCAM taraf değildir ve
            sorumlu tutulamaz.
          </p>
        </LegalSection>

        <LegalSection title="11. İptal ve iade">
          <p>
            Ders iptali, derse katılmama, paket geçerlilik süresi ve paket
            bedelinin iadesine ilişkin kurallar{" "}
            <LegalLink href="/iptal-ve-iade">
              İptal ve İade Koşulları
            </LegalLink>{" "}
            metninde ayrıca düzenlenmiştir ve işbu Kullanım Koşullarının
            ayrılmaz parçasıdır.
          </p>
        </LegalSection>

        <LegalSection title="12. Yasak kullanımlar">
          <p>Kullanıcı, Platformu kullanırken aşağıdakileri yapamaz:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Başkasının kimliğini kullanmak, sahte hesap açmak veya yanıltıcı
              bilgi vermek.
            </li>
            <li>
              Doğrulama sürecine gerçeğe aykırı belge veya beyan sunmak.
            </li>
            <li>
              Diğer kullanıcıları taciz etmek, tehdit etmek, hakaret etmek veya
              ayrımcılık yapmak.
            </li>
            <li>
              Platformu reklam, spam, veri toplama veya kendi hizmetini pazarlama
              amacıyla kullanmak.
            </li>
            <li>
              Platformun güvenliğini tehdit eden, işleyişini engelleyen veya
              sistemlere yetkisiz erişim sağlamaya yönelik işlem yapmak;
              otomatik yöntemlerle içerik toplamak.
            </li>
            <li>
              Ders içeriğini veya diğer kullanıcılara ait paylaşımları izinsiz
              kaydetmek, çoğaltmak veya yaymak.
            </li>
            <li>
              Üçüncü kişilerin fikri ve sınai haklarını ihlal eden içerik
              paylaşmak.
            </li>
            <li>
              Değerlendirme sistemini gerçek bir derse dayanmayan yorumlarla
              etkilemeye çalışmak.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="13. İçerik ve fikri haklar">
          <p>
            Platformun tasarımı, arayüzü, yazılımı, metinleri, görselleri ve
            markası HOCAM’a aittir ve ilgili mevzuat kapsamında korunur. Bu
            unsurların izinsiz kopyalanması, çoğaltılması, değiştirilmesi veya
            dağıtılması yasaktır.
          </p>
          <p>
            Kullanıcının Platforma yüklediği içerik Kullanıcıya aittir.
            Kullanıcı, bu içeriğin Platform hizmetlerinin sunulabilmesi için
            gerekli ölçüde saklanmasına, görüntülenmesine ve ilgili kullanıcıya
            iletilmesine izin verir. Bu izin, hizmetin sunulması amacıyla
            sınırlıdır.
          </p>
          <p>
            Hocanın profilinde yayımlanan tanıtım metni, video ve ders
            açıklamaları hocaya aittir; hoca bu içeriğin herkese açık
            gösterilmesine ilişkin tercihini hesabından yönetir.
          </p>
        </LegalSection>

        <LegalSection title="14. Kişisel verilerin korunması">
          <p>
            Kişisel verilerin hangi amaçla işlendiği, kimlerle paylaşıldığı, ne
            kadar saklandığı ve Kullanıcının hakları{" "}
            <LegalLink href="/kvkk/aydinlatma-metni">
              Aydınlatma Metni
            </LegalLink>{" "}
            ile{" "}
            <LegalLink href="/kvkk/cerez-politikasi">
              Çerez Politikası
            </LegalLink>{" "}
            metinlerinde açıklanmıştır. Bu metinler bilgilendirme amaçlıdır ve
            açık rıza yerine geçmez; onay gereken hallerde ayrıca ve açıkça
            sorulur.
          </p>
        </LegalSection>

        <LegalSection title="15. Hizmetin sürekliliği ve sorumluluk">
          <p>
            HOCAM, Platformun kesintisiz ve hatasız çalışması için makul çabayı
            gösterir. Bakım, güncelleme, altyapı sağlayıcısından kaynaklanan
            arıza veya mücbir sebep hallerinde hizmette geçici kesinti
            yaşanabilir. Planlı kesintiler mümkün olduğunca önceden duyurulur.
          </p>
          <p>
            HOCAM, Öğrenci ile Hoca arasındaki ders ilişkisinin tarafı
            olmadığından, dersin içeriğinden, kalitesinden veya akademik
            sonucundan sorumlu değildir. HOCAM’ın sorumluluğu, kendi
            kusurundan doğan ve öngörülebilir doğrudan zararlarla sınırlıdır.
          </p>
          <p>
            Bu maddedeki sınırlamalar, tüketici mevzuatının Kullanıcıya tanıdığı
            ve sözleşmeyle daraltılamayan hakları etkilemez.
          </p>
        </LegalSection>

        <LegalSection title="16. Askıya alma ve fesih">
          <p>
            İşbu koşullara aykırılık tespit edilmesi halinde HOCAM, ihlalin
            ağırlığına göre içeriği kaldırabilir, profili herkese açık listeden
            çıkarabilir, hesabı geçici olarak askıya alabilir veya sözleşmeyi
            feshedebilir. Askıya alma ve fesih kararı, mümkün olan hallerde
            gerekçesiyle birlikte Kullanıcıya bildirilir ve Kullanıcı bu karara
            destek kanalı üzerinden itiraz edebilir.
          </p>
          <p>
            Askıya alma veya fesih, Kullanıcının o tarihe kadar doğmuş
            haklarını ve varsa iade taleplerini ortadan kaldırmaz. Devam eden
            dersler ve açık paketler, iptal ve iade kurallarına göre
            sonuçlandırılır.
          </p>
          <p>
            Kullanıcı, dilediği zaman hesabını kapatarak sözleşmeyi
            sonlandırabilir.
          </p>
        </LegalSection>

        <LegalSection title="17. Hesabın silinmesi">
          <p>
            Hesap silme talebi hesap ayarlarından oluşturulur. Talep
            oluşturulduktan sonra <strong>on dört gün</strong> süren bir bekleme
            dönemi işler; bu süre içinde talep geri alınabilir. Sürenin sonunda
            silme işlemi gerçekleştirilir.
          </p>
          <p>
            Aktif ders, açık paket veya sonuçlanmamış iade talebi bulunması
            halinde silme işlemi bunlar sonuçlanıncaya kadar bekletilir. Hoca
            hesaplarında, devam eden derslerin tamamlanmasına yönelik bir
            ayrılma süreci uygulanır.
          </p>
          <p>
            Mevzuat gereği saklanması zorunlu olan kayıtlar, öngörülen süre
            boyunca saklanmaya devam eder. Saklama süreleri Aydınlatma
            Metni’nde gösterilmiştir.
          </p>
        </LegalSection>

        <LegalSection title="18. Koşullarda değişiklik">
          <p>
            HOCAM, işbu koşullarda değişiklik yapabilir. Değişiklikler bu
            sayfada yayımlanır ve yayımlandığı tarihte yürürlüğe girer.
            Değişiklikler <strong>geçmişe yürümez</strong>: değişiklikten önce
            oluşturulmuş dersler, paketler ve talepler bakımından işlem
            tarihinde yürürlükte olan koşullar uygulanır.
          </p>
          <p>
            Kullanıcı aleyhine sonuç doğuran esaslı değişiklikler, yasal veya
            idari bir zorunluluk bulunmadıkça, yürürlüğe girmeden makul bir süre
            önce Kullanıcıya duyurulur.
          </p>
        </LegalSection>

        <LegalSection title="19. Uygulanacak hukuk ve uyuşmazlıklar">
          <p>
            İşbu koşullara Türkiye Cumhuriyeti hukuku uygulanır.
          </p>
          <p>
            Tüketici sıfatını taşıyan Kullanıcılar bakımından, Ticaret
            Bakanlığı’nca her yıl ilan edilen parasal sınırlar çerçevesinde
            Kullanıcının yerleşim yerindeki Tüketici Hakem Heyetleri ile
            Tüketici Mahkemeleri yetkilidir. Diğer uyuşmazlıklarda, platform
            işletmecisinin merkezinin bulunduğu yer mahkemeleri ve icra
            daireleri yetkilidir.
          </p>
        </LegalSection>

        <LegalSection title="20. Yürürlük ve iletişim">
          <p>
            İşbu koşullar, Kullanıcının hesap oluşturmasıyla yürürlüğe girer ve
            hesap açık kaldığı sürece geçerliliğini korur.
          </p>
          <p>
            Koşullara ilişkin sorular ve bildirimler için hesaba giriş
            yapıldıktan sonra destek talebi kanalı kullanılabilir. Hesabı
            bulunmayanlar{" "}
            <LegalLink href="/iletisim">iletişim sayfası</LegalLink> üzerinden
            başvurabilir.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

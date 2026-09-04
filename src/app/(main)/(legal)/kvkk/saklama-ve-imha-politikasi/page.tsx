import {
  LegalArticle,
  LegalDocHeader,
  LegalLink,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

export const metadata = legalPageMetadata("saklama-ve-imha-politikasi");

const RETENTION: ReadonlyArray<{
  data: string;
  period: string;
  method: string;
}> = [
  { data: "Hesap ve profil", period: "Hesap süresi + 6 ay", method: "Silme ve kimlik alanlarının anonimleştirilmesi" },
  { data: "Tamamlanmamış kayıt başvurusu", period: "1 gün", method: "Yok etme" },
  { data: "E-posta doğrulama kodu", period: "30 gün", method: "Yok etme" },
  { data: "Hoca doğrulama belgeleri ve güvenli önizlemeleri", period: "Onaydan sonra 7 gün; ret veya bekleyen başvuruda en fazla 30 gün", method: "Yok etme" },
  { data: "Üniversite e-posta ispatı ve alan adı inceleme kaydı", period: "Hesap süresi", method: "Silme" },
  { data: "Ders ve rezervasyon kayıtları", period: "10 yıl", method: "Anonim hale getirme" },
  { data: "Derse katılım kayıtları", period: "2 yıl", method: "Silme" },
  { data: "Görüntülü ders altyapısı olay kayıtları", period: "90 gün", method: "Yok etme" },
  { data: "Mesajlaşma ve mesaj görselleri", period: "Hesap kapanışı + 1 yıl", method: "Silme" },
  { data: "Ders materyalleri ve öğretmen notları", period: "Ders ilişkisi bitişi + 1 yıl", method: "Yok etme" },
  { data: "Öğrenme takibi kayıtları", period: "Onay geri alınana kadar", method: "Silme" },
  { data: "Keşif ve analitik kayıtları", period: "12 ay", method: "Anonim hale getirme" },
  { data: "Yapay zekâ asistanı sohbetleri", period: "Son etkileşimden 180 gün", method: "Silme" },
  { data: "Yapay zekâ kullanım sayacı", period: "12 ay", method: "Silme" },
  { data: "Bildirimler", period: "90 gün", method: "Silme" },
  { data: "Değerlendirmeler", period: "Süresiz", method: "Öğrenci kimliği anonim hale getirilir, yorum kalır" },
  { data: "Fatura ve mali kayıtlar", period: "10 yıl", method: "Süre sonunda yok etme" },
  { data: "Uyuşmazlık delilleri", period: "Dosya bazında, azami 10 yıl", method: "Yok etme" },
  { data: "Şikâyet ve güven kayıtları", period: "10 yıl", method: "Anonim hale getirme" },
  { data: "Yönetici erişim ve hesap geçişi kayıtları", period: "2 yıl", method: "Silme" },
  { data: "Destek talepleri", period: "3 yıl", method: "Silme" },
  { data: "Hesap silme talebi kayıtları", period: "3 yıl", method: "Silme" },
  { data: "Silinmiş hesap kimlik özeti", period: "Kayıt bazında belirlenen tarihe kadar", method: "Yok etme" },
];

/**
 * The public form of hocam-backend/docs/kvkk/03-saklama-ve-imha-politikasi.md.
 *
 * Publishing it is not a legal obligation: the inventory's §5 concludes HOCAM
 * currently meets all three VERBİS exemption criteria, and exemption from the
 * registry carries exemption from the mandatory retention policy with it. It
 * is published because a retention table is the one thing that makes a
 * privacy notice checkable.
 *
 * Two edits against the internal draft, both to keep this honest. The
 * periods here are the ones apps/privacy/retention.py actually enforces —
 * the draft's note that the destruction command "has not been written" is
 * stale, it exists and runs dry by default. And §6 states plainly that
 * storage objects sit outside that command, which the command itself warns
 * about on every run.
 *
 * Deliberately omitted: the internal responsibilities table and the rule
 * forbidding production data copies. Those bind the team, not the reader.
 */
export default function RetentionPolicyPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="saklama-ve-imha-politikasi" />

      <div className="mt-6">
        <LegalNote>
          Bu politika, KVKK’nın 7. maddesi ve Kişisel Verilerin Silinmesi, Yok
          Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik uyarınca
          hazırlanmıştır. Hangi verinin ne kadar saklandığını, süre dolunca
          nasıl imha edildiğini ve silme talebinin nasıl sonuçlandığını anlatır.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="1. Amaç ve kapsam">
          <p>
            Bu politika, HOCAM tarafından işlenen tüm kişisel verilerin ne kadar
            süreyle saklanacağını, sürenin dolması halinde hangi yöntemle imha
            edileceğini ve bu işlemin nasıl denetleneceğini belirler. Hangi
            verilerin işlendiği{" "}
            <LegalLink href="/kvkk/aydinlatma-metni">Aydınlatma Metni</LegalLink>{" "}
            ve{" "}
            <LegalLink href="/kvkk/hoca-aydinlatma-metni">
              Hoca Aydınlatma Metni
            </LegalLink>{" "}
            metinlerinde açıklanmıştır.
          </p>
        </LegalSection>

        <LegalSection title="2. Tanımlar">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Silme:</strong> verinin ilgili kullanıcılar için hiçbir
              şekilde erişilemez ve kullanılamaz hale getirilmesi.
            </li>
            <li>
              <strong>Yok etme:</strong> verinin hiç kimse tarafından hiçbir
              şekilde geri getirilemez hale getirilmesi.
            </li>
            <li>
              <strong>Anonim hale getirme:</strong> verinin başka verilerle
              eşleştirilse dahi kimliği belirli veya belirlenebilir bir gerçek
              kişiyle ilişkilendirilemeyecek hale getirilmesi. Takma adlaştırma
              anonimleştirme sayılmaz.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Saklamayı gerektiren sebepler">
          <ul className="list-disc space-y-2 pl-5">
            <li>Ticari defter ve belgelerin saklanması (TTK m.82 — 10 yıl).</li>
            <li>Vergi usulüne ilişkin saklama (VUK m.253).</li>
            <li>Genel zamanaşımı (TBK m.146 — 10 yıl).</li>
            <li>Sözleşmenin ifası (KVKK m.5/2-c).</li>
            <li>Bir hakkın tesisi ve korunması (KVKK m.5/2-e).</li>
            <li>İşlem güvenliğinin sağlanması (KVKK m.12).</li>
          </ul>
        </LegalSection>

        <LegalSection title="4. İmhayı gerektiren sebepler">
          <ul className="list-disc space-y-2 pl-5">
            <li>Saklama süresinin dolması.</li>
            <li>İşlemenin dayanağı olan hukuki sebebin ortadan kalkması.</li>
            <li>Onaya dayalı işlemede onayın geri alınması.</li>
            <li>İlgili kişinin silme talebinin kabul edilmesi.</li>
            <li>Kurul veya mahkeme kararı.</li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Saklama süreleri ve imha yöntemleri">
          <ul className="not-prose space-y-3">
            {RETENTION.map((row) => (
              <li
                key={row.data}
                className="rounded-input border border-line p-4"
              >
                <p className="text-body font-medium text-ink">{row.data}</p>
                <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[7rem_minmax(0,1fr)]">
                  <dt className="text-label text-ink-mid">Süre</dt>
                  <dd className="text-small tabular-nums text-ink">
                    {row.period}
                  </dd>
                  <dt className="text-label text-ink-mid">Yöntem</dt>
                  <dd className="text-small text-ink">{row.method}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </LegalSection>

        <LegalSection title="6. Periyodik imha">
          <p>
            Yönetmelik uyarınca periyodik imha <strong>altı ayda bir</strong>,
            her yıl Haziran ve Aralık aylarının ilk haftasında yapılır. İşlem
            önce etkilenecek kayıt sayılarını raporlayan bir deneme çalıştırması
            ile başlar; gerçek imha ancak bu rapor onaylandıktan sonra
            uygulanır.
          </p>
          <p>
            Her çalıştırma için tarih, kapsam, kayıt sayısı, yöntem ve sorumlu
            kişi bir imha tutanağına yazılır ve en az üç yıl saklanır.
          </p>
          <p>
            Depolama katmanındaki dosyalar (doğrulama belgeleri, ders
            materyalleri, mesaj görselleri) bu otomatik işlemin kapsamı dışında
            olup ayrıca imha edilir. Yalnızca veri tabanı kaydını silmek yeterli
            değildir.
          </p>
        </LegalSection>

        <LegalSection title="7. Silme talebi ile saklama yükümlülüğünün çatışması">
          <p>Bir kullanıcı silme talep ettiğinde:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Onaya dayalı tüm veriler silinir.</li>
            <li>Sözleşme ve profil verileri anonim hale getirilir.</li>
            <li>
              <strong>Mali kayıtlar silinmez.</strong> Vergi ve ticaret mevzuatı
              gereği 10 yıl saklanır; kapsam yalnızca fatura ve mali kayıtla
              sınırlı tutulur ve kimlik bilgisi şifreli olarak saklanır.
            </li>
            <li>
              Açık uyuşmazlık, iade veya güvenlik incelemesi varsa silme, dosya
              kapanışına kadar ertelenir ve gerekçesi kullanıcıya bildirilir.
            </li>
            <li>
              Yeniden kayıt kötüye kullanımını önlemek için yalnızca geri
              döndürülemez bir kimlik özeti tutulur; süresi dolduğunda o da yok
              edilir.
            </li>
          </ol>
          <p>
            Kullanıcıya hangi verinin silindiği, hangisinin hangi hukuki sebeple
            saklandığı açıkça yazılı olarak bildirilir.
          </p>
        </LegalSection>

        <LegalSection title="8. Güncelleme">
          <p>
            Bu politika yılda en az bir kez, ayrıca yeni bir veri kategorisi
            veya hizmet sağlayıcı eklendiğinde gözden geçirilir. Kişisel veri
            işleme envanteri ile bu politika birlikte güncellenir.
          </p>
        </LegalSection>
      </div>
    </LegalArticle>
  );
}

/**
 * Kullanım Koşulları — the platform terms, distinct from the sales contract.
 *
 * Deliberately does not restate the commerce terms: purchase, cancellation and
 * refund live in their own documents so there is exactly one authoritative
 * statement of each rule.
 *
 * Not reviewed by a Turkish lawyer. See docs/kvkk/unanswered.md.
 */

import Link from "next/link";

import { LegalDoc, Section, SellerIdentityBlock } from "@/components/legal/LegalDoc";
import { PLATFORM_DOMAIN, PLATFORM_NAME } from "@/lib/sellerIdentity";
import { MONTHLY_TRIAL_LIMIT, TRIAL_MINUTES } from "@/components/yemeksepeti/ysHomeFacts";

export const metadata = {
  title: "Kullanım Koşulları",
  description:
    "HOCAM platformunun kullanım koşulları: hesap açma, öğrenci ve eğitmen yükümlülükleri, içerik ve davranış kuralları.",
};

const VERSION = "v1.1";
const UPDATED_AT = "3 Eylül 2026";

export default function KullanimKosullariPage() {
  return (
    <LegalDoc
      title="Kullanım Koşulları"
      version={VERSION}
      updatedAt={UPDATED_AT}
      currentHref="/kullanim-kosullari"
      intro={
        <p>
          Bu koşullar {PLATFORM_NAME} platformunun kullanımına ilişkindir. Ders
          paketi satın alımına ilişkin kurallar{" "}
          <Link href="/mesafeli-satis-sozlesmesi" className="text-primary underline">
            Mesafeli Satış Sözleşmesi
          </Link>{" "}
          ve{" "}
          <Link href="/iptal-ve-iade" className="text-primary underline">
            İptal ve İade Koşulları
          </Link>{" "}
          sayfalarındadır.
        </p>
      }
    >
      <Section title="1. İşletmeci">
        <SellerIdentityBlock />
      </Section>

      <Section title="2. Platformun işlevi">
        <p>
          {PLATFORM_NAME}, YKS’ye hazırlanan öğrenciler ile doğrulanmış
          üniversite öğrencisi eğitmenleri buluşturan bir çevrim içi özel ders
          platformudur. Dersler {PLATFORM_DOMAIN} üzerinden görüntülü olarak
          yapılır.
        </p>
        <p>
          Eğitmen profilleri, öğrenci belgesi ve sınav sonuç belgesi
          incelendikten sonra doğrulanmış olarak işaretlenir. Doğrulama,
          eğitmenin kimliğine ve akademik başarısına ilişkin bir kontroldür;
          belirli bir sınav sonucu veya başarı garantisi değildir.
        </p>
      </Section>

      <Section title="3. Hesap">
        <p>
          Hesap açarken verdiğin bilgilerin doğru ve güncel olması gerekir.
          Hesabının güvenliğinden ve şifreni gizli tutmaktan sen sorumlusun.
        </p>
        <p>
          18 yaşından küçüksen, platformu velinin bilgisi ve izni ile
          kullanmalısın. Yaşa bağlı işlemler ve veli onayına ilişkin
          düzenlemeler{" "}
          <Link href="/kvkk/aydinlatma-metni" className="text-primary underline">
            KVKK Aydınlatma Metni
          </Link>{" "}
          içinde açıklanmıştır.
        </p>
        <p>Hesabını dilediğin zaman kapatabilirsin.</p>
      </Section>

      <Section title="4. Deneme dersi">
        <p>
          {TRIAL_MINUTES} dakikalık deneme dersi, bir eğitmenle çalışmanın sana
          uygun olup olmadığını görmen içindir. Bir takvim ayında en fazla{" "}
          {MONTHLY_TRIAL_LIMIT} deneme dersi alabilirsin.
        </p>
      </Section>

      <Section title="5. Davranış kuralları">
        <p>Platformu kullanırken:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Taciz, hakaret, ayrımcılık ve tehdit içeren davranışlarda bulunamazsın.</li>
          <li>Başkasının kimliğine bürünemez, yanıltıcı bilgi veremezsin.</li>
          <li>Telif hakkı sana ait olmayan içerikleri izinsiz paylaşamazsın.</li>
          <li>Platformun teknik işleyişini engelleyecek girişimlerde bulunamazsın.</li>
          <li>
            Ödemeleri platform dışına taşımaya yönelik tekliflerde bulunamazsın;
            platform dışı ödemelerde uyuşmazlık koruması işlemez.
          </li>
        </ul>
        <p>
          Bu kurallara aykırılık hâlinde hesabın askıya alınabilir veya
          kapatılabilir.
        </p>
      </Section>

      <Section title="6. Ders içeriği ve sorumluluk">
        <p>
          Ders içeriği eğitmen tarafından belirlenir ve sunulur.{" "}
          {PLATFORM_NAME} platformu sağlar, eğitmenleri doğrular ve
          uyuşmazlıkları inceler; ancak belirli bir akademik sonuç taahhüt
          etmez.
        </p>
        <p>
          Ders sırasında paylaşılan materyallerin telif hakkı, aksi
          belirtilmedikçe onları oluşturan tarafa aittir.
        </p>
      </Section>

      <Section title="7. Kişisel veriler">
        <p>
          Kişisel verilerinin nasıl işlendiği{" "}
          <Link href="/kvkk/aydinlatma-metni" className="text-primary underline">
            KVKK Aydınlatma Metni
          </Link>{" "}
          ve{" "}
          <Link href="/kvkk/cerez-politikasi" className="text-primary underline">
            Çerez Politikası
          </Link>{" "}
          sayfalarında açıklanmıştır.
        </p>
      </Section>

      <Section title="8. Değişiklikler ve uyuşmazlık">
        <p>
          Bu koşullar güncellenebilir. Güncellemelerde bu sayfadaki sürüm
          numarası ve tarihi değişir; esaslı değişikliklerde ayrıca
          bilgilendirilirsin.
        </p>
        <p>
          Tüketici sıfatını taşıyan kullanıcılar için Tüketici Hakem Heyetleri
          ve Tüketici Mahkemeleri yetkilidir.
        </p>
      </Section>
    </LegalDoc>
  );
}

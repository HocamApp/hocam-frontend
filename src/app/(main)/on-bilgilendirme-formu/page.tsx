/**
 * Ön Bilgilendirme Formu — Mesafeli Sözleşmeler Yönetmeliği m.5.
 *
 * The buyer must be able to read this BEFORE the order is placed, so the page
 * is public and is linked from checkout as well as the footer.
 *
 * Every product number quoted here comes from `ysHomeFacts.ts`, which mirrors
 * the backend constants that actually enforce them. Do not restate a number
 * from memory — import it, so the form cannot drift away from the software.
 *
 * Not reviewed by a Turkish lawyer. See docs/kvkk/unanswered.md.
 */

import Link from "next/link";

import { CommerceStatusNotice, LegalDoc, Section, SellerIdentityBlock } from "@/components/legal/LegalDoc";
import { PLATFORM_NAME } from "@/lib/sellerIdentity";
import {
  CANCELLATION_FREE_HOURS,
  LESSON_MINUTES,
  PACKAGE_GRACE_DAYS,
} from "@/components/yemeksepeti/ysHomeFacts";

export const metadata = {
  title: "Ön Bilgilendirme Formu",
  description:
    "HOCAM üzerinden satın alınan ders paketleri için Mesafeli Sözleşmeler Yönetmeliği uyarınca ön bilgilendirme formu.",
};

const VERSION = "v1.1";
const UPDATED_AT = "3 Eylül 2026";

export default function OnBilgilendirmeFormuPage() {
  return (
    <LegalDoc
      title="Ön Bilgilendirme Formu"
      version={VERSION}
      updatedAt={UPDATED_AT}
      currentHref="/on-bilgilendirme-formu"
      intro={
        <p>
          Bu form, siparişini tamamlamadan önce bilmen gereken bilgileri
          özetler. Siparişi onayladığında{" "}
          <Link href="/mesafeli-satis-sozlesmesi" className="text-primary underline">
            Mesafeli Satış Sözleşmesi
          </Link>{" "}
          metnini kabul edersin. Ödeme altyapısı kullanıma açıldığında, açıkça
          “ödeme yükümlülüğü doğuran sipariş” olarak işaretlenen son onay ücretli
          sözleşmeyi kurar.
        </p>
      }
    >
      <CommerceStatusNotice />
      <Section title="1. Satıcı bilgileri">
        <SellerIdentityBlock />
      </Section>

      <Section title="2. Hizmetin konusu ve temel nitelikleri">
        <p>
          {PLATFORM_NAME}, YKS’ye hazırlanan öğrencilerle doğrulanmış üniversite
          öğrencisi eğitmenleri buluşturan bir çevrim içi özel ders
          platformudur. Satın aldığın şey, seçtiğin eğitmenle yapılacak,
          platform üzerinden çevrim içi görüntülü olarak gerçekleştirilen ders
          hakkıdır.
        </p>
        <p>
          Bir ders {LESSON_MINUTES} dakikadır. Paketler, haftalık ders sayısı ve
          paket süresi seçilerek oluşturulur; toplam ders adedi ve tutar,
          siparişi onaylamadan önce sipariş özetinde açıkça gösterilir.
        </p>
        <p>
          Dersler bir eğitmene özeldir. Paket, satın alındığı eğitmenle
          kullanılmak üzere tanımlanır.
        </p>
      </Section>

      <Section title="3. Fiyat ve ödeme">
        <p>
          Sipariş özetinde gösterilen tutar, tüm vergiler dâhil toplam
          bedeldir ve Türk Lirası (TL) cinsindendir. Sipariş özetinde
          gösterilenin dışında herhangi bir ek masraf, hizmet bedeli veya
          kargo ücreti alınmaz.
        </p>
        <p>
          Paket otomatik olarak yenilenmez. Süre dolduğunda yeni bir sipariş
          vermediğin sürece herhangi bir ücret tahsil edilmez.
        </p>
      </Section>

      <Section title="4. İfa ve süre">
        <p>
          Hizmet, paket süresi boyunca ve senin planladığın ders saatlerinde
          ifa edilir. Paket süresi, ödemenin alındığı tarihte başlar.
        </p>
        <p>
          Paket süresi dolduktan sonra kalan derslerini planlayabilmen için{" "}
          {PACKAGE_GRACE_DAYS} günlük ek bir planlama süresi tanınır. Bu süre
          yalnızca ders planlamaya ilişkindir; cayma hakkı süresi değildir ve
          onunla karıştırılmamalıdır.
        </p>
      </Section>

      <Section title="5. Cayma hakkı">
        <p>
          Tüketici olarak, sözleşmenin kurulduğu tarihten itibaren{" "}
          <strong>14 gün</strong> içinde hiçbir gerekçe göstermeksizin ve cezai
          şart ödemeksizin cayma hakkına sahipsin.
        </p>
        <p>
          Hizmetin ifasına, açık onayınla 14 günlük süre dolmadan başlanması
          hâlinde cayma hakkı, ifa edilen kısım bakımından kullanılamaz. Bu
          durumda kullanılmamış derslerin bedeli iade edilir; kullanılmış
          derslerin bedeli mahsup edilir. Ayrıntısı{" "}
          <Link href="/iptal-ve-iade" className="text-primary underline">
            İptal ve İade Koşulları
          </Link>{" "}
          sayfasındadır.
        </p>
      </Section>

      <Section title="6. Ders iptali">
        <p>
          Planlanmış bir dersi, ders saatinden en az {CANCELLATION_FREE_HOURS}{" "}
          saat önce iptal edersen ders hakkın paketine geri döner. Daha geç
          yapılan iptallerde ders hakkı kullanılmış sayılabilir.
        </p>
      </Section>

      <Section title="7. Şikâyet ve uyuşmazlık">
        <p>
          Talep ve şikâyetlerini yukarıdaki iletişim kanallarından
          iletebilirsin. Uyuşmazlık hâlinde, Ticaret Bakanlığı’nca her yıl
          belirlenen parasal sınırlar çerçevesinde, satın aldığın veya
          yerleşim yerinin bulunduğu yerdeki Tüketici Hakem Heyetine veya
          Tüketici Mahkemelerine başvurabilirsin.
        </p>
      </Section>
    </LegalDoc>
  );
}

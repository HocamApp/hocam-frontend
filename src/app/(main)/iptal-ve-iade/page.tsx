/**
 * İptal ve İade Koşulları.
 *
 * This page replaces the auth-gated `/support#odeme-ve-iade` accordion as the
 * canonical statement, because a refund policy an anonymous buyer cannot read
 * is not published. `/support` keeps a short signed-in summary that links here
 * so the two cannot contradict each other.
 *
 * Not reviewed by a Turkish lawyer. See docs/kvkk/unanswered.md.
 */

import Link from "next/link";

import { CommerceStatusNotice, LegalDoc, Section, SellerIdentityBlock } from "@/components/legal/LegalDoc";
import {
  CANCELLATION_FREE_HOURS,
  PACKAGE_GRACE_DAYS,
} from "@/components/yemeksepeti/ysHomeFacts";

export const metadata = {
  title: "İptal ve İade Koşulları",
  description:
    "HOCAM ders paketlerinde cayma hakkı, ders iptali ve ücret iadesinin nasıl işlediği.",
};

const VERSION = "v1.1";
const UPDATED_AT = "3 Eylül 2026";

export default function IptalVeIadePage() {
  return (
    <LegalDoc
      title="İptal ve İade Koşulları"
      version={VERSION}
      updatedAt={UPDATED_AT}
      currentHref="/iptal-ve-iade"
      intro={
        <p>
          Bu sayfa iki ayrı şeyi anlatır: tek bir <strong>dersin</strong>{" "}
          iptali ve bir <strong>paketin</strong> iadesi. İkisi farklı
          kurallara tabidir.
        </p>
      }
    >
      <CommerceStatusNotice />
      <Section title="1. Tek bir dersin iptali">
        <p>
          Planlanmış bir dersi, ders saatinden en az {CANCELLATION_FREE_HOURS}{" "}
          saat önce iptal edersen ders hakkın paketine geri döner ve başka bir
          zaman için yeniden planlayabilirsin.
        </p>
        <p>
          {CANCELLATION_FREE_HOURS} saatten daha geç yapılan iptallerde ders
          hakkı kullanılmış sayılabilir. Bu, eğitmenin o saati başka bir
          öğrenciye ayıramamış olmasındandır.
        </p>
        <p>
          Eğitmen derse katılmazsa ders hakkın paketine geri verilir. Teknik
          sorunlarda olayın tarafı ve etkisi incelenir; uygun sonuç ders hakkı,
          telafi hakkı veya ücret iadesi yükümlülüğü olabilir. İnceleme
          tamamlanana kadar sonuç, gerçekleşmiş banka iadesi olarak gösterilmez.
        </p>
      </Section>

      <Section title="2. Paketin iadesi — cayma hakkı">
        <p>
          Bir paketi satın aldığın tarihten itibaren <strong>14 gün</strong>{" "}
          içinde, gerekçe göstermeden cayma hakkını kullanabilirsin.
        </p>
        <p>
          Bu süre içinde hiç ders kullanmadıysan ödediğin tutarın tamamı için
          iade süreci başlatılır. Ders kullandıysan mevcut ürün hesabı,
          kullanılan ders sayısını satın alımda gerçekten uygulanan indirimli
          birim fiyatla çarpar; bu tutar toplamdan düşülür. Zorunlu tüketici
          hakları farklı bir sonuç gerektiriyorsa onlar uygulanır.
        </p>
        <p>
          Uygulanabilir cayma hakkındaki iade, bildirimin bize ulaşmasından itibaren{" "}
          <strong>14 gün</strong> içinde, ödemeyi yaptığın yöntemle yapılır.
          İade için senden herhangi bir masraf alınmaz.
        </p>
      </Section>

      <Section title="3. 14 günden sonra">
        <p>
          Cayma süresi geçtikten sonra, kullanılmamış ders hakları için iade
          talebinde bulunabilirsin. Bu talepler bireysel olarak incelenir;
          eğitmenin hizmeti sunamaması, uzun süreli teknik sorunlar ve benzeri
          durumlarda kullanılmamış dersler için ücret iadesi yükümlülüğü
          doğabilir. Talebin alınması veya iç kaydın açılması, paranın bankana
          döndüğü anlamına gelmez; sonuç ödeme sağlayıcısı doğrulamasından sonra
          bildirilir.
        </p>
        <p>
          Paket süresi ve ardından gelen {PACKAGE_GRACE_DAYS} günlük planlama
          süresi dolduktan sonra kullanılmayan ders hakları kullanılamaz hâle
          gelir.
        </p>
      </Section>

      <Section title="4. Nasıl talep edersin">
        <p>
          İptal veya iade talebini, hesabındaki destek merkezinden ya da
          aşağıdaki iletişim adresinden iletebilirsin. Talebinde paket
          bilgini ve talebinin nedenini belirtmen incelemeyi hızlandırır.
        </p>
        <SellerIdentityBlock />
        <p>
          Hesabın varsa{" "}
          <Link href="/support" className="text-primary underline">
            destek merkezi
          </Link>{" "}
          üzerinden de talep oluşturabilirsin.
        </p>
      </Section>

      <Section title="5. Uyuşmazlık">
        <p>
          Talebinin sonucundan memnun kalmazsan, Ticaret Bakanlığı’nca her yıl
          belirlenen parasal sınırlar çerçevesinde yerleşim yerindeki Tüketici
          Hakem Heyetine veya Tüketici Mahkemesine başvurabilirsin.
        </p>
      </Section>
    </LegalDoc>
  );
}

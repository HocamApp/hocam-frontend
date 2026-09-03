/**
 * Mesafeli Satış Sözleşmesi — 6502 sayılı Kanun m.48 ve Mesafeli Sözleşmeler
 * Yönetmeliği.
 *
 * Public and readable before purchase; the checkout step links here and
 * records which version the buyer accepted.
 *
 * Product numbers are imported from `ysHomeFacts.ts` rather than restated, so
 * a rule change in the backend cannot leave a stale figure inside a contract.
 *
 * Not reviewed by a Turkish lawyer. See docs/kvkk/unanswered.md.
 */

import Link from "next/link";

import { LegalDoc, Section, SellerIdentityBlock } from "@/components/legal/LegalDoc";
import { PLATFORM_DOMAIN, PLATFORM_NAME } from "@/lib/sellerIdentity";
import {
  CANCELLATION_FREE_HOURS,
  LESSON_MINUTES,
  PACKAGE_GRACE_DAYS,
} from "@/components/yemeksepeti/ysHomeFacts";

export const metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description:
    "HOCAM üzerinden satın alınan çevrim içi özel ders paketlerine ilişkin mesafeli satış sözleşmesi.",
};

const VERSION = "v1.0";
const UPDATED_AT = "31 Ağustos 2026";

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <LegalDoc
      title="Mesafeli Satış Sözleşmesi"
      version={VERSION}
      updatedAt={UPDATED_AT}
      currentHref="/mesafeli-satis-sozlesmesi"
      intro={
        <p>
          Bu sözleşme, siparişini onayladığın anda kurulur. Siparişten önce{" "}
          <Link href="/on-bilgilendirme-formu" className="text-primary underline">
            Ön Bilgilendirme Formu
          </Link>{" "}
          ile bilgilendirilmiş sayılırsın.
        </p>
      }
    >
      <Section title="1. Taraflar">
        <p>
          <strong>SATICI</strong>
        </p>
        <SellerIdentityBlock />
        <p className="pt-2">
          <strong>ALICI</strong> — siparişi veren, hesabında kayıtlı ad, soyad,
          e-posta ve iletişim bilgileri esas alınan kullanıcıdır.
        </p>
      </Section>

      <Section title="2. Sözleşmenin konusu">
        <p>
          Bu sözleşmenin konusu, ALICI’nın {PLATFORM_DOMAIN} üzerinden
          elektronik ortamda sipariş verdiği, aşağıda nitelikleri ve satış
          bedeli belirtilen çevrim içi özel ders hizmetinin sunulmasına
          ilişkin tarafların hak ve yükümlülüklerinin belirlenmesidir.
        </p>
        <p>
          6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
          Sözleşmeler Yönetmeliği hükümleri uygulanır.
        </p>
      </Section>

      <Section title="3. Hizmetin nitelikleri ve bedeli">
        <p>
          Hizmet, ALICI’nın seçtiği eğitmenle {PLATFORM_NAME} üzerinden çevrim
          içi görüntülü olarak yapılan özel derstir. Bir ders{" "}
          {LESSON_MINUTES} dakikadır.
        </p>
        <p>
          Sipariş edilen paketin haftalık ders sayısı, süresi, toplam ders
          adedi ve tüm vergiler dâhil toplam bedeli, sipariş özetinde ve
          sipariş onayında Türk Lirası cinsinden gösterilir; bu bilgiler bu
          sözleşmenin ayrılmaz parçasıdır.
        </p>
        <p>Paket otomatik olarak yenilenmez.</p>
      </Section>

      <Section title="4. İfa">
        <p>
          Paket süresi ödemenin alınmasıyla başlar. Dersler, ALICI’nın
          eğitmenin müsait saatleri içinden seçtiği zamanlarda yapılır.
        </p>
        <p>
          Paket süresi sona erdikten sonra kalan derslerin planlanabilmesi için{" "}
          {PACKAGE_GRACE_DAYS} günlük ek planlama süresi tanınır. Bu sürenin
          sonunda kullanılmayan ders hakları kullanılamaz hâle gelir.
        </p>
        <p>
          Derse katılım için ALICI’nın internet bağlantısı ile kamera ve
          mikrofon desteği olan bir cihaza sahip olması gerekir.
        </p>
      </Section>

      <Section title="5. Ders iptali ve erteleme">
        <p>
          Planlanmış bir ders, ders saatinden en az {CANCELLATION_FREE_HOURS}{" "}
          saat önce iptal edilirse ders hakkı pakete geri döner.
        </p>
        <p>
          Eğitmenin derse katılmaması veya teknik bir aksaklık nedeniyle dersin
          yapılamaması hâlinde ders hakkı ALICI’ya iade edilir; ALICI dersi
          bildirim yoluyla uyuşmazlık olarak işaretleyebilir.
        </p>
      </Section>

      <Section title="6. Cayma hakkı">
        <p>
          ALICI, sözleşmenin kurulduğu tarihten itibaren <strong>14 gün</strong>{" "}
          içinde hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin cayma
          hakkına sahiptir.
        </p>
        <p>
          Cayma hakkının kullanıldığı tarihe kadar hizmetin ifasına ALICI’nın
          açık onayıyla başlanmışsa, cayma hakkı ifa edilen kısım bakımından
          kullanılamaz. Bu hâlde kullanılmamış ders bedelleri iade edilir,
          kullanılmış ders bedelleri mahsup edilir.
        </p>
        <p>
          Cayma bildirimi, bu sözleşmede belirtilen iletişim kanallarından
          yazılı olarak iletilir. İade, cayma bildiriminin SATICI’ya
          ulaşmasından itibaren <strong>14 gün</strong> içinde, ödemenin
          yapıldığı yöntemle ve ALICI’ya ek masraf yüklenmeksizin yapılır.
        </p>
      </Section>

      <Section title="7. Genel hükümler">
        <p>
          ALICI, sipariş öncesinde hizmetin temel nitelikleri, tüm vergiler
          dâhil satış fiyatı, ödeme ve ifa şekli ile cayma hakkına ilişkin
          bilgileri okuyup bilgilendiğini kabul eder.
        </p>
        <p>
          ALICI’nın {PLATFORM_NAME} hesabında kayıtlı e-posta adresi, bu
          sözleşme kapsamındaki bildirimler için geçerli tebligat adresi
          sayılır.
        </p>
        <p>
          Bu sözleşme elektronik ortamda kurulur; kabul kaydı, kabul edilen
          metin sürümü ve tarihi ile birlikte SATICI tarafından saklanır.
        </p>
      </Section>

      <Section title="8. Uyuşmazlık">
        <p>
          Uyuşmazlık hâlinde, Ticaret Bakanlığı’nca her yıl belirlenen parasal
          sınırlar çerçevesinde ALICI’nın mal veya hizmeti satın aldığı ya da
          yerleşim yerinin bulunduğu yerdeki Tüketici Hakem Heyetleri veya
          Tüketici Mahkemeleri yetkilidir.
        </p>
      </Section>
    </LegalDoc>
  );
}

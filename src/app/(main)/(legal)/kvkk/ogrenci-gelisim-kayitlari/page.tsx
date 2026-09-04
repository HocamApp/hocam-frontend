import Link from "next/link";

import {
  LegalArticle,
  LegalDocHeader,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

export const metadata = legalPageMetadata("ogrenci-gelisim-kayitlari");

export default function StudentProgressNoticePage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="ogrenci-gelisim-kayitlari" />

      <div className="mt-6">
        <LegalNote>
          Bu kayıt özelliği, hukuki değerlendirme tamamlanıp yalnızca açıkça
          seçilmiş pilot öğretmenler için etkinleştirilene kadar kapalıdır.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="Hangi bilgiler kaydedilir?">
          <p>
            Tamamlanmış bir ders için işlenen müfredat konusu, konuya ne ölçüde
            değinildiği, öğretmenin dersteki anlama ve destek ihtiyacı gözlemi
            ile önerilen sonraki adım kaydedilebilir. Belge içeriği, sağlık
            verisi veya öğrencinin özel hayatına ilişkin serbest metin
            istenmez.
          </p>
        </LegalSection>

        <LegalSection title="Amaç ve yorum sınırı">
          <p>
            Amaç ders devamlılığını ve bir sonraki dersin hazırlığını
            desteklemektir. Kayıtlar öğretmen gözlemidir; sınav sonucu, kesin
            seviye, tanı veya nesnel başarı ölçümü olarak sunulmaz. Otomatik
            karar, öğretmen sıralaması veya öğrenciye dönük otomatik
            yönlendirme üretmez.
          </p>
        </LegalSection>

        <LegalSection title="Kimler erişebilir?">
          <p>
            Kayıt, ilgili öğrenciyle ders ilişkisi bulunan ve kaydı oluşturan
            doğrulanmış öğretmenin özel öğrenci notları alanında tutulur.
            Yetkili teknik ve hukuki operasyonlar dışında başka öğretmenlere
            veya herkese açık profillere gösterilmez.
          </p>
        </LegalSection>

        <LegalSection title="Düzeltme, silme ve saklama">
          <p>
            Öğretmen yanlış kaydı düzeltebilir; değişiklik geçmişi güvenlik ve
            denetim amacıyla korunur. Öğrenci veya velisi, uygulanabilir KVKK
            hakları kapsamında bilgi alma, düzeltme ve silme talebini destek
            kanalı üzerinden iletebilir. Önerilen azami saklama süresi son
            güncellemeden itibaren 12 aydır ve süre sonunda çalışan idempotent
            silme mekanizması hazırlanmıştır. Süre ve hukuki dayanak nitelikli
            hukuk incelemesinde doğrulanmadan üretimde etkinleştirilmez.
          </p>
        </LegalSection>

        <LegalSection title="Araştırma kullanımı">
          <p>
            Yeterli ve uygun veri oluşursa yalnızca çevrimdışı yöntem
            araştırmalarında kimliği doğrudan göstermeyen biçimde
            kullanılabilir. Bu araştırma gerçek öğrenme kazanımı veya
            öğretmenin nedensel etkisi olarak sunulmaz ve canlı eşleştirmeyi
            kendiliğinden değiştiremez.
          </p>
        </LegalSection>
      </div>

      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-small">
        <Link href="/" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Hocam’a dön
        </Link>
      </div>
    </LegalArticle>
  );
}

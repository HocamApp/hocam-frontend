import Link from "next/link";

import { DiscoveryConsentControls } from "@/components/privacy/DiscoveryConsentControls";
import {
  LegalArticle,
  LegalDocHeader,
  LegalNote,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";

export const metadata = legalPageMetadata("analitik");

export default function AnalyticsNoticePage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="analitik" />

      <div className="mt-6">
        <LegalNote>
          Bu özellik hukuki onay tamamlanana kadar üretimde kapalıdır.
        </LegalNote>
      </div>

      <div className="mt-10 space-y-10">
        <LegalSection title="Hangi veriler işlenir?">
          <p>
            Onay vermen halinde gösterilen hoca sonuçları, görüntülenen
            kartlar, profil açma, favori ve rezervasyon başlangıcı gibi keşif
            etkileşimleri kaydedilir. Serbest arama metninin kendisi analitik
            kayda alınmaz.
          </p>
        </LegalSection>

        <LegalSection title="Amaç ve saklama">
          <p>
            Veriler hoca bulma deneyimini ölçmek ve iyileştirmek amacıyla
            kullanılır. Ham keşif kayıtları en fazla 12 ay tutulur; ardından
            silinir veya anonim hale getirilir.
          </p>
        </LegalSection>

        <LegalSection title="Tercihini değiştirme">
          <p>
            Onay vermemek uygulamanın temel işlevlerini etkilemez. Hesap ve
            gizlilik ayarlarından onayını geri çekebilirsin.
          </p>
        </LegalSection>
      </div>

      <div className="mt-10">
        <DiscoveryConsentControls />
      </div>

      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-small">
        <Link href="/" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Hocam’a dön
        </Link>
      </div>
    </LegalArticle>
  );
}

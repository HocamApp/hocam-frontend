import Link from "next/link";

import {
  LegalArticle,
  LegalDocHeader,
  LegalSection,
} from "@/components/legal/LegalDocument";
import { legalPageMetadata } from "@/lib/legalDocuments";
import { BROWSER_STORAGE_INVENTORY } from "@/lib/browserStorageInventory";

export const metadata = legalPageMetadata("cerez-politikasi");

export default function CerezPolitikasiPage() {
  return (
    <LegalArticle>
      <LegalDocHeader slug="cerez-politikasi" />

      <div className="mt-8 space-y-8">
        <LegalSection title="Çerez nedir">
          <p>
            Çerez, siteyi kullanırken tarayıcına kaydedilen küçük bir dosyadır.
            Bazıları sitenin çalışması için zorunludur; bazıları ise yalnızca
            sen izin verirsen kullanılır.
          </p>
        </LegalSection>

        <LegalSection title="Çerez ve tarayıcı depolama envanteri">
          <p>
            Aşağıdaki liste HOCAM’ın birinci taraf çerezlerini, yerel ve oturum
            depolamasını ve yalnız ilgili özellik açıldığında çalışan gömülü
            hizmetleri birlikte gösterir.
          </p>
          {/* A card per entry rather than a six-column table.
              The table needed a horizontal scroller to fit, and a horizontal
              scroller is only reachable with a trackpad or a visible
              scrollbar drag — a plain mouse wheel scrolls the page, not the
              box, so mouse users simply could not read the last three
              columns. Stacked label/value pairs need no scrolling at any
              width. */}
          <ul className="not-prose space-y-3">
            {BROWSER_STORAGE_INVENTORY.map((entry) => (
              <li
                key={entry.name}
                className="rounded-input border border-line p-4"
              >
                <p className="break-all font-mono text-small text-ink">
                  {entry.name}
                </p>
                <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  {[
                    ["Tür", entry.kind],
                    ["Amacı", entry.purpose],
                    ["Sağlayıcı", entry.provider],
                    ["Süre", entry.duration],
                    ["Kategori", entry.category],
                  ].map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-label text-ink-mid">{label}</dt>
                      <dd className="text-small text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </LegalSection>

        <LegalSection title="Reklam ve takip çerezleri">
          <p>
            Reklam amaçlı çerez, üçüncü taraf reklam ağı veya sosyal medya takip
            pikseli <strong>kullanmıyoruz.</strong> Bu değişirse bu sayfa
            güncellenir ve senden yeniden onay istenir.
          </p>
          <p>
            Keşif analitiği tercihi verilmeden gösterim, tıklama veya etkileşim
            kaydı oluşturulmaz. “Reddet” seçeneği yalnız ret tercihini hatırlar;
            analitik oturum başlatmaz.
          </p>
        </LegalSection>

        <LegalSection title="Tercihini değiştirme">
          <p>
            Onaya bağlı çerezleri istediğin an kapatabilirsin; kapatmak açmak
            kadar kolaydır ve sitenin temel işlevlerini etkilemez. Tercihini{" "}
            <Link href="/profile/gizlilik" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
              Gizlilik ve Verilerim
            </Link>{" "}
            sayfasından yönetebilirsin.
          </p>
          <p>
            Tarayıcı ayarlarından da tüm çerezleri silebilir veya
            engelleyebilirsin. Zorunlu çerezleri engellersen giriş yapamayabilir
            veya oturumun sürekli kapanabilir.
          </p>
        </LegalSection>
      </div>


      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-small">
        <Link href="/kvkk/aydinlatma-metni" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Aydınlatma Metni
        </Link>
        <Link href="/" className="inline-flex min-h-6 items-center font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink">
          Hocam’a dön
        </Link>
      </div>
    </LegalArticle>
  );
}

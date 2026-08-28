import Link from "next/link";
import { BROWSER_STORAGE_INVENTORY } from "@/lib/browserStorageInventory";

export const metadata = {
  title: "Çerez Politikası",
  description:
    "HOCAM’ın hangi çerezleri neden kullandığını ve tercihini nasıl değiştirebileceğini anlatan çerez politikası.",
};

export default function CerezPolitikasiPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Çerez Politikası</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sürüm v1.1 · 26 Ağustos 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Çerez nedir</h2>
          <p>
            Çerez, siteyi kullanırken tarayıcına kaydedilen küçük bir dosyadır.
            Bazıları sitenin çalışması için zorunludur; bazıları ise yalnızca
            sen izin verirsen kullanılır.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Çerez ve tarayıcı depolama envanteri</h2>
          <p>
            Aşağıdaki liste HOCAM’ın birinci taraf çerezlerini, yerel ve oturum
            depolamasını ve yalnız ilgili özellik açıldığında çalışan gömülü
            hizmetleri birlikte gösterir.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 font-semibold">Teknoloji</th>
                  <th className="py-2 pr-4 font-semibold">Tür</th>
                  <th className="py-2 pr-4 font-semibold">Amacı</th>
                  <th className="py-2 pr-4 font-semibold">Sağlayıcı</th>
                  <th className="py-2 pr-4 font-semibold">Süre</th>
                  <th className="py-2 font-semibold">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {BROWSER_STORAGE_INVENTORY.map((entry) => (
                  <tr key={entry.name} className="border-b align-top">
                    <td className="py-3 pr-4 font-mono text-xs">
                      {entry.name}
                    </td>
                    <td className="py-3 pr-4">{entry.kind}</td>
                    <td className="py-3 pr-4">{entry.purpose}</td>
                    <td className="py-3 pr-4">{entry.provider}</td>
                    <td className="py-3 pr-4">{entry.duration}</td>
                    <td className="py-3">{entry.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Reklam ve takip çerezleri</h2>
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
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Tercihini değiştirme</h2>
          <p>
            Onaya bağlı çerezleri istediğin an kapatabilirsin; kapatmak açmak
            kadar kolaydır ve sitenin temel işlevlerini etkilemez. Tercihini{" "}
            <Link href="/profile/gizlilik" className="text-primary underline">
              Gizlilik ve Verilerim
            </Link>{" "}
            sayfasından yönetebilirsin.
          </p>
          <p>
            Tarayıcı ayarlarından da tüm çerezleri silebilir veya
            engelleyebilirsin. Zorunlu çerezleri engellersen giriş yapamayabilir
            veya oturumun sürekli kapanabilir.
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        <Link href="/kvkk/aydinlatma-metni" className="text-primary underline">
          Aydınlatma Metni
        </Link>
        <Link href="/" className="text-primary underline">
          Hocam’a dön
        </Link>
      </div>
    </main>
  );
}

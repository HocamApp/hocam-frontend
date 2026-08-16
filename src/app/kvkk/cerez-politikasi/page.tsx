import Link from "next/link";

export const metadata = {
  title: "Çerez Politikası",
  description:
    "HOCAM’ın hangi çerezleri neden kullandığını ve tercihini nasıl değiştirebileceğini anlatan çerez politikası.",
};

const COOKIES = [
  {
    name: "auth_token",
    purpose: "Oturumunu açık tutar. Bu olmadan giriş yapamazsın.",
    duration: "Oturum boyunca",
    party: "HOCAM",
    required: true,
  },
  {
    name: "hocam_discovery_consent",
    purpose:
      "Analitik ölçüme onay verip vermediğini hatırlar, böylece sana tekrar tekrar sormayız.",
    duration: "12 ay",
    party: "HOCAM",
    required: true,
  },
  {
    name: "admin_impersonation_token",
    purpose:
      "Yalnızca destek ekibi, izinli bir inceleme yaparken kullanır. Normal kullanımda oluşmaz.",
    duration: "Oturum boyunca",
    party: "HOCAM",
    required: true,
  },
  {
    name: "Keşif analitiği kayıtları",
    purpose:
      "Hangi hocaların gösterildiğini ve hangilerine tıklandığını ölçer; hoca bulma deneyimini iyileştirmek için kullanılır.",
    duration: "12 ay",
    party: "HOCAM",
    required: false,
  },
];

export default function CerezPolitikasiPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Çerez Politikası</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sürüm v1.0 · 16 Ağustos 2026
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
          <h2 className="text-xl font-semibold">Kullandığımız çerezler</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 font-semibold">Çerez</th>
                  <th className="py-2 pr-4 font-semibold">Amacı</th>
                  <th className="py-2 pr-4 font-semibold">Süre</th>
                  <th className="py-2 font-semibold">Zorunlu mu</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((cookie) => (
                  <tr key={cookie.name} className="border-b align-top">
                    <td className="py-3 pr-4 font-mono text-xs">
                      {cookie.name}
                    </td>
                    <td className="py-3 pr-4">{cookie.purpose}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {cookie.duration}
                    </td>
                    <td className="py-3">
                      {cookie.required ? "Zorunlu" : "Onaya bağlı"}
                    </td>
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

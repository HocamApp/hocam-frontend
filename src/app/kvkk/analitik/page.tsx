import Link from "next/link";
import { DiscoveryConsentControls } from "@/components/privacy/DiscoveryConsentControls";

export const metadata = { title: "Analitik Aydınlatma Metni" };

export default function AnalyticsNoticePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Analitik Aydınlatma Metni</h1>
      <p className="mt-4 text-muted-foreground">Bu özellik hukuki onay tamamlanana kadar üretimde kapalıdır.</p>
      <div className="mt-8 space-y-5 text-sm leading-7">
        <section><h2 className="font-semibold">Hangi veriler işlenir?</h2><p>Onay vermen halinde gösterilen hoca sonuçları, görüntülenen kartlar, profil açma, favori ve rezervasyon başlangıcı gibi keşif etkileşimleri kaydedilir. Serbest arama metninin kendisi analitik kayda alınmaz.</p></section>
        <section><h2 className="font-semibold">Amaç ve saklama</h2><p>Veriler hoca bulma deneyimini ölçmek ve iyileştirmek amacıyla kullanılır. Ham keşif kayıtları en fazla 12 ay tutulur; ardından silinir veya anonim hale getirilir.</p></section>
        <section><h2 className="font-semibold">Tercihini değiştirme</h2><p>Onay vermemek uygulamanın temel işlevlerini etkilemez. Hesap ve gizlilik ayarlarından onayını geri çekebilirsin.</p></section>
      </div>
      <div className="mt-8"><DiscoveryConsentControls /></div>
      <Link href="/" className="mt-8 inline-flex min-h-6 items-center text-sm font-medium text-primary underline">Hocam’a dön</Link>
    </main>
  );
}

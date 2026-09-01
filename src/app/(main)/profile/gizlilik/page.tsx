import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ConsentSettings } from "@/components/privacy/ConsentSettings";
import { DataSubjectRequestForm } from "@/components/privacy/DataSubjectRequestForm";

export const metadata = { title: "Gizlilik ve Verilerim" };

export default function PrivacySettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/profile"
        className="inline-flex min-h-6 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Profilime dön
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Gizlilik ve Verilerim</h1>
      <p className="mt-3 text-muted-foreground">
        Kişisel verilerinle ilgili bilgilere, mevcut onay kayıtlarına ve başvuru
        kanalına buradan ulaşabilirsin. Ders alma, gerekli mesajlaşma ve ödeme
        gibi temel işlemler pazarlama onayından bağımsızdır.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Verilerini nasıl işlediğimizi{" "}
        <Link href="/kvkk/aydinlatma-metni" className="text-primary underline">
          aydınlatma metninde
        </Link>{" "}
        okuyabilirsin.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Onaylarım</h2>
        <div className="mt-4">
          <ConsentSettings />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Haklarımı kullanmak istiyorum</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          KVKK 11. madde kapsamındaki taleplerini her zaman
          kvkk@hocamozelders.com adresine; çevrimiçi kanal etkinse aşağıdaki
          formdan iletebilirsin. Başvurunu en geç 30 gün içinde cevaplarız.
        </p>
        <div className="mt-4">
          <DataSubjectRequestForm />
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";

import { ConsentSettings } from "@/components/privacy/ConsentSettings";
import { DataSubjectRequestForm } from "@/components/privacy/DataSubjectRequestForm";
import { RouteGuard } from "@/components/shared/RouteGuard";

export const metadata = { title: "Gizlilik ve Verilerim" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-h3-m text-ink md:text-h3">{title}</h2>
        {description ? (
          <div className="max-w-[60ch] text-body leading-[1.6] text-ink-mid">
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Everything on this page reads the signed-in account, so it sits behind
 * RouteGuard. Without it an anonymous visitor reached the page, every request
 * failed, and the consent list sat on "Yükleniyor…" with nothing to explain
 * why — the exact failure this guard prevents.
 */
export default function PrivacySettingsPage() {
  return (
    <RouteGuard requireAuth>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
        <Link
          href="/profile"
          className="inline-flex min-h-9 items-center gap-1.5 text-small text-ink-mid transition-colors duration-[var(--duration-state)] hover:text-ink"
        >
          <ArrowLeft weight="regular" className="h-4 w-4" aria-hidden />
          Profilime dön
        </Link>

        <header className="mt-6 space-y-3">
          <h1 className="text-h2-m text-ink md:text-h2">
            Gizlilik ve Verilerim
          </h1>
          <p className="max-w-[60ch] text-body leading-[1.6] text-ink-mid">
            Hangi onayları verdiğini buradan görebilir, istediğin an geri
            alabilirsin. Ders alma, öğretmeninle mesajlaşma ve ödeme gibi temel
            işlemler bu onaylardan bağımsız çalışır.
          </p>
          <p className="max-w-[60ch] text-small leading-[1.6] text-ink-mid">
            Verilerini nasıl işlediğimizi{" "}
            <Link
              href="/kvkk/aydinlatma-metni"
              className="font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink"
            >
              aydınlatma metninde
            </Link>{" "}
            okuyabilirsin.
          </p>
        </header>

        <div className="mt-10 space-y-12">
          <Section title="Onaylarım">
            <ConsentSettings />
          </Section>

          <Section
            title="Haklarımı kullanmak istiyorum"
            description={
              <>
                KVKK 11. madde kapsamında verilerin hakkında bilgi isteyebilir,
                düzeltme veya silme talep edebilirsin. Başvurunu en geç 30 gün
                içinde cevaplarız.
              </>
            }
          >
            <DataSubjectRequestForm />
          </Section>
        </div>
      </div>
    </RouteGuard>
  );
}

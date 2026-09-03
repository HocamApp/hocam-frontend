import type { Metadata } from "next";
import Link from "next/link";
import { ChatsCircle, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { ContactSimpleForm } from "@/components/contact/ContactSimpleForm";
import styles from "@/components/contact/contact.module.css";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Hocam ile iletişime geç: sorularını, önerilerini ve iş birliği taleplerini ekibimize gönder.",
  robots: { index: false, follow: true },
};

export default function ContactPage() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>İletişim</p>
        <h1 className={styles.title}>Seni dinliyoruz.</h1>
        <p className={styles.intro}>Aklındaki soruyu, önerini ya da iş birliği fikrini bizimle paylaş. Mesajın doğrudan Hocam ekibine ulaşsın.</p>
      </header>
      <ContactSimpleForm />
      <p className={styles.email}>Doğrudan yazmak istersen: <a href="mailto:iletisim@hocamozelders.com">iletisim@hocamozelders.com</a></p>
      <section className={styles.channels} aria-label="Diğer iletişim kanalları">
        <div className={styles.channel}>
          <ChatsCircle size={24} weight="regular" aria-hidden="true" />
          <h2>Hesabınla ilgili bir konu mu?</h2>
          <p>Derslerin, rezervasyonların veya hesabın için destek merkezinden talep oluşturabilirsin.</p>
          <Link href="/support">Destek merkezine git</Link>
        </div>
        <div className={styles.channel}>
          <ShieldCheck size={24} weight="regular" aria-hidden="true" />
          <h2>Kişisel verilerinle ilgili talepler</h2>
          <p>KVKK kapsamındaki başvurularını ilgili ekibimize doğrudan iletebilirsin.</p>
          <a href="mailto:kvkk@hocamozelders.com">kvkk@hocamozelders.com</a>
        </div>
      </section>
    </article>
  );
}

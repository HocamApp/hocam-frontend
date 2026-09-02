import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import styles from "./about-continuation.module.css";

export function AboutInvitation() {
  return (
    <section className={styles.invitation} aria-labelledby="about-invitation">
      <div className={styles.invitationGrid}>
        <div>
          <p className={styles.eyebrow}>Söz sende</p>
          <h2 className={styles.title} id="about-invitation">Hocam&apos;ı birlikte geliştirelim.</h2>
          <p className={styles.lede}>
            Hoca ararken zorlandığın bir şey mi var? Bir önerin ya da aklına
            takılan bir soru varsa bize yaz. Öğrenci veya hoca, deneyimini
            duymak isteriz.
          </p>
        </div>
        <Link className={styles.contact} href="/iletisim">
          Bize ulaş <ArrowUpRight size={20} weight="regular" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

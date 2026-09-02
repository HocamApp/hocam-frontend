"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import styles from "./about-continuation.module.css";

const PRINCIPLES = [
  {
    id: "trust",
    title: "Belgeye dayanan güven",
    summary: "Kiminle çalışacağını bil.",
    description:
      "Hocaların YKS sıralaması ve öğrenci bilgileri, gönderilen belgeler üzerinden incelenir. Profilleri bu bilgilerle birlikte görür, hocanı daha yakından tanıyarak karar verirsin.",
  },
  {
    id: "choice",
    title: "Kendi ihtiyacına göre seçim",
    summary: "Önceliklerini sen belirle.",
    description:
      "Aradığın ders, üniversite, sıralama ve ücret bilgileri bir arada. Hocaları kendi önceliklerine göre karşılaştırabilir, sana uygun profilleri inceleyebilirsin.",
  },
  {
    id: "continuity",
    title: "Bir arada yürüyen süreç",
    summary: "Dersin etrafındaki işler de kolaylaşsın.",
    description:
      "Ders planın, hocanla mesajların ve online ders odan aynı hesabında. Derslerini ve iletişimini buradan takip ederek çalışmana zaman ayırabilirsin.",
  },
] as const;

export function AboutPrinciples() {
  return (
    <section className={styles.approach} aria-labelledby="about-principles">
      <div className={styles.approachGrid}>
        <header className={styles.introduction}>
          <p className={styles.eyebrow}>Yaklaşımımız</p>
          <h2 className={styles.title} id="about-principles">
            Karar senin.<br />Bilgiler açık.
          </h2>
          <p className={styles.lede}>
            Her öğrencinin aradığı destek farklı. Hocam&apos;ı, sana uygun hocayı
            kendi önceliklerinle seçebilmen için geliştiriyoruz.
          </p>
        </header>
        <Accordion type="single" defaultValue="trust" collapsible className={styles.accordion}>
          {PRINCIPLES.map((principle) => (
            <AccordionItem key={principle.id} value={principle.id} className={styles.item}>
              <AccordionTrigger className={styles.trigger}>
                <span>
                  <span className={styles.principleTitle}>{principle.title}</span>
                  <span className={styles.summary}>{principle.summary}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className={styles.content}>
                <p>{principle.description}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

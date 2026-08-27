"use client";

import Link from "next/link";

import {
  SupportAccordionSection,
  type SupportAccordionSectionLayout,
} from "@/components/support/SupportAccordionSection";

const faqItems = [
  {
    id: "faq-item-1",
    question: "Hocam destek merkezi ne işe yarar?",
    answer:
      "Destek merkezi üzerinden hesap, ders talebi, rezervasyon, mesajlaşma ve platform kullanımıyla ilgili sorunlarını bize iletebilirsin. Ekibimiz talebini inceleyip en kısa sürede yanıtlar.",
  },
  {
    id: "faq-item-2",
    question: "Destek talebi nasıl oluşturulur?",
    answer:
      "Destek sayfasındaki formdan kategori seçip konuyu ve yaşadığın durumu açıklayarak destek talebi oluşturabilirsin. Ne kadar net bilgi verirsen süreci o kadar hızlı değerlendirebiliriz.",
  },
  {
    id: "faq-item-3",
    question: "Ders talebim yanıtlanmazsa ne yapmalıyım?",
    answer:
      "Eğitmenler uygunluk durumlarına göre dönüş yapar. Uzun süre yanıt alamazsan farklı bir eğitmene talep gönderebilir veya destek ekibine durumu iletebilirsin.",
  },
  {
    id: "faq-item-4",
    question: "Rezervasyon ve ders süreçlerinde sorun yaşarsam kim yardımcı olur?",
    answer:
      "Rezervasyon, ders saati, iptal veya iletişim sorunlarında destek talebi oluşturarak ekibimizden yardım alabilirsin. Gerekirse ilgili ders ve eğitmen bilgilerini de paylaş.",
  },
  {
    id: "faq-item-5",
    question: "Favori hocalarımı nereden görebilirim?",
    answer:
      "Öğrenci hesabınla giriş yaptıktan sonra üst menüdeki Favoriler alanından daha önce favorilerine eklediğin hocaları görebilirsin.",
  },
  {
    id: "faq-item-6",
    question: "Profil ve hesap ayarlarımı nereden yönetebilirim?",
    answer:
      "Sağ üstteki profil menüsünden hesap bilgilerine, tema ayarlarına ve destek bağlantısına ulaşabilirsin.",
  },
  {
    id: "faq-item-7",
    question: "Destek taleplerime ne kadar sürede dönüş yapılır?",
    answer:
      "Talepler destek ekibi tarafından sırayla incelenir. Yoğunluğa göre süre değişebilir ancak amaç en kısa sürede net ve yardımcı bir yanıt vermektir.",
  },
];

interface SupportFAQProps {
  layout?: SupportAccordionSectionLayout;
  className?: string;
}

export function SupportFAQ({
  layout = "split",
  className,
}: SupportFAQProps = {}) {
  const isStacked = layout === "stacked";

  return (
    <SupportAccordionSection
      layout={layout}
      className={className}
      heading={
        <>
          <h2
            className={
              isStacked
                ? "text-xl font-semibold tracking-tight text-foreground"
                : "text-2xl font-semibold tracking-tight text-foreground"
            }
          >
            Sıkça Sorulan Sorular
          </h2>
          <p
            className={
              isStacked
                ? "mt-3 text-sm leading-6 text-muted-foreground"
                : "mt-5 text-base leading-7 text-muted-foreground"
            }
          >
            Aradığın cevabı bulamadın mı?
          </p>
          <Link
            href="#support-request-form"
            className={
              isStacked
                ? "mt-1 inline-flex text-sm font-medium text-primary hover:underline"
                : "mt-2 inline-flex text-base font-medium text-primary hover:underline"
            }
          >
            Destek ekibimizle iletişime geç
          </Link>
        </>
      }
      items={faqItems.map((item) => ({
        id: item.id,
        title: item.question,
        content: <p className="text-base leading-7">{item.answer}</p>,
      }))}
    />
  );
}

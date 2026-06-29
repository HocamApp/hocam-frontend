"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    id: "item-1",
    question: "Hocam destek merkezi ne işe yarar?",
    answer:
      "Destek merkezi üzerinden hesap, ders talebi, rezervasyon, mesajlaşma ve platform kullanımıyla ilgili sorunlarını bize iletebilirsin. Ekibimiz talebini inceleyip en kısa sürede yanıtlar.",
  },
  {
    id: "item-2",
    question: "Destek talebi nasıl oluşturulur?",
    answer:
      "Destek sayfasındaki formdan kategori seçip konuyu ve yaşadığın durumu açıklayarak destek talebi oluşturabilirsin. Ne kadar net bilgi verirsen süreci o kadar hızlı değerlendirebiliriz.",
  },
  {
    id: "item-3",
    question: "Ders talebim yanıtlanmazsa ne yapmalıyım?",
    answer:
      "Eğitmenler uygunluk durumlarına göre dönüş yapar. Uzun süre yanıt alamazsan farklı bir eğitmene talep gönderebilir veya destek ekibine durumu iletebilirsin.",
  },
  {
    id: "item-4",
    question: "Rezervasyon ve ders süreçlerinde sorun yaşarsam kim yardımcı olur?",
    answer:
      "Rezervasyon, ders saati, iptal veya iletişim sorunlarında destek talebi oluşturarak ekibimizden yardım alabilirsin. Gerekirse ilgili ders ve eğitmen bilgilerini de paylaş.",
  },
  {
    id: "item-5",
    question: "Favori hocalarımı nereden görebilirim?",
    answer:
      "Öğrenci hesabınla giriş yaptıktan sonra üst menüdeki Favoriler alanından daha önce favorilerine eklediğin hocaları görebilirsin.",
  },
  {
    id: "item-6",
    question: "Profil ve hesap ayarlarımı nereden yönetebilirim?",
    answer:
      "Sağ üstteki profil menüsünden hesap bilgilerine, tema ayarlarına ve destek bağlantısına ulaşabilirsin.",
  },
  {
    id: "item-7",
    question: "Destek taleplerime ne kadar sürede dönüş yapılır?",
    answer:
      "Talepler destek ekibi tarafından sırayla incelenir. Yoğunluğa göre süre değişebilir ancak amaç en kısa sürede net ve yardımcı bir yanıt vermektir.",
  },
];

export function SupportFAQ() {
  return (
    <section className="mt-10 border-t border-border/70 py-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
        <div>
          <p className="text-sm font-medium text-primary">
            Sorularının cevapları
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            Sıkça Sorulan Sorular
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Aradığın cevabı bulamadın mı?
          </p>
          <Link
            href="#support-request-form"
            className="mt-2 inline-flex text-base font-medium text-primary hover:underline"
          >
            Destek ekibimizle iletişime geç
          </Link>
        </div>

        <Accordion
          type="single"
          collapsible
          className="w-full"
        >
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-dotted"
            >
              <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="text-base leading-7">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

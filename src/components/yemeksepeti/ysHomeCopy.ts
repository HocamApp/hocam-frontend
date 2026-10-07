import type { ReactNode } from "react";

/**
 * Every sentence the homepage says, in one place.
 *
 * Components import their strings from here; Turkish text does not live in
 * their JSX. Rewriting the page's copy means editing this file and nothing
 * else.
 *
 * Numbers never appear here as literals. They come from `ysHomeFacts.ts`, and
 * an entry that contains one is a small function the component calls with the
 * value. Where the value can still be an undecided `TODO`, the function takes
 * a `ReactNode`, so the component can pass a `<YsFact>` that renders the
 * placeholder in development.
 *
 * One export per section, in page order. Sections land phase by phase
 * (docs/design/product-home/homepage-rebuild/HOCAM_HOMEPAGE_PLAN.md); the ones
 * not built yet are added with their task.
 */

export const hero = {
  titleLine1: "Dünün öğrencisi,",
  titleLine2: "bugünün öğretmeni",
  /* The pre-rebuild headline, shown while NEXT_PUBLIC_HOME_V2 is off. */
  titleLine2Legacy: "Bugünün öğretmeni",
  sub: "YKS'de derece yapmış öğrencileri, derece yapacaklarla buluşturuyoruz.",
  ctaTutors: "Hocaları gör",
  ctaBecomeTutor: "Hoca ol",
  audienceLabel: "Senin için olan kısma atla",
  audience: {
    students: "Ders almak istiyorum",
    parents: "Velisiyim",
    tutors: "Hoca olmak istiyorum",
  },
} as const;

export const subjects = {
  title: "Hangi dersler var?",
  sub: "Dersine tıkla, o dersi veren hocaları gör.",
  coaching: "YKS koçluğu",
} as const;

export const band = {
  title: "Belgesi olmayan kimse ders veremez",
  lead: "Öğrenci kimliği, YKS sonuç belgesi ve üniversite e-posta adresi tek tek kontrol edilir.",
  rankBadge: (maxRank: string) => `İlk ${maxRank}`,
  eligibility: (rankBadge: ReactNode): ReactNode[] => [
    "Sadece YKS'de ",
    rankBadge,
    " içine girmiş öğrenciler hoca olabilir.",
  ],
  cta: "Nasıl doğruluyoruz?",
  checklistTitle: "Her hoca başvurusunda kontrol ettiklerimiz",
  /* The three TutorVerification documents, in the model's order. */
  checklist: [
    { label: "Öğrenci kimliği", sub: "Hâlâ üniversitede okuduğunu gösterir." },
    { label: "YKS sonuç belgesi", sub: "Profilde yazan sıralamanın kaynağı." },
    { label: ".edu.tr e-posta adresi", sub: "Hangi üniversitede olduğunu doğrular." },
  ],
  checklistFoot: (f: { reviewDays: ReactNode; docsDeletedAfter: ReactNode }): ReactNode[] => [
    "Başvurular ",
    f.reviewDays,
    " gün içinde sonuçlanır. Belgeler profilde hiçbir zaman görünmez ve ",
    f.docsDeletedAfter,
    " sonra silinir.",
  ],
} as const;

/** Values the student steps quote. Undecided ones arrive as `<YsFact>`. */
export interface StudentStepFacts {
  trialMinutes: number;
  trialLimit: number;
  weeklyMin: number;
  weeklyMax: number;
  shortestPlan: string;
  longestPlan: string;
  paymentChargedWhen: ReactNode;
  remainingOnSwitch: ReactNode;
}

export const students = {
  sub: "Öğrenciler için: hoca bulmaktan ilk derse kadar ne olacağını adım adım gör. Profilleri incelemek için hesap açman gerekmiyor.",
  steps: [
    {
      title: "Hocanı bul",
      body: (): ReactNode[] => [
        "Ders, sınav türü, üniversite, fiyat ve YKS sıralamasına göre filtrele. Profilde bio, verdiği dersler ve gerçek derslerden gelen yorumlar var.",
      ],
    },
    {
      title: "Hocana yaz",
      body: (): ReactNode[] => [
        "Profilinden mesaj attığında ya da ders talebi gönderdiğinde aranızda mesajlaşma açılır. Hedefini, eksik konularını ve uygun saatlerini orada konuşursunuz. Mesaj ve talep göndermek ücretsiz.",
      ],
    },
    {
      title: "Ücretsiz deneme dersi",
      body: (f: StudentStepFacts): ReactNode[] => [
        `İlk dersin ${f.trialMinutes} dakikalık ücretsiz bir deneme dersi. Her hocayla bir kez yapabilirsin, ayda en fazla ${f.trialLimit} deneme hakkın var. Anlaşırsanız devam edersiniz.`,
      ],
    },
    {
      title: "Paketini seç",
      body: (f: StudentStepFacts): ReactNode[] => [
        `Haftada ${f.weeklyMin} ile ${f.weeklyMax} ders arasında seç, ${f.shortestPlan} ile ${f.longestPlan} arasında bir süre belirle. Uzun pakette ders başı fiyat düşer. Paket tek seferlik, otomatik yenilenmez.`,
      ],
    },
    {
      title: "Paket talebini gönder",
      body: (f: StudentStepFacts): ReactNode[] => [
        "Paket talebini oluştururken kartından ücret alınmaz. ",
        f.paymentChargedWhen,
      ],
    },
    {
      title: "Derse gir",
      body: (): ReactNode[] => [
        'Ders saatinde panelinden "Derse katıl"a bas. Tarayıcıda açılır, bir şey indirmen gerekmez. Görüntülü görüşme ve ortak beyaz tahta aynı ekranda.',
      ],
    },
    {
      title: "Ders sonrası",
      body: (f: StudentStepFacts): ReactNode[] => [
        "Dersi puanla, yorumunu bırak. Kalan derslerini panelinde görürsün. Hocanla uyuşmadıysan başka hocaya geçebilirsin ",
        f.remainingOnSwitch,
        ".",
      ],
    },
  ],
  shots: {
    tutorList: { caption: "01 · Hoca listesi", alt: "Hoca listesi ekranı" },
    packageSelection: { caption: "04 · Paket seçimi", alt: "Paket seçimi ekranı" },
    lessonDashboard: { caption: "06 · Panelden derse katıl", alt: "Öğrenci paneli, Derse katıl butonu" },
    lessonRoom: { caption: "06 · Ders odası", alt: "Ders odası, görüntülü görüşme ve beyaz tahta" },
  },
  lessonRoomPlaceholder: "Ders odası ekran görüntüsü (video + beyaz tahta)",
} as const;

export const pricing = {
  titleLead: "Ne kadar",
  titlePill: "ödersin?",
  sub: "Fiyatı her hoca kendisi belirler, profilde gördüğün fiyat ders başı fiyattır. Pakette ne kadar uzun gidersen ders başı o kadar düşer.",
  lessonKey: "Bir ders",
  lessonValue: (minutes: number) => `${minutes} dakika`,
  lessonBody: (min: number, max: number) =>
    `Her ders aynı sürede. Haftada ${min} ile ${max} ders arasında seçersin.`,
  rangeKey: "Ders başı fiyatlar",
  trialKey: "Deneme dersi",
  trialValue: "Ücretsiz",
  trialBody: (minutes: number, limit: number) =>
    `${minutes} dakika. Her hocayla bir kez, ayda en fazla ${limit} deneme.`,
  exampleTitle: "Paket süresi · örnek",
  exampleSub: (lessonsPerWeek: number, price: string) =>
    `Haftada ${lessonsPerWeek} ders, ${price}'lik bir hocayla`,
  examplePrice: (price: string, minutes: number) => `${price} / ${minutes} dk`,
  planAdvantage: (percent: number) => `%${percent} fiyat avantajı`,
  planMostPopular: "En popüler",
  planPerLesson: (lessonCount: number) => `/ ders · ${lessonCount} ders`,
  noteOneTime: "Tek seferlik paket, otomatik yenilenmez.",
  noteNoCharge: "Paket talebini oluştururken kartından ücret alınmaz.",
  noteNoExtraFee: "Hocanın profilindeki fiyatın üstüne ekstra ücret yok.",
} as const;

export const guarantees = {
  titleLead: "Ters giderse",
  titlePill: "ne olur?",
  payment: {
    question: "Param ne zaman çekiliyor?",
    answer: (chargedWhen: ReactNode): ReactNode[] => [
      "Paket talebini oluştururken kartından ücret alınmaz. ",
      chargedWhen,
    ],
  },
  noShow: {
    question: "Hoca derse gelmezse?",
    answer: (noShow: ReactNode): ReactNode[] => [noShow],
  },
  cancel: {
    question: "Dersi iptal edersem?",
    answer: (hours: number, policyLink: ReactNode): ReactNode[] => [
      `Dersten ${hours} saat öncesine kadar ücretsiz. Sonrası için `,
      policyLink,
      ".",
    ],
    policyLink: "iptal ve iade koşulları",
  },
  switchTutor: {
    question: "Hocamla anlaşamazsam?",
    answer: (remaining: ReactNode): ReactNode[] => [
      "Başka hocaya geçebilirsin. Paketinde kalan dersler ",
      remaining,
      ".",
    ],
  },
} as const;

export const parents = {
  title: "Veliler için",
  lead: "Çocuğunuzun kiminle, nerede ders aldığını bilin. Hocalarımız YKS'de derece yapmış, belgeleri tek tek incelenmiş üniversite öğrencileri.",
  cta: "Veliler için tüm bilgiler",
  onPlatform: {
    title: "Her şey platformda",
    /* The mockup said messaging opens only after a lesson request. It does
       not: a first message from the tutor's profile opens the conversation
       (lib/messagingApi.ts createMessageRequest), so the row says what is
       true today. */
    body: "Dersler Hocam'ın ders odasında yapılır. Hocayla mesajlaşma da platformun içinde, telefon numarası paylaşmak gerekmez.",
  },
  recording: {
    title: "Kayıt ve derse katılım",
    body: (recording: ReactNode, parentJoin: ReactNode): ReactNode[] => [recording, " ", parentJoin],
  },
  payment: {
    title: "Ödeme ve dekont",
    body: (parentPay: ReactNode): ReactNode[] => [
      parentPay,
      " Paket fiyatı ve indirim ödemeden önce açıkça görünür.",
    ],
  },
  support: {
    title: "Bir sorun olursa",
    body: (reply: ReactNode): ReactNode[] => [
      "iletisim@hocamozelders.com adresine yazın, ",
      reply,
      " içinde dönüyoruz.",
    ],
  },
} as const;

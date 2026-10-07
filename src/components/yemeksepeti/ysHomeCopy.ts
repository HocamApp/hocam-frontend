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

/** Values the tutor steps quote. Undecided ones arrive as `<YsFact>`. */
export interface TutorStepFacts {
  signupMinutes: number;
  reviewDays: ReactNode;
  trialMinutes: number;
  trialPaid: ReactNode;
  autoConfirmHours: number;
  payout: ReactNode;
  commission: ReactNode;
  coaching: boolean;
  coachingText: ReactNode;
}

export const tutors = {
  title: "YKS'deki dereceni gelire çevir",
  lead: "Geçen sene çözdüğün soruları bu sene sınava girenlere anlat. Saatlerini sen seçersin, fiyatını sen belirlersin.",
  ctaApply: "Hoca olarak başvur",
  ctaLearnMore: "Hocalık hakkında her şey",
  eligibilityTitle: "Kimler başvurabilir?",
  eligibility: (f: { maxRank: string; minWeeklyHours: ReactNode }): ReactNode[][] => [
    [`YKS'de ilk ${f.maxRank} içine girmiş olmak`],
    ["Aktif üniversite öğrencisi olmak ve .edu.tr e-postana erişebilmek"],
    ["Öğrenci kimliğini ve YKS sonuç belgeni yükleyebilmek"],
    ["Haftada en az ", f.minWeeklyHours, " saat ayırabilmek"],
  ],
  stepsTitle: "Başvurudan ilk ödemene kadar",
  steps: [
    {
      title: "Başvur",
      body: (f: TutorStepFacts): ReactNode[] => [
        `Hesabını aç, üniversite ve bölüm bilgilerini gir. ${f.signupMinutes} dakika sürer.`,
      ],
    },
    {
      title: "Doğrulan",
      body: (f: TutorStepFacts): ReactNode[] => [
        "Belgelerini yükle. ",
        f.reviewDays,
        " gün içinde incelenir. Belgelerin profilinde hiçbir zaman görünmez.",
      ],
    },
    {
      title: "Profilini ve takvimini kur",
      body: (): ReactNode[] => [
        "Derslerini, tanıtım yazını ve ders ücretini belirle. Haftalık uygun saatlerini işaretle, öğrenciler sadece o saatlere ders alabilir.",
      ],
    },
    {
      title: "Talepleri yanıtla, deneme dersi ver",
      body: (f: TutorStepFacts): ReactNode[] => [
        `Gelen taleplere panelinden mesajla dön. Deneme dersleri ${f.trialMinutes} dakika, açıp kapatmak senin elinde. `,
        f.trialPaid,
      ],
    },
    {
      title: "Dersini ver",
      body: (): ReactNode[] => [
        "Ders odası hazır: görüntülü görüşme ve ortak tahta. Zoom hesabına ya da ekstra programa gerek yok.",
      ],
    },
    {
      title: "Ödemeni al",
      body: (f: TutorStepFacts): ReactNode[] => [
        `Öğrenci dersi onaylayınca ya da ${f.autoConfirmHours} saat geçince ders tamamlanmış sayılır. `,
        f.payout,
        " Hocam ders başı %",
        f.commission,
        " komisyon alır.",
      ],
    },
    {
      /* Coaching appears only while the coaching flag is on, title included. */
      title: "Büyü, koçluk da ver",
      titleWithoutCoaching: "Büyü",
      chip: "Koçluk",
      body: (f: TutorStepFacts): ReactNode[] =>
        f.coaching
          ? [
              "Yorumların arttıkça listede üste çıkarsın. İstersen ders anlatmanın yanında YKS koçluğu da verebilirsin. ",
              f.coachingText,
            ]
          : ["Yorumların arttıkça listede üste çıkarsın."],
    },
  ],
  calculator: {
    title: "Ne kadar kazanırsın?",
    sub: "Kendi rakamlarınla dene.",
    lessonsPerWeek: "Haftada kaç ders?",
    price: "Ders ücretin",
    commission: "Komisyon",
    lessonsPerMonth: "Ayda ders",
    gross: "Brüt",
    commissionAmount: "Komisyon",
    net: "Eline geçen / ay",
    note: (lessonMinutes: number, weeksPerMonth: string) =>
      `Ders başı ${lessonMinutes} dakika, ayda ${weeksPerMonth} hafta ile hesaplanır.`,
  },
  quotesTitle: "Hocalarımız anlatıyor",
  profileLink: "Profilini gör →",
} as const;

export const testimonialsTitle = "Öğrencilerden";

/**
 * One FAQ answer, as parts: plain text, a fact (with the placeholder label
 * shown while it is TODO), or a link. Kept as data so the same answer can be
 * rendered and also flattened to text for the FAQPage JSON-LD.
 */
export type FaqPart = string | { fact: unknown; label: string } | { href: string; text: string };

export interface FaqFacts {
  trialMinutes: number;
  trialLimit: number;
  lessonMinutes: number;
  weeklyMin: number;
  weeklyMax: number;
  shortestPlan: string;
  longestPlan: string;
  maxDiscount: number;
  cancelHours: number;
  offPlatform: unknown;
  parentCanPay: unknown;
  parentCanJoin: unknown;
  tutorNoShow: unknown;
  trialPaid: unknown;
  mustAccept: unknown;
  minWeeklyHours: unknown;
  studentNoShow: unknown;
  tax: unknown;
}

export const faq = {
  title: "Merak Edilenler",
  guideLink: "Ders sürecinin tamamını oku",
  tabsLabel: "Kim için",
  tabs: { student: "Öğrenci", parent: "Veli", tutor: "Hoca" },
  /* The student answers are the existing, fact-backed homepage FAQ; only the
     single-lesson answer changed, to the weekly-package wording. */
  student: (f: FaqFacts): { id: string; question: string; answer: FaqPart[] }[] => [
    {
      id: "deneme",
      question: "Ücretsiz deneme dersi nasıl çalışıyor?",
      answer: [
        `Deneme dersi ${f.trialMinutes} dakika sürer ve ücretsizdir; ödeme ya da paket hakkı gerekmez. Her hocayla bir kez deneme dersi yapabilirsin ve aynı takvim ayı içinde en fazla ${f.trialLimit} deneme dersi hakkın olur. Bu seçeneği yalnızca profilinde deneme dersini açık tutan hocalarda görürsün.`,
      ],
    },
    {
      id: "sure-ucret",
      question: "Standart bir ders kaç dakika, ücreti nasıl belirleniyor?",
      answer: [
        `Standart ders ${f.lessonMinutes} dakikadır. Hoca profilinde gördüğün ücret bu ${f.lessonMinutes} dakikalık dersin ücretidir; ücreti her hoca kendisi belirler ve dilediğinde güncelleyebilir. Bu yüzden ders seçmeden önce ilgili profildeki güncel değere bak.`,
      ],
    },
    {
      id: "tek-ders",
      question: "Tek ders satın alabilir miyim?",
      answer: [
        `Hayır. Dersler haftalık paketle alınır: haftada ${f.weeklyMin} ile ${f.weeklyMax} ders, ${f.shortestPlan} ile ${f.longestPlan} arası.`,
      ],
    },
    {
      id: "paket-fiyat",
      question: "Paket seçerken ders başına fiyat nasıl değişiyor?",
      answer: [
        `Haftalık ders sayısı arttıkça ve paket süresi uzadıkça ders başına ücret düşer. En yoğun ve en uzun seçimde bu fiyat avantajı %${f.maxDiscount}'a kadar çıkabilir. Seçimini yaptığında toplam ders sayısı, liste fiyatı ve uygulanan fiyat avantajı özet ekranında ayrı ayrı gösterilir.`,
      ],
    },
    {
      id: "iptal",
      question: "Bir dersi iptal edersem ne oluyor?",
      answer: [
        `Dersin başlamasına ${f.cancelHours} saatten fazla varken iptal edersen kullandığın ders hakkı paketine geri döner. ${f.cancelHours} saatten az kaldığında yapılan iptalde ders hakkı geri verilmez. Planın değişecekse hocanı mümkün olduğunca erken haberdar et.`,
      ],
    },
    {
      id: "ders-odasi",
      question: "Dersler nerede yapılıyor, kaydediliyor mu?",
      answer: [
        "Dersler Hocam'ın kendi online ders odasında yapılır; ders saatinde hesabındaki rezervasyon üzerinden katılırsın. Ders odasında kayıt, canlı yayın ve otomatik konuşma dökümü kapalıdır, dersler kaydedilmez.",
      ],
    },
    {
      id: "dogrulama",
      question: "Hocalar nasıl doğrulanıyor?",
      answer: [
        "Hoca adayları öğrenci kimliği, YKS sonuç belgesi ve .edu.tr uzantılı üniversite e-posta adresiyle başvurur. Hoca listesinde yalnızca doğrulanmış ve yayına açık profiller listelenir. Doğrulamada kullanılan belgeler herkese açık profilde yayınlanmaz. Ayrıntıları ",
        { href: "/hocalar-nasil-dogrulaniyor", text: "doğrulama sayfasında" },
        " okuyabilirsin.",
      ],
    },
    {
      id: "mesaj",
      question: "Ders almadan hocayla iletişim kurabilir miyim?",
      answer: [
        "Evet. Hoca profilindeki mesaj alanından ilk mesajını gönderdiğinde konuşma hemen başlar, ayrıca bir onay adımı yoktur. Ders talebi oluşturduğunda da aynı konuşma açılır. Mesaj gönderebilmek için hesabınla giriş yapmış olman gerekir.",
      ],
    },
  ],
  parent: (f: FaqFacts): { id: string; question: string; answer: FaqPart[] }[] => [
    {
      id: "platform-disi",
      question: "Çocuğum hocayla platform dışında konuşabilir mi?",
      answer: ["Mesajlaşma ve dersler platformda. ", { fact: f.offPlatform, label: "Platform dışı iletişim kuralı: D13" }],
    },
    {
      id: "veli-odeme",
      question: "Ödemeyi ben yapabilir miyim?",
      answer: [{ fact: f.parentCanPay, label: "D14" }],
    },
    {
      id: "veli-izleme",
      question: "Dersleri izleyebilir miyim?",
      answer: [{ fact: f.parentCanJoin, label: "D10" }],
    },
    {
      id: "veli-hoca-gelmezse",
      question: "Hoca derse gelmezse ne oluyor?",
      answer: [{ fact: f.tutorNoShow, label: "D7" }],
    },
  ],
  tutor: (f: FaqFacts): { id: string; question: string; answer: FaqPart[] }[] => [
    {
      id: "hoca-deneme-ucret",
      question: "Deneme derslerinde ücret alıyor muyum?",
      answer: [{ fact: f.trialPaid, label: "D5" }],
    },
    {
      id: "hoca-talep",
      question: "Gelen her talebi kabul etmek zorunda mıyım?",
      answer: [{ fact: f.mustAccept, label: "D12" }],
    },
    {
      id: "hoca-saat",
      question: "Haftada en az kaç saat ders vermeliyim?",
      answer: ["Haftada en az ", { fact: f.minWeeklyHours, label: "D12" }, " saat."],
    },
    {
      id: "hoca-ogrenci-gelmezse",
      question: "Öğrenci derse gelmezse ne oluyor?",
      answer: [{ fact: f.studentNoShow, label: "D7" }],
    },
    {
      id: "hoca-vergi",
      question: "Kazancımı vergi açısından nasıl beyan ederim?",
      answer: [{ fact: f.tax, label: "D13: mali müşavir onaylı metin" }],
    },
  ],
} as const;

export const footer = {
  columns: {
    discover: "Hocam'ı keşfet",
    how: "Nasıl çalışır?",
    who: "Kimin için?",
    hocam: "Hocam",
    legal: "Yasal Metinler",
  },
  links: {
    tutorList: "Hoca Listesi",
    yks: "YKS özel ders",
    tytMath: "TYT Matematik özel ders",
    aytMath: "AYT Matematik özel ders",
    trial: "Ücretsiz deneme dersi",
    process: "Ders süreci",
    pricing: "Fiyatlar ve paketler",
    verification: "Hoca doğrulama",
    faq: "Sıkça sorulan sorular",
    students: "Öğrenciler",
    parents: "Veliler",
    becomeTutor: "Hoca ol",
    about: "Hakkımızda",
    contact: "İletişim",
    mobileSoon: "Mobil uygulama yakında",
    kvkk: "KVKK ve Gizlilik",
  },
  copyright: (year: number) => `© ${year} Hocam. Tüm hakları saklıdır.`,
  mersis: "MERSİS",
  kvkkContact: "KVKK başvuru: iletisim@hocamozelders.com",
} as const;

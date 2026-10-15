import {
  BookOpen,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { PAYTR_ENABLED } from "@/lib/featureFlags";
import { POLICY_FACTS as f } from "@/lib/policyFacts";
import type {
  SupportTicketCategory,
  SupportTicketStatus,
} from "@/types/api";

export const CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  account: "Hesap",
  booking: "Ders & Rezervasyon",
  payment: "Ödeme",
  messaging: "Mesajlaşma",
  technical: "Teknik Sorun",
  other: "Diğer",
};

export const CATEGORY_OPTIONS: SupportTicketCategory[] = [
  "account",
  "booking",
  "payment",
  "messaging",
  "technical",
  "other",
];

export const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Açık",
  in_progress: "İnceleniyor",
  resolved: "Çözüldü",
  closed: "Kapatıldı",
};

export const STATUS_VARIANTS: Record<
  SupportTicketStatus,
  "default" | "secondary" | "outline"
> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

export interface HelpSection {
  icon: LucideIcon;
  title: string;
  items: string[];
  /** Deep-link anchor, e.g. #odeme-ve-iade. */
  anchorId?: string;
}

/**
 * Formal, honest Turkish help/rulebook content. Copy says only what the
 * product does.
 *
 * Two products, one page: before the instant checkout a package request waits
 * for the tutor and payment is settled by the support desk by hand; with it the
 * student pays at once and the lessons are written to the tutor's calendar.
 * `instant` (the build flag) picks the version the live product matches, and
 * the numbers come from policyFacts.ts, as they do on the legal pages.
 */
export function helpSections(instant: boolean): HelpSection[] {
  return [
    {
      icon: BookOpen,
      title: "Platform kuralları",
      items: [
        "Hocam, YKS'ye hazırlanan öğrenciler ile üniversiteli eğitmenleri buluşturan bir platformdur.",
        "Tüm kullanıcılar saygılı ve dürüst bir iletişim sürdürmekle yükümlüdür.",
        "Sahte hesap, yanıltıcı bilgi veya başkasının kimliğini kullanmak platform politikası gereği yasaktır.",
        "Kurallara aykırı davranışlar destek ekibi tarafından incelenir ve gerekli görülürse hesap askıya alınabilir.",
      ],
    },
    {
      icon: CalendarCheck,
      title: "Ders ve rezervasyon kuralları",
      items: instant
        ? [
            "Ders paketi, eğitmenin açık tuttuğu saatlerden seçilir.",
            "Paket dersleri ödeme onaylanınca eğitmenin takvimine yazılır ve kesinleşir. Ücretsiz deneme dersi talepleri eğitmenin kabul etmesiyle kesinleşir.",
            `Bir dersi başlamasına ${f.freeCancelHours} saatten fazla varken ücretsiz iptal edebilirsin; ders hakkın geri döner ve yerleşmemiş hak olarak durur. Hakları Paketlerim ekranından yeni saatlere yerleştirirsin.`,
            "Plan değişikliklerini mümkün olduğunca erken bildirmeniz beklenir.",
            "Tekrarlayan katılım sorunları destek ekibi tarafından değerlendirilir.",
          ]
        : [
            "Ders talepleri, eğitmenin uygunluk saatleri içinde oluşturulabilir.",
            "Rezervasyon onayı eğitmenin kabul etmesiyle kesinleşir.",
            "Plan değişikliklerini mümkün olduğunca erken bildirmeniz beklenir.",
            "Tekrarlayan katılım sorunları destek ekibi tarafından değerlendirilir.",
          ],
    },
    {
      icon: MessageSquare,
      title: "Mesajlaşma kuralları",
      items: [
        "Mesajlaşma, öğrencinin eğitmen profilinden ilk mesajını göndermesiyle ya da ders talebi oluşturmasıyla açılır.",
        "Mesajlar eğitim amaçlı ve nezaket sınırları içinde olmalıdır.",
        "Taciz, spam veya uygunsuz içerik paylaşımı yasaktır.",
        "Şüpheli bir durumla karşılaşırsanız destek talebi oluşturabilirsiniz.",
      ],
    },
    {
      icon: CreditCard,
      title: "Ödeme ve iade bilgilendirmesi",
      anchorId: "odeme-ve-iade",
      items: instant
        ? [
            "Paket ödemesi PayTR'nin güvenli sayfasında kartla yapılır; kart bilgileriniz Hocam'a ulaşmaz.",
            `Ödemeye geçtiğinizde seçtiğiniz saatler ${f.holdMinutes} dakika boyunca yalnızca sizin için ayrılır.`,
            `Paketi aldığınız günden başlayarak ${f.withdrawalDays} gün içinde cayabilirsiniz; hiçbir ders kullanılmadıysa tutarın tamamı iade edilir.`,
            `İade taleplerinizi hesabınızdaki Ödemeler sayfasından oluşturursunuz. Destek ekibi talebi en geç ${f.refundSettleDays} gün içinde sonuçlandırır ve iadeyi ödeme yaptığınız karta yapar.`,
            "Platform dışı ödeme yöntemleri önerilmez; oluşabilecek sorunlardan platform sorumlu tutulamaz.",
          ]
        : [
            "Şu anda platform üzerinde otomatik ödeme veya iade işlemi bulunmamaktadır.",
            "Ödeme ile ilgili talepleriniz destek ekibi tarafından manuel olarak incelenir.",
            "İade veya ücret anlaşmazlıklarında lütfen detaylı bir destek talebi oluşturun.",
            "Platform dışı ödeme yöntemleri önerilmez; oluşabilecek sorunlardan platform sorumlu tutulamaz.",
          ],
    },
    {
      icon: ShieldCheck,
      title: "Güvenlik ve doğrulama",
      items: [
        "Eğitmen profilleri, belge incelemesi sonrası doğrulanmış (is_verified) olarak işaretlenir.",
        "Hesap güvenliğiniz için şifrenizi kimseyle paylaşmayın.",
        "Şüpheli bir hesap veya davranış gördüğünüzde destek ekibini bilgilendirin.",
        "Kişisel bilgilerinizi yalnızca gerekli olduğunda paylaşmanız önerilir.",
      ],
    },
    {
      icon: HelpCircle,
      title: "Sık karşılaşılan sorunlar",
      items: [
        "Mesaj gönderemiyorsanız, eğitmen profilinden ilk mesajınızı gönderdiğinizden ya da ders talebi oluşturduğunuzdan emin olun.",
        "Giriş yapamıyorsanız şifre sıfırlama bağlantısını kullanabilirsiniz.",
        "Rezervasyon görünmüyorsa sayfayı yenileyin; sorun sürerse destek talebi açın.",
        "Çözüme kavuşmayan durumlarda destek ekibi talebinizi en kısa sürede inceler.",
      ],
    },
  ];
}

export const HELP_SECTIONS: HelpSection[] = helpSections(PAYTR_ENABLED);

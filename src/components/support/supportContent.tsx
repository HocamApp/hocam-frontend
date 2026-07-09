import {
  BookOpen,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
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
  /** Deep-link anchor; checkout links to #odeme-ve-iade for the refund policy. */
  anchorId?: string;
}

/**
 * Formal, honest Turkish help/rulebook content. Copy deliberately avoids
 * promising automation that does not exist (payments/refunds are reviewed by
 * the destek ekibi, not processed automatically).
 */
export const HELP_SECTIONS: HelpSection[] = [
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
    items: [
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
      "Mesajlaşma yalnızca ders talebi oluşturulduktan sonra açılır.",
      "Mesajlar eğitim amaçlı ve nezaket sınırları içinde olmalıdır.",
      "Taciz, spam veya uygunsuz içerik paylaşımı yasaktır.",
      "Şüpheli bir durumla karşılaşırsanız destek talebi oluşturabilirsiniz.",
    ],
  },
  {
    icon: CreditCard,
    title: "Ödeme ve iade bilgilendirmesi",
    anchorId: "odeme-ve-iade",
    items: [
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
      "Mesaj gönderemiyorsanız, önce ilgili eğitmene ders talebi oluşturduğunuzdan emin olun.",
      "Giriş yapamıyorsanız şifre sıfırlama bağlantısını kullanabilirsiniz.",
      "Rezervasyon görünmüyorsa sayfayı yenileyin; sorun sürerse destek talebi açın.",
      "Çözüme kavuşmayan durumlarda destek ekibi talebinizi en kısa sürede inceler.",
    ],
  },
];

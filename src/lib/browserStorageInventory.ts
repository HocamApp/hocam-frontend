import { COOKIE_AUTH_ENABLED } from "@/lib/authMode";

export const AUTH_TOKEN_MAX_AGE_DAYS = 7;

export type BrowserStorageKind =
  | "Çerez"
  | "Yerel depolama"
  | "Oturum depolaması"
  | "Üçüncü taraf hizmet";

export type BrowserStorageCategory =
  | "Zorunlu"
  | "Tercih"
  | "İşlevsel — kullanıcı isteğiyle"
  | "Analitik — onaya bağlı";

export interface BrowserStorageEntry {
  name: string;
  kind: BrowserStorageKind;
  purpose: string;
  provider: string;
  duration: string;
  category: BrowserStorageCategory;
  required: boolean;
}

/**
 * Canonical public inventory for browser-side storage and embedded services.
 * Any new cookie, localStorage/sessionStorage key family, or embedded provider
 * must be added here before release so the policy page cannot drift into a
 * separately maintained hard-coded table.
 */
export const BROWSER_STORAGE_INVENTORY: readonly BrowserStorageEntry[] = [
  {
    name: COOKIE_AUTH_ENABLED ? "hocam_auth" : "auth_token",
    kind: "Çerez",
    purpose: COOKIE_AUTH_ENABLED
      ? "Giriş oturumunu doğrular. Secure ve HttpOnly olduğu için tarayıcı JavaScript’i bu değeri okuyamaz."
      : "Giriş oturumunu doğrular ve hesabın açık kalmasını sağlar.",
    provider: "HOCAM",
    duration: `${AUTH_TOKEN_MAX_AGE_DAYS} gün`,
    category: "Zorunlu",
    required: true,
  },
  {
    name: "admin_impersonation_token",
    kind: "Çerez",
    purpose:
      "Yalnız yetkili destek ve kalite incelemesinde kısa süreli hesap geçişini güvenli biçimde sürdürür.",
    provider: "HOCAM",
    duration: "Sunucunun belirlediği kısa süre; işlem bitince silinir",
    category: "Zorunlu",
    required: true,
  },
  {
    name: "hocam_discovery_consent",
    kind: "Çerez",
    purpose:
      "Keşif analitiği tercihini hatırlar. Ret durumunda yalnız ret tercihini; izin durumunda onaylı ölçüm oturumunu taşır.",
    provider: "HOCAM",
    duration: "12 ay",
    category: "Analitik — onaya bağlı",
    required: false,
  },
  {
    name: "auth_user",
    kind: "Yerel depolama",
    purpose:
      "Ekrandaki hesap durumunu eşzamanlar; doğruluk her açılışta sunucudan yeniden kontrol edilir.",
    provider: "HOCAM",
    duration: "Çıkışa veya geçersiz oturumun tespitine kadar",
    category: "Zorunlu",
    required: true,
  },
  {
    name: "hocam-theme, hocam-interface-language, hocam:tutor-filters-open, jitsi_tutorial_nudge_dismissed_v1, hocam_sensitive_data_guidance_seen",
    kind: "Yerel depolama",
    purpose: "Tema, dil, filtre paneli ve daha önce gösterilmiş yardımcı metinler gibi arayüz tercihlerini hatırlar.",
    provider: "HOCAM",
    duration: "Tarayıcı verileri silinene veya tercih değiştirilene kadar",
    category: "Tercih",
    required: true,
  },
  {
    name: "hocam:hoca-bul-draft:v1:{kullanıcı}",
    kind: "Yerel depolama",
    purpose: "Yarım kalan Hoca Bul yanıtlarını aynı hesap için geri yükler.",
    provider: "HOCAM",
    duration: "7 gün",
    category: "Zorunlu",
    required: true,
  },
  {
    name: "hocam:hoca-bul-preview:v1:{kullanıcı}:{özet}",
    kind: "Oturum depolaması",
    purpose: "Sayfa yenilendiğinde aynı eşleştirme isteğinin gereksiz yere tekrarlanmasını önler.",
    provider: "HOCAM",
    duration: "En fazla 15 dakika veya sekme kapanana kadar",
    category: "Zorunlu",
    required: true,
  },
  {
    name: "lesson-video-quality:{rezervasyon}, lesson-teacher-video:{rezervasyon}, lesson-timer-mode:{rezervasyon}",
    kind: "Oturum depolaması",
    purpose: "Canlı ders görüntü ve sayaç tercihlerini aynı sekmede korur.",
    provider: "HOCAM",
    duration: "Sekme kapanana kadar",
    category: "Tercih",
    required: true,
  },
  {
    name: "question-list-scroll:{sayfa}, hocam:lesson-question:{rezervasyon}:{sürüm}",
    kind: "Oturum depolaması",
    purpose: "Soru listesi konumunu ve açık ders soru akışının geçici durumunu korur.",
    provider: "HOCAM",
    duration: "Sekme kapanana kadar",
    category: "Zorunlu",
    required: true,
  },
  {
    name: "coaching-hold-key:{hoca}",
    kind: "Oturum depolaması",
    purpose: "Aynı paket talebinin sayfa yenilenince iki kez oluşturulmasını önler.",
    provider: "HOCAM",
    duration: "Sekme kapanana kadar",
    category: "Zorunlu",
    required: true,
  },
  {
    name: "hocam:retention-offer-shown, hocam:tutor-profile-ai-nudge-shown",
    kind: "Oturum depolaması",
    purpose: "Aynı güvenlik veya yardım uyarısının tek sekmede tekrar gösterilmesini önler.",
    provider: "HOCAM",
    duration: "Sekme kapanana kadar",
    category: "Tercih",
    required: true,
  },
  {
    name: "Google Identity Services",
    kind: "Üçüncü taraf hizmet",
    purpose: "Kullanıcı Google ile giriş veya kayıt düğmesinin bulunduğu ekranı açtığında kimlik doğrulama sunar.",
    provider: "Google",
    duration: "Google hesabı ve tarayıcı ayarlarına göre",
    category: "İşlevsel — kullanıcı isteğiyle",
    required: false,
  },
  {
    name: "JaaS canlı ders depolaması",
    kind: "Üçüncü taraf hizmet",
    purpose: "Onaylanmış dersin görüntülü görüşme oturumunu çalıştırır.",
    provider: "8x8 / JaaS",
    duration: "Canlı ders ve sağlayıcı ayarlarına göre",
    category: "Zorunlu",
    required: true,
  },
  {
    name: "youtube-nocookie.com gömülü video depolaması",
    kind: "Üçüncü taraf hizmet",
    purpose: "Hoca tanıtım videosu oynatıldığında video hizmetini sunar.",
    provider: "Google / YouTube",
    duration: "Video etkileşimi ve sağlayıcı ayarlarına göre",
    category: "İşlevsel — kullanıcı isteğiyle",
    required: false,
  },
] as const;

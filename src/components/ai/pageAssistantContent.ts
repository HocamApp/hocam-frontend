export type PageAssistantContent = {
  title: string;
  welcomeMessage: string;
  attentionMessages: readonly string[];
  starterPrompts: readonly string[];
};

export const STUDENT_DASHBOARD_ASSISTANT: PageAssistantContent = {
  title: "Hocam AI Öğrenci Yardımcısı",
  welcomeMessage:
    "Merhaba! Derslerini planlamak, doğru hocayı bulmak ve çalışma hedeflerini netleştirmek için buradayım.",
  attentionMessages: [
    "Bugün sana nasıl yardımcı olabilirim?",
    "Derslerini planlamana yardım edeyim mi?",
    "Sıradaki adımını birlikte belirleyelim mi?",
    "Hoca seçimi veya rezervasyon konusunda bir sorun mu var?",
    "Çalışma hedefin için buradayım. Nereden başlayalım?",
  ],
  starterPrompts: [
    "Bugün neye çalışmalıyım?",
    "Bana uygun bir hoca bulmama yardım et.",
    "Yeni bir dersi nasıl planlarım?",
    "Bekleyen rezervasyonlarımı açıkla.",
    "Aktif paketimi ve kalan ders haklarımı açıkla.",
  ],
};

export const TUTOR_DASHBOARD_ASSISTANT: PageAssistantContent = {
  title: "Hocam AI Hoca Yardımcısı",
  welcomeMessage:
    "Merhaba! Rezervasyonlarını, müsaitliğini, öğrencilerini ve profilini yönetirken sana yardımcı olabilirim.",
  attentionMessages: [
    "Bugün sana nasıl yardımcı olabilirim?",
    "Rezervasyonlarını birlikte gözden geçirelim mi?",
    "Profilini güçlendirmek ister misin?",
    "Müsaitlik planında yardıma ihtiyacın var mı?",
    "Öğrencilerin ve derslerinle ilgili neyi çözelim?",
  ],
  starterPrompts: [
    "Bugünkü derslerimi özetle.",
    "Bekleyen rezervasyonları nasıl yönetirim?",
    "Müsaitlik saatlerimi nasıl düzenlerim?",
    "Bu ayın 20'sinde dolu muyum?",
    "Profilimi daha güçlü hale nasıl getiririm?",
    "Öğrenci ilerlemesini nasıl onaylarım?",
  ],
};

export const SUPPORT_PAGE_ASSISTANT: PageAssistantContent = {
  title: "Hocam AI Destek",
  welcomeMessage:
    "Merhaba! Yaşadığın sorunu hızlıca çözmene veya doğru destek talebini oluşturmana yardımcı olabilirim.",
  attentionMessages: [
    "Nasıl yardımcı olabilirim?",
    "Yaşadığın sorunu birlikte çözelim.",
    "Rezervasyon veya ders bağlantısıyla ilgili bir sorun mu var?",
    "Destek talebi açmadan önce hızlıca yardımcı olabilirim.",
    "Ödeme, paket veya platform kullanımı hakkında neyi merak ediyorsun?",
  ],
  starterPrompts: [
    "Ders linkim açılmıyor.",
    "Rezervasyonumla ilgili sorun yaşıyorum.",
    "Paketim veya ders haklarım görünmüyor.",
    "İptal ve iade kurallarını açıkla.",
    "Destek talebini nasıl oluştururum?",
  ],
};

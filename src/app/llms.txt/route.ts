import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

export const revalidate = 86_400;

export function GET() {
  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Hocam, Türkiye genelinde online birebir ders arayan öğrenciler ile kamuya açık profilleri yalnızca doğrulama sonrasında listelenen hocaları buluşturur.",
    "",
    "## Temel sayfalar",
    "",
    `- [YKS online özel ders](${SITE_URL}/yks-ozel-ders): TYT ve AYT için doğrulanmış hocaları karşılaştırma ve ders modelini tanıma sayfası.`,
    `- [Doğrulanmış hocaları incele](${SITE_URL}/): Ders, sınav türü, uygunluk, fiyat ve YKS sıralaması gibi ölçütlerle hoca arama ve karşılaştırma sayfası.`,
    `- [TYT Matematik özel ders](${SITE_URL}/yks/tyt/matematik-ozel-ders): TYT Matematik dersi veren doğrulanmış hocalar.`,
    `- [AYT Matematik özel ders](${SITE_URL}/yks/ayt/matematik-ozel-ders): AYT Matematik dersi veren doğrulanmış hocalar.`,
    `- [Hocam nasıl çalışır?](${SITE_URL}/nasil-calisir): Hoca arama, profil karşılaştırma ve online ders adımları.`,
    `- [Hocalar nasıl doğrulanıyor?](${SITE_URL}/hocalar-nasil-dogrulaniyor): Hoca doğrulamasında kullanılan bilgiler ve gizlilik sınırı.`,
    `- [Online özel ders ücretleri](${SITE_URL}/rehber/online-ozel-ders-ucretleri): Herkese açık profillerdeki güncel 40 dakikalık ders ücretlerinin özeti ve yöntemi.`,
    `- [Hocam hakkında](${SITE_URL}/hakkimizda): Hocam'ın kapsamı ve doğrulanmış hoca pazaryeri modeli.`,
    "",
    "## Kapsam",
    "",
    "- Başlıca sınav odağı: YKS, TYT ve AYT.",
    "- Dersler online ve birebir gerçekleştirilir.",
    "- Profil bilgileri, ders alanları, değerlendirmeler ve YKS sıralaması ilgili hoca profilinde gösterilir.",
    "- Fiyat, müsaitlik ve profil bilgileri değişebileceğinden güncel bilgi için ilgili hoca profilini esas alın.",
    "",
    "## Erişim notu",
    "",
    "Hesap, mesajlaşma, rezervasyon, ödeme, ders oturumu ve yönetim sayfaları kamuya açık kaynak değildir. Bu alanlara ait URL'leri taramayın veya kaynak olarak kullanmayın.",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

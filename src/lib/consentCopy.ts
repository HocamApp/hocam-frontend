import type { ConsentPurpose } from "./privacyApi";

/**
 * The consent wording shown to users. Kept in one place and mirrored from
 * hocam-backend/docs/kvkk/02-acik-riza-metinleri.md — if the wording changes
 * there, CONSENT_TEXT_VERSION is bumped on the backend and these strings must
 * change with it, or people will be agreeing to words they never read.
 */
export interface ConsentCopy {
  purpose: ConsentPurpose;
  code: string;
  title: string;
  body: string;
  /** What the user loses by declining. Never the core service. */
  ifDeclined: string;
  role: "student" | "tutor" | "all";
}

export const CONSENT_COPY: ConsentCopy[] = [
  {
    purpose: "R1_public_profile",
    code: "R-1",
    title: "Profilimin herkese açık yayınlanması",
    body: "Adım, profil fotoğrafım, tanıtım videom, üniversite ve bölüm bilgim, YKS sıralamam, verdiğim dersler ve saatlik ücretim HOCAM üzerinde herkese açık gösterilsin ve arama motorlarında çıkabilsin.",
    ifDeclined:
      "Profilin gizli kalır ve yeni öğrenciler seni bulamaz. Mevcut derslerin etkilenmez.",
    role: "tutor",
  },
  {
    purpose: "R2_learning_tracking",
    code: "R-2",
    title: "Öğrenme takibi",
    body: "Derslerimde işlenen konular, konuyu ne kadar anladığım ve hedeflerimdeki ilerlemem öğretmenim tarafından kaydedilsin ve bana gösterilsin.",
    ifDeclined:
      "Ders alırsın ama ilerleme kaydın tutulmaz. Ders ve mesajlaşma etkilenmez.",
    role: "student",
  },
  {
    purpose: "R3_personalized_recs",
    code: "R-3",
    title: "Bana özel öğretmen ve soru önerisi",
    body: "Sitede gezinme ve arama davranışım ile çözdüğüm soruların sonuçları, bana daha uygun öğretmen ve soru önerilmesi için otomatik olarak analiz edilsin.",
    ifDeclined:
      "Öneriler kişiselleştirilmez, herkese gösterilen genel sıralamayı görürsün.",
    role: "student",
  },
  {
    purpose: "R4_ai_assistant",
    code: "R-4",
    title: "Yapay zekâ çalışma asistanı",
    body: "Asistana yazdığım mesajlar, bana cevap üretilebilmesi için Google (Gemini) hizmetine yurt dışına aktarılsın ve sohbet geçmişim hesabımda saklansın.",
    ifDeclined: "Asistanı kullanamazsın. Diğer her şey çalışmaya devam eder.",
    role: "all",
  },
  {
    purpose: "R5_marketing",
    code: "R-5",
    title: "Kampanya ve tanıtım e-postaları",
    body: "HOCAM'ın kampanya, indirim ve tanıtım içerikli e-postalarını almak istiyorum.",
    ifDeclined:
      "Sadece rezervasyon onayı gibi zorunlu bilgilendirme e-postaları gelir.",
    role: "all",
  },
];

export function consentCopyForRole(role: string | undefined): ConsentCopy[] {
  const normalized = role === "tutor" ? "tutor" : "student";
  return CONSENT_COPY.filter(
    (item) => item.role === "all" || item.role === normalized,
  );
}

export function consentCopyFor(purpose: ConsentPurpose): ConsentCopy | undefined {
  return CONSENT_COPY.find((item) => item.purpose === purpose);
}

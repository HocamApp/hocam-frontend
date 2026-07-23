// Canonical step registry for the live-lesson (Jitsi) tutorial.
//
// KEEP IN SYNC: mirrors the backend tuple in
// Hocam_backend/apps/tutors/tutorial.py (TUTORIAL_STEP_IDS). Both sides are
// locked by unit tests; changing the flow means changing both files together
// and bumping JITSI_TUTORIAL_REQUIRED_VERSION on the backend.

export type TutorialStepId =
  | "welcome"
  | "camera-mic"
  | "chat"
  | "screen-share"
  | "whiteboard"
  | "live-question"
  | "materials"
  | "timer-quality"
  | "end-vs-leave"
  | "summary";

export const TUTORIAL_STEP_IDS: TutorialStepId[] = [
  "welcome",
  "camera-mic",
  "chat",
  "screen-share",
  "whiteboard",
  "live-question",
  "materials",
  "timer-quality",
  "end-vs-leave",
  "summary",
];

export type TutorialStepKind = "intro" | "try" | "ack" | "final";

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  /** 1-2 short sentences, no Jitsi jargon, no unsupported-feature promises. */
  body: string;
  /** Optional smaller footnote under the body. */
  note?: string;
  /** data-tutorial-target values to spotlight; empty = centered card. */
  targets: string[];
  kind: TutorialStepKind;
  /** For "try" steps: the instruction shown until the action is performed. */
  tryHint?: string;
  /** Primary CTA label (for "try" steps, shown once the action succeeded). */
  ctaLabel: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Canlı ders ekranına hoş geldin",
    body: "Bu kısa eğitimde ders ekranındaki araçları güvenle kullanmayı öğreneceksin. Eğitimi tamamladığında hesabın öğrencilere açılır.",
    note: "Buradaki ekran temsilîdir — hiçbir işlem gerçek bir derse veya öğrenciye gitmez.",
    targets: [],
    kind: "intro",
    ctaLabel: "Başlayalım",
  },
  {
    id: "camera-mic",
    title: "Kamera ve mikrofon",
    body: "Derse katılırken tarayıcın kamera ve mikrofon izni ister — 'İzin ver' demen yeterli. 'En iyi performans' görüntü ayarı seçiliyken kameran otomatik kapanır.",
    note: "İzni yanlışlıkla reddedersen adres çubuğundaki kilit simgesinden yeniden açabilirsin.",
    targets: ["jitsi-av"],
    kind: "try",
    tryHint: "Deneyin: Mikrofon düğmesine tıklayıp kapatıp açın.",
    ctaLabel: "Devam",
  },
  {
    id: "chat",
    title: "Sohbet",
    body: "Yazılı iletişim için ders içi sohbeti kullan. Öğrencin de sana buradan yazabilir.",
    targets: ["jitsi-chat"],
    kind: "try",
    tryHint: "Deneyin: Sohbeti açın ve öğrencinin mesajına yanıt gönderin.",
    ctaLabel: "Devam",
  },
  {
    id: "screen-share",
    title: "Ekran paylaşımı",
    body: "PDF, soru ekranı veya sunumunu paylaşabilirsin; öğrenci ekran paylaşamaz. Paylaşmadan önce özel sekmelerini kapatmayı unutma.",
    note: "Gerçek derste tarayıcı hangi pencereyi paylaşacağını sana sorar.",
    targets: ["control-screen-share"],
    kind: "ack",
    ctaLabel: "Anladım",
  },
  {
    id: "whiteboard",
    title: "Beyaz tahta",
    body: "Tahtayı yalnızca sen açıp kapatabilirsin; açıkken öğrenci de çizebilir. Çizim araçları tahtanın kendi menüsünden gelir.",
    targets: ["control-whiteboard"],
    kind: "try",
    tryHint: "Deneyin: Tahtayı açın, sonra tekrar kapatın.",
    ctaLabel: "Devam",
  },
  {
    id: "live-question",
    title: "Canlı soru",
    body: "Bir soruyu öğrencinle paylaş, cevabını canlı takip et. Doğru cevap ve çözüm yalnızca sana görünür — istediğinde öğrenciye açarsın.",
    note: "Öğrenci paneli kendisi açamaz — soruyu her zaman sen paylaşırsın.",
    targets: ["control-question"],
    kind: "try",
    tryHint: "Deneyin: Soruyu paylaşın, öğrencinin cevabını görün, doğru cevabı gösterip gizleyin.",
    ctaLabel: "Devam",
  },
  {
    id: "materials",
    title: "Öğrenci notları ve materyaller",
    body: "Her öğrencin için özel not ve dosya alanın var; bunları yalnızca sen görürsün. Ders sırasında buradan not alıp materyal yükleyebilirsin.",
    targets: ["control-notes"],
    kind: "try",
    tryHint: "Deneyin: Öğrenci notları panelini açın.",
    ctaLabel: "Devam",
  },
  {
    id: "timer-quality",
    title: "Süre ve görüntü kalitesi",
    body: "Kalan ders süresi burada sayar. Bağlantın zayıfsa 'Görüntü ayarı'ndan 'En iyi performans'ı seç — kameran kapanır ama ses sürer.",
    note: "Bağlantı koparsa üstte kırmızı bir uyarı görürsün; sorun sürerse destek ekibine yazabilirsin.",
    targets: ["control-quality", "control-timer"],
    kind: "try",
    tryHint: "Deneyin: Görüntü ayarını açıp 'En iyi performans'ı seçin.",
    ctaLabel: "Devam",
  },
  {
    id: "end-vs-leave",
    title: "Dersi bitirmek ve ayrılmak farklıdır",
    body: "'Dersi bitir' dersi herkes için resmî olarak sonlandırır ve öğrenciden onay ister. 'Görüşmeden ayrıl' yalnızca seni odadan çıkarır — önce onay sorulur, ders devam eder.",
    targets: ["control-end", "control-leave"],
    kind: "ack",
    ctaLabel: "Anladım",
  },
  {
    id: "summary",
    title: "Hazırsın!",
    body: "Ders ekranındaki tüm araçları gördün. Eğitimi dilediğinde Profil sayfandan tekrar izleyebilirsin.",
    targets: [],
    kind: "final",
    ctaLabel: "Eğitimi tamamla ve hesabımı aktifleştir",
  },
];

export function getTutorialStep(id: TutorialStepId): TutorialStep {
  return TUTORIAL_STEPS.find((step) => step.id === id)!;
}

// ---------------------------------------------------------------------------
// Pure progress state helpers (unit-tested; the React hook wraps these)
// ---------------------------------------------------------------------------

export interface TutorialLocalState {
  stepIndex: number;
  completedSteps: TutorialStepId[];
}

function normalizeCompleted(steps: string[]): TutorialStepId[] {
  return TUTORIAL_STEP_IDS.filter((id) => steps.includes(id));
}

/** Seeds local state from server progress: resume at current_step when valid,
 * otherwise at the first incomplete step. */
export function seedFromServer(
  completedSteps: string[],
  currentStep: string | null
): TutorialLocalState {
  const completed = normalizeCompleted(completedSteps);
  let stepIndex = currentStep
    ? TUTORIAL_STEP_IDS.indexOf(currentStep as TutorialStepId)
    : -1;
  if (stepIndex < 0) {
    stepIndex = TUTORIAL_STEP_IDS.findIndex((id) => !completed.includes(id));
    if (stepIndex < 0) stepIndex = TUTORIAL_STEP_IDS.length - 1;
  }
  return { stepIndex, completedSteps: completed };
}

/** Monotonic: completing a step can never remove a previously completed one. */
export function markStepCompleted(
  state: TutorialLocalState,
  id: TutorialStepId
): TutorialLocalState {
  if (state.completedSteps.includes(id)) return state;
  return {
    ...state,
    completedSteps: normalizeCompleted([...state.completedSteps, id]),
  };
}

/** Back is always allowed; forward only across already-completed steps. */
export function canNavigateTo(
  state: TutorialLocalState,
  targetIndex: number
): boolean {
  if (targetIndex < 0 || targetIndex >= TUTORIAL_STEP_IDS.length) return false;
  if (targetIndex <= state.stepIndex) return true;
  return TUTORIAL_STEP_IDS.slice(0, targetIndex).every((id) =>
    state.completedSteps.includes(id)
  );
}

export function allStepsCompleted(state: TutorialLocalState): boolean {
  return TUTORIAL_STEP_IDS.every((id) => state.completedSteps.includes(id));
}

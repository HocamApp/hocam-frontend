"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import {
  type AIChatRequest,
  sendAIChatMessage,
} from "@/lib/aiAssistantApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const BIO_MAX_LENGTH = 1000;

const BIO_QUESTIONS = [
  {
    title: "Ders anlatım tarzını nasıl tanımlarsın?",
    description:
      "Örneğin sade anlatım, bol örnek, soru üzerinden ilerleme veya görsel yöntemlerden söz edebilirsin.",
    placeholder: "Konuları önce sadeleştirir, sonra örneklerle pekiştiririm...",
  },
  {
    title: "Öğrencilerine en çok hangi konuda yardımcı olursun?",
    description:
      "Zorlandıkları noktaları, hedeflerini veya birlikte çözmeyi sevdiğin öğrenme problemlerini anlat.",
    placeholder: "Özellikle temel eksiklerini bulmak ve soru çözme hızını geliştirmek...",
  },
  {
    title: "Bir dersin genellikle nasıl ilerler?",
    description:
      "İlk değerlendirme, konu anlatımı, soru çözümü, ödev veya takip biçiminden bahsedebilirsin.",
    placeholder: "Önce öğrencinin seviyesini kontrol eder, ardından kişisel bir plan...",
  },
  {
    title: "Seni hoca olarak öne çıkaran güçlü yönlerin neler?",
    description:
      "Yalnızca gerçekten sahip olduğun özellikleri yaz; sabır, iletişim, disiplin veya sınav deneyimi gibi.",
    placeholder: "Sabırlı olmam ve öğrencinin nerede zorlandığını hızlıca fark etmem...",
  },
  {
    title: "Öğrenci profilini okuduğunda sende ne hissetsin?",
    description:
      "Metnin samimi, motive edici, sakin, planlı veya iddialı bir tonda olmasını isteyebilirsin.",
    placeholder: "Kendini güvende hissetsin ve birlikte düzenli çalışabileceğimizi anlasın...",
  },
] as const;

type RequestContext = Pick<AIChatRequest, "surface" | "draft_profile">;

interface TutorBioWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getRequestContext: () => RequestContext;
  onApplyProfileBio: (value: string) => void;
}

function buildBioRequest(answers: string[]) {
  return [
    "Hakkımda yazımı hazırla.",
    "Aşağıdaki beş cevabı ve sistemde kayıtlı doğrulanmış tutor profil bilgilerimi birlikte kullan.",
    "Cevaplarımda veya profilimde bulunmayan deneyim, başarı, sonuç ya da uzmanlık bilgisi ekleme.",
    ...BIO_QUESTIONS.flatMap((question, index) => [
      `${index + 1}. ${question.title}`,
      `Cevabım: ${answers[index]}`,
    ]),
  ].join("\n");
}

function getGeneratedBio(metadata: Record<string, unknown>) {
  const action = metadata.action;
  if (!action || typeof action !== "object") return "";
  const typedAction = action as { type?: string; value?: string };
  return typedAction.type === "apply_profile_bio" &&
    typeof typedAction.value === "string"
    ? typedAction.value.trim()
    : "";
}

export function TutorBioWizardDialog({
  open,
  onOpenChange,
  getRequestContext,
  onApplyProfileBio,
}: TutorBioWizardDialogProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() =>
    BIO_QUESTIONS.map(() => "")
  );
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setAnswers(BIO_QUESTIONS.map(() => ""));
    setDraft("");
    setError("");
    setIsGenerating(false);
  }, [open]);

  const question = BIO_QUESTIONS[step];
  const currentAnswer = answers[step] ?? "";
  const canContinue = currentAnswer.trim().length >= 3 && !isGenerating;

  const updateCurrentAnswer = (value: string) => {
    setAnswers((current) =>
      current.map((answer, index) => (index === step ? value : answer))
    );
    setError("");
  };

  const generateDraft = async () => {
    if (!canContinue) return;
    setIsGenerating(true);
    setError("");
    try {
      const response = await sendAIChatMessage({
        message: buildBioRequest(answers.map((answer) => answer.trim())),
        ...getRequestContext(),
      });
      const generatedBio = getGeneratedBio(response.metadata);
      if (!generatedBio) throw new Error("missing_bio_action");
      setDraft(generatedBio.slice(0, BIO_MAX_LENGTH));
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError) && requestError.response?.status === 429
          ? "Günlük AI kullanım limitine ulaştın. Yarın yeniden deneyebilirsin."
          : "Hakkımda taslağı şu anda hazırlanamadı. Cevapların duruyor; tekrar deneyebilirsin."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    const value = draft.trim();
    if (!value) return;
    onApplyProfileBio(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle>
            {draft ? "Hakkımda taslağın hazır" : "Hakkımda yazını birlikte hazırlayalım"}
          </DialogTitle>
          <DialogDescription>
            {draft
              ? "Taslağı düzenleyebilir, ardından profilindeki Hakkımda alanına ekleyebilirsin."
              : "Beş kısa soruyu yanıtla. Cevaplarını mevcut profil bilgilerinle birleştirerek sana özel bir taslak hazırlayacağız."}
          </DialogDescription>
        </DialogHeader>

        {draft ? (
          <div className="space-y-3 py-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={BIO_MAX_LENGTH}
              className="min-h-52 resize-y leading-7"
              aria-label="Hazırlanan Hakkımda taslağı"
            />
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Kaydetmeden önce metni gözden geçir.</span>
              <span>{draft.length}/{BIO_MAX_LENGTH}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Soru {step + 1} / {BIO_QUESTIONS.length}</span>
                <span>%{Math.round(((step + 1) / BIO_QUESTIONS.length) * 100)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${((step + 1) / BIO_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-muted/25 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-foreground">{question.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {question.description}
              </p>
              <Textarea
                autoFocus
                value={currentAnswer}
                onChange={(event) => updateCurrentAnswer(event.target.value)}
                placeholder={question.placeholder}
                maxLength={600}
                className="mt-4 min-h-32 resize-y bg-background"
                aria-label={`Soru ${step + 1} yanıtı`}
              />
              <p className="mt-2 text-right text-xs text-muted-foreground">
                {currentAnswer.length}/600
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {draft ? (
            <>
              <Button type="button" variant="outline" onClick={() => setDraft("")}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Cevaplara dön
              </Button>
              <Button type="button" onClick={handleApply} disabled={!draft.trim()}>
                <Check className="mr-2 h-4 w-4" aria-hidden />
                Hakkımda alanına ekle
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0 || isGenerating}
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Geri
              </Button>
              {step < BIO_QUESTIONS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep((current) => current + 1)}
                  disabled={!canContinue}
                >
                  Sonraki soru
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              ) : (
                <Button type="button" onClick={() => void generateDraft()} disabled={!canContinue}>
                  <Sparkles className="mr-2 h-4 w-4" aria-hidden />
                  {isGenerating ? "Taslak hazırlanıyor" : "Taslağı hazırla"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

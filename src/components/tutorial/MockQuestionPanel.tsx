"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, Share2, User } from "lucide-react";

/**
 * Scripted "canlı soru" walkthrough: a mock tutor panel plus a miniature
 * student-screen preview. Fully local — never touches the question-session
 * API (the real LessonQuestionPanel polls the backend every 2s).
 *
 * Script: tutor shares → student picks "B" and presses "Cevabımı gönder" →
 * tutor reveals the correct answer to the student → tutor hides it again →
 * step complete.
 */
export type MockQuestionPhase =
  | "idle"
  | "shared"
  | "student-answered"
  | "revealed"
  | "done";

const CHOICES = ["A", "B", "C", "D", "E"] as const;
const CORRECT_CHOICE = "C";
const STUDENT_CHOICE = "B";

interface MockQuestionPanelProps {
  phase: MockQuestionPhase;
  onPhaseChange: (phase: MockQuestionPhase) => void;
}

export function MockQuestionPanel({ phase, onPhaseChange }: MockQuestionPanelProps) {
  const reducedMotion = useReducedMotion();
  const [studentPending, setStudentPending] = useState(false);

  // Scripted student: shortly after sharing, they select B and submit.
  useEffect(() => {
    if (phase !== "shared") return;
    setStudentPending(true);
    const timer = window.setTimeout(
      () => {
        setStudentPending(false);
        onPhaseChange("student-answered");
      },
      reducedMotion ? 400 : 1200
    );
    return () => window.clearTimeout(timer);
  }, [phase, onPhaseChange, reducedMotion]);

  const answerVisibleToStudent = phase === "revealed";

  return (
    <aside
      className="pointer-events-auto z-[60] flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 bg-gray-900 p-3"
      aria-label="Canlı soru paneli (temsilî)"
    >
      {/* ---- Tutor panel ---- */}
      <div className="rounded-lg border border-white/10 bg-gray-800/60 p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Senin panelin
        </div>
        <div className="rounded-md border border-white/10 bg-gray-950 p-3 text-xs leading-relaxed text-gray-100">
          <span className="mb-1 block font-medium text-sky-300">Örnek Soru · TYT Matematik</span>
          Bir sayının 3 katının 5 fazlası 20 ise bu sayı kaçtır?
          <div className="mt-2 flex gap-1.5">
            {CHOICES.map((choice) => (
              <span
                key={choice}
                className={`flex h-6 w-6 items-center justify-center rounded border text-[11px] ${
                  choice === CORRECT_CHOICE
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                    : "border-white/15 text-gray-300"
                }`}
              >
                {choice}
              </span>
            ))}
          </div>
        </div>

        {/* Teacher-only block: correct answer + solution */}
        <div className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-[11px] leading-relaxed text-emerald-200">
          <span className="font-medium">Yalnızca sana görünür:</span> Doğru cevap{" "}
          <span className="font-semibold">{CORRECT_CHOICE}</span> · Çözüm: 3x + 5 = 20 → x = 5.
        </div>

        {phase === "idle" && (
          <button
            type="button"
            onClick={() => onPhaseChange("shared")}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-sky-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-400"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Öğrenciyle paylaş
          </button>
        )}

        {phase !== "idle" && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1.5 text-[11px] text-gray-300">
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" /> Öğrencinin son cevabı
              </span>
              {phase === "shared" ? (
                <span className="text-gray-500">Bekleniyor…</span>
              ) : (
                <span className="inline-flex animate-in fade-in zoom-in-95 items-center gap-1 font-semibold text-sky-300 motion-reduce:animate-none">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  {STUDENT_CHOICE}
                </span>
              )}
            </div>
            {(phase === "student-answered" || phase === "revealed" || phase === "done") && (
              <button
                type="button"
                onClick={() =>
                  onPhaseChange(phase === "revealed" ? "done" : "revealed")
                }
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  phase === "revealed"
                    ? "bg-amber-500/90 text-amber-950 hover:bg-amber-400"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {phase === "revealed" ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    Doğru cevabı gizle
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Doğru cevabı öğrenciye göster
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---- Miniature student screen ---- */}
      <div className="rounded-lg border border-dashed border-white/15 bg-gray-800/40 p-3">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
          Öğrencinin ekranı (önizleme)
        </div>
        {phase === "idle" ? (
          <p className="text-[11px] leading-relaxed text-gray-500">
            Öğrenci şu anda soru görmüyor. Soruyu her zaman sen paylaşırsın —
            öğrenci paneli kendisi açamaz.
          </p>
        ) : (
          <div className="rounded-md bg-gray-950 p-2 text-[11px] text-gray-200">
            <span className="mb-1 block text-sky-300">Örnek Soru</span>
            <div className="flex gap-1.5">
              {CHOICES.map((choice) => (
                <span
                  key={choice}
                  className={`flex h-5 w-5 items-center justify-center rounded border text-[10px] ${
                    choice === STUDENT_CHOICE && phase !== "shared"
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : answerVisibleToStudent && choice === CORRECT_CHOICE
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                        : "border-white/15 text-gray-400"
                  }`}
                >
                  {choice}
                </span>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-gray-400">
              {phase === "shared" &&
                (studentPending ? "Ayşe bir şık seçiyor…" : "Soru öğrencide açık.")}
              {phase === "student-answered" && '"Cevabımı gönder" ile B seçeneğini gönderdi.'}
              {answerVisibleToStudent && (
                <span className="animate-in fade-in text-emerald-300 motion-reduce:animate-none">
                  Doğru cevap öğrenciye açıldı: {CORRECT_CHOICE}
                </span>
              )}
              {phase === "done" && "Doğru cevap tekrar gizlendi — kontrol sende."}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  FileQuestion,
  MonitorUp,
  PencilRuler,
  StickyNote,
  Timer,
  UploadCloud,
  Video,
} from "lucide-react";

import {
  DEFAULT_VIDEO_QUALITY_LEVEL,
  VideoQualityLevel,
} from "@/lib/jitsiSessionControls";
import { TutorialStep, TutorialStepId } from "@/lib/liveLessonTutorialSteps";
import { MockChatMessage, MockChatPane } from "./MockChatPane";
import { MockJitsiToolbar } from "./MockJitsiToolbar";
import { MockQualityDialog } from "./MockQualityDialog";
import { MockQuestionPanel, MockQuestionPhase } from "./MockQuestionPanel";

// KEEP IN SYNC: the control bar below replicates the live lesson header in
// src/app/session/[bookingId]/page.tsx (lines ~673-780). If a control is
// added, renamed, or restyled there, mirror it here so the tutorial keeps
// teaching the real interface. This screen is fully simulated: no Jitsi
// iframe, no getUserMedia, no network side effects.

const STUDENT_FIRST_MESSAGE = "Hocam merhaba, beni duyuyor musunuz?";
const LESSON_SECONDS = 40 * 60;

interface MockLessonScreenProps {
  activeStep: TutorialStep;
  /** Reports that the active step's "Deneyin" action was performed. */
  onStepAction: (id: TutorialStepId) => void;
}

export function MockLessonScreen({ activeStep, onStepAction }: MockLessonScreenProps) {
  const reducedMotion = useReducedMotion();

  // --- Mock interface state (all local, all fake) ---
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<MockChatMessage[]>([]);
  const [studentTyping, setStudentTyping] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);
  const whiteboardWasOpened = useRef(false);
  const [questionPanelOpen, setQuestionPanelOpen] = useState(false);
  const [questionPhase, setQuestionPhase] = useState<MockQuestionPhase>("idle");
  const [notesOpen, setNotesOpen] = useState(false);
  const [qualityDialogOpen, setQualityDialogOpen] = useState(false);
  const [quality, setQuality] = useState<VideoQualityLevel>(
    DEFAULT_VIDEO_QUALITY_LEVEL
  );
  const [remainingSeconds, setRemainingSeconds] = useState(LESSON_SECONDS);

  const stepId = activeStep.id;
  const targets = activeStep.targets;
  const isTabbable = useCallback(
    (target: string) => targets.includes(target),
    [targets]
  );

  // Fake countdown so the timer chip feels alive.
  useEffect(() => {
    const interval = window.setInterval(
      () => setRemainingSeconds((seconds) => Math.max(seconds - 1, 0)),
      1000
    );
    return () => window.clearInterval(interval);
  }, []);

  // Scripted student message shortly after the chat opens on the chat step.
  useEffect(() => {
    if (stepId !== "chat" || !chatOpen || chatMessages.length > 0) return;
    setStudentTyping(true);
    const timer = window.setTimeout(
      () => {
        setStudentTyping(false);
        setChatMessages([{ from: "student", text: STUDENT_FIRST_MESSAGE }]);
      },
      reducedMotion ? 300 : 800
    );
    return () => window.clearTimeout(timer);
  }, [stepId, chatOpen, chatMessages.length, reducedMotion]);

  // "En iyi performans" mirrors the real behavior: camera turns off.
  useEffect(() => {
    if (quality === "audio-only") setCamOn(false);
  }, [quality]);

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  const handleToggleMic = () => {
    setMicOn((on) => !on);
    if (stepId === "camera-mic") onStepAction("camera-mic");
  };

  const handleSendReply = (text: string) => {
    setChatMessages((messages) => [...messages, { from: "tutor", text }]);
    setReplySent(true);
    if (stepId === "chat") onStepAction("chat");
  };

  const handleToggleWhiteboard = () => {
    setWhiteboardOpen((open) => {
      const next = !open;
      if (next) {
        whiteboardWasOpened.current = true;
      } else if (whiteboardWasOpened.current && stepId === "whiteboard") {
        onStepAction("whiteboard");
      }
      return next;
    });
  };

  // Stable identity: the fake countdown re-renders this component every
  // second, and MockQuestionPanel's scripted timer effect depends on this
  // callback — a fresh function each render would reset that timer forever.
  const handleQuestionPhase = useCallback(
    (phase: MockQuestionPhase) => {
      setQuestionPhase(phase);
      if (phase === "done" && stepId === "live-question") {
        onStepAction("live-question");
      }
    },
    [stepId, onStepAction]
  );

  const handleToggleNotes = () => {
    setNotesOpen((open) => {
      const next = !open;
      if (next && stepId === "materials") onStepAction("materials");
      return next;
    });
  };

  const handleSelectQuality = (level: VideoQualityLevel) => {
    setQuality(level);
    if (level === "audio-only" && stepId === "timer-quality") {
      onStepAction("timer-quality");
    }
  };

  const controlButtonClass =
    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10";

  return (
    <div className="flex h-full flex-col bg-black text-white">
      {/* --- Host control bar replica (KEEP IN SYNC — see note above) --- */}
      <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 text-sm text-white">
        <span className="min-w-0 flex-1 truncate font-medium">
          Matematik — Canlı Ders
          <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-gray-300">
            Temsilî
          </span>
        </span>
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-none">
          <span
            data-tutorial-target="control-timer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-white/20 px-2.5 py-1 font-mono text-xs tabular-nums"
          >
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {minutes}:{seconds}
          </span>
          <button
            type="button"
            data-tutorial-target="control-question"
            tabIndex={isTabbable("control-question") ? 0 : -1}
            onClick={() => setQuestionPanelOpen((open) => !open)}
            aria-expanded={questionPanelOpen}
            className={controlButtonClass}
          >
            <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            Canlı soru
            {questionPhase !== "idle" && (
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            data-tutorial-target="control-notes"
            tabIndex={isTabbable("control-notes") ? 0 : -1}
            onClick={handleToggleNotes}
            aria-expanded={notesOpen}
            className={controlButtonClass}
          >
            <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
            Öğrenci notları
          </button>
          <button
            type="button"
            data-tutorial-target="control-screen-share"
            tabIndex={isTabbable("control-screen-share") ? 0 : -1}
            onClick={() => setScreenSharing((sharing) => !sharing)}
            className={controlButtonClass}
          >
            <MonitorUp className="h-3.5 w-3.5" aria-hidden="true" />
            {screenSharing ? "Paylaşımı durdur" : "Ekran paylaş"}
          </button>
          <button
            type="button"
            data-tutorial-target="control-whiteboard"
            tabIndex={isTabbable("control-whiteboard") ? 0 : -1}
            onClick={handleToggleWhiteboard}
            className={controlButtonClass}
          >
            <PencilRuler className="h-3.5 w-3.5" aria-hidden="true" />
            Tahtayı aç/kapat
          </button>
          <button
            type="button"
            data-tutorial-target="control-quality"
            tabIndex={isTabbable("control-quality") ? 0 : -1}
            onClick={() => setQualityDialogOpen(true)}
            className={controlButtonClass}
          >
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            Görüntü ayarı
          </button>
          <button
            type="button"
            data-tutorial-target="control-end"
            tabIndex={-1}
            className={controlButtonClass}
          >
            Dersi bitir
          </button>
          <button
            type="button"
            data-tutorial-target="control-leave"
            tabIndex={-1}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-red-500/50 bg-red-500/20 px-3 py-1 text-xs font-medium text-red-100 transition-colors hover:bg-red-500/30"
          >
            Görüşmeden ayrıl
          </button>
        </div>
      </div>

      {/* --- Stage: video tiles / whiteboard + side panels --- */}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 items-center justify-center p-4">
          {whiteboardOpen ? (
            <div className="flex h-full w-full animate-in fade-in zoom-in-95 flex-col items-center justify-center rounded-lg bg-gray-100 text-gray-500 duration-200 motion-reduce:animate-none">
              <PencilRuler className="mb-2 h-8 w-8" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-600">Beyaz tahta açık</p>
              <p className="mt-1 max-w-xs text-center text-xs">
                Gerçek derste çizim araçları tahtanın kendi menüsünde görünür;
                öğrenci de bu tahtaya çizebilir.
              </p>
            </div>
          ) : (
            <div className="grid h-full w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <ParticipantTile
                name="Sen (Öğretmen)"
                initials="SÖ"
                muted={!micOn}
                cameraOff={!camOn}
                speaking={micOn}
                sharing={screenSharing}
                reducedMotion={!!reducedMotion}
              />
              <ParticipantTile
                name="Ayşe (Öğrenci)"
                initials="A"
                muted={false}
                cameraOff={false}
                speaking={false}
                sharing={false}
                reducedMotion={!!reducedMotion}
              />
            </div>
          )}
          <span className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-white/25">
            Temsilî görüntü — gerçek ders değildir
          </span>
          {/* Jitsi-native toolbar replica */}
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <MockJitsiToolbar
              micOn={micOn}
              camOn={camOn}
              chatOpen={chatOpen}
              onToggleMic={handleToggleMic}
              onToggleCam={() => setCamOn((on) => !on)}
              onToggleChat={() => setChatOpen((open) => !open)}
              activeTargets={targets}
            />
          </div>
        </div>

        {chatOpen && (
          <MockChatPane
            messages={chatMessages}
            studentTyping={studentTyping}
            onSendReply={handleSendReply}
            replySent={replySent}
          />
        )}
        {questionPanelOpen && (
          <MockQuestionPanel phase={questionPhase} onPhaseChange={handleQuestionPhase} />
        )}
        {notesOpen && <MockNotesPanel />}
      </div>

      <MockQualityDialog
        open={qualityDialogOpen}
        selected={quality}
        onSelect={handleSelectQuality}
        onClose={() => setQualityDialogOpen(false)}
      />
    </div>
  );
}

function ParticipantTile({
  name,
  initials,
  muted,
  cameraOff,
  speaking,
  sharing,
  reducedMotion,
}: {
  name: string;
  initials: string;
  muted: boolean;
  cameraOff: boolean;
  speaking: boolean;
  sharing: boolean;
  reducedMotion: boolean;
}) {
  return (
    <div className="relative flex min-h-[140px] items-center justify-center overflow-hidden rounded-lg bg-gray-800">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-xl font-semibold text-gray-200">
        {speaking && !reducedMotion && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-sky-400/25 [animation-duration:1.8s]"
          />
        )}
        {initials}
      </div>
      <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[11px] text-gray-200">
        {name}
        {muted && " · mikrofon kapalı"}
        {cameraOff && " · kamera kapalı"}
      </span>
      {sharing && (
        <span className="absolute right-2 top-2 rounded bg-sky-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Ekran paylaşılıyor
        </span>
      )}
    </div>
  );
}

/** Replica of the in-lesson "Öğrenci notları" aside (upload is simulated). */
function MockNotesPanel() {
  return (
    <aside
      className="pointer-events-auto z-[60] flex w-72 shrink-0 flex-col gap-3 border-l border-white/10 bg-gray-900 p-3"
      aria-label="Öğrenci notları (temsilî)"
    >
      <div className="text-xs font-medium text-gray-300">Özel Notlarım · Ayşe</div>
      <textarea
        placeholder="Bu öğrenciyle ilgili notların… (yalnızca sana görünür)"
        className="h-24 w-full resize-none rounded-md border border-white/15 bg-gray-800 p-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />
      <div className="rounded-md border border-dashed border-white/20 p-3 text-center">
        <UploadCloud className="mx-auto mb-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        <p className="text-[11px] text-gray-400">
          Materyaller: PDF, görsel veya sunum yükle.
        </p>
        <p className="mt-1 text-[10px] text-gray-500">
          Eğitimde yükleme simüle edilir — dosyalar öğrenciye otomatik görünmez.
        </p>
      </div>
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Monitor,
  Note,
  PencilSimple,
  Timer,
  UploadSimple,
  VideoCamera,
} from "@phosphor-icons/react";

import {
  DEFAULT_VIDEO_QUALITY_LEVEL,
  VideoQualityLevel,
} from "@/lib/jitsiSessionControls";
import { TutorialStep, TutorialStepId } from "@/lib/liveLessonTutorialSteps";
import { MockChatMessage, MockChatPane } from "./MockChatPane";
import { MockJitsiToolbar } from "./MockJitsiToolbar";
import { MockQualityDialog } from "./MockQualityDialog";

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

  // Each tutorial step starts from a clean stage. This also guarantees that
  // forward/back navigation cannot carry a panel from the previous lesson
  // tool into the next explanation.
  useEffect(() => {
    setChatOpen(false);
    setNotesOpen(false);
    setWhiteboardOpen(false);
    setQualityDialogOpen(false);
    setScreenSharing(false);
  }, [stepId]);

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

  const handleToggleChat = () => {
    const next = !chatOpen;
    setChatOpen(next);
    if (next) {
      setNotesOpen(false);
      setWhiteboardOpen(false);
      setQualityDialogOpen(false);
    }
  };

  const handleToggleWhiteboard = () => {
    const next = !whiteboardOpen;
    setWhiteboardOpen(next);
    if (next) {
      setChatOpen(false);
      setNotesOpen(false);
      setQualityDialogOpen(false);
      if (stepId === "whiteboard") onStepAction("whiteboard");
    }
  };

  const handleToggleNotes = () => {
    const next = !notesOpen;
    setNotesOpen(next);
    if (next) {
      setChatOpen(false);
      setWhiteboardOpen(false);
      setQualityDialogOpen(false);
      if (stepId === "materials") onStepAction("materials");
    }
  };

  const handleOpenQuality = () => {
    setChatOpen(false);
    setNotesOpen(false);
    setWhiteboardOpen(false);
    setQualityDialogOpen(true);
  };

  const handleSelectQuality = (level: VideoQualityLevel) => {
    setQuality(level);
    if (level === "audio-only" && stepId === "timer-quality") {
      onStepAction("timer-quality");
    }
  };

  const controlButtonClass =
    "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors duration-[var(--duration-state)] hover:bg-paper";
  const activeScreenShareButtonClass =
    "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-success bg-success px-3 text-xs font-semibold text-white transition-colors duration-[var(--duration-state)] hover:brightness-95";

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      {/* --- Host control bar replica (KEEP IN SYNC — see note above) --- */}
      <div className="flex min-h-14 items-center gap-3 border-b border-line bg-paper px-4 py-2 text-sm text-ink">
        <span className="min-w-0 flex-1 truncate font-semibold tracking-[-0.01em]">
          Matematik — Canlı Ders
          <span className="ml-2 rounded-pill border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-mid">
            Temsilî
          </span>
        </span>
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-none">
          <span
            data-tutorial-target="control-timer"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill border border-line bg-surface px-3 text-xs font-medium tabular-nums text-ink"
          >
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {minutes}:{seconds}
          </span>
          <button
            type="button"
            data-tutorial-target="control-notes"
            tabIndex={isTabbable("control-notes") ? 0 : -1}
            onClick={handleToggleNotes}
            aria-expanded={notesOpen}
            className={controlButtonClass}
          >
            <Note className="h-4 w-4" aria-hidden="true" />
            Öğrenci notları
          </button>
          <button
            type="button"
            data-tutorial-target="control-screen-share"
            tabIndex={isTabbable("control-screen-share") ? 0 : -1}
            onClick={() => setScreenSharing((sharing) => !sharing)}
            className={
              screenSharing
                ? activeScreenShareButtonClass
                : controlButtonClass
            }
            aria-pressed={screenSharing}
          >
            <Monitor className="h-4 w-4" aria-hidden="true" />
            {screenSharing ? "Paylaşımı durdur" : "Ekran paylaş"}
          </button>
          <button
            type="button"
            data-tutorial-target="control-whiteboard"
            tabIndex={isTabbable("control-whiteboard") ? 0 : -1}
            onClick={handleToggleWhiteboard}
            className={controlButtonClass}
          >
            <PencilSimple className="h-4 w-4" aria-hidden="true" />
            Tahtayı aç/kapat
          </button>
          <button
            type="button"
            data-tutorial-target="control-quality"
            tabIndex={isTabbable("control-quality") ? 0 : -1}
            onClick={handleOpenQuality}
            className={controlButtonClass}
          >
            <VideoCamera className="h-4 w-4" aria-hidden="true" />
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
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-error bg-transparent px-3 text-xs font-medium text-ink transition-colors duration-[var(--duration-state)] hover:bg-error hover:text-white"
          >
            Görüşmeden ayrıl
          </button>
        </div>
      </div>

      {/* --- Stage: video tiles / whiteboard + side panels --- */}
      <div className="relative flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 items-center justify-center p-4">
          {whiteboardOpen ? (
            <div className="flex h-full w-full animate-in fade-in flex-col items-center justify-center rounded-card border border-line bg-surface text-ink-mid duration-200 motion-reduce:animate-none">
              <PencilSimple className="mb-2 h-8 w-8" aria-hidden="true" />
              <p className="text-sm font-medium text-ink">Beyaz tahta açık</p>
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
          <span className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-ink-mid">
            Temsilî görüntü, gerçek ders değildir
          </span>
          {/* Jitsi-native toolbar replica */}
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <MockJitsiToolbar
              micOn={micOn}
              camOn={camOn}
              chatOpen={chatOpen}
              onToggleMic={handleToggleMic}
              onToggleCam={() => setCamOn((on) => !on)}
              onToggleChat={handleToggleChat}
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
    <div className="relative flex min-h-[140px] items-center justify-center overflow-hidden rounded-card border border-line bg-surface">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-paper text-xl font-semibold text-ink">
        {speaking && !reducedMotion && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-pink/20 [animation-duration:1.8s]"
          />
        )}
        {initials}
      </div>
      <span className="absolute bottom-2 left-2 rounded-input bg-ink px-2 py-1 text-[11px] text-paper">
        {name}
        {muted && " · mikrofon kapalı"}
        {cameraOff && " · kamera kapalı"}
      </span>
      {sharing && (
        <span className="absolute right-2 top-2 rounded-pill bg-success px-2 py-1 text-[10px] font-medium text-white">
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
      className="pointer-events-auto z-[60] flex w-72 shrink-0 flex-col gap-3 border-l border-line bg-surface p-4"
      aria-label="Öğrenci notları (temsilî)"
    >
      <div className="text-xs font-semibold text-ink">Özel Notlarım · Ayşe</div>
      <textarea
        placeholder="Bu öğrenciyle ilgili notların… (yalnızca sana görünür)"
        className="h-24 w-full resize-none rounded-input border border-line bg-paper p-3 text-xs text-ink placeholder:text-ink-mid focus:outline-none focus:ring-2 focus:ring-pink"
      />
      <div className="rounded-input border border-dashed border-line p-3 text-center">
        <UploadSimple className="mx-auto mb-1 h-5 w-5 text-ink-mid" aria-hidden="true" />
        <p className="text-[11px] text-ink-mid">
          Materyaller: PDF, görsel veya sunum yükle.
        </p>
        <p className="mt-1 text-[10px] text-ink-mid">
          Eğitimde yükleme simüle edilir. Dosyalar öğrenciye otomatik görünmez.
        </p>
      </div>
    </aside>
  );
}

"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Blocks,
  BookOpen,
  CalendarDays,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Gauge,
  ListChecks,
  MessageCircle,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";

import type { MatchingSceneState, SceneStopState } from "@/lib/matchingFlow";
import type { MatchChallenge, TutorTeachingStyle } from "@/types";
import { MATCH_EASING, MATCH_MOTION } from "./motion";

const STOP_POSITIONS = [
  { left: "13%", top: "79%" },
  { left: "24%", top: "65%" },
  { left: "37%", top: "53%" },
  { left: "50%", top: "42%" },
  { left: "63%", top: "32%" },
  { left: "76%", top: "22%" },
  { left: "88%", top: "13%" },
] as const;

const AVAILABILITY_LABELS = {
  weekday_day: "Hafta içi gündüz",
  weekday_evening: "Hafta içi akşam",
  weekend_day: "Hafta sonu gündüz",
  weekend_evening: "Hafta sonu akşam",
  flexible: "Esnek program",
} as const;

const STYLE_LABELS: Record<TutorTeachingStyle, string> = {
  foundations_patient: "Sabırlı anlatım",
  question_speed: "Soru ve hız",
  planning_accountability: "Plan ve takip",
  motivating_communication: "Güçlü iletişim",
  high_target: "Yüksek hedef",
};

function ChallengeIcon({ value }: { value: MatchChallenge }) {
  const className = "h-4 w-4";
  if (value === "foundations") return <Blocks className={className} />;
  if (value === "question_solving") return <CircleHelp className={className} />;
  if (value === "speed_accuracy") return <Gauge className={className} />;
  if (value === "consistency") return <ListChecks className={className} />;
  if (value === "advanced_questions") return <Rocket className={className} />;
  return <ClipboardCheck className={className} />;
}

function stopClassName(state: SceneStopState) {
  if (state === "committed") return "border-[#ff5968] bg-[#ff5968] text-white";
  if (state === "preview") return "border-[#ff5968] bg-white text-[#ff5968] ring-4 ring-[#ff5968]/15";
  return "border-[#ffb8ad] bg-white/85 text-[#c77d70]";
}

function ScenePill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: -4, scale: 0.96 }}
      transition={{ duration: MATCH_MOTION.scene, ease: MATCH_EASING.enter }}
      className={`notranslate absolute z-30 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[10px] font-bold leading-none text-[#10182e] shadow-[0_8px_24px_rgba(16,24,46,0.1)] sm:text-xs ${className}`}
      translate="no"
    >
      {children}
    </motion.div>
  );
}

export function MatchingScene({
  state,
  matching = false,
}: {
  state: MatchingSceneState;
  matching?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const revealedStops = state.stops.filter((stop) => stop !== "empty").length;
  const progress = revealedStops / 7;
  const showMentor = state.teachingStyles.length > 0 || state.isComplete;
  const availability = state.availabilityWindows[0];

  return (
    <div
      aria-hidden="true"
      data-testid="matching-scene"
      className="relative mx-auto h-full min-h-[9rem] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#ffdcd2] bg-[#fff8f3] shadow-[0_24px_70px_rgba(101,55,42,0.08)] lg:min-h-[32rem]"
    >
      <div className="absolute -left-[12%] top-[8%] h-[48%] w-[54%] rounded-full bg-[#ffe5dc] opacity-80 blur-3xl" />
      <div className="absolute -right-[18%] bottom-[2%] h-[54%] w-[62%] rounded-full bg-[#ffd6d8] opacity-55 blur-3xl" />

      <motion.svg
        viewBox="0 0 600 620"
        preserveAspectRatio="none"
        className="absolute inset-0 z-10 h-full w-full"
      >
        <motion.path
          d="M72 520 C128 484 126 418 190 387 C248 358 250 305 310 274 C374 242 377 199 438 157 C476 131 508 103 535 76"
          fill="none"
          stroke="#efb9ae"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="7 12"
          initial={reducedMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.42, ease: MATCH_EASING.enter }}
        />
        <motion.path
          d="M72 520 C128 484 126 418 190 387 C248 358 250 305 310 274 C374 242 377 199 438 157 C476 131 508 103 535 76"
          fill="none"
          stroke="#ff5968"
          strokeWidth="7"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: progress }}
          transition={{ duration: reducedMotion ? 0 : MATCH_MOTION.progress, ease: MATCH_EASING.enter }}
        />
      </motion.svg>

      {STOP_POSITIONS.map((position, index) => {
        const stop = state.stops[index];
        return (
          <motion.div
            key={index}
            style={position}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{
              opacity: matching ? 0.45 : 1,
              scale: stop === "preview" && !reducedMotion ? 1.08 : 1,
            }}
            transition={{
              duration: reducedMotion ? 0 : MATCH_MOTION.scene,
              delay: reducedMotion ? 0 : index * 0.02,
              ease: MATCH_EASING.enter,
            }}
            className={`absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[9px] font-black shadow-sm sm:h-6 sm:w-6 ${stopClassName(stop)}`}
          >
            {stop === "committed" ? "✓" : index + 1}
          </motion.div>
        );
      })}

      <motion.div
        animate={matching ? { opacity: 0.3, x: -18, scale: 0.9 } : { opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : MATCH_MOTION.scene, ease: MATCH_EASING.complete }}
        className="absolute -bottom-[8%] -left-[24%] z-20 h-[112%] w-[78%] lg:-left-[21%] lg:h-[96%] lg:w-[72%]"
      >
        <Image
          src="/images/matching/student.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 30vw, 58vw"
          className="object-contain object-bottom"
        />
      </motion.div>

      <AnimatePresence initial={false}>
        {showMentor ? (
          <motion.div
            key="mentor"
            initial={reducedMotion ? false : { opacity: 0, x: 12, scale: 0.96 }}
            animate={matching ? { opacity: 0.3, x: 18, scale: 0.9 } : { opacity: 1, x: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: 8, scale: 0.96 }}
            transition={{ duration: reducedMotion ? 0 : MATCH_MOTION.scene, ease: MATCH_EASING.enter }}
            className="absolute -bottom-[10%] -right-[24%] z-20 h-[112%] w-[76%] lg:-right-[22%] lg:h-[98%] lg:w-[74%]"
          >
            <Image
              src="/images/matching/mentor.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 30vw, 58vw"
              className="object-contain object-bottom"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {state.goal && !matching ? (
          <ScenePill key={`goal-${state.goal}`} className="right-[4%] top-[3%] sm:right-[6%] sm:top-[5%]">
            <Target className="h-3.5 w-3.5 text-[#ff5968]" /> {state.goal}
          </ScenePill>
        ) : null}
        {state.stage && !matching ? (
          <ScenePill key={`stage-${state.stage}`} className="left-[4%] top-[9%] sm:left-[7%] sm:top-[12%]">
            <Sparkles className="h-3.5 w-3.5 text-[#ff5968]" /> {state.stage}
          </ScenePill>
        ) : null}
        {state.subjects.length && !matching ? (
          <ScenePill key={`subjects-${state.subjects.join("-")}`} className="left-[31%] top-[57%] max-w-[45%]">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#ff5968]" />
            <span className="truncate">{state.subjects.join(" · ")}</span>
          </ScenePill>
        ) : null}
        {state.challenges.length && !matching ? (
          <ScenePill key={`challenge-${state.challenges.join("-")}`} className="left-[35%] top-[36%]">
            <ChallengeIcon value={state.challenges[0]} /> Destek noktası
          </ScenePill>
        ) : null}
        {state.teachingStyles.length && !matching ? (
          <ScenePill key={`style-${state.teachingStyles.join("-")}`} className="right-[3%] top-[47%] max-w-[44%]">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#ff5968]" />
            <span className="truncate">{state.teachingStyles.map((style) => STYLE_LABELS[style]).join(" · ")}</span>
          </ScenePill>
        ) : null}
        {availability && !matching ? (
          <ScenePill key={`availability-${availability}`} className="left-[38%] top-[15%] max-w-[42%]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#ff5968]" />
            <span className="truncate">{AVAILABILITY_LABELS[availability]}</span>
          </ScenePill>
        ) : null}
        {state.budget && !matching ? (
          <ScenePill key={`budget-${state.budget}`} className="right-[4%] top-[23%] max-w-[42%]">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[#ff5968]" />
            <span className="truncate">{state.budget}</span>
          </ScenePill>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {matching ? (
          <motion.div
            key="matching-profile"
            initial={reducedMotion ? false : { opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.94 }}
            transition={{ duration: reducedMotion ? 0.12 : MATCH_MOTION.complete, ease: MATCH_EASING.complete }}
            className="absolute left-1/2 top-1/2 z-40 w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-white bg-white/95 p-4 text-center shadow-[0_24px_70px_rgba(16,24,46,0.18)] backdrop-blur sm:p-6"
          >
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1f2] text-[#ff5968]">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-[#10182e]">Eşleşme profilin tamamlandı</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              {state.goal ?? "Hedefin"} · {state.subjects.join(", ") || "Derslerin"}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-neutral-500">
              <Clock3 className="h-3.5 w-3.5" /> Gerçek profil ve müsaitlikler karşılaştırılıyor
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

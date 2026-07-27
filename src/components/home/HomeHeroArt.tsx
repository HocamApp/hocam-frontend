import { cn } from "@/lib/utils";
import type { HomeVisualTone } from "@/components/home/HomeVisual";

/**
 * Bespoke hero illustrations — one composition per slide.
 *
 * Each scene is a small arrangement of floating "paper" cards (a notebook
 * page, an optical answer sheet, a study plan, a question stack) rather than
 * the enlarged abstract blobs the first pass used. They are pure SVG built
 * from `currentColor`, so they inherit the slide's tone and follow dark mode
 * without any image assets.
 *
 * Everything sits behind the copy card, so opacity stays low enough that
 * headline contrast is never in question.
 */

const TONE_INK: Record<HomeVisualTone, string> = {
  brand: "text-brand-600 dark:text-brand-300",
  sky: "text-sky-700 dark:text-sky-300",
  cream: "text-amber-700 dark:text-amber-300",
  violet: "text-violet-700 dark:text-violet-300",
  slate: "text-slate-600 dark:text-slate-300",
};

const TONE_WASH: Record<HomeVisualTone, string> = {
  brand: "from-brand-100/80 via-brand-50/50 to-transparent dark:from-brand-900/40 dark:via-brand-900/15",
  sky: "from-sky-100/80 via-sky-50/50 to-transparent dark:from-sky-900/40 dark:via-sky-900/15",
  cream: "from-amber-100/80 via-amber-50/50 to-transparent dark:from-amber-900/30 dark:via-amber-900/12",
  violet: "from-violet-100/80 via-violet-50/50 to-transparent dark:from-violet-900/40 dark:via-violet-900/15",
  slate: "from-slate-200/80 via-slate-100/50 to-transparent dark:from-slate-700/45 dark:via-slate-800/20",
};

export type HomeHeroScene = "study" | "exam" | "plan" | "questions";

/** A sheet of paper: filled panel plus hairline border. */
function Sheet({
  x,
  y,
  width,
  height,
  rotate = 0,
  opacity = 0.14,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <g transform={`rotate(${rotate} ${x + width / 2} ${y + height / 2})`}>
      <rect x={x} y={y} width={width} height={height} rx={14} opacity={opacity} />
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={14}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.3}
      />
    </g>
  );
}

function Lines({
  x,
  y,
  widths,
  gap = 15,
  rotate = 0,
  pivot,
}: {
  x: number;
  y: number;
  widths: number[];
  gap?: number;
  rotate?: number;
  pivot?: [number, number];
}) {
  const body = widths.map((width, index) => (
    <rect key={index} x={x} y={y + index * gap} width={width} height={7} rx={3.5} opacity={0.3} />
  ));
  if (!rotate || !pivot) return <g>{body}</g>;
  return <g transform={`rotate(${rotate} ${pivot[0]} ${pivot[1]})`}>{body}</g>;
}

/** Slide 1 — notebook page, equation strip and a progress ring. */
function StudyScene() {
  return (
    <g>
      <Sheet x={54} y={40} width={190} height={236} rotate={-6} opacity={0.16} />
      <g transform="rotate(-6 149 158)">
        <rect x={54} y={40} width={22} height={236} rx={14} opacity={0.22} />
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <circle key={index} cx={65} cy={72 + index * 36} r={4.5} opacity={0.45} />
        ))}
        <Lines x={92} y={78} widths={[132, 118, 138, 96, 128]} gap={34} />
      </g>

      <Sheet x={218} y={132} width={172} height={104} rotate={5} opacity={0.2} />
      <g transform="rotate(5 304 184)">
        {[0, 1].map((row) => {
          let x = 238;
          return (
            <g key={row}>
              {[26, 16, 22].map((width, column) => {
                const rect = (
                  <rect key={column} x={x} y={162 + row * 32} width={width} height={9} rx={4} opacity={column === 2 ? 0.5 : 0.28} />
                );
                x += width + 14;
                return rect;
              })}
              <g opacity={0.4}>
                <rect x={x - 26} y={164 + row * 32} width={8} height={2.6} rx={1.3} />
                <rect x={x - 26} y={169 + row * 32} width={8} height={2.6} rx={1.3} />
              </g>
            </g>
          );
        })}
      </g>

      <g fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round">
        <circle cx={300} cy={78} r={34} opacity={0.18} />
        <path d="M300 44 a 34 34 0 0 1 27 54" opacity={0.5} />
      </g>
    </g>
  );
}

/** Slide 2 — optical answer sheet with a pencil rule and a score chip. */
function ExamScene() {
  return (
    <g>
      <Sheet x={92} y={34} width={214} height={248} rotate={-3} opacity={0.16} />
      <g transform="rotate(-3 199 158)">
        <rect x={116} y={58} width={80} height={11} rx={5.5} opacity={0.42} />
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <g key={row}>
            <rect x={116} y={96 + row * 30} width={16} height={8} rx={4} opacity={0.3} />
            {[0, 1, 2, 3].map((bubble) => (
              <circle
                key={bubble}
                cx={152 + bubble * 34}
                cy={100 + row * 30}
                r={9.5}
                fill={bubble === (row * 2 + 1) % 4 ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
                opacity={bubble === (row * 2 + 1) % 4 ? 0.5 : 0.26}
              />
            ))}
          </g>
        ))}
      </g>

      <g transform="rotate(24 332 96)">
        <rect x={322} y={40} width={20} height={112} rx={10} opacity={0.28} />
        <polygon points="322,152 342,152 332,176" opacity={0.45} />
      </g>
    </g>
  );
}

/** Slide 3 — study plan: milestone path, week blocks and a rising chart. */
function PlanScene() {
  return (
    <g>
      <Sheet x={58} y={58} width={200} height={168} rotate={-4} opacity={0.16} />
      <g transform="rotate(-4 158 142)">
        <rect x={58} y={58} width={200} height={30} rx={14} opacity={0.26} />
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((column) => {
            const lesson = (row === 0 && column === 1) || (row === 2 && column === 2);
            return (
              <rect
                key={`${row}-${column}`}
                x={76 + column * 44}
                y={104 + row * 38}
                width={32}
                height={26}
                rx={7}
                opacity={lesson ? 0.55 : 0.18}
              />
            );
          })
        )}
      </g>

      <Sheet x={244} y={128} width={152} height={132} rotate={6} opacity={0.2} />
      <g transform="rotate(6 320 194)">
        {[26, 44, 34, 62].map((height, index) => (
          <rect
            key={index}
            x={266 + index * 30}
            y={230 - height}
            width={18}
            height={height}
            rx={5}
            opacity={0.22 + index * 0.1}
          />
        ))}
        <polyline
          points={[26, 44, 34, 62].map((height, index) => `${275 + index * 30},${222 - height}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          opacity={0.5}
        />
      </g>

      <g fill="none" stroke="currentColor" strokeWidth={2.4} strokeDasharray="6 8" opacity={0.4}>
        <path d="M76 268 C 150 268, 190 236, 268 236" />
      </g>
    </g>
  );
}

/** Slide 4 — a fanned stack of question cards over paragraph lines. */
function QuestionsScene() {
  return (
    <g>
      <Sheet x={70} y={70} width={186} height={166} rotate={-10} opacity={0.12} />
      <Sheet x={104} y={54} width={186} height={166} rotate={-4} opacity={0.16} />
      <Sheet x={138} y={40} width={186} height={166} rotate={3} opacity={0.22} />

      <g transform="rotate(3 231 123)">
        <rect x={160} y={64} width={54} height={10} rx={5} opacity={0.45} />
        <Lines x={160} y={92} widths={[140, 116, 132]} gap={20} />
        {[0, 1].map((index) => (
          <g key={index}>
            <circle
              cx={168}
              cy={162 + index * 26}
              r={7.5}
              fill={index === 1 ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              opacity={index === 1 ? 0.55 : 0.28}
            />
            <rect x={184} y={157 + index * 26} width={index === 1 ? 96 : 76} height={8} rx={4} opacity={0.26} />
          </g>
        ))}
      </g>

      <g fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" opacity={0.45}>
        <path d="M318 214 l 16 16 l 30 -36" />
      </g>
    </g>
  );
}

const SCENES: Record<HomeHeroScene, () => JSX.Element> = {
  study: StudyScene,
  exam: ExamScene,
  plan: PlanScene,
  questions: QuestionsScene,
};

interface HomeHeroArtProps {
  scene: HomeHeroScene;
  tone: HomeVisualTone;
  className?: string;
}

export function HomeHeroArt({ scene, tone, className }: HomeHeroArtProps) {
  const Scene = SCENES[scene];

  return (
    <div aria-hidden="true" className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Tone wash reads left-to-right so the copy card always sits on the
          lightest part of the band. */}
      <div className={cn("absolute inset-0 bg-gradient-to-l", TONE_WASH[tone])} />
      <div className={cn("absolute inset-y-0 right-0 w-full sm:w-[62%]", TONE_INK[tone])}>
        <svg
          viewBox="0 0 440 316"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          fill="currentColor"
          focusable="false"
        >
          <Scene />
        </svg>
      </div>
    </div>
  );
}

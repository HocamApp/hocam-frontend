import { cn } from "@/lib/utils";
import type { HomeVisualTone } from "@/components/home/HomeVisual";

/**
 * Illustrated scenes for the homepage discovery and goal cards.
 *
 * These replace the flat geometric panels the earlier pass used. The upgrade
 * is layering: each scene stacks real "sheets" filled with the card colour and
 * outlined in the tone's ink, then places objects on top of them. That gives
 * depth and a drawn, editorial feel instead of shapes floating on a wash.
 *
 * Still 100% local SVG — no image files, no network fetches, no stock photos,
 * nothing derived from another product's assets. Tone comes from the same
 * five-family palette the rest of the home uses, so the richer artwork does
 * not pull the page away from Hocam's colour system.
 */

export type HomeScene =
  // academic / exam
  | "worksheet"
  | "graphing"
  | "drafting"
  | "reading"
  | "physics"
  | "answerSheet"
  | "logic"
  | "archive"
  // goals
  | "medicine"
  | "engineering"
  | "law"
  | "teaching";

const TONE_SURFACE: Record<HomeVisualTone, string> = {
  brand:
    "from-brand-100 via-brand-50 to-background dark:from-brand-900/40 dark:via-brand-900/15 dark:to-background",
  sky: "from-sky-100 via-sky-50 to-background dark:from-sky-900/40 dark:via-sky-900/15 dark:to-background",
  cream:
    "from-amber-100 via-amber-50 to-background dark:from-amber-900/30 dark:via-amber-900/10 dark:to-background",
  violet:
    "from-violet-100 via-violet-50 to-background dark:from-violet-900/40 dark:via-violet-900/15 dark:to-background",
  slate:
    "from-slate-200 via-slate-100 to-background dark:from-slate-700/50 dark:via-slate-800/25 dark:to-background",
};

const TONE_INK: Record<HomeVisualTone, string> = {
  brand: "text-brand-700 dark:text-brand-300",
  sky: "text-sky-800 dark:text-sky-300",
  cream: "text-amber-800 dark:text-amber-300",
  violet: "text-violet-800 dark:text-violet-300",
  slate: "text-slate-700 dark:text-slate-300",
};

/** Paper: a card-coloured sheet with an inked hairline, used to build depth. */
function Sheet({
  x,
  y,
  w,
  h,
  r = 7,
  rotate = 0,
  shade = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  rotate?: number;
  /** 0 = clean paper, higher = pushed further back. */
  shade?: number;
}) {
  return (
    <g transform={rotate ? `rotate(${rotate} ${x + w / 2} ${y + h / 2})` : undefined}>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="hsl(var(--card))" opacity={0.92} />
      {shade > 0 && <rect x={x} y={y} width={w} height={h} rx={r} opacity={shade} />}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        opacity={0.38}
      />
    </g>
  );
}

function Rules({ x, y, widths, gap = 11, o = 0.26 }: { x: number; y: number; widths: number[]; gap?: number; o?: number }) {
  return (
    <g>
      {widths.map((w, i) => (
        <rect key={i} x={x} y={y + i * gap} width={w} height={4.5} rx={2.25} opacity={o} />
      ))}
    </g>
  );
}

/* ------------------------------- academic ------------------------------- */

/** Worksheet: a squared exercise page with a pencil resting on it. */
function Worksheet() {
  return (
    <g>
      <Sheet x={26} y={16} w={104} h={122} rotate={-4} shade={0.05} />
      <Sheet x={62} y={26} w={106} h={116} rotate={3} />
      <g transform="rotate(3 115 84)">
        <rect x={74} y={38} width={40} height={6} rx={3} opacity={0.5} />
        {[0, 1, 2].map((row) => (
          <g key={row}>
            <Rules x={74} y={58 + row * 24} widths={[28, 46]} gap={12} o={0.24} />
            <rect x={132} y={58 + row * 24} width={22} height={4.5} rx={2.25} opacity={0.45} />
          </g>
        ))}
      </g>
      {/* pencil */}
      <g transform="rotate(38 156 104)">
        <rect x={150} y={54} width={12} height={62} rx={3} opacity={0.6} />
        <rect x={150} y={44} width={12} height={12} rx={2} opacity={0.35} />
        <polygon points="150,116 162,116 156,132" opacity={0.75} />
      </g>
    </g>
  );
}

/** Graphing: a plotted curve on a gridded chart card. */
function Graphing() {
  return (
    <g>
      <Sheet x={22} y={22} w={156} h={110} />
      <g opacity={0.16}>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={`v${i}`} x={40 + i * 28} y={32} width={1.4} height={88} />
        ))}
        {[0, 1, 2].map((i) => (
          <rect key={`h${i}`} x={32} y={52 + i * 28} width={136} height={1.4} />
        ))}
      </g>
      <g opacity={0.45}>
        <rect x={36} y={116} width={132} height={2.4} rx={1.2} />
        <rect x={36} y={32} width={2.4} height={86} rx={1.2} />
      </g>
      <path
        d="M40 112 C 66 112, 74 62, 96 60 S 138 96, 166 44"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.4}
        strokeLinecap="round"
        opacity={0.75}
      />
      {[
        [96, 60],
        [166, 44],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={5} fill="hsl(var(--card))" stroke="currentColor" strokeWidth={3} opacity={0.85} />
      ))}
    </g>
  );
}

/** Drafting: geometry construction with a protractor and set square. */
function Drafting() {
  return (
    <g>
      <Sheet x={20} y={18} w={150} h={118} rotate={-3} />
      <g transform="rotate(-3 95 77)" opacity={0.14}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={30} y={30 + i * 18} width={130} height={1.2} />
        ))}
      </g>
      {/* set square */}
      <polygon points="44,118 132,118 44,52" fill="none" stroke="currentColor" strokeWidth={3} opacity={0.62} />
      <polygon points="44,118 132,118 44,52" opacity={0.08} />
      <path d="M64 118 a 20 20 0 0 0 -1 -18" fill="none" stroke="currentColor" strokeWidth={2.2} opacity={0.55} />
      {/* protractor */}
      <g transform="translate(150 96)">
        <path d="M-34 0 a 34 34 0 0 1 68 0 z" fill="hsl(var(--card))" opacity={0.9} />
        <path d="M-34 0 a 34 34 0 0 1 68 0 z" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.5} />
        <path d="M-20 0 a 20 20 0 0 1 40 0" fill="none" stroke="currentColor" strokeWidth={1.4} opacity={0.34} />
        {[-60, -30, 0, 30, 60].map((deg) => (
          <rect key={deg} x={-0.8} y={-33} width={1.6} height={8} opacity={0.4} transform={`rotate(${deg})`} />
        ))}
      </g>
    </g>
  );
}

/** Reading: an open book with a bookmark and highlighted line. */
function Reading() {
  return (
    <g>
      <path d="M22 44 Q 100 26 100 34 L100 124 Q 100 116 22 132 Z" fill="hsl(var(--card))" opacity={0.94} />
      <path d="M178 44 Q 100 26 100 34 L100 124 Q 100 116 178 132 Z" fill="hsl(var(--card))" opacity={0.94} />
      <path d="M22 44 Q 100 26 100 34 L100 124 Q 100 116 22 132 Z" fill="none" stroke="currentColor" strokeWidth={1.8} opacity={0.4} />
      <path d="M178 44 Q 100 26 100 34 L100 124 Q 100 116 178 132 Z" fill="none" stroke="currentColor" strokeWidth={1.8} opacity={0.4} />
      <rect x={99} y={32} width={2} height={92} opacity={0.35} />
      <g transform="rotate(-3 60 84)">
        <Rules x={34} y={56} widths={[52, 58, 46, 58]} gap={14} />
      </g>
      <g transform="rotate(3 140 84)">
        <Rules x={112} y={56} widths={[58, 44, 58, 36]} gap={14} />
        <rect x={112} y={70} width={44} height={5} rx={2.5} opacity={0.65} />
      </g>
      <path d="M150 30 l 16 -4 l 0 34 l -8 -8 l -8 10 z" opacity={0.7} />
    </g>
  );
}

/** Physics: pendulum, orbit and a vector arrow over a lab card. */
function Physics() {
  return (
    <g>
      <Sheet x={24} y={22} w={152} h={112} />
      <g fill="none" stroke="currentColor" strokeWidth={2}>
        <ellipse cx={72} cy={78} rx={40} ry={17} opacity={0.35} />
        <ellipse cx={72} cy={78} rx={40} ry={17} opacity={0.35} transform="rotate(62 72 78)" />
        <ellipse cx={72} cy={78} rx={40} ry={17} opacity={0.35} transform="rotate(-62 72 78)" />
      </g>
      <circle cx={72} cy={78} r={8} opacity={0.7} />
      <circle cx={112} cy={78} r={4} opacity={0.5} />
      <g opacity={0.55}>
        <rect x={126} y={36} width={38} height={2.6} rx={1.3} />
        <rect x={144} y={38} width={2} height={40} opacity={0.7} />
        <circle cx={145} cy={88} r={10} opacity={0.85} />
      </g>
      <g stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.6}>
        <path d="M120 116 L 164 116" />
        <path d="M156 109 L 164 116 L 156 123" fill="none" />
      </g>
    </g>
  );
}

/** Answer sheet: an optical form under a timer. */
function AnswerSheet() {
  return (
    <g>
      <Sheet x={30} y={14} w={112} h={128} rotate={-4} shade={0.05} />
      <Sheet x={44} y={22} w={112} h={124} rotate={2} />
      <g transform="rotate(2 100 84)">
        <rect x={58} y={36} width={46} height={6} rx={3} opacity={0.5} />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <rect x={58} y={58 + row * 21} width={9} height={5} rx={2.5} opacity={0.36} />
            {[0, 1, 2, 3].map((b) => {
              const marked = b === (row + 2) % 4;
              return (
                <circle
                  key={b}
                  cx={80 + b * 20}
                  cy={60 + row * 21}
                  r={6.4}
                  fill={marked ? "currentColor" : "hsl(var(--card))"}
                  stroke="currentColor"
                  strokeWidth={1.7}
                  opacity={marked ? 0.75 : 0.4}
                />
              );
            })}
          </g>
        ))}
      </g>
      <g transform="translate(160 40)">
        <circle r={19} fill="hsl(var(--card))" opacity={0.95} />
        <circle r={19} fill="none" stroke="currentColor" strokeWidth={2.6} opacity={0.6} />
        <path d="M0 -11 L0 0 L8 6" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" opacity={0.8} />
      </g>
    </g>
  );
}

/** Logic: a flow of connected reasoning blocks. */
function Logic() {
  const nodes: Array<[number, number]> = [
    [50, 40],
    [50, 100],
    [116, 70],
    [166, 70],
  ];
  return (
    <g>
      <g stroke="currentColor" strokeWidth={2.2} opacity={0.4} fill="none">
        <path d="M78 46 C 96 50, 98 62, 110 68" />
        <path d="M78 100 C 96 96, 98 80, 110 74" />
        <path d="M140 70 L 156 70" />
      </g>
      {nodes.slice(0, 2).map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 28} y={y - 15} width={56} height={30} rx={8} fill="hsl(var(--card))" opacity={0.95} />
          <rect x={x - 28} y={y - 15} width={56} height={30} rx={8} fill="none" stroke="currentColor" strokeWidth={1.8} opacity={0.45} />
          <rect x={x - 16} y={y - 3} width={32} height={5} rx={2.5} opacity={0.34} />
        </g>
      ))}
      <g>
        <polygon points="116,46 142,70 116,94 90,70" fill="hsl(var(--card))" opacity={0.95} />
        <polygon points="116,46 142,70 116,94 90,70" fill="none" stroke="currentColor" strokeWidth={2} opacity={0.5} />
        <rect x={107} y={67} width={18} height={5} rx={2.5} opacity={0.4} />
      </g>
      <circle cx={168} cy={70} r={13} opacity={0.7} />
      <path d="M162 70 l 4.5 5 l 8 -10" fill="none" stroke="hsl(var(--card))" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  );
}

/** Archive: a stack of past papers with year tabs and a magnifier. */
function Archive() {
  return (
    <g>
      <Sheet x={30} y={30} w={112} h={104} rotate={-7} shade={0.07} />
      <Sheet x={38} y={24} w={112} h={104} rotate={-2} shade={0.03} />
      <Sheet x={46} y={18} w={112} h={104} rotate={3} />
      <g transform="rotate(3 102 70)">
        <rect x={62} y={34} width={38} height={6} rx={3} opacity={0.5} />
        <Rules x={62} y={54} widths={[80, 66, 80, 52]} gap={14} />
      </g>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={150} y={40 + i * 20} width={20} height={12} rx={3} opacity={0.28 + i * 0.16} />
      ))}
      <g transform="translate(146 108)">
        <circle r={17} fill="hsl(var(--card))" opacity={0.9} />
        <circle r={17} fill="none" stroke="currentColor" strokeWidth={3} opacity={0.7} />
        <rect x={11} y={11} width={20} height={5.5} rx={2.75} transform="rotate(45 11 11)" opacity={0.7} />
      </g>
    </g>
  );
}

/* --------------------------------- goals -------------------------------- */

/** Medicine: heartbeat chart, molecule and a cross badge. */
function Medicine() {
  return (
    <g>
      <Sheet x={22} y={30} w={126} h={92} rotate={-3} />
      <g transform="rotate(-3 85 76)">
        <path
          d="M36 84 L60 84 L68 62 L80 104 L92 78 L102 84 L130 84"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.75}
        />
        <rect x={36} y={44} width={40} height={5} rx={2.5} opacity={0.35} />
      </g>
      <g transform="translate(154 46)">
        <circle r={22} opacity={0.72} />
        <rect x={-11} y={-3.5} width={22} height={7} rx={3.5} fill="hsl(var(--card))" />
        <rect x={-3.5} y={-11} width={7} height={22} rx={3.5} fill="hsl(var(--card))" />
      </g>
      <g opacity={0.5} stroke="currentColor" strokeWidth={2} fill="none">
        <path d="M140 106 L 158 116 L 176 106" />
        <circle cx={140} cy={106} r={5} fill="currentColor" />
        <circle cx={158} cy={116} r={5} fill="currentColor" />
        <circle cx={176} cy={106} r={5} fill="currentColor" />
      </g>
    </g>
  );
}

/** Engineering: a blueprint sheet with a gear and dimension line. */
function Engineering() {
  return (
    <g>
      <Sheet x={20} y={20} w={158} h={114} />
      <g opacity={0.14}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={`v${i}`} x={34 + i * 26} y={30} width={1.2} height={94} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <rect key={`h${i}`} x={30} y={40 + i * 24} width={138} height={1.2} />
        ))}
      </g>
      <g transform="translate(84 74)">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={-5} y={-38} width={10} height={13} rx={2.5} opacity={0.6} transform={`rotate(${i * 45})`} />
        ))}
        <circle r={28} fill="hsl(var(--card))" opacity={0.95} />
        <circle r={28} fill="none" stroke="currentColor" strokeWidth={4} opacity={0.7} />
        <circle r={10} fill="none" stroke="currentColor" strokeWidth={4} opacity={0.55} />
      </g>
      <g opacity={0.55} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M132 46 L132 108" />
        <path d="M127 51 L132 46 L137 51" fill="none" />
        <path d="M127 103 L132 108 L137 103" fill="none" />
      </g>
      <rect x={144} y={70} width={26} height={5} rx={2.5} opacity={0.4} />
    </g>
  );
}

/** Law: scales of justice standing beside a statute book and a column. */
function Law() {
  return (
    <g>
      <Sheet x={104} y={54} w={74} h={80} rotate={4} />
      <g transform="rotate(4 141 94)">
        <rect x={118} y={70} width={38} height={5} rx={2.5} opacity={0.45} />
        <Rules x={118} y={86} widths={[46, 34, 46]} gap={12} />
      </g>
      <g stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.75} fill="none">
        <path d="M66 34 L66 118" />
        <path d="M28 48 L104 48" />
        <path d="M44 118 L88 118" />
      </g>
      <circle cx={66} cy={32} r={5} opacity={0.8} />
      {[28, 104].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 48 L${x - 15} 76 L${x + 15} 76 Z`} fill="hsl(var(--card))" opacity={0.95} />
          <path
            d={`M${x} 48 L${x - 15} 76 L${x + 15} 76 Z`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            opacity={0.6}
          />
        </g>
      ))}
    </g>
  );
}

/** Teaching: a chalkboard with a lesson on it and a graduation cap. */
function Teaching() {
  return (
    <g>
      <Sheet x={24} y={24} w={132} h={94} r={8} />
      <rect x={34} y={34} width={112} height={74} rx={5} opacity={0.14} />
      <g opacity={0.55}>
        <rect x={46} y={48} width={40} height={5} rx={2.5} />
        <rect x={46} y={62} width={62} height={5} rx={2.5} opacity={0.7} />
        <rect x={46} y={76} width={30} height={5} rx={2.5} opacity={0.7} />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth={2.4} opacity={0.6}>
        <path d="M104 92 L118 78 L132 92" />
      </g>
      <rect x={40} y={118} width={100} height={5} rx={2.5} opacity={0.4} />
      <g transform="translate(156 52)">
        <polygon points="0,-16 30,-2 0,12 -30,-2" opacity={0.75} />
        <path d="M18 4 L18 20 a 18 8 0 0 1 -36 0 L-18 4" fill="hsl(var(--card))" opacity={0.9} />
        <path d="M18 4 L18 20 a 18 8 0 0 1 -36 0 L-18 4" fill="none" stroke="currentColor" strokeWidth={2.2} opacity={0.6} />
      </g>
    </g>
  );
}

const SCENES: Record<HomeScene, () => JSX.Element> = {
  worksheet: Worksheet,
  graphing: Graphing,
  drafting: Drafting,
  reading: Reading,
  physics: Physics,
  answerSheet: AnswerSheet,
  logic: Logic,
  archive: Archive,
  medicine: Medicine,
  engineering: Engineering,
  law: Law,
  teaching: Teaching,
};

interface HomeSceneArtProps {
  scene: HomeScene;
  tone: HomeVisualTone;
  className?: string;
}

export function HomeSceneArt({ scene, tone, className }: HomeSceneArtProps) {
  const Scene = SCENES[scene];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        TONE_SURFACE[tone],
        TONE_INK[tone],
        className
      )}
    >
      <svg
        viewBox="0 0 200 150"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        fill="currentColor"
        focusable="false"
      >
        <Scene />
      </svg>
    </div>
  );
}

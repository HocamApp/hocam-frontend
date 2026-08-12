import type { CoachingTutorEarningSummary } from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

type Batch = CoachingTutorEarningSummary["payout_batches"][number];

const WIDTH = 680;
const HEIGHT = 260;
const PLOT = { left: 82, right: 18, top: 20, bottom: 48 };

export function CoachingEarningsChart({ batches }: { batches: Batch[] }) {
  const points = [...batches]
    .sort((a, b) => a.local_month.localeCompare(b.local_month))
    .slice(-6);
  const maxValue = Math.max(
    0,
    ...points.map((point) => point.total_amount_minor),
  );
  const axisMax = maxValue > 0 ? maxValue : 100;
  const plotWidth = WIDTH - PLOT.left - PLOT.right;
  const plotHeight = HEIGHT - PLOT.top - PLOT.bottom;
  const xFor = (index: number) =>
    PLOT.left +
    (points.length <= 1
      ? plotWidth / 2
      : (index / (points.length - 1)) * plotWidth);
  const yFor = (value: number) =>
    PLOT.top + plotHeight - (value / axisMax) * plotHeight;
  const linePoints = points
    .map((point, index) => `${xFor(index)},${yFor(point.total_amount_minor)}`)
    .join(" ");
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div
      role="region"
      aria-label="Aylık kazanç grafiği kaydırma alanı"
      tabIndex={0}
      className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div
        data-testid="coaching-earnings-chart"
        className="relative min-w-[38rem] sm:min-w-0"
      >
        <svg
          role="img"
          aria-label="Aylık koçluk kazanç grafiği"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[16.25rem] w-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {ticks.map((tick) => {
            const y = PLOT.top + (1 - tick) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={PLOT.left}
                  x2={WIDTH - PLOT.right}
                  y1={y}
                  y2={y}
                  className="stroke-border/70"
                  strokeWidth="1"
                />
                <text
                  x={PLOT.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {formatTryMinor(
                    maxValue > 0 ? Math.round(axisMax * tick) : 0,
                  )}
                </text>
              </g>
            );
          })}
          <line
            x1={PLOT.left}
            x2={PLOT.left}
            y1={PLOT.top}
            y2={HEIGHT - PLOT.bottom}
            className="stroke-border"
            strokeWidth="1"
          />
          <line
            x1={PLOT.left}
            x2={WIDTH - PLOT.right}
            y1={HEIGHT - PLOT.bottom}
            y2={HEIGHT - PLOT.bottom}
            className="stroke-foreground/20"
            strokeWidth="1.5"
          />

          {points.length > 0 ? (
            <>
              <defs>
                <linearGradient
                  id="coaching-earnings-fill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0.22"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <polygon
                points={`${xFor(0)},${HEIGHT - PLOT.bottom} ${linePoints} ${xFor(points.length - 1)},${HEIGHT - PLOT.bottom}`}
                fill="url(#coaching-earnings-fill)"
                className="motion-safe:animate-in motion-safe:fade-in"
              />
              <polyline
                points={linePoints}
                fill="none"
                className="stroke-primary motion-safe:animate-in motion-safe:fade-in"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {points.map((point, index) => (
                <g key={point.local_month}>
                  <circle
                    cx={xFor(index)}
                    cy={yFor(point.total_amount_minor)}
                    r="6"
                    className="fill-background stroke-primary"
                    strokeWidth="4"
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>{`${formatMonthShort(point.local_month)}: ${formatTryMinor(point.total_amount_minor)}`}</title>
                  </circle>
                  <text
                    data-chart-month
                    x={xFor(index)}
                    y={HEIGHT - 20}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[12px] font-medium"
                  >
                    {formatMonthShort(point.local_month)}
                  </text>
                </g>
              ))}
            </>
          ) : null}
        </svg>
        {points.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-16 top-1/2 -translate-y-1/2 rounded-2xl border border-dashed bg-background/90 px-4 py-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-foreground">
              Henüz grafik oluşturacak aylık kazanç kaydı yok.
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Aylık kayıt oluştuğunda gerçek değerler burada görünür.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatMonthShort(localMonth: string) {
  const [year, month] = localMonth.split("-").map(Number);
  if (!year || !month) return localMonth;
  return new Intl.DateTimeFormat("tr-TR", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(".", "");
}

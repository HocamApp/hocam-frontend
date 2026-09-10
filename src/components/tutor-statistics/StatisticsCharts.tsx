"use client";

import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { DonutChart, type DonutChartSegment } from "@/components/ui/donut-chart";
import { cn } from "@/lib/utils";

type ChartPoint = { label: string; value: number | null };

/**
 * Both charts keep their accessible layer *outside* recharts on purpose.
 *
 * The `role="img"` name, the axis titles and the `sr-only` data table are real
 * DOM, not SVG. Recharts computes its layout from a measured parent, so in a
 * headless DOM (`ResponsiveContainer` sees 0×0) it draws nothing at all —
 * anything written inside the chart would be invisible to a screen reader's
 * text alternative *and* to the tests. Outside, both keep working.
 */

/* From the supplied components, kept as they came: a violet line, and the
   donut's own five. Deliberately not the DESIGN.md brand palette — the chart
   internals are their own visual system, and the cards around them are still
   `--surface` / `--line` / `--ink`. */
const LINE_COLOR = "#8b5cf6";
const DONUT_COLORS = [
  "hsl(214.7 95% 40%)",
  "hsl(142.1 76.2% 36.3%)",
  "hsl(47.9 95.8% 53.1%)",
  "hsl(0 0% 63.9%)",
  "hsl(262.1 83.3% 57.8%)",
];

const numberLabel = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const percentLabel = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

const dateLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Recharts calls a tick formatter with whatever the axis holds, which is not
 * always one of our labels — a category axis pads its domain, and the grid
 * asks for ticks of its own. An unparseable value used to throw
 * `RangeError: Invalid time value` out of `Intl.format` and take the whole
 * page down with it, so anything that is not a real day is handed back as-is.
 */
function chartDate(value: string) {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return String(value ?? "");
  return dateLabel.format(parsed);
}

export function LineChartEmpty() {
  return <p className="py-10 text-center text-small text-ink-mid">Bu dönem için grafik verisi bulunmuyor.</p>;
}

function DataTable({ title, headers, rows }: { title: string; headers: [string, string]; rows: Array<[string, string]> }) {
  return (
    <table aria-label={`${title} verileri`} className="sr-only">
      <thead><tr><th>{headers[0]}</th><th>{headers[1]}</th></tr></thead>
      <tbody>{rows.map(([first, second]) => <tr key={first}><td>{first}</td><td>{second}</td></tr>)}</tbody>
    </table>
  );
}

export function StatisticsLineChart({
  title,
  points,
  valueLabel,
  xAxisLabel,
  yAxisLabel,
  axisValueLabel = (value) => numberLabel.format(value),
  maxValue,
}: {
  title: string;
  points: ChartPoint[];
  valueLabel: (value: number) => string;
  xAxisLabel: string;
  yAxisLabel: string;
  axisValueLabel?: (value: number) => string;
  maxValue?: number;
}) {
  const available = points.filter((point): point is { label: string; value: number } => point.value !== null);
  const max = Math.max(1, maxValue ?? 0, ...available.map((point) => point.value));

  const config = useMemo<ChartConfig>(() => ({ value: { label: yAxisLabel, color: LINE_COLOR } }), [yAxisLabel]);

  /* Not the title: these end up inside `url(#...)`, and every title here is
     Turkish prose with spaces, which is not a usable SVG reference — the fill
     silently failed and painted the whole plot black. */
  const patternId = `dot-grid-${useId().replace(/:/g, "")}`;
  const shadowId = `dot-shadow-${useId().replace(/:/g, "")}`;

  /* Recharts wants a fixed gutter, and "30.154,00 ₺" does not fit the default.
     The old hand-rolled chart sized its own gutter off the longest tick for
     the same reason; without it the currency labels wrap onto two lines. */
  const yAxisWidth = Math.min(148, Math.max(52, Array.from(axisValueLabel(max)).length * 7 + 16));

  if (!available.length) return <LineChartEmpty />;

  return (
    /* Scrolls inside its own box rather than squeezing. A fourteen-point series
       in the ~190px a phone leaves after the card padding and the axis gutter
       is not a smaller chart, it is an unreadable one; the hand-rolled chart
       this replaces reserved 680px for the same reason. */
    <div className="min-w-0 overflow-x-auto pb-1">
      <div role="img" aria-label={`${title} grafiği`} className="flex min-w-[520px] items-stretch gap-2">
        <span
          aria-hidden="true"
          className="shrink-0 self-center text-caption font-semibold text-ink-mid [writing-mode:vertical-rl] rotate-180"
        >
          {yAxisLabel}
        </span>
        <ChartContainer
          config={config}
          className="h-[260px] w-full min-w-0 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[var(--line)]"
        >
          <ComposedChart data={points} margin={{ top: 16, right: 12, left: 4, bottom: 8 }}>
            <defs>
              <pattern id={patternId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="var(--line)" fillOpacity="0.6" />
              </pattern>
              <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.25)" />
              </filter>
            </defs>

            <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} style={{ pointerEvents: "none" }} />

            <CartesianGrid strokeDasharray="4 8" stroke="var(--line)" horizontal vertical={false} />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--ink-mid)" }}
              tickFormatter={chartDate}
              tickMargin={12}
              interval="preserveStartEnd"
              minTickGap={24}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--ink-mid)" }}
              tickFormatter={(value: number) => axisValueLabel(value)}
              tickMargin={10}
              width={yAxisWidth}
              domain={[0, max]}
            />

            <ChartTooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--ink-mid)", strokeOpacity: 0.4 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as ChartPoint;
                if (point.value === null) return null;
                return (
                  <div className="rounded-input border border-line bg-surface px-3 py-2 shadow-float">
                    <p className="text-caption text-ink-mid">{chartDate(point.label)}</p>
                    <p className="mt-0.5 text-small font-semibold tabular-nums">{valueLabel(point.value)}</p>
                  </div>
                );
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke={LINE_COLOR}
              strokeWidth={2.5}
              strokeLinecap="round"
              /* A gap is "no data", not zero. The old chart broke the path for
                 the same reason; do not turn this on to make the line tidy. */
              connectNulls={false}
              dot={false}
              activeDot={{
                r: 5,
                fill: LINE_COLOR,
                stroke: "var(--surface)",
                strokeWidth: 2,
                filter: `url(#${shadowId})`,
              }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
      <p className="mt-1 min-w-[520px] text-center text-caption font-semibold text-ink-mid">{xAxisLabel}</p>
      <DataTable
        title={title}
        headers={["Dönem", "Değer"]}
        rows={points.map((point) => [point.label, point.value === null ? "Veri yok" : valueLabel(point.value)])}
      />
    </div>
  );
}

export function StatisticsDonutChart({
  title,
  rows,
  valueLabel = (value) => String(value),
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  valueLabel?: (value: number) => string;
}) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const segments = useMemo<DonutChartSegment[]>(
    () => rows.map((row, index) => ({ ...row, color: DONUT_COLORS[index % DONUT_COLORS.length] })),
    [rows],
  );
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  /* An all-zero distribution is not a donut with nothing in it — every arc
     would be a zero-length stroke around an empty ring, which reads as a
     rendering failure. It is the same "no data" the old bars showed. */
  if (!rows.length || total === 0) {
    return <p className="py-8 text-small text-ink-mid">Bu dönem için veri bulunmuyor.</p>;
  }

  const active = segments.find((segment) => segment.label === activeLabel) ?? null;
  const centerValue = active ? active.value : total;
  const centerLabel = active ? active.label : "Toplam";
  const centerPercent = active ? (active.value / total) * 100 : null;

  return (
    <div className="min-w-0">
      <div
        role="img"
        aria-label={`${title} grafiği`}
        className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8"
      >
        <DonutChart
          data={segments}
          size={188}
          strokeWidth={26}
          animationDuration={1}
          activeLabel={activeLabel}
          onSegmentHover={(segment) => setActiveLabel(segment?.label ?? null)}
          className="shrink-0"
          centerContent={
            <div className="flex flex-col items-center justify-center text-center">
              <p className="max-w-[104px] truncate text-caption text-ink-mid">{centerLabel}</p>
              <p className="text-h3 font-bold tabular-nums">{valueLabel(centerValue)}</p>
              {centerPercent !== null && (
                <p className="text-caption font-medium text-ink-mid tabular-nums">
                  %{percentLabel.format(centerPercent)}
                </p>
              )}
            </div>
          }
        />

        <ul className="w-full min-w-0 space-y-1">
          {segments.map((segment) => (
            <li key={segment.label}>
              <button
                type="button"
                onMouseEnter={() => setActiveLabel(segment.label)}
                onMouseLeave={() => setActiveLabel(null)}
                onFocus={() => setActiveLabel(segment.label)}
                onBlur={() => setActiveLabel(null)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-input px-2 py-1.5 text-left text-small transition-colors",
                  activeLabel === segment.label ? "bg-paper" : "bg-transparent",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="min-w-0 truncate" title={segment.label}>{segment.label}</span>
                </span>
                <strong className="shrink-0 tabular-nums">{valueLabel(segment.value)}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <DataTable
        title={title}
        headers={["Başlık", "Değer"]}
        rows={rows.map((row) => [row.label, valueLabel(row.value)])}
      />
    </div>
  );
}

export function ChartCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="min-w-0 rounded-card border border-line bg-surface p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-h3-m font-semibold sm:text-h3">{title}</h2>{description && <p className="mt-1 text-small text-ink-mid">{description}</p>}</div>{action}</div>
    {children}
  </section>;
}

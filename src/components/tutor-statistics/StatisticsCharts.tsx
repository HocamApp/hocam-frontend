import type { ReactNode } from "react";

type ChartPoint = { label: string; value: number | null };

function chartDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export function LineChart({
  title,
  points,
  valueLabel,
  xAxisLabel,
  yAxisLabel,
  axisValueLabel = (value) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(value),
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
  if (!available.length) return <p className="py-10 text-center text-small text-ink-mid">Bu dönem için grafik verisi bulunmuyor.</p>;
  const max = Math.max(1, maxValue ?? 0, ...available.map(point => point.value));
  const width = 760, height = 260, left = 88, right = 18, top = 16, bottom = 58;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const plotBottom = height - bottom;
  const x = (index: number) => left + (index / Math.max(1, points.length - 1)) * plotWidth;
  const y = (value: number) => top + (1 - value / max) * plotHeight;
  const yTicks = Array.from({ length: 5 }, (_, index) => max * index / 4);
  const xStep = Math.max(1, Math.ceil(Math.max(1, points.length - 1) / 4));
  const xTickIndexes = points.map((_, index) => index).filter(index => index % xStep === 0 || index === points.length - 1);
  const segments: string[] = [];
  let open = false;
  points.forEach((point, index) => {
    if (point.value === null) { open = false; return; }
    segments.push(`${open ? "L" : "M"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`);
    open = true;
  });
  return <div className="overflow-x-auto pb-1">
    <svg role="img" aria-label={`${title} grafiği`} viewBox={`0 0 ${width} ${height}`} className="h-[260px] min-w-[680px] w-full">
      <text x="16" y={top + plotHeight / 2} transform={`rotate(-90 16 ${top + plotHeight / 2})`} textAnchor="middle" fill="var(--ink-mid)" fontSize="11" fontWeight="600">{yAxisLabel}</text>
      {yTicks.map((tick) => <g key={tick}>
        <line x1={left} y1={y(tick)} x2={width-right} y2={y(tick)} stroke="var(--line)" strokeDasharray={tick === 0 ? undefined : "3 4"} />
        <text x={left-9} y={y(tick)+4} textAnchor="end" fill="var(--ink-mid)" fontSize="10">{axisValueLabel(tick)}</text>
      </g>)}
      {xTickIndexes.map(index => <text key={points[index].label} x={x(index)} y={plotBottom+18} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"} fill="var(--ink-mid)" fontSize="10">{chartDate(points[index].label)}</text>)}
      <text x={left + plotWidth / 2} y={height-5} textAnchor="middle" fill="var(--ink-mid)" fontSize="11" fontWeight="600">{xAxisLabel}</text>
      <path d={segments.join(" ")} fill="none" stroke="var(--pink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => point.value === null ? null : <g key={`${point.label}-${index}`}>
        <circle cx={x(index)} cy={y(point.value)} r="4" fill="var(--surface)" stroke="var(--pink)" strokeWidth="3" tabIndex={0} aria-label={`${chartDate(point.label)}: ${valueLabel(point.value)}`}><title>{`${chartDate(point.label)}: ${valueLabel(point.value)}`}</title></circle>
      </g>)}
    </svg>
    <table aria-label={`${title} verileri`} className="sr-only"><thead><tr><th>Dönem</th><th>Değer</th></tr></thead><tbody>{points.map(point => <tr key={point.label}><td>{point.label}</td><td>{point.value === null ? "Veri yok" : valueLabel(point.value)}</td></tr>)}</tbody></table>
  </div>;
}

export function HorizontalBars({ title, rows, valueLabel = value => String(value) }: { title: string; rows: Array<{ label: string; value: number }>; valueLabel?: (value: number) => string }) {
  if (!rows.length) return <p className="py-8 text-small text-ink-mid">Bu dönem için veri bulunmuyor.</p>;
  const max = Math.max(1, ...rows.map(row => row.value));
  return <><div className="space-y-4" role="img" aria-label={`${title} grafiği`}>
    {rows.map(row => <div key={row.label} className="grid grid-cols-[minmax(7rem,1fr)_minmax(8rem,2fr)_auto] items-center gap-3 text-small">
      <span className="min-w-0 truncate" title={row.label}>{row.label}</span>
      <span className="h-2 overflow-hidden rounded-pill bg-paper"><span className="block h-full rounded-pill bg-pink" style={{ width: `${Math.max(3, row.value / max * 100)}%` }} /></span>
      <strong className="tabular-nums">{valueLabel(row.value)}</strong>
    </div>)}
  </div><table aria-label={`${title} verileri`} className="sr-only"><thead><tr><th>Başlık</th><th>Değer</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><td>{row.label}</td><td>{valueLabel(row.value)}</td></tr>)}</tbody></table></>;
}

export function ChartCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="min-w-0 rounded-card border border-line bg-surface p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-h3-m font-semibold sm:text-h3">{title}</h2>{description && <p className="mt-1 text-small text-ink-mid">{description}</p>}</div>{action}</div>
    {children}
  </section>;
}

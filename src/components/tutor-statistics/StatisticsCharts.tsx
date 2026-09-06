import type { ReactNode } from "react";

type ChartPoint = { label: string; value: number | null };

function chartDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export function LineChart({ title, points, valueLabel }: { title: string; points: ChartPoint[]; valueLabel: (value: number) => string }) {
  const available = points.filter((point): point is { label: string; value: number } => point.value !== null);
  if (!available.length) return <p className="py-10 text-center text-small text-ink-mid">Bu dönem için grafik verisi bulunmuyor.</p>;
  const max = Math.max(1, ...available.map(point => point.value));
  const width = 720, height = 220, left = 20, top = 16, bottom = 28;
  const x = (index: number) => left + (index / Math.max(1, points.length - 1)) * (width - left * 2);
  const y = (value: number) => top + (1 - value / max) * (height - top - bottom);
  const segments: string[] = [];
  let open = false;
  points.forEach((point, index) => {
    if (point.value === null) { open = false; return; }
    segments.push(`${open ? "L" : "M"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`);
    open = true;
  });
  return <div className="overflow-x-auto pb-1">
    <svg role="img" aria-label={`${title} grafiği`} viewBox={`0 0 ${width} ${height}`} className="h-[220px] min-w-[620px] w-full">
      <line x1={left} y1={height-bottom} x2={width-left} y2={height-bottom} stroke="var(--line)" />
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

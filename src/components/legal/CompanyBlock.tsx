import { companyRows } from "@/lib/companyInfo";

/**
 * The aracı hizmet sağlayıcı's registered details, one row per known field.
 * Renders nothing at all while none is known, and never a row or a placeholder
 * for one that is not (src/lib/companyInfo.ts).
 */
export function CompanyBlock() {
  const rows = companyRows();
  if (rows.length === 0) return null;
  return (
    <dl className="max-w-[60ch] divide-y divide-line rounded-input border border-line text-body">
      {rows.map((row) => (
        <div key={row.field} className="grid gap-1 px-4 py-2 sm:grid-cols-[12rem_1fr]">
          <dt className="font-medium text-ink">{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

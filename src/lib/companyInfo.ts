/**
 * Who the contract names. The one place these facts live.
 *
 * Mesafeli Sözleşmeler Yönetmeliği m.5(1)(b)-(ç) wants the name or title and
 * the MERSİS or tax number of the seller or provider AND of the intermediary
 * service provider, a way to reach them quickly, and any separate address for
 * complaints. HOCAM is the intermediary; the provider of each lesson is the
 * tutor named on the order screen (see /on-bilgilendirme-formu, section 2).
 *
 * `null` means the owners have not supplied the value yet. A missing field is
 * not printed at all: no row, no label and no placeholder text appears on the
 * page (`companyRows()` returns only what is known). `companyInfoMissing()`
 * lists what is left, companyInfo.test.ts keeps that list honest, and the
 * real-money launch must not open while it is not empty (plan, G2 gate). Fill
 * the values in here and nowhere else: no page types an address or a number of
 * its own.
 */

export interface CompanyInfo {
  /** Full legal title, as it appears in the trade registry. */
  legalName: string | null;
  /** MERSİS number (16 digits). */
  mersisNo: string | null;
  /** Tax office and tax number, written "Vergi dairesi, numara". */
  taxId: string | null;
  /** Registered address that can be served. */
  address: string | null;
  /** Registered electronic mail address (KEP). */
  kepAddress: string | null;
  /** Where a customer reaches support by e-mail. */
  supportEmail: string | null;
}

export const COMPANY: CompanyInfo = {
  legalName: null,
  mersisNo: null,
  taxId: null,
  address: null,
  kepAddress: null,
  supportEmail: null,
};

export const COMPANY_FIELD_LABELS: Record<keyof CompanyInfo, string> = {
  legalName: "Unvan",
  mersisNo: "MERSİS numarası",
  taxId: "Vergi dairesi ve numarası",
  address: "Adres",
  kepAddress: "KEP adresi",
  supportEmail: "Destek e-posta adresi",
};

/** The rows to print, in the contract's order: only fields that have a value. */
export function companyRows(): { field: keyof CompanyInfo; label: string; value: string }[] {
  return (Object.keys(COMPANY) as (keyof CompanyInfo)[]).flatMap((field) => {
    const value = COMPANY[field];
    return value ? [{ field, label: COMPANY_FIELD_LABELS[field], value }] : [];
  });
}

/** Fields still waiting for the owners, in the order the contract lists them. */
export function companyInfoMissing(): (keyof CompanyInfo)[] {
  return (Object.keys(COMPANY) as (keyof CompanyInfo)[]).filter((key) => COMPANY[key] === null);
}

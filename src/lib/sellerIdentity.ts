/**
 * The seller's legal identity — the single place it is defined.
 *
 * Turkish distance-selling rules (6502 sayılı Kanun and the Mesafeli
 * Sözleşmeler Yönetmeliği) require the seller to be identifiable before a
 * contract is concluded: legal name, tebligata elverişli address, telephone
 * and e-mail. The same identity is what the KVKK aydınlatma metni owes as the
 * "veri sorumlusu". One object, so those two can never disagree.
 *
 * HOCAM operates as a şahıs şirketi, so the seller is a natural person and
 * `legalName` is that person's own name, not a ticaret unvanı.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TO PUBLISH: fill every field below, flip IDENTITY_PUBLISHED to true, and
 * bump the version constants on the four legal pages. Nothing else needs to
 * change — every page reads from here.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * While IDENTITY_PUBLISHED is false the pages say plainly that the details
 * are not yet published, rather than rendering an empty line or an invented
 * address. A placeholder that looks like a real address is worse than an
 * honest gap: a made-up phone number is somebody's real line.
 */

export const IDENTITY_PUBLISHED = false;

export interface SellerIdentity {
  /** Ad soyad (şahıs şirketinde ticaret unvanı yerine geçer). */
  legalName: string;
  /** Tebligata elverişli açık adres. */
  address: string;
  /** Bağlı olunan vergi dairesi. */
  taxOffice: string;
  /** Vergi kimlik numarası veya T.C. kimlik numarası. */
  taxNumber: string;
  /** Yayımlanabilir telefon numarası. */
  phone: string;
  /** Sözleşme ve sipariş yazışmaları için e-posta. */
  email: string;
  /** MERSİS numarası — şahıs şirketlerinde bulunmayabilir, boş bırakılabilir. */
  mersis: string;
}

export const SELLER: SellerIdentity = {
  legalName: "",
  address: "",
  taxOffice: "",
  taxNumber: "",
  phone: "",
  email: "",
  mersis: "",
};

/** The KVKK application address, published independently of the fields above. */
export const KVKK_CONTACT_EMAIL = "kvkk@hocamozelders.com";

/** Platform name as it should appear inside contract prose. */
export const PLATFORM_NAME = "HOCAM";
export const PLATFORM_DOMAIN = "hocamozelders.com";

/** Truthful launch state: no card processor or automatic bank refund is live. */
export const PAYMENTS_LIVE = false;

/** Rows for the identity table, in the order the Yönetmelik lists them. */
export function sellerIdentityRows(): { label: string; value: string }[] {
  const rows = [
    { label: "Satıcı", value: SELLER.legalName },
    { label: "Adres", value: SELLER.address },
    { label: "Vergi dairesi", value: SELLER.taxOffice },
    { label: "Vergi / T.C. kimlik no", value: SELLER.taxNumber },
    { label: "Telefon", value: SELLER.phone },
    { label: "E-posta", value: SELLER.email },
    { label: "MERSİS no", value: SELLER.mersis },
  ];
  // An empty optional field is omitted rather than rendered blank.
  return rows.filter((row) => row.value.trim().length > 0);
}

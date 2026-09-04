import type { Metadata } from "next";

/**
 * The single registry of published legal documents.
 *
 * Two consumers read this list and nothing else: the sidebar rendered by
 * `src/app/(main)/(legal)/layout.tsx` and `src/app/sitemap.ts`. Adding a
 * document here is the whole change needed to make it appear in both.
 *
 * `/kvkk` itself is no longer a page. next.config.js redirects it onto the
 * first document, because an index whose only content was this same list
 * meant reading the menu twice.
 *
 * `/kvkk/veli-onayi` is deliberately NOT a member of this union. It is a
 * token-gated confirmation flow reached from an email link, not a document
 * anyone browses to, and a sidebar or sitemap entry pointing at it lands the
 * reader on an error state. Keeping it out of the type makes that an
 * impossible mistake rather than a documented one.
 */
export type LegalDocumentSlug =
  | "aydinlatma-metni"
  | "hoca-aydinlatma-metni"
  | "hoca-dogrulama"
  | "cerez-politikasi"
  | "analitik"
  | "ogrenci-gelisim-kayitlari"
  | "saklama-ve-imha-politikasi"
  | "iptal-ve-iade"
  | "kullanim-kosullari"
  | "mesafeli-satis-sozlesmesi";

export interface LegalDocument {
  slug: LegalDocumentSlug;
  href: string;
  /** Page `<h1>` and the hub card title. */
  title: string;
  /**
   * Sidebar label. Falls back to `title` — it exists so
   * "Hoca Doğrulama Aydınlatma Metni" does not wrap to three lines in a
   * 256px rail.
   */
  navLabel?: string;
  /** Hub card body and `<meta name="description">`. */
  description: string;
  /** `<title>` when it differs from the on-page `<h1>`. */
  metaTitle?: string;
  version?: string;
  /** Rendered date, Turkish. */
  updatedAt?: string;
  /** Machine date for `<time dateTime>` and the sitemap's lastModified. */
  updatedAtIso?: string;
}

/** Array order is the sidebar order and the hub order. One list, one sequence. */
export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    slug: "aydinlatma-metni",
    href: "/kvkk/aydinlatma-metni",
    title: "Kişisel Verilerin Korunması Hakkında Aydınlatma Metni",
    navLabel: "Aydınlatma Metni",
    metaTitle: "Aydınlatma Metni",
    description:
      "Hangi verilerini, neden işlediğimizi, kimlerle paylaştığımızı ve haklarını anlatır.",
    version: "v1.1",
    updatedAt: "23 Ağustos 2026",
    updatedAtIso: "2026-08-23",
  },
  {
    slug: "hoca-aydinlatma-metni",
    href: "/kvkk/hoca-aydinlatma-metni",
    title: "Hoca Aydınlatma Metni",
    navLabel: "Hoca Aydınlatma Metni",
    description:
      "Ders veren üniversite öğrencisi hocaların hangi verilerinin, neden işlendiğini anlatır.",
    version: "v1.0",
    updatedAt: "4 Eylül 2026",
    updatedAtIso: "2026-09-04",
  },
  {
    slug: "hoca-dogrulama",
    href: "/kvkk/hoca-dogrulama",
    title: "Hoca Doğrulama Süreci Aydınlatma Metni",
    navLabel: "Hoca Doğrulama",
    metaTitle: "Hoca Doğrulama Aydınlatma Metni",
    description:
      "Üniversite e-postası, öğrenci belgesi ve YKS belgesinin nasıl incelendiğini ve ne kadar saklandığını anlatır.",
    version: "v1.0",
    updatedAt: "23 Ağustos 2026",
    updatedAtIso: "2026-08-23",
  },
  {
    slug: "cerez-politikasi",
    href: "/kvkk/cerez-politikasi",
    title: "Çerez Politikası",
    navLabel: "Çerez Politikası",
    description:
      "Hangi çerezleri kullandığımızı ve tercihini nasıl değiştirebileceğini anlatır.",
    version: "v1.1",
    updatedAt: "26 Ağustos 2026",
    updatedAtIso: "2026-08-26",
  },
  {
    slug: "analitik",
    href: "/kvkk/analitik",
    title: "Analitik Aydınlatma Metni",
    navLabel: "Analitik",
    description:
      "Hoca bulma deneyimini ölçmek için tutulan keşif kayıtlarını anlatır.",
  },
  {
    slug: "ogrenci-gelisim-kayitlari",
    href: "/kvkk/ogrenci-gelisim-kayitlari",
    title: "Öğrenci Gelişim Kayıtları Aydınlatma Metni",
    navLabel: "Öğrenci Gelişim Kayıtları",
    description: "Derslerde tutulan öğrenme takibi kayıtlarını anlatır.",
  },
  {
    slug: "saklama-ve-imha-politikasi",
    href: "/kvkk/saklama-ve-imha-politikasi",
    title: "Kişisel Veri Saklama ve İmha Politikası",
    navLabel: "Saklama ve İmha Politikası",
    description:
      "Hangi verinin ne kadar saklandığını, süre dolunca nasıl imha edildiğini anlatır.",
    version: "v1.1",
    updatedAt: "4 Eylül 2026",
    updatedAtIso: "2026-09-04",
  },
  {
    slug: "kullanim-kosullari",
    href: "/kullanim-kosullari",
    title: "Kullanım Koşulları",
    navLabel: "Kullanım Koşulları",
    description:
      "Hesap açma, ders süreci, yasak kullanımlar ve sözleşmenin feshi dahil platform kuralları.",
    updatedAt: "4 Eylül 2026",
    updatedAtIso: "2026-09-04",
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    href: "/mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    navLabel: "Mesafeli Satış Sözleşmesi",
    description:
      "Ders paketi alımında satıcı bilgileri, bedel, ifa ve cayma hakkına ilişkin koşullar.",
    updatedAt: "4 Eylül 2026",
    updatedAtIso: "2026-09-04",
  },
  {
    slug: "iptal-ve-iade",
    href: "/iptal-ve-iade",
    title: "İptal ve İade Koşulları",
    navLabel: "İptal ve İade Koşulları",
    description:
      "Ders iptali, derse katılmama, paket süresi ve paket iadesi hakkındaki koşullar.",
    updatedAt: "3 Eylül 2026",
    updatedAtIso: "2026-09-03",
  },
];

const BY_SLUG = new Map(LEGAL_DOCUMENTS.map((doc) => [doc.slug, doc]));

export function getLegalDocument(slug: LegalDocumentSlug): LegalDocument {
  const doc = BY_SLUG.get(slug);
  if (!doc) throw new Error(`Unknown legal document slug: ${slug}`);
  return doc;
}

/** Sidebar label for a document, with the fallback applied. */
export function legalNavLabel(doc: LegalDocument) {
  return doc.navLabel ?? doc.title;
}

export function legalPageMetadata(slug: LegalDocumentSlug): Metadata {
  const doc = getLegalDocument(slug);
  return {
    title: doc.metaTitle ?? doc.title,
    description: doc.description,
    alternates: { canonical: doc.href },
  };
}

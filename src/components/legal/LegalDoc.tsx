/**
 * Shared shell for the commerce legal documents.
 *
 * Mirrors the layout the KVKK pages already established (versioned header,
 * numbered sections, cross-links at the foot) so the two sets read as one
 * body of text rather than two. The KVKK pages keep their own local Section
 * helper; this exists because four commerce documents would otherwise repeat
 * the same scaffolding four times.
 */

import Link from "next/link";

import {
  IDENTITY_PUBLISHED,
  KVKK_CONTACT_EMAIL,
  sellerIdentityRows,
} from "@/lib/sellerIdentity";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-7">{children}</div>
    </section>
  );
}

/**
 * The seller block every commerce document has to carry.
 *
 * When the identity is not yet published this states that plainly instead of
 * rendering an empty table. Saying "not yet published" is accurate; an empty
 * row implies the information is missing by accident.
 */
export function SellerIdentityBlock() {
  if (!IDENTITY_PUBLISHED) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm leading-6">
        <p>
          Satıcının tam yasal kimliği ve tebligata elverişli adresi, işletme
          kuruluş işlemleri tamamlandığında bu bölümde yayımlanacaktır. Bu
          bilgiler yayımlanana kadar sipariş ve sözleşmeye ilişkin her türlü
          talebini{" "}
          <a href={`mailto:${KVKK_CONTACT_EMAIL}`} className="text-primary underline">
            {KVKK_CONTACT_EMAIL}
          </a>{" "}
          adresine iletebilirsin.
        </p>
      </div>
    );
  }

  return (
    <dl className="divide-y rounded-lg border text-sm">
      {sellerIdentityRows().map((row) => (
        <div key={row.label} className="grid gap-1 p-3 sm:grid-cols-[12rem_1fr]">
          <dt className="font-medium text-muted-foreground">{row.label}</dt>
          <dd className="leading-6">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const RELATED = [
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/on-bilgilendirme-formu", label: "Ön Bilgilendirme Formu" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/iptal-ve-iade", label: "İptal ve İade Koşulları" },
  { href: "/kvkk/aydinlatma-metni", label: "KVKK Aydınlatma Metni" },
];

export function LegalDoc({
  title,
  version,
  updatedAt,
  intro,
  currentHref,
  children,
}: {
  title: string;
  version: string;
  updatedAt: string;
  intro?: React.ReactNode;
  /** Omitted from the cross-links so a page never links to itself. */
  currentHref: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sürüm {version} · {updatedAt}
      </p>

      {intro ? (
        <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm leading-6">
          {intro}
        </div>
      ) : null}

      <div className="mt-10 space-y-10">{children}</div>

      <div className="mt-12 flex flex-wrap gap-4 text-sm">
        {RELATED.filter((item) => item.href !== currentHref).map((item) => (
          <Link key={item.href} href={item.href} className="text-primary underline">
            {item.label}
          </Link>
        ))}
        <Link href="/" className="text-primary underline">
          Hocam’a dön
        </Link>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstagramLogo, LinkedinLogo, type Icon } from "@phosphor-icons/react";

import { HOME_V2_ENABLED } from "@/lib/featureFlags";
import { getLegalDocument } from "@/lib/legalDocuments";
import { tutorListHref } from "@/lib/tutorDirectoryLinks";

import { FAQ_SECTION_ID } from "./ysAppNav";
import { footer as copy } from "./ysHomeCopy";
import { YsFact } from "./YsFact";
import { COMPANY_ADDRESS, COMPANY_LEGAL_NAME, COMPANY_MERSIS, isTodo } from "./ysHomeFacts";

import { BrandMark } from "@/components/brand/BrandMark";
import { AppStoreBadge, GooglePlayBadge } from "@/components/ui/store-badges";

/**
 * The homepage footer.
 *
 * Two rules shape what is in here:
 *
 * 1. **An entry is only a link if the destination exists and an anonymous
 *    visitor can reach it.** Every legal text listed here now has a page, so
 *    nothing in this footer is inert copy any more.
 *    `/support` exists but is auth-gated, so linking it here would bounce an
 *    anonymous reader to `/login` — it is deliberately absent.
 * 3. **The legal column is a shortlist, not the index.** Every published legal
 *    text is reachable from the sidebar on `/kvkk`; the five here are the
 *    ones a reader looks for by name. Slugs are listed explicitly rather than
 *    mapped over `LEGAL_DOCUMENTS` so the column cannot silently grow when a
 *    new document is registered.
 * 2. **Nothing here claims a channel Hocam does not own.** An account appears
 *    in `SOCIAL_LINKS` only once it exists, so `href` is required. X and
 *    YouTube icons used to sit here unlinked; they looked identical to the
 *    live ones and swallowed the click, so they were removed rather than
 *    dimmed.
 */

type FooterEntry = { label: string; href?: string };

type FooterColumn = { heading: string; entries: FooterEntry[] };

/** Label and href straight from the registry, so titles cannot drift. */
function legalEntry(slug: Parameters<typeof getLegalDocument>[0]): FooterEntry {
  const doc = getLegalDocument(slug);
  return { label: doc.navLabel ?? doc.title, href: doc.href };
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Hocam'ı keşfet",
    entries: [
      { label: "Hoca Listesi", href: tutorListHref() },
      { label: "YKS özel ders", href: tutorListHref({ exam_type: "YKS" }) },
      { label: "TYT Matematik özel ders", href: tutorListHref({ exam_type: "TYT", subject: "Matematik" }) },
      { label: "AYT Matematik özel ders", href: tutorListHref({ exam_type: "AYT", subject: "Matematik" }) },
      { label: "Ücretsiz deneme dersi", href: "/ucretsiz-deneme-dersi" },
    ],
  },
  {
    heading: "Nasıl çalışır?",
    entries: [
      { label: "Ders süreci", href: "/nasil-calisir" },
      { label: "Hoca doğrulama", href: "/hocalar-nasil-dogrulaniyor" },
      { label: "Sıkça sorulan sorular", href: `/#${FAQ_SECTION_ID}` },
    ],
  },
  {
    heading: "Hocam",
    entries: [
      { label: "Hakkımızda", href: "/hakkimizda-v2" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Hoca ol", href: "/register?role=tutor" },
    ],
  },
  {
    heading: "Yasal Metinler",
    entries: [
      // /kvkk redirects onto the aydınlatma metni, so a separate entry for
      // that document would be a second link to the same page.
      { label: "KVKK ve Gizlilik", href: "/kvkk" },
      legalEntry("kullanim-kosullari"),
      legalEntry("mesafeli-satis-sozlesmesi"),
      legalEntry("cerez-politikasi"),
      legalEntry("iptal-ve-iade"),
    ],
  },
];

const LEGAL_ENTRIES: FooterEntry[] = [
  { label: "KVKK başvuru: iletisim@hocamozelders.com", href: "mailto:iletisim@hocamozelders.com" },
];

const SOCIAL_LINKS: { id: string; label: string; Icon: Icon; href: string }[] = [
  // The Instagram share link carried an `igsi` tracking parameter; the bare
  // profile URL is the same destination without it.
  { id: "instagram", label: "Instagram", Icon: InstagramLogo, href: "https://www.instagram.com/hocam.co" },
  { id: "linkedin", label: "LinkedIn", Icon: LinkedinLogo, href: "https://www.linkedin.com/company/hocamozelders/" },
];

function FooterLink({ entry }: { entry: FooterEntry }) {
  if (!entry.href) {
    return <span className="ys-footer-text">{entry.label}</span>;
  }

  if (entry.href.startsWith("mailto:")) {
    return (
      <a href={entry.href} className="ys-footer-link">
        {entry.label}
      </a>
    );
  }

  return (
    <Link href={entry.href} className="ys-footer-link">
      {entry.label}
    </Link>
  );
}

/* The rebuilt homepage's footer (NEXT_PUBLIC_HOME_V2). Five columns, no
   store badges, and the company line under the bottom row. */
const V2_FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: copy.columns.discover,
    entries: [
      { label: copy.links.tutorList, href: tutorListHref() },
      { label: copy.links.yks, href: tutorListHref({ exam_type: "YKS" }) },
      { label: copy.links.tytMath, href: tutorListHref({ exam_type: "TYT", subject: "Matematik" }) },
      { label: copy.links.aytMath, href: tutorListHref({ exam_type: "AYT", subject: "Matematik" }) },
      { label: copy.links.trial, href: "/ucretsiz-deneme-dersi" },
    ],
  },
  {
    heading: copy.columns.how,
    entries: [
      { label: copy.links.process, href: "/nasil-calisir" },
      { label: copy.links.pricing, href: "/#fiyatlar" },
      { label: copy.links.verification, href: "/hocalar-nasil-dogrulaniyor" },
      { label: copy.links.faq, href: `/#${FAQ_SECTION_ID}` },
    ],
  },
  {
    heading: copy.columns.who,
    entries: [
      { label: copy.links.students, href: "/#ogrenciler" },
      { label: copy.links.parents, href: "/veliler" },
      { label: copy.links.becomeTutor, href: "/hoca-ol" },
    ],
  },
  {
    heading: copy.columns.hocam,
    entries: [
      // Still the noindex preview: swapping it for /hakkimizda is a separate decision.
      { label: copy.links.about, href: "/hakkimizda-v2" },
      { label: copy.links.contact, href: "/iletisim" },
      { label: copy.links.mobileSoon },
    ],
  },
  {
    heading: copy.columns.legal,
    entries: [
      { label: copy.links.kvkk, href: "/kvkk" },
      legalEntry("kullanim-kosullari"),
      legalEntry("mesafeli-satis-sozlesmesi"),
      legalEntry("cerez-politikasi"),
      legalEntry("iptal-ve-iade"),
    ],
  },
];

/**
 * "Unvan · Adres · MERSİS no · KVKK başvuru". While the company facts are
 * TODO they show as placeholders in development and are left out in
 * production, so the KVKK contact is never lost with them.
 */
function CompanyLine() {
  const production = process.env.NODE_ENV === "production";
  const parts = [
    { value: COMPANY_LEGAL_NAME, node: <YsFact value={COMPANY_LEGAL_NAME} label="Şirket unvanı" /> },
    { value: COMPANY_ADDRESS, node: <YsFact value={COMPANY_ADDRESS} label="Adres" /> },
    {
      value: COMPANY_MERSIS,
      node: (
        <>
          {copy.mersis} <YsFact value={COMPANY_MERSIS} label="No" />
        </>
      ),
    },
  ].filter((part) => !production || !isTodo(part.value));

  return (
    <p className="mt-4 text-[13px] leading-[21px] text-ink-mid">
      {parts.map((part, index) => (
        <span key={index}>
          {part.node}
          {" · "}
        </span>
      ))}
      <a href="mailto:iletisim@hocamozelders.com" className="hover:text-ink">
        {copy.kvkkContact}
      </a>
    </p>
  );
}

function YsFooterV2() {
  return (
    <footer className="mt-16 border-t border-line bg-paper text-ink md:mt-24">
      <div className="ys-shell py-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-5">
          {V2_FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-3 text-sm font-bold text-ink">{column.heading}</h4>
              <ul className="space-y-2">
                {column.entries.map((entry) => (
                  <li key={entry.label}>
                    <FooterLink entry={entry} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" />
              <span
                className="h-6 w-px"
                style={{ background: "var(--ys-neutral-divider)" }}
                aria-hidden
              />
              <span className="ys-footer-text">{copy.copyright(new Date().getFullYear())}</span>
            </div>
            <div className="flex shrink-0 gap-2">
              {SOCIAL_LINKS.map(({ id, label, Icon, href }) => (
                <a
                  key={id}
                  href={href}
                  className="ys-icon-btn"
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
          <CompanyLine />
        </div>
      </div>
    </footer>
  );
}

export function YsFooter({ v2 = HOME_V2_ENABLED }: { v2?: boolean } = {}) {
  const pathname = usePathname();
  const isMessagesRoute =
    pathname === "/messages" || pathname.startsWith("/messages/");

  if (isMessagesRoute) return null;
  if (v2) return <YsFooterV2 />;

  return (
    <footer className="mt-16 border-t border-line bg-paper text-ink md:mt-24">
      <div className="ys-shell py-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-3 text-sm font-bold text-ink">{column.heading}</h4>
              <ul className="space-y-2">
                {column.entries.map((entry) => (
                  <li key={entry.label}>
                    <FooterLink entry={entry} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className="mb-3 text-sm font-bold text-ink">Hocam mobilde</h4>
            <p className="ys-footer-text mb-3 block">Mobil uygulama yakında.</p>
            {/* Deliberately inert: there is no Hocam app yet. Both badges
                become real anchors the moment they are handed an href. */}
            <div className="flex flex-wrap gap-2">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-line pt-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <BrandMark size="sm" />
              <span
                className="h-6 w-px"
                style={{ background: "var(--ys-neutral-divider)" }}
                aria-hidden
              />
              <span className="ys-footer-text">
                © {new Date().getFullYear()} Hocam. Tüm hakları saklıdır.
              </span>
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {LEGAL_ENTRIES.map((entry) => (
                <li key={entry.label}>
                  <FooterLink entry={entry} />
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 gap-2">
            {SOCIAL_LINKS.map(({ id, label, Icon, href }) => (
              <a
                key={id}
                href={href}
                className="ys-icon-btn"
                aria-label={label}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

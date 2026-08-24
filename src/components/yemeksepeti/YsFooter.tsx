import Link from "next/link";
import {
  Apple,
  Instagram,
  Linkedin,
  Play,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";

/**
 * The homepage footer.
 *
 * Two rules shape what is in here:
 *
 * 1. **An entry is only a link if the destination exists and an anonymous
 *    visitor can reach it.** Headings the product will eventually need but does
 *    not have yet (Blog, Kariyer, İletişim, Kullanım Koşulları, Mesafeli Satış,
 *    İptal ve İade) render as plain text rather than links to nowhere.
 *    `/support` exists but is auth-gated, so linking it here would bounce an
 *    anonymous reader to `/login` — it is deliberately absent.
 * 2. **Nothing here claims a channel Hocam does not own.** There are no real
 *    social accounts yet, so the icons are decoration: no href, not focusable,
 *    hidden from assistive tech. Give a `SOCIAL_LINKS` entry an `href` and it
 *    becomes a real anchor and the group stops being `aria-hidden` — that is
 *    the whole change needed when the accounts exist.
 */

type FooterEntry = { label: string; href?: string };

type FooterColumn = { heading: string; entries: FooterEntry[] };

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Hocam'ı keşfet",
    entries: [
      { label: "Hoca dizini", href: "/tutors" },
      { label: "YKS özel ders", href: "/yks-ozel-ders" },
      { label: "TYT Matematik özel ders", href: "/yks/tyt/matematik-ozel-ders" },
      { label: "AYT Matematik özel ders", href: "/yks/ayt/matematik-ozel-ders" },
      { label: "Ücretsiz deneme dersi", href: "/register" },
    ],
  },
  {
    heading: "Nasıl çalışır?",
    entries: [
      { label: "Ders süreci", href: "/nasil-calisir" },
      { label: "Hoca doğrulama", href: "/hocalar-nasil-dogrulaniyor" },
      { label: "Online özel ders ücretleri", href: "/rehber/online-ozel-ders-ucretleri" },
      { label: "Sıkça sorulan sorular", href: "#sikca-sorulan-sorular" },
    ],
  },
  {
    heading: "Hocam",
    entries: [
      { label: "Hakkımızda", href: "/hakkimizda-v2" },
      { label: "Başarı hikayeleri", href: "/basari-hikayeleri" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Hoca ol", href: "/register?role=tutor" },
      { label: "Giriş yap", href: "/login" },
      { label: "Blog" },
      { label: "Kariyer" },
    ],
  },
  {
    heading: "KVKK ve gizlilik",
    entries: [
      { label: "KVKK ve Gizlilik", href: "/kvkk" },
      { label: "Aydınlatma Metni", href: "/kvkk/aydinlatma-metni" },
      { label: "Çerez Politikası", href: "/kvkk/cerez-politikasi" },
      { label: "Analitik Aydınlatma Metni", href: "/kvkk/analitik" },
      { label: "Öğrenci Gelişim Kayıtları", href: "/kvkk/ogrenci-gelisim-kayitlari" },
      { label: "Veli Onayı", href: "/kvkk/veli-onayi" },
    ],
  },
];

const LEGAL_ENTRIES: FooterEntry[] = [
  { label: "Kullanım Koşulları" },
  { label: "Mesafeli Satış Sözleşmesi" },
  { label: "İptal ve İade Koşulları" },
  { label: "KVKK başvuru: kvkk@hocamozelders.com", href: "mailto:kvkk@hocamozelders.com" },
];

const SOCIAL_LINKS: { id: string; label: string; Icon: LucideIcon; href?: string }[] = [
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "x", label: "X", Icon: Twitter },
  { id: "youtube", label: "YouTube", Icon: Youtube },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin },
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

export function YsFooter() {
  const hasSocialLinks = SOCIAL_LINKS.some((social) => social.href);

  return (
    <footer className="mt-12 border-t" style={{ borderColor: "var(--ys-neutral-divider)" }}>
      <div className="ys-shell py-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="mb-3 text-sm font-semibold">{column.heading}</h4>
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
            <h4 className="mb-3 text-sm font-semibold">Hocam mobilde</h4>
            <p className="ys-footer-text mb-3 block">Mobil uygulama yakında.</p>
            <div className="flex flex-wrap gap-2">
              {/* Deliberately inert: there is no Hocam app yet. Same treatment
                  the checkout gives its not-yet-available plans. */}
              <button
                type="button"
                aria-disabled="true"
                aria-label="App Store — Yakında"
                className="ys-btn ys-btn--secondary ys-btn--small cursor-not-allowed"
              >
                <Apple className="h-4 w-4" />
                App Store
              </button>
              <button
                type="button"
                aria-disabled="true"
                aria-label="Google Play — Yakında"
                className="ys-btn ys-btn--secondary ys-btn--small cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                Google Play
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-10 flex flex-col gap-6 border-t pt-6 md:flex-row md:items-start md:justify-between"
          style={{ borderColor: "var(--ys-neutral-divider)" }}
        >
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

          <div className="flex shrink-0 gap-2" aria-hidden={hasSocialLinks ? undefined : true}>
            {SOCIAL_LINKS.map(({ id, label, Icon, href }) =>
              href ? (
                <a
                  key={id}
                  href={href}
                  className="ys-icon-btn"
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ) : (
                <span key={id} className="ys-icon-btn">
                  <Icon className="h-5 w-5" />
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

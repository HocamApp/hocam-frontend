import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/kullanim-kosullari", label: "Kullanım koşulları" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli satış sözleşmesi" },
  { href: "/iptal-ve-iade", label: "İptal ve iade" },
] as const;

/**
 * The three documents that must be reachable before the payment action, in
 * the order the visual contract fixes.
 *
 * Links only. There is no "I accept" checkbox, because the backend stores no
 * document version or acceptance timestamp — a tick box here would fabricate
 * an audit trail that does not exist.
 */
export function PayTRLegalNotice({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {LEGAL_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1 text-sm text-[#02171a] underline underline-offset-4 hover:text-[var(--pink-deep)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[0.8125rem] text-[#5c6b6d]">Yeni sekmede açılır.</p>
    </div>
  );
}

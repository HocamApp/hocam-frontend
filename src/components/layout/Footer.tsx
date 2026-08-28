"use client";

/*
 * NO LONGER MOUNTED.
 *
 * The application shell is `YsNavbar` + `YsFooter`, rendered by
 * `src/app/(main)/layout.tsx`. Nothing imports this file any more.
 *
 * Kept rather than deleted while the new shell settles: this is the only
 * remaining description of the pre-rebrand navigation, and `navItems.ts` —
 * which it and `MobileTabBar` share — is still the source of truth for the
 * mobile bottom bar. Delete this, `AnimatedNavbarLinks.tsx` and `Footer.tsx`
 * together, and only once the mobile bar has been moved off `navItems.ts`
 * too.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // The messaging screen is a full-height chat surface; the global footer must
  // not appear inside it. Hidden only for /messages routes — other pages keep it.
  if (pathname?.startsWith("/messages")) {
    return null;
  }

  const showPublicLinks = [
    "/tutors",
    "/yks",
    "/yks-ozel-ders",
    "/rehber",
    "/nasil-calisir",
    "/hocalar-nasil-dogrulaniyor",
    "/hakkimizda",
  ].some(
    (publicPath) =>
      pathname === publicPath || pathname?.startsWith(`${publicPath}/`)
  );

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {showPublicLinks && (
          <nav
            aria-label="Hocam hakkında ve YKS özel ders bağlantıları"
            className="mb-5 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm"
          >
            <Link href="/yks-ozel-ders" className="hover:text-primary">
              YKS Özel Ders
            </Link>
            <Link href="/nasil-calisir" className="hover:text-primary">
              Nasıl Çalışır?
            </Link>
            <Link
              href="/hocalar-nasil-dogrulaniyor"
              className="hover:text-primary"
            >
              Hoca Doğrulama
            </Link>
            <Link
              href="/rehber/online-ozel-ders-ucretleri"
              className="hover:text-primary"
            >
              Ders Ücretleri
            </Link>
            <Link href="/hakkimizda" className="hover:text-primary">
              Hakkımızda
            </Link>
          </nav>
        )}
        <nav
          aria-label="Yasal ve gizlilik bağlantıları"
          className="mb-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
        >
          <Link href="/kvkk" className="hover:text-primary">
            KVKK ve Gizlilik
          </Link>
          <Link href="/kvkk/aydinlatma-metni" className="hover:text-primary">
            Aydınlatma Metni
          </Link>
          <Link href="/kvkk/cerez-politikasi" className="hover:text-primary">
            Çerez Politikası
          </Link>
        </nav>
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Hocam. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}

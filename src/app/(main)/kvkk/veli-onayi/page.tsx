import { Suspense } from "react";

import { GuardianApprovalConfirm } from "@/components/privacy/GuardianApprovalConfirm";
import { LegalArticle } from "@/components/legal/LegalDocument";

export const metadata = {
  title: "Veli Onayı",
  // The URL carries a guardian token. It has no business in an index.
  robots: { index: false, follow: false },
};

/**
 * Deliberately a sibling of the (legal) route group rather than a member.
 * This is a token-gated confirmation flow reached from an email link, not a
 * document anyone browses to, so it gets the site shell but no document rail.
 */
export default function GuardianApprovalPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <LegalArticle>
        <h1 className="text-h2-m text-ink md:text-h2">Veli Onayı</h1>
        <p className="mt-3 max-w-[60ch] text-body leading-[1.6] text-ink-mid">
          Çocuğunuz HOCAM’da bazı özellikleri kullanabilmek için onayınızı
          istiyor. Onayınızı vermeseniz de çocuğunuz ders alabilir ve
          öğretmeniyle mesajlaşabilir.
        </p>

        <div className="mt-8">
          <Suspense
            fallback={<p className="text-small text-ink-mid">Yükleniyor…</p>}
          >
            <GuardianApprovalConfirm />
          </Suspense>
        </div>
      </LegalArticle>
    </div>
  );
}

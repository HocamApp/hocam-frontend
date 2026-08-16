import { Suspense } from "react";

import { GuardianApprovalConfirm } from "@/components/privacy/GuardianApprovalConfirm";

export const metadata = { title: "Veli Onayı" };

export default function GuardianApprovalPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Veli Onayı</h1>
      <p className="mt-3 text-muted-foreground">
        Çocuğunuz HOCAM’da bazı özellikleri kullanabilmek için onayınızı
        istiyor. Onayınızı vermeseniz de çocuğunuz ders alabilir ve
        öğretmeniyle mesajlaşabilir.
      </p>

      <div className="mt-8">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Yükleniyor…</p>}
        >
          <GuardianApprovalConfirm />
        </Suspense>
      </div>
    </main>
  );
}

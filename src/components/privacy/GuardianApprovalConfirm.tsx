"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CONSENT_COPY } from "@/lib/consentCopy";
import { verifyGuardianApproval } from "@/lib/privacyApi";

export function GuardianApprovalConfirm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<"idle" | "pending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu bağlantı geçerli görünmüyor. Lütfen e-postadaki bağlantıyı doğrudan
        açın.
      </p>
    );
  }

  if (state === "done") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="space-y-2 text-sm leading-6">
          <p className="font-semibold">Onayınız kaydedildi.</p>
          <p>
            Bu onayı istediğiniz an geri alabilirsiniz. Geri almak için
            iletisim@hocamozelders.com adresine yazmanız yeterli. Onayı geri
            aldığınızda, bu onaya bağlı tüm izinler de birlikte kalkar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold">Onayınız istenen konular</h2>
        <ul className="mt-3 space-y-3 text-sm leading-6">
          {CONSENT_COPY.filter((item) => item.purpose !== "R1_public_profile").map(
            (item) => (
              <li key={item.purpose}>
                <span className="font-medium">{item.title}</span>
                <span className="mt-1 block text-muted-foreground">
                  {item.body}
                </span>
              </li>
            ),
          )}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Çocuğunuzun hangi izinleri istediğini onay sonrası hesabınızdan
          görebilirsiniz. Ayrıntılar için{" "}
          <Link href="/kvkk/aydinlatma-metni" className="text-primary underline">
            aydınlatma metnine
          </Link>{" "}
          bakabilirsiniz.
        </p>
      </div>

      {state === "error" && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        disabled={state === "pending"}
        onClick={async () => {
          setState("pending");
          try {
            await verifyGuardianApproval(token);
            setState("done");
          } catch {
            setError(
              "Onay bağlantısı geçersiz veya süresi dolmuş. Çocuğunuzdan yeni bir bağlantı göndermesini isteyin.",
            );
            setState("error");
          }
        }}
      >
        Veli olarak onaylıyorum
      </Button>
    </div>
  );
}

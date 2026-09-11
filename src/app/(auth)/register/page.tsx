"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthSplitScreen } from "@/components/auth/AuthSplitScreen";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { safeReturnUrl } from "@/lib/utils";
import { normalizeReferralCode } from "@/lib/referralCode";

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "tutor" ? "tutor" : "student";
  const lockedRole = searchParams.get("lockRole") === "student" ? "student" : undefined;
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));
  // The invite link has always carried ?ref=; until now nothing read it.
  const referralCode = normalizeReferralCode(searchParams.get("ref"));
  const [role, setRole] = useState<"student" | "tutor">(initialRole);

  return (
    <AuthSplitScreen
      title="Hocam'a katıl"
      description={role === "tutor" ? "Hoca olarak kaydol" : "Öğrenci olarak kaydol"}
    >
      <RegisterForm
        initialRole={initialRole}
        lockedRole={lockedRole}
        returnUrl={returnUrl}
        initialReferralCode={referralCode}
        onRoleChange={setRole}
      />
    </AuthSplitScreen>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}

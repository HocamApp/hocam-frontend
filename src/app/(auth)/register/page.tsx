"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthSplitScreen } from "@/components/auth/AuthSplitScreen";
import { RegisterForm } from "@/components/auth/RegisterForm";

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "tutor" ? "tutor" : "student";
  const [role, setRole] = useState<"student" | "tutor">(initialRole);

  return (
    <AuthSplitScreen
      title="Hocam'a katıl"
      description={role === "tutor" ? "Hoca olarak kaydol" : "Öğrenci olarak kaydol"}
    >
      <RegisterForm initialRole={initialRole} onRoleChange={setRole} />
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

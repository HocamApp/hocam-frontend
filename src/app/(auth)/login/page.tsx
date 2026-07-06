"use client";

import { Suspense } from "react";
import { AuthSplitScreen } from "@/components/auth/AuthSplitScreen";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthSplitScreen
      title="Tekrar hoş geldin"
      description="Hocam'a devam etmek için giriş yap."
    >
      {/* LoginForm reads returnUrl via useSearchParams, which requires a
          Suspense boundary to build. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthSplitScreen>
  );
}

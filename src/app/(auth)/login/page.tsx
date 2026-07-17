"use client";

import { Suspense } from "react";
import { AuthSplitScreen } from "@/components/auth/AuthSplitScreen";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginBrandAnimation } from "@/components/brand/LoginBrandAnimation";

export default function LoginPage() {
  return (
    <AuthSplitScreen
      title="Tekrar hoş geldin"
      description="Hocam'a devam etmek için giriş yap."
      rightPanel={<LoginBrandAnimation />}
    >
      {/* LoginForm reads returnUrl via useSearchParams, which requires a
          Suspense boundary to build. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthSplitScreen>
  );
}

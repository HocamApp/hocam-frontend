"use client";

import { AuthSplitScreen } from "@/components/auth/AuthSplitScreen";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthSplitScreen
      title="Tekrar hoş geldin"
      description="Hocam'a devam etmek için giriş yap."
    >
      <LoginForm />
    </AuthSplitScreen>
  );
}

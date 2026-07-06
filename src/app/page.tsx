"use client";

import { Suspense, useState } from "react";
import { AuthSplitScreen } from "@/components/auth/AuthSplitScreen";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"student" | "tutor">("student");

  if (mode === "register") {
    return (
      <AuthSplitScreen
        title="Hocam'a katıl"
        description={role === "tutor" ? "Hoca olarak kaydol" : "Öğrenci olarak kaydol"}
      >
        <RegisterForm
          initialRole="student"
          onSignIn={() => setMode("login")}
          onRoleChange={setRole}
        />
      </AuthSplitScreen>
    );
  }

  return (
    <AuthSplitScreen
      title="Tekrar hoş geldin"
      description="Hocam'a devam etmek için giriş yap."
    >
      {/* LoginForm reads returnUrl via useSearchParams, which requires a
          Suspense boundary to build. */}
      <Suspense fallback={null}>
        <LoginForm onCreateAccount={() => setMode("register")} />
      </Suspense>
    </AuthSplitScreen>
  );
}

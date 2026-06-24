"use client";

import { OriginButton } from "@/components/ui/origin-button";

export default function OriginButtonPreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">OriginButton preview</p>
        <OriginButton
          className="w-full"
          onClick={() => alert("Rezervasyon modalı burada açılacak")}
        >
          Rezervasyon Yap
        </OriginButton>
      </div>
    </main>
  );
}

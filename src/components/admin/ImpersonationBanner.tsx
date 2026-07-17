"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { endAdminImpersonation } from "@/lib/adminControlApi";

export function ImpersonationBanner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [ending, setEnding] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user?.impersonation) return null;

  const handleEnd = async () => {
    setEnding(true);
    try {
      const adminUser = await endAdminImpersonation();
      queryClient.clear();
      updateUser(adminUser);
      router.push("/admin-control");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex max-w-[calc(100vw-2rem)] flex-col items-start gap-2 sm:bottom-6 sm:left-6">
      {open && (
        <div className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-amber-300 bg-background p-4 text-foreground shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Admin hesap görünümü</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "tutor" ? "Hoca" : "Öğrenci"} olarak görüntüleniyor
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Admin kontrolünü küçült"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <Button className="mt-4 w-full" onClick={handleEnd} disabled={ending}>
            {ending ? "Dönülüyor…" : "Admin paneline dön"}
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 items-center gap-2 rounded-full border border-amber-300 bg-amber-400 px-4 text-sm font-semibold text-amber-950 shadow-lg transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        aria-expanded={open}
        aria-label="Admin hesap görünümü kontrolleri"
      >
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        <span>Admin görünümü</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

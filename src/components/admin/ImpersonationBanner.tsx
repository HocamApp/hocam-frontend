"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { endAdminImpersonation } from "@/lib/adminControlApi";

export function ImpersonationBanner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [ending, setEnding] = useState(false);

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
    <div className="fixed inset-x-0 top-0 z-[100] flex min-h-12 items-center justify-between gap-3 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950 shadow-md">
      <span className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" />
        Test hesabı olarak görüntülüyorsunuz: {user.email} ({user.role === "tutor" ? "Hoca" : "Öğrenci"})
      </span>
      <Button size="sm" variant="outline" onClick={handleEnd} disabled={ending}>
        {ending ? "Dönülüyor…" : "Admin paneline dön"}
      </Button>
    </div>
  );
}

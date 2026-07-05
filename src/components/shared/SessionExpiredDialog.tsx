"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthContext } from "@/providers/AuthProvider";
import { SESSION_EXPIRED_EVENT } from "@/lib/api";

export function SessionExpiredDialog() {
  const router = useRouter();
  const { clearAuth } = useAuthContext();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuth();
      setOpen(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
    // clearAuth is stable enough for this listener; re-subscribing on every
    // AuthProvider render would risk missing events dispatched in between.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = () => {
    setOpen(false);
    router.push("/login");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Oturumun süresi doldu</DialogTitle>
          <DialogDescription>
            Güvenliğin için oturumun sonlandırıldı. Devam etmek için tekrar
            giriş yapman gerekiyor.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Kapat
          </Button>
          <Button onClick={handleLogin}>
            <LogIn className="mr-2 h-4 w-4" />
            Giriş Yap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

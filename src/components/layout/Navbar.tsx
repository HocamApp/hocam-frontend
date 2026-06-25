"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isStudent, isTutor, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const linkClass = (path: string) =>
    cn(
      "transition-colors",
      pathname === path ? "text-primary font-medium" : "text-foreground hover:text-primary"
    );

  const leftBrand = (
    <Link href="/tutors" className="font-bold text-xl text-foreground hover:text-primary transition-colors">
      Hocam
    </Link>
  );

  const rightContent = (
    <>
      {isLoading && (
        <div className="h-8 w-24 rounded bg-muted animate-pulse" aria-hidden />
      )}
      {!isLoading && !isAuthenticated && (
        <>
          <Link href="/tutors" className={cn("text-sm", linkClass("/tutors"))}>
            Hoca Bul
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Kayıt Ol</Link>
          </Button>
        </>
      )}
      {!isLoading && isAuthenticated && isStudent && (
        <>
          <Link href="/tutors" className={linkClass("/tutors")}>
            Hoca Bul
          </Link>
          <Link href="/messages" className={linkClass("/messages")}>
            Mesajlar
          </Link>
          <Link href="/dashboard/student" className={linkClass("/dashboard/student")}>
            Panom
          </Link>
          <Button variant="ghost" onClick={logout}>
            Çıkış
          </Button>
          <ProfileMenu />
        </>
      )}
      {!isLoading && isAuthenticated && isTutor && (
        <>
          <Link href="/tutors" className={linkClass("/tutors")}>
            Dersler
          </Link>
          <Link href="/messages" className={linkClass("/messages")}>
            Mesajlar
          </Link>
          <Link href="/dashboard/tutor" className={linkClass("/dashboard/tutor")}>
            Panom
          </Link>
          <Button variant="ghost" onClick={logout}>
            Çıkış
          </Button>
          <ProfileMenu />
        </>
      )}
    </>
  );

  const mobileLinks = (
    <div className="flex flex-col gap-2">
      {!isLoading && !isAuthenticated && (
        <>
          <Link href="/tutors" onClick={() => setOpen(false)} className={linkClass("/tutors")}>
            Hoca Bul
          </Link>
          <Button variant="ghost" asChild className="justify-start">
            <Link href="/login" onClick={() => setOpen(false)}>Giriş Yap</Link>
          </Button>
          <Button asChild className="justify-start">
            <Link href="/register" onClick={() => setOpen(false)}>Kayıt Ol</Link>
          </Button>
        </>
      )}
      {!isLoading && isAuthenticated && isStudent && (
        <>
          <Link href="/tutors" onClick={() => setOpen(false)} className={linkClass("/tutors")}>
            Hoca Bul
          </Link>
          <Link href="/messages" onClick={() => setOpen(false)} className={linkClass("/messages")}>
            Mesajlar
          </Link>
          <Link href="/dashboard/student" onClick={() => setOpen(false)} className={linkClass("/dashboard/student")}>
            Panom
          </Link>
          <Button variant="ghost" className="justify-start" onClick={() => { logout(); setOpen(false); }}>
            Çıkış
          </Button>
        </>
      )}
      {!isLoading && isAuthenticated && isTutor && (
        <>
          <Link href="/tutors" onClick={() => setOpen(false)} className={linkClass("/tutors")}>
            Dersler
          </Link>
          <Link href="/messages" onClick={() => setOpen(false)} className={linkClass("/messages")}>
            Mesajlar
          </Link>
          <Link href="/dashboard/tutor" onClick={() => setOpen(false)} className={linkClass("/dashboard/tutor")}>
            Panom
          </Link>
          <Button variant="ghost" className="justify-start" onClick={() => { logout(); setOpen(false); }}>
            Çıkış
          </Button>
        </>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background">
      <nav className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {leftBrand}
        </div>

        {/* Desktop right */}
        <div className="hidden items-center gap-4 md:flex">
          {rightContent}
        </div>

        {/* Mobile: profile avatar (if signed in) + hamburger Sheet */}
        <div className="flex items-center gap-1 md:hidden">
          {!isLoading && isAuthenticated && <ProfileMenu />}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menüyü aç">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/tutors" onClick={() => setOpen(false)} className="font-bold text-xl">
                    Hocam
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">{mobileLinks}</div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

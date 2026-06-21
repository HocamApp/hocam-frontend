"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function truncateEmail(email: string, maxLen = 20): string {
  if (email.length <= maxLen) return email;
  return email.slice(0, maxLen) + "...";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isStudent, isTutor, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const doSearch = useCallback(() => {
    const term = searchQuery.trim();
    if (!term) return;
    if (typeof window !== "undefined" && window.location.pathname === "/tutors") {
      const params = new URLSearchParams(window.location.search);
      params.set("search", term);
      router.push(`/tutors?${params.toString()}`);
    } else {
      router.push(`/tutors?search=${encodeURIComponent(term)}`);
    }
    setSearchQuery("");
  }, [searchQuery, router]);

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
          <span className="text-sm text-muted-foreground max-w-[120px] truncate">
            {user?.email ? truncateEmail(user.email) : ""}
          </span>
          <Button variant="ghost" onClick={logout}>
            Çıkış
          </Button>
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
          <span className="text-sm text-muted-foreground max-w-[120px] truncate">
            {user?.email ? truncateEmail(user.email) : ""}
          </span>
          <Button variant="ghost" onClick={logout}>
            Çıkış
          </Button>
        </>
      )}
    </>
  );

  const mobileLinks = (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(e) => { e.preventDefault(); doSearch(); setOpen(false); }}
        className="flex items-center gap-1"
      >
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hoca ara..."
          className="h-8 flex-1 text-sm"
        />
        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Ara">
          <Search className="h-4 w-4" />
        </Button>
      </form>

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
          <span className="text-sm text-muted-foreground py-2">
            {user?.email ? truncateEmail(user.email) : ""}
          </span>
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
          <span className="text-sm text-muted-foreground py-2">
            {user?.email ? truncateEmail(user.email) : ""}
          </span>
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
          {/* Desktop: show Hoca Bul / Dersler next to brand when not loading */}
          {!isLoading && (
            <Link
              href="/tutors"
              className={cn("hidden md:inline-block", linkClass("/tutors"))}
            >
              {isTutor ? "Dersler" : "Hoca Bul"}
            </Link>
          )}
        </div>

        {/* Desktop search */}
        <form
          onSubmit={(e) => { e.preventDefault(); doSearch(); }}
          className="hidden md:flex items-center gap-1"
        >
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hoca ara..."
            className="h-8 w-64 text-sm"
          />
          <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Ara">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Desktop right */}
        <div className="hidden items-center gap-4 md:flex">
          {rightContent}
        </div>

        {/* Mobile: hamburger + Sheet from left */}
        <div className="flex items-center gap-2 md:hidden">
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

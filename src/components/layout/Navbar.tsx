"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { AnimatedNavbarLinks } from "@/components/layout/AnimatedNavbarLinks";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

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
            Dersler
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Kayıt Ol</Link>
          </Button>
        </>
      )}
      {!isLoading && isAuthenticated && (
        <>
          <AnimatedNavbarLinks />
          <ProfileMenu />
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background">
      <nav className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-6">
          {leftBrand}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {rightContent}
        </div>
      </nav>
    </header>
  );
}

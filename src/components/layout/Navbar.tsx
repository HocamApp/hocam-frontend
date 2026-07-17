"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { AnimatedNavbarLinks } from "@/components/layout/AnimatedNavbarLinks";
import { BrandMark } from "@/components/brand/BrandMark";
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
    <Link
      href={isAuthenticated ? "/home" : "/tutors"}
      aria-label="Hocam ana sayfa"
      className="inline-flex min-h-11 items-center text-foreground transition-colors hover:text-[#cf3048] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:inline lg:min-h-0"
    >
      <BrandMark priority />
    </Link>
  );

  const rightContent = (
    <>
      {isLoading && (
        <div className="h-8 w-24 rounded bg-muted animate-pulse" aria-hidden />
      )}
      {!isLoading && !isAuthenticated && (
        <>
          <Link
            href="/tutors"
            className={cn(
              "inline-flex min-h-11 items-center text-sm lg:inline lg:min-h-0",
              linkClass("/tutors")
            )}
          >
            Dersler
          </Link>
          <Button
            variant="ghost"
            className="min-h-11 px-2 sm:px-4 lg:min-h-0"
            asChild
          >
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <Button
            className="min-h-11 px-2 sm:px-4 lg:min-h-0"
            asChild
          >
            <Link href="/register">Kayıt Ol</Link>
          </Button>
        </>
      )}
    </>
  );

  if (!isLoading && isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-nowrap items-center justify-between gap-x-1 min-[1039px]:gap-x-3">
            <div className="flex h-14 items-center md:h-16">{leftBrand}</div>
            <div className="hidden md:block">
              <AnimatedNavbarLinks />
            </div>
            <ProfileMenu />
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">{leftBrand}</div>
        <div className="flex items-center gap-1 sm:gap-4">{rightContent}</div>
      </nav>
    </header>
  );
}

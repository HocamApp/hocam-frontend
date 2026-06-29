"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // The messaging screen is a full-height chat surface; the global footer must
  // not appear inside it. Hidden only for /messages routes — other pages keep it.
  if (pathname?.startsWith("/messages")) {
    return null;
  }

  return (
    <footer className="border-t py-6">
      <p className="text-center text-sm text-muted-foreground">
        © 2024 Hoca Bul. Tüm hakları saklıdır.
      </p>
    </footer>
  );
}

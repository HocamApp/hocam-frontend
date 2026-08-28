"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ProfileScreenProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Small consistent shell for the profile-menu lesson/reservation screens. */
export function ProfileScreen({ title, description, children }: ProfileScreenProps) {
  const router = useRouter();

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-14">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 -ml-2 min-h-11 rounded-[var(--radius-pill)] text-[var(--ink-mid)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
        onClick={() => router.back()}
      >
        <ArrowLeft aria-hidden className="mr-1.5 h-4 w-4" weight="regular" />
        Geri
      </Button>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 text-base leading-7 text-[var(--ink-mid)]">{description}</p>
        )}
      </div>
      <div className="mt-8 sm:mt-10">{children}</div>
    </div>
  );
}

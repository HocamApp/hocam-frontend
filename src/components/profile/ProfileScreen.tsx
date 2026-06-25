"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Geri
      </Button>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

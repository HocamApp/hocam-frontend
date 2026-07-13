"use client";

import Link from "next/link";
import { Heart, Layers3, MessageCircle, PanelRightOpen, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

interface StudentQuickActionsProps {
  /** True when there's no upcoming lesson or usable/pending package — "Yeni
   * ders ara" becomes the only real next step, so it earns slightly more
   * visual weight than the other shortcuts (still well below the hero CTA). */
  emphasizeFindTutor?: boolean;
}

/** Compact secondary-shortcut list — kept visually quiet so it never
 * competes with the main learning flow (next lesson, progress, packages). */
export function StudentQuickActions({ emphasizeFindTutor = false }: StudentQuickActionsProps) {
  return (
    <div className="space-y-1 rounded-lg border bg-card p-3">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
        <PanelRightOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        Hızlı erişim
      </h2>
      <Button asChild variant="ghost" size="sm" className="w-full justify-start">
        <Link href="/tutors?favorites=1">
          <Heart className="mr-2 h-4 w-4" aria-hidden="true" />
          Hocalarım
        </Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => scrollToSection("my-packages")}
      >
        <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
        Paketlerim
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => scrollToSection("past-lessons")}
      >
        <Layers3 className="mr-2 h-4 w-4" aria-hidden="true" />
        Geçmiş dersler
      </Button>
      <Button asChild variant="ghost" size="sm" className="w-full justify-start">
        <Link href="/messages">
          <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Mesajlar
        </Link>
      </Button>
      <Button
        asChild
        variant={emphasizeFindTutor ? "secondary" : "ghost"}
        size="sm"
        className="w-full justify-start"
      >
        <Link href="/tutors">
          <Search className="mr-2 h-4 w-4" aria-hidden="true" />
          Yeni ders ara
        </Link>
      </Button>
    </div>
  );
}

"use client";

import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function VerifiedTutorMark({ verified, className }: { verified: boolean; className?: string }) {
  if (!verified) return null;
  return <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><span tabIndex={0} role="img" aria-label="Doğrulanmış hoca" className={cn("inline-flex h-6 w-6 shrink-0 items-center justify-center text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}><BadgeCheck className="h-4 w-4" /></span></TooltipTrigger><TooltipContent>Doğrulanmış hoca</TooltipContent></Tooltip></TooltipProvider>;
}

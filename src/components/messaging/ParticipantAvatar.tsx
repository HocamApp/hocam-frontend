"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ParticipantAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Avatar for the person the current user is talking to.
 * Shows their profile photo when available, otherwise polished initials.
 */
export function ParticipantAvatar({
  name,
  avatarUrl,
  className,
}: ParticipantAvatarProps) {
  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/30 text-sm font-semibold text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

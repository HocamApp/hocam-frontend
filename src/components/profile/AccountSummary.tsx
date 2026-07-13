"use client";

import { Mail, Pencil, ShieldCheck, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AccountSummaryProps {
  isLoading: boolean;
  fullName: string;
  role: "student" | "tutor" | undefined;
  email: string | undefined;
  avatarImage: string;
  initials: string;
  metaLine: string;
  isVerified?: boolean;
  /** Secondary link for editing name/photo when it lives on a different page than the primary edit action. */
  onEditIdentity?: () => void;
  onEditProfile: () => void;
  onViewPublicProfile?: () => void;
}

/** Compact, always-visible account identity block at the top of the account drawer. */
export function AccountSummary({
  isLoading,
  fullName,
  role,
  email,
  avatarImage,
  initials,
  metaLine,
  isVerified,
  onEditIdentity,
  onEditProfile,
  onViewPublicProfile,
}: AccountSummaryProps) {
  return (
    <div className="space-y-3 px-1 pb-4 pt-1">
      <div className="flex items-start gap-3">
        <Avatar className="h-14 w-14 shrink-0 border border-border">
          {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials || <UserCog className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 pt-0.5">
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="truncate text-base font-semibold text-foreground">
                {fullName || (role === "tutor" ? "Hoca" : "Öğrenci")}
              </p>
              {onEditIdentity && (
                <button
                  type="button"
                  onClick={onEditIdentity}
                  aria-label="İsim ve fotoğrafı düzenle"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {metaLine && (
            <p className="truncate text-sm text-muted-foreground">{metaLine}</p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {email && (
              <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{email}</span>
              </span>
            )}
            <Badge variant="secondary" className="shrink-0 text-[11px]">
              {role === "tutor" ? "Hoca" : "Öğrenci"}
              {isVerified && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-primary">
                  <ShieldCheck className="h-3 w-3" /> Doğrulanmış
                </span>
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onEditProfile}>
          Profili Düzenle
        </Button>
        {onViewPublicProfile && (
          <Button size="sm" variant="outline" className="flex-1" onClick={onViewPublicProfile}>
            Herkese Açık Profili Görüntüle
          </Button>
        )}
      </div>
    </div>
  );
}

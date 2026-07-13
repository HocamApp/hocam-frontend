"use client";

import { AlertCircle, Award, CheckCircle2, Circle, Lightbulb } from "lucide-react";

import type { Subject, TutorProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export interface ProfileActionItem {
  label: string;
  target: string;
}

interface TutorProfileEditSidebarProps {
  profile: TutorProfile;
  university: string;
  department: string;
  yksRank: string;
  hourlyPrice: string;
  bio: string;
  selectedSubjects: Subject[];
  missingRequirements: ProfileActionItem[];
  suggestions: ProfileActionItem[];
}

function getInitials(name: string, surname: string) {
  return `${name.trim()[0] ?? ""}${surname.trim()[0] ?? ""}`.toUpperCase() || "?";
}

function ActionList({ items }: { items: ProfileActionItem[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={`${item.target}-${item.label}`}>
          <a
            href={item.target}
            className="flex items-start gap-2 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function TutorProfileEditSidebar({
  profile,
  university,
  department,
  yksRank,
  hourlyPrice,
  bio,
  selectedSubjects,
  missingRequirements,
  suggestions,
}: TutorProfileEditSidebarProps) {
  const requiredTotal = 5;
  const completedRequired = requiredTotal - missingRequirements.length;
  const completionPercent = Math.round((completedRequired / requiredTotal) * 100);
  const numericPrice = Number(hourlyPrice);

  return (
    <aside className="space-y-5 lg:sticky lg:top-56 lg:self-start">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Profil Durumu</CardTitle>
            <Badge variant={profile.is_public ? "secondary" : "outline"}>
              {profile.is_public ? "Yayında" : "Yayında değil"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Zorunlu bilgiler</span>
              <span className="text-muted-foreground">
                {completedRequired}/{requiredTotal}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPercent}
              aria-label={`Profil tamamlanma oranı yüzde ${completionPercent}`}
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>

          {missingRequirements.length === 0 ? (
            <div className="flex gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">Profilin hazır</p>
                <p className="mt-0.5 opacity-80">Tüm zorunlu bilgiler tamamlandı.</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden />
                Tamamlanması gerekenler
              </p>
              <ActionList items={missingRequirements} />
            </div>
          )}

          <div className="border-t pt-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Doğrulama</span>
              <span className="font-medium">
                {profile.is_verified ? "Doğrulandı" : "Doğrulanmadı"}
              </span>
            </div>
            {profile.pending_profile_change && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                Profil değişikliği incelemede
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Öğrencilerin Göreceği Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 shrink-0">
              {profile.profile_picture && (
                <AvatarImage
                  src={profile.profile_picture}
                  alt={`${profile.name} ${profile.surname}`}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {getInitials(profile.name, profile.surname)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold">{profile.name} {profile.surname}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {university || "Üniversite"} · {department || "Bölüm"}
              </p>
            </div>
          </div>

          {Number(yksRank) > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
              <Award className="h-3.5 w-3.5" aria-hidden />
              YKS: {Number(yksRank).toLocaleString("tr-TR")}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {selectedSubjects.slice(0, 5).map((subject) => (
              <Badge key={subject.id} variant="outline" className="font-normal">
                {subject.name} · {subject.exam_type}
              </Badge>
            ))}
            {selectedSubjects.length > 5 && (
              <span className="self-center text-xs text-muted-foreground">
                +{selectedSubjects.length - 5} ders
              </span>
            )}
          </div>

          {bio && (
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {bio}
            </p>
          )}

          <div className="mt-4 border-t pt-4">
            <span className="text-lg font-semibold">
              {Number.isFinite(numericPrice) && numericPrice > 0
                ? formatPrice(numericPrice)
                : "—"}
            </span>
            <span className="ml-1 text-sm text-muted-foreground">/40 dk</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Bu önizleme kaydetmeden önce girdiğin değerleri gösterir. İnceleme bekleyen doğrulanmış
            bilgiler onaylanana kadar herkese açık profilde değişmez.
          </p>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4" aria-hidden />
              Profili güçlendir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionList items={suggestions} />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Bunlar öneridir; profilini kaydetmene engel olmaz.
            </p>
          </CardContent>
        </Card>
      )}
    </aside>
  );
}

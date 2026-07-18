"use client";

import { AlertCircle, Award, Check, Circle, Lightbulb, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import type { Subject, TutorProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
            className="flex items-start gap-2 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground active:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function CompletionRing({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const complete = value === 100;
  return (
    <div
      className="relative h-24 w-24 shrink-0"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={`Profil tamamlanma oranı yüzde ${value}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={complete ? "text-emerald-500" : "text-primary"}
          pathLength={1}
          initial={reduceMotion ? { pathLength: value / 100 } : { pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {complete ? (
          <motion.span
            initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.55 }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
          >
            <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
          </motion.span>
        ) : (
          <span className="text-lg font-semibold">%{value}</span>
        )}
      </div>
      {complete && (
        <motion.span
          initial={reduceMotion ? false : { scale: 0, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.8, duration: 0.3 }}
          className="absolute -right-1 -top-1 text-amber-500"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" />
        </motion.span>
      )}
    </div>
  );
}

interface StatusCardProps {
  profile: TutorProfile;
  completionPercent: number;
  completedRequired: number;
  requiredTotal: number;
  missingRequirements: ProfileActionItem[];
}

function StatusCard({
  profile,
  completionPercent,
  completedRequired,
  requiredTotal,
  missingRequirements,
}: StatusCardProps) {
  return (
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
        <div className="flex flex-col gap-4 rounded-xl bg-muted/30 p-3 min-[400px]:flex-row min-[400px]:items-center">
          <CompletionRing value={completionPercent} />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {completedRequired}/{requiredTotal} zorunlu bilgi
            </p>
            {missingRequirements.length === 0 ? (
              <>
                <p className="mt-1 font-semibold text-emerald-800 dark:text-emerald-200">
                  Harika, profilin hazır!
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Artık bilgini paylaşarak öğrencilerine ulaşmaya ve kazanmaya hazırsın.
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Birkaç adımı daha tamamlayarak profilini öğrenciler için hazır hale getir.
              </p>
            )}
          </div>
        </div>

        {missingRequirements.length > 0 && (
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
  );
}

interface PreviewCardProps {
  profile: TutorProfile;
  university: string;
  department: string;
  yksRank: string;
  hourlyPrice: string;
  bio: string;
  selectedSubjects: Subject[];
}

function PreviewCard({
  profile,
  university,
  department,
  yksRank,
  hourlyPrice,
  bio,
  selectedSubjects,
}: PreviewCardProps) {
  const numericPrice = Number(hourlyPrice);

  return (
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
  );
}

function SuggestionsCard({ suggestions }: { suggestions: ProfileActionItem[] }) {
  if (suggestions.length === 0) return null;

  return (
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
  const reduceMotion = useReducedMotion();
  const statusCardProps = {
    profile,
    completionPercent,
    completedRequired,
    requiredTotal,
    missingRequirements,
  };
  const previewCardProps = {
    profile,
    university,
    department,
    yksRank,
    hourlyPrice,
    bio,
    selectedSubjects,
  };

  return (
    <aside className="min-w-0 lg:sticky lg:top-56 lg:self-start">
      <Tabs defaultValue="status" className="min-w-0 lg:hidden">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="h-auto w-max min-w-full justify-start">
            <TabsTrigger value="status" className="flex-1">Durum</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Önizleme</TabsTrigger>
            {suggestions.length > 0 && (
              <TabsTrigger value="suggestions" className="flex-1">İpuçları</TabsTrigger>
            )}
          </TabsList>
        </div>
        <TabsContent value="status" className="mt-3">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <StatusCard {...statusCardProps} />
          </motion.div>
        </TabsContent>
        <TabsContent value="preview" className="mt-3">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <PreviewCard {...previewCardProps} />
          </motion.div>
        </TabsContent>
        {suggestions.length > 0 && (
          <TabsContent value="suggestions" className="mt-3">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <SuggestionsCard suggestions={suggestions} />
            </motion.div>
          </TabsContent>
        )}
      </Tabs>

      <div className="hidden space-y-5 lg:block">
        <StatusCard {...statusCardProps} />
        <PreviewCard {...previewCardProps} />
        <SuggestionsCard suggestions={suggestions} />
      </div>
    </aside>
  );
}

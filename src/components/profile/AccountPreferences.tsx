"use client";

import { Bell, Globe } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionCardTitle } from "@/components/profile/SectionCardTitle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ProfileToggleRow } from "@/components/profile/ProfileMenuRow";
import { AnimatedThemeToggler } from "@/components/theme/AnimatedThemeToggler";
import type { Theme } from "@/lib/theme";
import type { UserPreferences } from "@/types";

type BoolPrefKey = keyof Omit<UserPreferences, "language">;

const NOTIFICATION_ROWS: { key: BoolPrefKey; label: string }[] = [
  { key: "notify_messages", label: "Yeni mesaj bildirimleri" },
  { key: "notify_lesson_requests", label: "Ders talebi bildirimleri" },
  { key: "notify_booking_reminders", label: "Rezervasyon hatırlatmaları" },
  { key: "notify_email", label: "E-posta bildirimleri" },
];

interface AccountPreferencesProps {
  preferences: UserPreferences;
  onLanguageChange: (lang: string) => void;
  onThemeChange: (theme: Theme) => void;
  onNotificationToggle: (key: BoolPrefKey, next: boolean) => void;
}

export function AccountPreferences({
  preferences,
  onLanguageChange,
  onThemeChange,
  onNotificationToggle,
}: AccountPreferencesProps) {
  return (
    <Card>
      <CardHeader>
        <SectionCardTitle className="text-base">Hesap tercihleri</SectionCardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
          <span className="shrink-0 text-muted-foreground">
            <Globe className="h-4 w-4" />
          </span>
          <span className="flex-1 text-foreground">Dil</span>
          <Select value={preferences.language} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">İngilizce</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
          <span className="flex-1 text-foreground">Tema</span>
          <span className="text-sm text-muted-foreground">
            {preferences.dark_mode ? "Koyu" : "Açık"}
          </span>
          <AnimatedThemeToggler onThemeChange={onThemeChange} />
        </div>

        <Separator className="my-2" />
        <p className="flex items-center gap-2 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Bell className="h-3.5 w-3.5" /> Bildirim tercihleri
        </p>
        {NOTIFICATION_ROWS.map((row) => (
          <ProfileToggleRow
            key={row.key}
            label={row.label}
            checked={preferences[row.key]}
            onChange={(next) => onNotificationToggle(row.key, next)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  CalendarClock,
  ChevronDown,
  Download,
  Eye,
  GraduationCap,
  KeyRound,
  LifeBuoy,
  LogOut,
  Moon,
  PlayCircle,
  ShieldCheck,
  Star,
  UserCog,
  Video,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfileMe, updateProfileMe } from "@/lib/profileApi";
import { formatPrice } from "@/lib/utils";
import type { Theme } from "@/lib/theme";
import type { ProfileStudent, ProfileTutor, UserPreferences } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedThemeToggler } from "@/components/theme/AnimatedThemeToggler";
import {
  ProfileAccordionSection,
} from "@/components/profile/ProfileAccordionSection";
import {
  ProfileMenuRow,
  ProfileToggleRow,
} from "@/components/profile/ProfileMenuRow";

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function getInitials(name: string, surname: string): string {
  const n = (name || "").trim()[0] || "";
  const s = (surname || "").trim()[0] || "";
  return (n + s).toUpperCase();
}

function isTutorProfile(
  profile: ProfileTutor | ProfileStudent | null | undefined,
  role: string | undefined
): profile is ProfileTutor {
  return role === "tutor" && !!profile;
}

export function ProfileMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [prefOverrides, setPrefOverrides] = useState<Partial<UserPreferences>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchProfileMe,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const role = data?.user.role ?? user?.role;
  const profile = data?.profile ?? null;
  const tutor = isTutorProfile(profile, role) ? profile : null;
  const studentProfile = !tutor && profile ? (profile as ProfileStudent) : null;

  const name = tutor?.name ?? studentProfile?.name ?? "";
  const surname = tutor?.surname ?? studentProfile?.surname ?? "";
  const fullName = `${name} ${surname}`.trim();
  const initials = getInitials(name, surname);
  const avatarImage = tutor?.profile_picture || "";

  const stats = data?.stats;
  const prefs: UserPreferences = useMemo(
    () => ({
      dark_mode: false,
      notify_messages: true,
      notify_lesson_requests: true,
      notify_booking_reminders: true,
      notify_email: false,
      ...(data?.preferences ?? {}),
      ...prefOverrides,
    }),
    [data?.preferences, prefOverrides]
  );

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const comingSoon = () => {
    setOpen(false);
    toast.info("Bu özellik yakında eklenecek.");
  };

  const editHref = role === "tutor" ? "/dashboard/tutor/edit" : "/dashboard/student";

  const handleNotificationToggle = async (
    key: keyof UserPreferences,
    next: boolean
  ) => {
    setPrefOverrides((prev) => ({ ...prev, [key]: next }));
    try {
      await updateProfileMe({ preferences: { [key]: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setPrefOverrides((prev) => ({ ...prev, [key]: !next }));
      toast.error("Tercih kaydedilemedi.");
    }
  };

  const handleThemeChange = (nextTheme: Theme) => {
    // Best-effort backend sync; local preference stands regardless.
    updateProfileMe({ preferences: { dark_mode: nextTheme === "dark" } }).catch(
      () => undefined
    );
  };

  // Single-open connected accordion: one active section key (null = all collapsed).
  // Role-aware key order must mirror the rendered sections below so the group math
  // (marginTop + corner radius) lines up with the visible rows.
  const sectionKeys = useMemo(
    () => [
      "profile",
      "lessons",
      "security",
      "notifications",
      ...(tutor ? ["tutor"] : []),
      "advanced",
    ],
    [tutor]
  );
  const activeIndex = sectionKeys.indexOf(activeSection ?? "");

  const sectionProps = (key: string) => {
    const index = sectionKeys.indexOf(key);
    const isOpen = activeSection === key;
    const previousIsOpen = activeIndex === index - 1;
    const nextIsOpen = activeIndex === index + 1;
    return {
      open: isOpen,
      onToggle: () => setActiveSection((curr) => (curr === key ? null : key)),
      startsGroup: isOpen || index === 0 || previousIsOpen,
      endsGroup: isOpen || index === sectionKeys.length - 1 || nextIsOpen,
      separatedFromPrevious: index > 0 && (isOpen || previousIsOpen),
    };
  };

  // Reset accordion to fully collapsed whenever the dropdown closes, so it
  // always reopens fresh instead of restoring the previously expanded section.
  // An effect (not just onOpenChange) covers every close path, including the
  // direct setOpen(false) calls in go()/comingSoon()/logout.
  useEffect(() => {
    if (!open) setActiveSection(null);
  }, [open]);

  if (!isAuthenticated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Profil menüsü"
          className="flex items-center gap-1.5 rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="h-9 w-9 border border-border">
            {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials || <UserCog className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[calc(100vw-2rem)] border-none bg-transparent p-0 shadow-none sm:w-[440px]"
      >
        <div className="max-h-[min(80vh,640px)] overflow-y-auto rounded-[32px] bg-background/[0.08] p-3 backdrop-blur-lg">
          {/* ---- Profil Detayları ---- */}
          <ProfileAccordionSection
            icon={<UserCog className="h-4 w-4" />}
            title="Profil Detayları"
            {...sectionProps("profile")}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border border-border">
                {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials || <UserCog className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                {isLoading && !data ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <p className="truncate text-base font-semibold text-foreground">
                    {fullName || (role === "tutor" ? "Hoca" : "Öğrenci")}
                  </p>
                )}
                {tutor && (tutor.university || tutor.department) && (
                  <p className="truncate text-sm text-muted-foreground">
                    {[tutor.university, tutor.department].filter(Boolean).join(" · ")}
                  </p>
                )}
                {studentProfile && (studentProfile.school || studentProfile.grade) && (
                  <p className="truncate text-sm text-muted-foreground">
                    {[studentProfile.school, studentProfile.grade]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Hesap bilgileri ve ayarlarınız.
            </p>
            <Button variant="outline" className="w-full" onClick={() => go(editHref)}>
              Profili Düzenle
            </Button>
          </ProfileAccordionSection>

          {/* ---- Dersler ve Rezervasyonlar ---- */}
          <ProfileAccordionSection
            icon={<CalendarClock className="h-4 w-4" />}
            title="Dersler ve Rezervasyonlar"
            {...sectionProps("lessons")}
          >
            <ProfileMenuRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Yaklaşan dersler"
              badgeCount={stats?.upcoming_lessons_count}
              showChevron
              onClick={() => go("/profile/lessons/upcoming")}
            />
            <ProfileMenuRow
              icon={<BookOpen className="h-4 w-4" />}
              label="Onay bekleyen rezervasyonlar"
              badgeCount={stats?.pending_bookings_count}
              showChevron
              onClick={() => go("/profile/reservations/pending")}
            />
            <ProfileMenuRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Geçmiş dersler"
              showChevron
              onClick={() => go("/profile/lessons/history")}
            />
            <ProfileMenuRow
              icon={<Star className="h-4 w-4" />}
              label="Değerlendirme bekleyenler"
              badgeCount={stats?.pending_reviews_count}
              showChevron
              onClick={() => go("/profile/reviews/pending")}
            />
            <Button className="w-full" onClick={() => go("/profile/calendar")}>
              Ders Takvimine Git
            </Button>
          </ProfileAccordionSection>

          {/* ---- Güvenlik ve Gizlilik ---- */}
          <ProfileAccordionSection
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Güvenlik ve Gizlilik"
            {...sectionProps("security")}
          >
            <ProfileMenuRow
              icon={<KeyRound className="h-4 w-4" />}
              label="Şifre değiştir"
              showChevron
              onClick={() => go("/forgot-password")}
            />
            <ProfileMenuRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Oturumları yönet"
              showChevron
              onClick={comingSoon}
            />
            <ProfileMenuRow
              icon={<Eye className="h-4 w-4" />}
              label="Hesap görünürlüğü"
              showChevron
              onClick={comingSoon}
            />
            <ProfileMenuRow
              icon={<Download className="h-4 w-4" />}
              label="Verilerimi indir"
              showChevron
              onClick={comingSoon}
            />
            <Button variant="outline" className="w-full" onClick={comingSoon}>
              Güvenlik Ayarları
            </Button>
          </ProfileAccordionSection>

          {/* ---- Bildirimler ---- */}
          <ProfileAccordionSection
            icon={<Bell className="h-4 w-4" />}
            title="Bildirimler"
            {...sectionProps("notifications")}
          >
            <ProfileToggleRow
              label="Yeni mesajlar"
              checked={prefs.notify_messages}
              onChange={(v) => handleNotificationToggle("notify_messages", v)}
            />
            <ProfileToggleRow
              label="Ders talebi bildirimleri"
              checked={prefs.notify_lesson_requests}
              onChange={(v) => handleNotificationToggle("notify_lesson_requests", v)}
            />
            <ProfileToggleRow
              label="Rezervasyon hatırlatmaları"
              checked={prefs.notify_booking_reminders}
              onChange={(v) => handleNotificationToggle("notify_booking_reminders", v)}
            />
            <ProfileToggleRow
              label="E-posta bildirimleri"
              checked={prefs.notify_email}
              onChange={(v) => handleNotificationToggle("notify_email", v)}
            />
          </ProfileAccordionSection>

          {/* ---- Eğitmen Profili (tutor only) ---- */}
          {tutor && (
            <ProfileAccordionSection
              icon={<GraduationCap className="h-4 w-4" />}
              title="Eğitmen Profili"
              {...sectionProps("tutor")}
            >
              {tutor.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tutor.subjects.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saatlik ücret</span>
                <span className="font-medium text-foreground">
                  {formatPrice(tutor.hourly_price)}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">Müsaitlik saatleri</span>
                {tutor.availability.length === 0 ? (
                  <p className="text-foreground">Henüz eklenmedi</p>
                ) : (
                  <ul className="space-y-0.5">
                    {tutor.availability.slice(0, 5).map((a, i) => (
                      <li key={`${a.day_of_week}-${i}`} className="flex justify-between">
                        <span className="text-foreground">{DAY_NAMES[a.day_of_week]}</span>
                        <span className="text-muted-foreground">
                          {a.start_time} – {a.end_time}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {tutor.intro_video_url ? (
                <ProfileMenuRow
                  icon={<PlayCircle className="h-4 w-4" />}
                  label="Tanıtım videosu: Videoyu izle"
                  showChevron
                  onClick={() => {
                    setOpen(false);
                    window.open(tutor.intro_video_url, "_blank", "noopener,noreferrer");
                  }}
                />
              ) : (
                <ProfileMenuRow
                  icon={<Video className="h-4 w-4" />}
                  label="Tanıtım videosu ekle"
                  showChevron
                  onClick={() => go(editHref)}
                />
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => go(`/tutors/${tutor.id}`)}
              >
                Public Profili Gör
              </Button>
            </ProfileAccordionSection>
          )}

          {/* ---- Gelişmiş Ayarlar ---- */}
          <ProfileAccordionSection
            icon={<UserCog className="h-4 w-4" />}
            title="Gelişmiş Ayarlar"
            {...sectionProps("advanced")}
          >
            <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
              <span className="shrink-0 text-muted-foreground">
                <Moon className="h-4 w-4" />
              </span>
              <span className="flex-1 text-foreground">Tema</span>
              <AnimatedThemeToggler
                className="shrink-0"
                onThemeChange={handleThemeChange}
              />
            </div>
            <ProfileMenuRow
              icon={<LifeBuoy className="h-4 w-4" />}
              label="Destek ile iletişime geç"
              showChevron
              onClick={comingSoon}
            />
            <ProfileMenuRow
              icon={<LogOut className="h-4 w-4" />}
              label="Çıkış yap"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            />
            <div className="pt-1">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tehlikeli Alan
              </p>
              <ProfileMenuRow label="Hesabı dondur" danger onClick={comingSoon} />
              <ProfileMenuRow label="Hesabı sil" danger onClick={comingSoon} />
            </div>
          </ProfileAccordionSection>
        </div>
      </PopoverContent>
    </Popover>
  );
}

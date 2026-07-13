"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  CalendarClock,
  CreditCard,
  Download,
  Eye,
  Globe,
  GraduationCap,
  PlayCircle,
  Receipt,
  ShieldCheck,
  Star,
  UserCog,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { exportMyData, fetchProfileMe, updateProfileMe } from "@/lib/profileApi";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { formatPrice } from "@/lib/utils";
import type { Theme } from "@/lib/theme";
import type { ProfileStudent, ProfileTutor, UserPreferences } from "@/types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProfileAccordionSection,
} from "@/components/profile/ProfileAccordionSection";
import {
  ProfileMenuRow,
  ProfileToggleRow,
} from "@/components/profile/ProfileMenuRow";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "@/components/profile/PaymentMethodSelector";
import { AccountSummary } from "@/components/profile/AccountSummary";
import { ThemeSegmentedControl } from "@/components/profile/ThemeSegmentedControl";
import { AccountDrawerFooter } from "@/components/profile/AccountDrawerFooter";

// Boolean-valued preference keys — excludes string fields like `language`
type BoolPrefKey = keyof Omit<UserPreferences, "language">;

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

function normalizeProfileName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");
}

function isBurakYilmazTutor(name: string, surname: string, role: string | undefined) {
  return (
    role === "tutor" &&
    normalizeProfileName(`${name} ${surname}`) === "burak yilmaz"
  );
}

function PaymentBrandBadge({
  children,
  tone,
}: {
  children: string;
  tone: "visa" | "mastercard";
}) {
  return (
    <span
      className={
        tone === "visa"
          ? "rounded-md bg-blue-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
          : "rounded-md bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white"
      }
    >
      {children}
    </span>
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [prefOverrides, setPrefOverrides] = useState<Partial<UserPreferences>>({});
  const [notifSaving, setNotifSaving] = useState<Partial<Record<BoolPrefKey, boolean>>>({});
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");

  // Optimistic overrides for profile-level toggles
  const [autoApproveOverride, setAutoApproveOverride] = useState<boolean | null>(null);
  const [autoApproveSaving, setAutoApproveSaving] = useState(false);
  const [isPublicOverride, setIsPublicOverride] = useState<boolean | null>(null);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchProfileMe,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const role = data?.user.role ?? user?.role;
  const isTutor = role === "tutor";
  const profile = data?.profile ?? null;
  const tutor = isTutorProfile(profile, role) ? profile : null;
  const studentProfile = !tutor && profile ? (profile as ProfileStudent) : null;

  const { data: tutorMeData } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated && isTutor,
    staleTime: 60_000,
  });

  const tutorId = tutorMeData?.id ?? tutor?.id;
  const name = tutorMeData?.name ?? tutor?.name ?? studentProfile?.name ?? "";
  const surname = tutorMeData?.surname ?? tutor?.surname ?? studentProfile?.surname ?? "";
  const fullName = `${name} ${surname}`.trim();
  const initials = getInitials(name, surname);
  const avatarImage =
    tutorMeData?.profile_picture || tutor?.profile_picture || studentProfile?.avatar_url || "";
  const tutorUniversity = tutorMeData?.university ?? tutor?.university ?? "";
  const tutorDepartment = tutorMeData?.department ?? tutor?.department ?? "";
  const tutorHourlyPrice = tutorMeData?.hourly_price ?? tutor?.hourly_price ?? 0;
  const tutorIntroVideoUrl = tutorMeData?.intro_video_url ?? tutor?.intro_video_url ?? "";
  const tutorSubjects = tutorMeData?.subjects ?? tutor?.subjects ?? [];
  const tutorAvailability = tutor?.availability ?? [];
  const showDemoPaymentMethods = isBurakYilmazTutor(name, surname, role);

  const metaLine = isTutor
    ? [tutorUniversity, tutorDepartment].filter(Boolean).join(" · ")
    : [studentProfile?.school, studentProfile?.grade].filter(Boolean).join(" · ");

  const visibleSubjects = tutorSubjects.slice(0, 3);
  const extraSubjectsCount = Math.max(0, tutorSubjects.length - visibleSubjects.length);
  const definedAvailabilityDays = new Set(
    tutorAvailability.filter((a) => !a.is_unavailable).map((a) => a.day_of_week)
  ).size;
  const hasIntroVideo = Boolean(tutorIntroVideoUrl);

  const stats = data?.stats;
  const prefs: UserPreferences = useMemo(
    () => ({
      dark_mode: false,
      notify_messages: true,
      notify_lesson_requests: true,
      notify_booking_reminders: true,
      notify_email: false,
      language: "tr",
      ...(data?.preferences ?? {}),
      ...prefOverrides,
    }),
    [data?.preferences, prefOverrides]
  );

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const editHref = role === "tutor" ? "/dashboard/tutor/edit" : "/profile";

  const handleNotificationToggle = async (key: BoolPrefKey, next: boolean) => {
    if (notifSaving[key]) return;
    setPrefOverrides((prev) => ({ ...prev, [key]: next } as Partial<UserPreferences>));
    setNotifSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await updateProfileMe({ preferences: { [key]: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setPrefOverrides((prev) => ({ ...prev, [key]: !next } as Partial<UserPreferences>));
      toast.error("Tercih kaydedilemedi.");
    } finally {
      setNotifSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleThemeChange = (nextTheme: Theme) => {
    updateProfileMe({ preferences: { dark_mode: nextTheme === "dark" } }).catch(
      () => undefined
    );
  };

  const paymentMethods = useMemo<PaymentMethod[]>(
    () =>
      showDemoPaymentMethods
        ? [
            {
              id: "demo-visa",
              icon: <PaymentBrandBadge tone="visa">Visa</PaymentBrandBadge>,
              label: "Demo Visa Kart",
              description: "Test ödeme yöntemi — gerçek ödeme alınmaz.",
            },
            {
              id: "demo-mastercard",
              icon: (
                <PaymentBrandBadge tone="mastercard">Mastercard</PaymentBrandBadge>
              ),
              label: "Demo Mastercard Kart",
              description: "Test ödeme yöntemi — gerçek ödeme alınmaz.",
            },
          ]
        : [
            {
              id: "card",
              icon: <CreditCard className="h-5 w-5" />,
              label: "Kredi veya banka kartı",
              description:
                "Kart ekleme akışı ödeme altyapısı bağlandıktan sonra aktif olacak.",
            },
          ],
    [showDemoPaymentMethods]
  );

  const openPaymentDialog = () => {
    setPaymentNotice("");
    setPaymentDialogOpen(true);
    setOpen(false);
  };

  const handlePaymentDialogChange = (nextOpen: boolean) => {
    setPaymentDialogOpen(nextOpen);
    if (!nextOpen) {
      setPaymentNotice("");
    }
  };

  const handleLanguageChange = async (nextLang: string) => {
    const prevLang = prefs.language;
    setPrefOverrides((prev) => ({ ...prev, language: nextLang }));
    try {
      await updateProfileMe({ preferences: { language: nextLang } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setPrefOverrides((prev) => ({ ...prev, language: prevLang }));
      toast.error("Dil ayarı kaydedilemedi.");
    }
  };

  const handleAutoApproveToggle = async (next: boolean) => {
    if (autoApproveSaving) return;
    const prev = autoApproveOverride ?? tutor?.auto_approve_bookings ?? false;
    setAutoApproveOverride(next);
    setAutoApproveSaving(true);
    try {
      await updateProfileMe({ profile: { auto_approve_bookings: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setAutoApproveOverride(prev);
      toast.error("Tercih kaydedilemedi.");
    } finally {
      setAutoApproveSaving(false);
    }
  };

  const currentIsPublic =
    isPublicOverride ?? tutorMeData?.is_public ?? tutor?.is_public ?? true;

  const handleVisibilityToggle = async (next: boolean) => {
    if (visibilitySaving) return;
    const prev = currentIsPublic;
    setIsPublicOverride(next);
    setVisibilitySaving(true);
    try {
      await updateProfileMe({ profile: { is_public: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      toast.success(next ? "Profiliniz artık herkese açık." : "Profiliniz artık gizli.");
    } catch {
      setIsPublicOverride(prev);
      toast.error("Görünürlük ayarı kaydedilemedi.");
    } finally {
      setVisibilitySaving(false);
    }
  };

  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const exported = await exportMyData();
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hocam-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Verileriniz indirildi.");
    } catch {
      toast.error("Veriler indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setOpen(false);
    logout();
  };

  // Single-open connected accordion: one active section key (null = all collapsed).
  const sectionKeys = useMemo(
    () => [
      ...(isTutor ? ["profile"] : []),
      "lessons",
      "payment",
      "notifications",
      "security",
      "preferences",
    ],
    [isTutor]
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

  useEffect(() => {
    if (!open) {
      setActiveSection(null);
    }
  }, [open]);

  if (!isAuthenticated) return null;

  const currentAutoApprove = autoApproveOverride ?? tutor?.auto_approve_bookings ?? false;

  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Hesap menüsünü aç"
          className="flex items-center justify-center rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="h-9 w-9 border border-border">
            {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials || <UserCog className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-border p-0 sm:max-w-[420px]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="text-base">Hesabım</SheetTitle>
          <SheetDescription className="sr-only">
            Hesap özetin, hızlı erişim bağlantıların ve ayarların.
          </SheetDescription>
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Kapat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetClose>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <AccountSummary
            isLoading={isLoading && !data}
            fullName={fullName}
            role={role}
            email={user?.email}
            avatarImage={avatarImage}
            initials={initials}
            metaLine={metaLine}
            isVerified={isTutor ? tutorMeData?.is_verified : undefined}
            onEditIdentity={isTutor ? () => go("/profile") : undefined}
            onEditProfile={() => go(editHref)}
            onViewPublicProfile={isTutor && tutorId ? () => go(`/tutors/${tutorId}`) : undefined}
          />

          {/* ---- Profil (tutor-only compact summary) ---- */}
          {isTutor && (
            <ProfileAccordionSection
              icon={<GraduationCap className="h-4 w-4" />}
              title="Profil"
              {...sectionProps("profile")}
            >
              {tutorSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {visibleSubjects.map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-xs">
                      {s.name} · {s.exam_type}
                    </Badge>
                  ))}
                  {extraSubjectsCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{extraSubjectsCount} ders
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">40 dk ders ücreti</span>
                <span className="font-medium text-foreground">
                  {formatPrice(tutorHourlyPrice)}
                </span>
              </div>
              <ProfileMenuRow
                icon={<CalendarClock className="h-4 w-4" />}
                label="Müsaitlik"
                trailingText={
                  definedAvailabilityDays > 0
                    ? `${definedAvailabilityDays} gün tanımlı`
                    : "Henüz eklenmedi"
                }
                showChevron
                onClick={() => go("/dashboard/tutor?tab=availability")}
              />
              <ProfileMenuRow
                icon={hasIntroVideo ? <PlayCircle className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                label="Tanıtım videosu"
                trailingText={hasIntroVideo ? "Eklendi" : "Eklenmedi"}
                showChevron
                onClick={() => {
                  if (hasIntroVideo) {
                    setOpen(false);
                    window.open(tutorIntroVideoUrl, "_blank", "noopener,noreferrer");
                  } else {
                    go(editHref);
                  }
                }}
              />
            </ProfileAccordionSection>
          )}

          {/* ---- Dersler ve Rezervasyonlar ---- */}
          <ProfileAccordionSection
            icon={<CalendarClock className="h-4 w-4" />}
            title="Dersler ve Rezervasyonlar"
            {...sectionProps("lessons")}
          >
            {isTutor && (
              <ProfileToggleRow
                label="Otomatik onay"
                description="Açıkken uygun saatlere gelen ders talepleri otomatik onaylanır; kapalıyken talepleri elle onaylarsın."
                checked={currentAutoApprove}
                onChange={handleAutoApproveToggle}
                loading={autoApproveSaving}
              />
            )}
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

          {/* ---- Ödemeler (role-aware) ---- */}
          <ProfileAccordionSection
            icon={<CreditCard className="h-4 w-4" />}
            title="Ödemeler"
            {...sectionProps("payment")}
          >
            {isTutor ? (
              <>
                <div>
                  <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kazançlar
                  </p>
                  <p className="px-1 pb-2 text-sm text-muted-foreground">
                    Son 7 gün, son 30 gün ve toplam tamamladığın ders sayını gösterir.
                  </p>
                  <ProfileMenuRow
                    icon={<Wallet className="h-4 w-4" />}
                    label="Kazanç özetini gör"
                    showChevron
                    onClick={() => go("/dashboard/tutor?tab=earnings")}
                  />
                </div>
                {showDemoPaymentMethods && (
                  <div>
                    <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ödeme yöntemleri
                    </p>
                    <p className="px-1 py-1.5 text-sm text-muted-foreground">
                      2 demo ödeme yöntemi kayıtlı.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-1 mt-1 h-8"
                      onClick={openPaymentDialog}
                    >
                      <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                      Ödeme yöntemi ekle
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ödeme yöntemleri
                  </p>
                  <p className="px-1 py-1.5 text-sm text-muted-foreground">
                    Henüz kayıtlı ödeme yöntemi yok.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-1 mt-1 h-8"
                    onClick={openPaymentDialog}
                  >
                    <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                    Ödeme yöntemi ekle
                  </Button>
                </div>
                <div>
                  <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ödeme geçmişi
                  </p>
                  <ProfileMenuRow
                    icon={<Receipt className="h-4 w-4" />}
                    label="Paketlerim ve ödeme geçmişim"
                    showChevron
                    onClick={() => go("/profile/payments")}
                  />
                </div>
              </>
            )}
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
              loading={notifSaving.notify_messages}
            />
            <ProfileToggleRow
              label="Ders talebi bildirimleri"
              checked={prefs.notify_lesson_requests}
              onChange={(v) => handleNotificationToggle("notify_lesson_requests", v)}
              loading={notifSaving.notify_lesson_requests}
            />
            <ProfileToggleRow
              label="Rezervasyon hatırlatmaları"
              checked={prefs.notify_booking_reminders}
              onChange={(v) => handleNotificationToggle("notify_booking_reminders", v)}
              loading={notifSaving.notify_booking_reminders}
            />
            <ProfileToggleRow
              label="E-posta bildirimleri"
              checked={prefs.notify_email}
              onChange={(v) => handleNotificationToggle("notify_email", v)}
              loading={notifSaving.notify_email}
            />
          </ProfileAccordionSection>

          {/* ---- Güvenlik ve Gizlilik ---- */}
          <ProfileAccordionSection
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Güvenlik ve Gizlilik"
            {...sectionProps("security")}
          >
            <ProfileMenuRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Güvenlik Ayarları"
              trailingText="Şifre, oturumlar"
              showChevron
              onClick={() => go("/profile/security")}
            />
            {isTutor && (
              <ProfileToggleRow
                icon={<Eye className="h-4 w-4" />}
                label="Profilim herkese açık"
                description={
                  currentIsPublic
                    ? "Hoca listesinde ve aramalarda görünürsün."
                    : "Profilin gizli; hoca listesinde görünmezsin."
                }
                checked={currentIsPublic}
                onChange={handleVisibilityToggle}
                loading={visibilitySaving}
              />
            )}
            <ProfileMenuRow
              icon={<Download className="h-4 w-4" />}
              label="Verilerimi indir"
              trailingText={exporting ? "İndiriliyor…" : undefined}
              disabled={exporting}
              onClick={handleExportData}
            />
          </ProfileAccordionSection>

          {/* ---- Tercihler ---- */}
          <ProfileAccordionSection
            icon={<Globe className="h-4 w-4" />}
            title="Tercihler"
            {...sectionProps("preferences")}
          >
            <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
              <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-foreground">Dil</span>
              <Select value={prefs.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="h-8 w-28 text-xs">
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
              <ThemeSegmentedControl onThemeChange={handleThemeChange} />
            </div>
          </ProfileAccordionSection>
        </div>

        <div className="shrink-0 border-t-0 px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1">
          <AccountDrawerFooter
            onSupport={() => go("/support")}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />
        </div>
      </SheetContent>
    </Sheet>
    <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ödeme Yöntemleri</DialogTitle>
          <DialogDescription>
            Hocam&apos;da ödeme yöntemi yönetimi için hazırlanan ön arayüz.
            Gerçek kart bilgisi alınmaz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <PaymentMethodSelector
            title="Kayıtlı yöntemler"
            actionText="Kart ekle"
            methods={paymentMethods}
            defaultSelectedId={paymentMethods[0]?.id}
            onActionClick={() =>
              setPaymentNotice("Kart ekleme yakında aktif olacak.")
            }
            className="max-w-none"
          />
          {paymentNotice ? (
            <p
              role="status"
              className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
            >
              {paymentNotice}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

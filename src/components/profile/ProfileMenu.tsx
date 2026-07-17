"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  CalendarClock,
  Camera,
  ChevronDown,
  CreditCard,
  Download,
  Eye,
  Globe,
  GraduationCap,
  KeyRound,
  LifeBuoy,
  LogOut,
  Mail,
  Moon,
  Pencil,
  PlayCircle,
  Receipt,
  Settings,
  ShieldCheck,
  Star,
  UserCog,
  Video,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfileMe, updateProfileMe } from "@/lib/profileApi";
import { fetchMyTutorProfile, uploadTutorProfilePicture } from "@/lib/tutorsApi";
import {
  PROFILE_PHOTO_ACCEPT,
  PROFILE_PHOTO_RULE_TEXT,
  TUTOR_REAL_PHOTO_RULE_TEXT,
  validateProfilePhotoFile,
} from "@/lib/profilePhoto";
import { formatPrice } from "@/lib/utils";
import {
  applyInterfaceLanguage,
  getStoredInterfaceLanguage,
  hasStoredInterfaceLanguage,
  isInterfaceLanguage,
} from "@/lib/interfaceLanguage";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedThemeToggler } from "@/components/theme/AnimatedThemeToggler";
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

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

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
    .replace(/[\u0300-\u036f]/g, "")
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");

  // Inline name/surname editing
  const [nameEdit, setNameEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSurname, setEditSurname] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);

  // Profile photo upload (tutor only)
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Optimistic override for auto_approve_bookings
  const [autoApproveOverride, setAutoApproveOverride] = useState<boolean | null>(null);

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

  useEffect(() => {
    const accountLanguage = data?.preferences?.language;
    if (
      accountLanguage &&
      isInterfaceLanguage(accountLanguage) &&
      (!hasStoredInterfaceLanguage() || getStoredInterfaceLanguage() !== accountLanguage)
    ) {
      applyInterfaceLanguage(accountLanguage);
    }
  }, [data?.preferences?.language]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const comingSoon = () => {
    setOpen(false);
    toast.info("Bu özellik yakında eklenecek.");
  };

  const editHref = role === "tutor" ? "/dashboard/tutor/edit" : "/dashboard/student";

  const handleNotificationToggle = async (key: BoolPrefKey, next: boolean) => {
    setPrefOverrides((prev) => ({ ...prev, [key]: next } as Partial<UserPreferences>));
    try {
      await updateProfileMe({ preferences: { [key]: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setPrefOverrides((prev) => ({ ...prev, [key]: !next } as Partial<UserPreferences>));
      toast.error("Tercih kaydedilemedi.");
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
    if (!isInterfaceLanguage(nextLang)) return;
    if (nextLang === prefs.language) {
      applyInterfaceLanguage(nextLang);
      return;
    }
    const prevLang = prefs.language;
    setPrefOverrides((prev) => ({ ...prev, language: nextLang }));
    try {
      await updateProfileMe({ preferences: { language: nextLang } });
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      applyInterfaceLanguage(nextLang);
    } catch {
      setPrefOverrides((prev) => ({ ...prev, language: prevLang }));
      toast.error("Dil ayarı kaydedilemedi.");
    }
  };

  const handleNameSave = async () => {
    const trimmedName = editName.trim();
    const trimmedSurname = editSurname.trim();
    if (!trimmedName || !trimmedSurname) {
      setNameError("İsim ve soyisim boş olamaz.");
      return;
    }
    setNameSaving(true);
    try {
      await updateProfileMe({ profile: { name: trimmedName, surname: trimmedSurname } });
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      setNameEdit(false);
      toast.success("İsim güncellendi.");
    } catch {
      setNameError("İsim güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setNameSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPhotoError(null);
    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }
    setPhotoUploading(true);
    try {
      await uploadTutorProfilePicture(file);
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      if (tutorId) {
        await queryClient.invalidateQueries({ queryKey: ["tutor", tutorId] });
      }
      await queryClient.invalidateQueries({ queryKey: ["tutors"] });
      toast.success("Profil fotoğrafı güncellendi.");
    } catch {
      setPhotoError("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleAutoApproveToggle = async (next: boolean) => {
    const prev = autoApproveOverride ?? tutor?.auto_approve_bookings ?? false;
    setAutoApproveOverride(next);
    try {
      await updateProfileMe({ profile: { auto_approve_bookings: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setAutoApproveOverride(prev);
      toast.error("Tercih kaydedilemedi.");
    }
  };

  // Single-open connected accordion: one active section key (null = all collapsed).
  const sectionKeys = useMemo(
    () => [
      "profile",
      "lessons",
      "payment",
      "security",
      "notifications",
      ...(isTutor ? ["tutor"] : []),
      "advanced",
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
      setNameEdit(false);
      setEditName("");
      setEditSurname("");
    }
  }, [open]);

  if (!isAuthenticated) return null;

  const currentAutoApprove = autoApproveOverride ?? tutor?.auto_approve_bookings ?? false;

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Profil menüsü"
          className="flex min-h-11 items-center gap-1.5 rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:min-h-0"
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
        <div className="scrollbar-none max-h-[min(80vh,640px)] overflow-y-auto rounded-[32px] bg-background/[0.08] p-3 backdrop-blur-lg">

          {/* ---- Profil Detayları ---- */}
          <ProfileAccordionSection
            icon={<UserCog className="h-4 w-4" />}
            title="Profil Detayları"
            {...sectionProps("profile")}
          >
            {/* Avatar row with photo upload for tutors */}
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14 border border-border">
                  {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {initials || <UserCog className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                {isTutor && (
                  <>
                    <input
                      type="file"
                      accept={PROFILE_PHOTO_ACCEPT}
                      hidden
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-opacity disabled:opacity-60"
                      aria-label="Profil fotoğrafı değiştir"
                    >
                      {photoUploading ? (
                        <span
                          className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                          aria-hidden
                        />
                      ) : (
                        <Camera className="h-3 w-3" />
                      )}
                    </button>
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {isLoading && !data ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <p className="truncate text-base font-semibold text-foreground">
                    {fullName || (role === "tutor" ? "Hoca" : "Öğrenci")}
                  </p>
                )}
                {isTutor && (tutorUniversity || tutorDepartment) && (
                  <p className="truncate text-sm text-muted-foreground">
                    {[tutorUniversity, tutorDepartment].filter(Boolean).join(" · ")}
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

            {photoError && (
              <p className="text-xs text-destructive" role="alert">
                {photoError}
              </p>
            )}

            {isTutor && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                <p>{PROFILE_PHOTO_RULE_TEXT}</p>
                <p className="mt-1">{TUTOR_REAL_PHOTO_RULE_TEXT}</p>
                <p className="mt-1 text-amber-800 dark:text-amber-200">
                  JPEG, PNG veya WebP; en fazla 5 MB.
                </p>
              </div>
            )}

            {/* Email (read-only) */}
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-foreground">{user?.email}</span>
              <span className="shrink-0 text-xs text-muted-foreground">E-posta</span>
            </div>

            {/* Role (read-only) */}
            <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm">
              <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-foreground">Rol</span>
              <Badge variant="secondary" className="shrink-0">
                {role === "tutor" ? "Hoca" : "Öğrenci"}
              </Badge>
            </div>

            {/* Full profile page */}
            <ProfileMenuRow
              icon={<UserCog className="h-4 w-4" />}
              label="Profil sayfasına git"
              showChevron
              onClick={() => go("/profile")}
            />

            {/* Inline name / surname edit */}
            {!nameEdit ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setEditName(name);
                  setEditSurname(surname);
                  setNameError(null);
                  setNameEdit(true);
                }}
              >
                <Pencil className="mr-1.5 h-3 w-3" />
                İsim ve soyismi düzenle
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="İsim"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      setNameError(null);
                    }}
                    className="h-8 text-sm"
                    disabled={nameSaving}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                  />
                  <Input
                    placeholder="Soyisim"
                    value={editSurname}
                    onChange={(e) => {
                      setEditSurname(e.target.value);
                      setNameError(null);
                    }}
                    className="h-8 text-sm"
                    disabled={nameSaving}
                  />
                </div>
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setNameEdit(false)}
                    disabled={nameSaving}
                  >
                    İptal
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleNameSave}
                    disabled={nameSaving}
                  >
                    {nameSaving ? (
                      <span
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                        aria-hidden
                      />
                    ) : (
                      "Kaydet"
                    )}
                  </Button>
                </div>
              </div>
            )}

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
            {isTutor && (
              <ProfileToggleRow
                label="Otomatik onay"
                checked={currentAutoApprove}
                onChange={handleAutoApproveToggle}
              />
            )}
            <ProfileMenuRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={isTutor ? "Yaklaşan dersler" : "Derslerim"}
              badgeCount={stats?.upcoming_lessons_count}
              showChevron
              onClick={() => go(isTutor ? "/profile/lessons/upcoming" : "/profile/lessons")}
            />
            {isTutor && (
              <ProfileMenuRow
                icon={<BookOpen className="h-4 w-4" />}
                label="Onay bekleyen rezervasyonlar"
                badgeCount={stats?.pending_bookings_count}
                showChevron
                onClick={() => go("/profile/reservations/pending")}
              />
            )}
            {isTutor && (
              <ProfileMenuRow
                icon={<CalendarClock className="h-4 w-4" />}
                label="Geçmiş dersler"
                showChevron
                onClick={() => go("/profile/lessons/history")}
              />
            )}
            {isTutor && (
              <ProfileMenuRow
                icon={<Star className="h-4 w-4" />}
                label="Değerlendirme bekleyenler"
                badgeCount={stats?.pending_reviews_count}
                showChevron
                onClick={() => go("/profile/reviews/pending")}
              />
            )}
            <Button className="w-full" onClick={() => go("/profile/calendar")}>
              Ders Takvimine Git
            </Button>
          </ProfileAccordionSection>

          {/* ---- Ödeme ve Faturalandırma ---- */}
          <ProfileAccordionSection
            icon={<CreditCard className="h-4 w-4" />}
            title="Ödeme ve Faturalandırma"
            {...sectionProps("payment")}
          >
            <div>
              <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ödeme yöntemleri
              </p>
              <p className="px-1 py-1.5 text-sm text-muted-foreground">
                {showDemoPaymentMethods
                  ? "2 demo ödeme yöntemi kayıtlı."
                  : "Henüz kayıtlı ödeme yöntemi yok."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="ml-1 mt-2 h-8"
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
              onClick={() => go("/profile/security")}
            />
            <ProfileMenuRow
              icon={<Eye className="h-4 w-4" />}
              label="Hesap görünürlüğü"
              showChevron
              onClick={() => go("/profile#account-visibility")}
            />
            <ProfileMenuRow
              icon={<Download className="h-4 w-4" />}
              label="Verilerimi indir"
              showChevron
              onClick={() => go("/profile#data-export")}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => go("/profile/security")}
            >
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
          {isTutor && (
            <ProfileAccordionSection
              icon={<GraduationCap className="h-4 w-4" />}
              title="Eğitmen Profili"
              {...sectionProps("tutor")}
            >
              {tutorSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tutorSubjects.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">40 dk ders ücreti</span>
                <span className="font-medium text-foreground">
                  {formatPrice(tutorHourlyPrice)}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <span className="text-muted-foreground">Müsaitlik saatleri</span>
                {tutorAvailability.length === 0 ? (
                  <p className="text-foreground">Henüz eklenmedi</p>
                ) : (
                  <ul className="space-y-0.5">
                    {tutorAvailability.slice(0, 5).map((a, i) => (
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
              {tutorIntroVideoUrl ? (
                <ProfileMenuRow
                  icon={<PlayCircle className="h-4 w-4" />}
                  label="Tanıtım videosu: Videoyu izle"
                  showChevron
                  onClick={() => {
                    setOpen(false);
                    window.open(tutorIntroVideoUrl, "_blank", "noopener,noreferrer");
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
                disabled={!tutorId}
                onClick={() => tutorId && go(`/tutors/${tutorId}`)}
              >
                Public Profili Gör
              </Button>
            </ProfileAccordionSection>
          )}

          {/* ---- Gelişmiş Ayarlar ---- */}
          <ProfileAccordionSection
            icon={<Settings className="h-6 w-6" />}
            title="Gelişmiş Ayarlar"
            {...sectionProps("advanced")}
          >
            <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
              <span className="shrink-0 text-muted-foreground">
                <Globe className="h-4 w-4" />
              </span>
              <span className="flex-1 text-foreground">Dil</span>
              <select
                value={prefs.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground"
              >
                <option value="tr">Türkçe</option>
                <option value="en">İngilizce</option>
              </select>
            </div>
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
              onClick={() => go("/support")}
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

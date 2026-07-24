"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Download,
  Eye,
  Globe,
  KeyRound,
  LifeBuoy,
  LogOut,
  Mail,
  Moon,
  Receipt,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchProfileMe, updateProfileMe } from "@/lib/profileApi";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
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

  const name = tutorMeData?.name ?? tutor?.name ?? studentProfile?.name ?? "";
  const surname = tutorMeData?.surname ?? tutor?.surname ?? studentProfile?.surname ?? "";
  const fullName = `${name} ${surname}`.trim();
  const initials = getInitials(name, surname);
  const avatarImage =
    tutorMeData?.profile_picture || tutor?.profile_picture || studentProfile?.avatar_url || "";
  const tutorUniversity = tutorMeData?.university ?? tutor?.university ?? "";
  const tutorDepartment = tutorMeData?.department ?? tutor?.department ?? "";
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

  // Single-open connected accordion: one active section key (null = all collapsed).
  const sectionKeys = useMemo(
    () => ["profile", "lessons", "payment", "security", "notifications", "advanced"],
    []
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
        className="w-[calc(100dvw-1rem)] max-w-[440px] border-none bg-transparent p-0 shadow-none sm:w-[440px]"
      >
        <div className="scrollbar-none max-h-[min(80dvh,640px)] min-w-0 overscroll-contain overflow-y-auto rounded-[24px] bg-background/[0.08] p-2 backdrop-blur-lg sm:rounded-[32px] sm:p-3">

          {/* ---- Profil Detayları ---- */}
          <ProfileAccordionSection
            icon={<UserCog className="h-4 w-4" />}
            title="Profil Detayları"
            {...sectionProps("profile")}
          >
            {/* Avatar row */}
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14 border border-border">
                  {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {initials || <UserCog className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
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
              onClick={() => go(isTutor ? editHref : "/profile")}
            />
          </ProfileAccordionSection>

          {/* ---- Dersler ve Rezervasyonlar ---- */}
          <ProfileAccordionSection
            icon={<CalendarClock className="h-4 w-4" />}
            title="Dersler ve Rezervasyonlar"
            {...sectionProps("lessons")}
          >
            <ProfileMenuRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Derslerim"
              badgeCount={stats?.upcoming_lessons_count}
              showChevron
              onClick={() => go(isTutor ? "/profile/lessons/upcoming" : "/profile/lessons")}
            />
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
            {isTutor && (
              <ProfileMenuRow
                icon={<Eye className="h-4 w-4" />}
                label="Hesap görünürlüğü"
                showChevron
                onClick={() => go("/profile#account-visibility")}
              />
            )}
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
                value="tr"
                onChange={() => undefined}
                aria-label="Arayüz dili"
                className="rounded-md border border-input bg-background px-2 py-0.5 text-xs text-foreground"
              >
                <option value="tr">Türkçe</option>
                <option value="en" disabled>
                  İngilizce (yakında)
                </option>
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
          </ProfileAccordionSection>
        </div>
      </PopoverContent>
    </Popover>
    <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogChange}>
      <DialogContent className="w-[calc(100dvw-1rem)] max-w-[calc(100dvw-1rem)] sm:max-w-xl">
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

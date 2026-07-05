"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  Camera,
  CalendarClock,
  Download,
  Eye,
  GraduationCap,
  LifeBuoy,
  LogOut,
  Mail,
  Monitor,
  Pencil,
  ShieldCheck,
  Star,
  UserCog,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  fetchProfileMe,
  updateProfileMe,
  exportMyData,
  uploadStudentProfileAvatar,
  selectStudentAnonymousAvatar,
} from "@/lib/profileApi";
import { logoutAllSessions } from "@/lib/authApi";
import { uploadTutorProfilePicture } from "@/lib/tutorsApi";
import {
  STUDENT_AVATAR_PRESETS,
  type StudentAvatarKey,
} from "@/lib/studentAvatars";
import {
  PROFILE_PHOTO_ACCEPT,
  PROFILE_PHOTO_RULE_TEXT,
  TUTOR_REAL_PHOTO_RULE_TEXT,
  validateProfilePhotoFile,
} from "@/lib/profilePhoto";
import { cn, formatPrice } from "@/lib/utils";
import type { Theme } from "@/lib/theme";
import type {
  ProfileMeResponse,
  ProfileStudent,
  ProfileTutor,
  UserPreferences,
} from "@/types";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ProfileMenuRow, ProfileToggleRow } from "@/components/profile/ProfileMenuRow";
import { AnimatedThemeToggler } from "@/components/theme/AnimatedThemeToggler";
import Link from "next/link";

type BoolPrefKey = keyof Omit<UserPreferences, "language">;

const DEFAULT_PREFS: UserPreferences = {
  dark_mode: false,
  notify_messages: true,
  notify_lesson_requests: true,
  notify_booking_reminders: true,
  notify_email: false,
  language: "tr",
};

const NOTIFICATION_ROWS: { key: BoolPrefKey; label: string }[] = [
  { key: "notify_messages", label: "Yeni mesaj bildirimleri" },
  { key: "notify_lesson_requests", label: "Ders talebi bildirimleri" },
  { key: "notify_booking_reminders", label: "Rezervasyon hatırlatmaları" },
  { key: "notify_email", label: "E-posta bildirimleri" },
];

function getInitials(name: string, surname: string): string {
  return ((name.trim()[0] || "") + (surname.trim()[0] || "")).toUpperCase();
}

function isTutorProfile(
  profile: ProfileTutor | ProfileStudent | null | undefined,
  role: string | undefined
): profile is ProfileTutor {
  return role === "tutor" && !!profile;
}

function ProfileContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [prefOverrides, setPrefOverrides] = useState<Partial<UserPreferences>>({});
  const [isPublicOverride, setIsPublicOverride] = useState<boolean | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [nameEdit, setNameEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSurname, setEditSurname] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [avatarChoicePendingKey, setAvatarChoicePendingKey] =
    useState<StudentAvatarKey | null>(null);
  const [autoApproveOverride, setAutoApproveOverride] = useState<boolean | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["profile-me"],
    queryFn: fetchProfileMe,
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
  const avatarImage = tutor?.profile_picture || studentProfile?.avatar_url || "";

  const prefs: UserPreferences = {
    ...DEFAULT_PREFS,
    ...(data?.preferences ?? {}),
    ...prefOverrides,
  };
  const currentAutoApprove =
    autoApproveOverride ?? tutor?.auto_approve_bookings ?? false;
  const currentIsPublic = isPublicOverride ?? tutor?.is_public ?? true;

  const handleNotificationToggle = async (key: BoolPrefKey, next: boolean) => {
    setPrefOverrides((prev) => ({ ...prev, [key]: next }));
    try {
      await updateProfileMe({ preferences: { [key]: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setPrefOverrides((prev) => ({ ...prev, [key]: !next }));
      toast.error("Tercih kaydedilemedi.");
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

  const handleThemeChange = (nextTheme: Theme) => {
    updateProfileMe({ preferences: { dark_mode: nextTheme === "dark" } }).catch(
      () => undefined
    );
  };

  const updateStudentProfileCache = (nextProfile: ProfileStudent) => {
    queryClient.setQueryData<ProfileMeResponse>(["profile-me"], (current) =>
      current ? { ...current, profile: nextProfile } : current
    );
  };

  const startNameEdit = () => {
    setEditName(name);
    setEditSurname(surname);
    setNameError(null);
    setNameEdit(true);
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
      if (studentProfile) {
        const updatedProfile = await uploadStudentProfileAvatar(file);
        updateStudentProfileCache(updatedProfile);
        await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      } else if (tutor) {
        await uploadTutorProfilePicture(file);
        await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
        await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
        if (tutor.id) {
          await queryClient.invalidateQueries({ queryKey: ["tutor", tutor.id] });
        }
        await queryClient.invalidateQueries({ queryKey: ["tutors"] });
      } else {
        return;
      }
      toast.success("Profil fotoğrafı güncellendi.");
    } catch {
      setPhotoError("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleStudentAvatarChoice = async (avatarKey: StudentAvatarKey) => {
    if (!studentProfile) return;
    setAvatarChoicePendingKey(avatarKey);
    try {
      const updatedProfile = await selectStudentAnonymousAvatar(avatarKey);
      updateStudentProfileCache(updatedProfile);
      await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      toast.success("Hazır avatar seçildi.");
    } catch {
      toast.error("Avatar seçilemedi. Lütfen tekrar deneyin.");
    } finally {
      setAvatarChoicePendingKey(null);
    }
  };

  const handleAutoApproveToggle = async (next: boolean) => {
    const prev = currentAutoApprove;
    setAutoApproveOverride(next);
    try {
      await updateProfileMe({ profile: { auto_approve_bookings: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    } catch {
      setAutoApproveOverride(prev);
      toast.error("Tercih kaydedilemedi.");
    }
  };

  const handleVisibilityToggle = async (next: boolean) => {
    const prev = currentIsPublic;
    setIsPublicOverride(next);
    try {
      await updateProfileMe({ profile: { is_public: next } });
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      toast.success(
        next ? "Profiliniz artık herkese açık." : "Profiliniz artık gizli."
      );
    } catch {
      setIsPublicOverride(prev);
      toast.error("Görünürlük ayarı kaydedilemedi.");
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllSessions();
      toast.success("Tüm oturumlardan çıkış yapıldı.");
      logout();
    } catch {
      toast.error("Oturumlar kapatılamadı. Lütfen tekrar deneyin.");
      setLoggingOutAll(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profilim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hesap kimliğinizi ve tercihlerinizi buradan yönetin. Ders ve ilerleme
          takibi için panonuzu kullanabilirsiniz.
        </p>
      </div>

      <div className="space-y-6">
        {/* ---- Profil Detayları ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profil Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-16 w-16 border border-border">
                  {avatarImage ? <AvatarImage src={avatarImage} alt={fullName} /> : null}
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {initials || <UserCog className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                {(tutor || studentProfile) && (
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
                      disabled={photoUploading || Boolean(avatarChoicePendingKey)}
                      aria-label="Profil fotoğrafını değiştir"
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-opacity disabled:opacity-60"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {nameEdit ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setNameError(null);
                        }}
                        placeholder="İsim"
                      />
                      <Input
                        value={editSurname}
                        onChange={(e) => {
                          setEditSurname(e.target.value);
                          setNameError(null);
                        }}
                        placeholder="Soyisim"
                      />
                    </div>
                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleNameSave} disabled={nameSaving}>
                        Kaydet
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNameEdit(false)}
                        disabled={nameSaving}
                      >
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="truncate text-lg font-semibold text-foreground">
                      {fullName || "İsimsiz kullanıcı"}
                    </p>
                    <button
                      type="button"
                      onClick={startNameEdit}
                      aria-label="İsmi düzenle"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Badge variant="secondary" className="mt-2">
                  {role === "tutor" ? "Eğitmen" : "Öğrenci"}
                </Badge>
              </div>
            </div>
            {photoError && (
              <p className="text-sm text-destructive" role="alert">
                {photoError}
              </p>
            )}
            {tutor && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                <p>{PROFILE_PHOTO_RULE_TEXT}</p>
                <p className="mt-1">{TUTOR_REAL_PHOTO_RULE_TEXT}</p>
              </div>
            )}
            {studentProfile && (
              <div className="space-y-4 rounded-md border border-border bg-muted/20 p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Profil fotoğrafı</p>
                  <p className="text-sm text-muted-foreground">
                    Kendi fotoğrafını yükleyebilir veya hazır anonim avatarlardan
                    birini seçebilirsin.
                  </p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                  {PROFILE_PHOTO_RULE_TEXT}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading || Boolean(avatarChoicePendingKey)}
                >
                  {photoUploading ? (
                    <span
                      className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden
                    />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  {photoUploading ? "Yükleniyor" : "Fotoğraf yükle"}
                </Button>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Hazır avatar seç
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {STUDENT_AVATAR_PRESETS.map((preset) => {
                      const selected =
                        studentProfile.avatar_kind === "anonymous" &&
                        studentProfile.avatar_key === preset.key;
                      const pending = avatarChoicePendingKey === preset.key;

                      return (
                        <button
                          key={preset.key}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handleStudentAvatarChoice(preset.key)}
                          disabled={photoUploading || Boolean(avatarChoicePendingKey)}
                          className={cn(
                            "flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-md border bg-background px-2 py-2 text-xs font-medium text-foreground transition hover:border-primary/60 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60",
                            selected && "border-primary bg-primary/10 text-primary"
                          )}
                        >
                          <Avatar className="h-12 w-12 border border-border bg-muted">
                            <AvatarImage src={preset.url} alt={preset.label} />
                            <AvatarFallback>{preset.label.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <span className="leading-none">
                            {pending ? "Seçiliyor" : preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">E-posta</span>
                <span className="truncate font-medium text-foreground">
                  {user?.email}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">Rol</span>
                <span className="font-medium text-foreground">
                  {role === "tutor" ? "Eğitmen" : "Öğrenci"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---- Hesap Ayarları ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hesap Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-3 px-2 py-1.5 text-sm">
              <span className="flex-1 text-foreground">Dil</span>
              <Select value={prefs.language} onValueChange={handleLanguageChange}>
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
              <AnimatedThemeToggler onThemeChange={handleThemeChange} />
            </div>

            <Separator className="my-2" />
            <p className="flex items-center gap-2 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Bell className="h-3.5 w-3.5" /> Bildirim tercihleri
            </p>
            {NOTIFICATION_ROWS.map((row) => (
              <ProfileToggleRow
                key={row.key}
                label={row.label}
                checked={prefs[row.key]}
                onChange={(next) => handleNotificationToggle(row.key, next)}
              />
            ))}
          </CardContent>
        </Card>

        {/* ---- Hoca Bilgileri (tutor only) ---- */}
        {tutor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hoca Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfileToggleRow
                label="Rezervasyonları otomatik onayla"
                checked={currentAutoApprove}
                onChange={handleAutoApproveToggle}
              />
              <Separator />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Üniversite</dt>
                  <dd className="text-right font-medium text-foreground">
                    {tutor.university || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Bölüm</dt>
                  <dd className="text-right font-medium text-foreground">
                    {tutor.department || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">40 dk ders ücreti</dt>
                  <dd className="text-right font-medium text-foreground">
                    {tutor.hourly_price ? formatPrice(tutor.hourly_price) : "—"}
                  </dd>
                </div>
              </dl>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/tutor/edit">Eğitmen profilini düzenle</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ---- Hesap görünürlüğü ---- */}
        <Card id="account-visibility" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-lg">Hesap görünürlüğü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tutor ? (
              <>
                <ProfileToggleRow
                  label="Profilim herkese açık olsun"
                  checked={currentIsPublic}
                  onChange={handleVisibilityToggle}
                  icon={<Eye className="h-4 w-4" />}
                />
                <p className="px-2 text-xs text-muted-foreground">
                  {currentIsPublic
                    ? "Profiliniz hoca listesinde görünür ve öğrenciler tarafından bulunabilir."
                    : "Profiliniz şu anda gizli; hoca listesinde ve aramalarda görünmez. Mevcut konuşmalarınız ve panonuz etkilenmez."}
                </p>
              </>
            ) : (
              <div className="flex gap-3 px-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Öğrenci profilleri herkese açık değildir. Bilgileriniz yalnızca
                  ders aldığınız hocalarla ve platform politikası gereği gerekli
                  durumlarda paylaşılır.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---- Oturumları yönet ---- */}
        <Card id="data-export" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="text-lg">Oturumları yönet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hesabınıza giriş bir oturum anahtarı (token) ile sağlanır. Şu anda
              cihazlar ayrı ayrı listelenmez; tüm oturumlardan çıkış, oturum
              anahtarınızı sıfırlayarak giriş yapılmış tüm cihazları kapatır.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={logout}>
                <Monitor className="mr-2 h-4 w-4" />
                Bu cihazdan çıkış yap
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
              >
                {loggingOutAll ? (
                  <span
                    className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden
                  />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Tüm oturumlardan çıkış yap
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ---- Verilerimi indir ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verilerimi indir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hesabınıza ait verileri (profil, tercihler, destek talepleri, ders
              talepleri ve rezervasyonlar) JSON dosyası olarak indirebilirsiniz.
              Yalnızca size ait veriler dışa aktarılır.
            </p>
            <Button variant="outline" onClick={handleExportData} disabled={exporting}>
              {exporting ? (
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Verilerimi indir (.json)
            </Button>
          </CardContent>
        </Card>

        {/* ---- Hızlı Erişim ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ProfileMenuRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Yaklaşan dersler"
              showChevron
              onClick={() => router.push("/profile/lessons/upcoming")}
            />
            <ProfileMenuRow
              icon={<BookOpen className="h-4 w-4" />}
              label="Ders geçmişi"
              showChevron
              onClick={() => router.push("/profile/lessons/history")}
            />
            {role === "student" && (
              <ProfileMenuRow
                icon={<Star className="h-4 w-4" />}
                label="Bekleyen değerlendirmeler"
                showChevron
                onClick={() => router.push("/profile/reviews/pending")}
              />
            )}
            <ProfileMenuRow
              icon={<Eye className="h-4 w-4" />}
              label="Hesap görünürlüğü"
              showChevron
              onClick={() => router.push("/profile#account-visibility")}
            />
            <ProfileMenuRow
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Güvenlik ayarları"
              showChevron
              onClick={() => router.push("/profile/security")}
            />
            <ProfileMenuRow
              icon={<Download className="h-4 w-4" />}
              label="Verilerimi indir"
              showChevron
              onClick={() => router.push("/profile#data-export")}
            />
            <ProfileMenuRow
              icon={<LifeBuoy className="h-4 w-4" />}
              label="Destek"
              showChevron
              onClick={() => router.push("/support")}
            />
            <ProfileMenuRow
              icon={<GraduationCap className="h-4 w-4" />}
              label="Panoma git"
              showChevron
              onClick={() =>
                router.push(role === "tutor" ? "/dashboard/tutor" : "/dashboard/student")
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RouteGuard requireAuth>
      <ProfileContent />
    </RouteGuard>
  );
}

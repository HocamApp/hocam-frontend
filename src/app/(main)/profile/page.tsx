"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import {
  fetchProfileMe,
  updateProfileMe,
  uploadStudentProfileAvatar,
  selectStudentAnonymousAvatar,
} from "@/lib/profileApi";
import {
  fetchMyTutorProfile,
  updateMyTutorProfile,
  uploadTutorProfilePicture,
} from "@/lib/tutorsApi";
import { validateProfilePhotoFile } from "@/lib/profilePhoto";
import type { StudentAvatarKey } from "@/lib/studentAvatars";
import { formatPrice } from "@/lib/utils";
import type { Theme } from "@/lib/theme";
import type {
  ProfileMeResponse,
  ProfileStudent,
  ProfileTutor,
  UserPreferences,
} from "@/types";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionCardTitle } from "@/components/profile/SectionCardTitle";
import { Separator } from "@/components/ui/separator";
import { ProfileToggleRow } from "@/components/profile/ProfileMenuRow";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { AccountPreferences } from "@/components/profile/AccountPreferences";
import { SecurityPrivacySection } from "@/components/profile/SecurityPrivacySection";
import { StudentLearningSummary } from "@/components/profile/StudentLearningSummary";
import { TutorVideoSection } from "@/components/profile/TutorVideoSection";

type BoolPrefKey = keyof Omit<UserPreferences, "language">;

const DEFAULT_PREFS: UserPreferences = {
  dark_mode: false,
  notify_messages: true,
  notify_lesson_requests: true,
  notify_booking_reminders: true,
  notify_email: false,
  language: "tr",
};

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
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [prefOverrides, setPrefOverrides] = useState<Partial<UserPreferences>>({});
  const [isPublicOverride, setIsPublicOverride] = useState<boolean | null>(null);
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
  const isTutor = role === "tutor";
  const profile = data?.profile ?? null;
  const tutor = isTutorProfile(profile, role) ? profile : null;
  const studentProfile = !tutor && profile ? (profile as ProfileStudent) : null;

  const { data: tutorMeData, isLoading: tutorMeLoading } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isTutor,
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

  const prefs: UserPreferences = {
    ...DEFAULT_PREFS,
    ...(data?.preferences ?? {}),
    ...prefOverrides,
  };
  const currentAutoApprove =
    autoApproveOverride ?? tutor?.auto_approve_bookings ?? false;
  const currentIsPublic =
    isPublicOverride ?? tutorMeData?.is_public ?? tutor?.is_public ?? true;

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
    setPrefOverrides((prev) => ({ ...prev, dark_mode: nextTheme === "dark" }));
    updateProfileMe({ preferences: { dark_mode: nextTheme === "dark" } }).catch(
      () => undefined
    );
  };

  const updateStudentProfileCache = (nextProfile: ProfileStudent) => {
    queryClient.setQueryData<ProfileMeResponse>(["profile-me"], (current) =>
      current ? { ...current, profile: nextProfile } : current
    );
  };

  const handleSaveName = async (newName: string, newSurname: string) => {
    await updateProfileMe({ profile: { name: newName, surname: newSurname } });
    await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
    toast.success("İsim güncellendi.");
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
      } else if (isTutor) {
        await uploadTutorProfilePicture(file);
        await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
        await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
        if (tutorId) {
          await queryClient.invalidateQueries({ queryKey: ["tutor", tutorId] });
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

  const handleSaveIntroVideo = async (url: string) => {
    await updateMyTutorProfile({ intro_video_url: url });
    await queryClient.invalidateQueries({ queryKey: ["profile-me"] });
    await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
    if (tutorId) {
      await queryClient.invalidateQueries({ queryKey: ["tutor", tutorId] });
    }
    await queryClient.invalidateQueries({ queryKey: ["tutors"] });
    toast.success(url ? "Tanıtım videosu güncellendi." : "Tanıtım videosu kaldırıldı.");
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

  if (isLoading || (isTutor && tutorMeLoading)) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profilim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hesap bilgilerini, tercihlerini ve güvenlik ayarlarını buradan yönet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start lg:gap-8">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <ProfileSummary
                fullName={fullName}
                name={name}
                surname={surname}
                role={role}
                email={user?.email}
                avatarImage={avatarImage}
                initials={initials}
                studentMeta={
                  studentProfile
                    ? {
                        targetExamType: studentProfile.target_exam_type,
                        school: studentProfile.school,
                        grade: studentProfile.grade,
                      }
                    : undefined
                }
                onSave={handleSaveName}
                avatarEditor={
                  <AvatarEditor
                    avatarImage={avatarImage}
                    initials={initials}
                    fullName={fullName}
                    isStudent={Boolean(studentProfile)}
                    isTutor={isTutor}
                    photoUploading={photoUploading}
                    photoError={photoError}
                    fileInputRef={photoInputRef}
                    onPickFile={() => photoInputRef.current?.click()}
                    onFileChange={handlePhotoUpload}
                    studentAvatar={
                      studentProfile
                        ? {
                            avatarKind: studentProfile.avatar_kind,
                            avatarKey: studentProfile.avatar_key,
                          }
                        : undefined
                    }
                    avatarChoicePendingKey={avatarChoicePendingKey}
                    onChooseStudentAvatar={handleStudentAvatarChoice}
                  />
                }
              />
            </CardContent>
          </Card>

          {isTutor ? (
            <Card>
              <CardHeader>
                <SectionCardTitle className="text-base">Hoca Bilgileri</SectionCardTitle>
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
                      {tutorUniversity || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Bölüm</dt>
                    <dd className="text-right font-medium text-foreground">
                      {tutorDepartment || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">40 dk ders ücreti</dt>
                    <dd className="text-right font-medium text-foreground">
                      {tutorHourlyPrice ? formatPrice(tutorHourlyPrice) : "—"}
                    </dd>
                  </div>
                </dl>
                <Separator />
                <TutorVideoSection
                  introVideoUrl={tutorIntroVideoUrl}
                  fullName={fullName}
                  onSave={handleSaveIntroVideo}
                />
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/tutor/edit">Eğitmen profilini düzenle</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <StudentLearningSummary
              pendingReviewsCount={data?.stats.pending_reviews_count ?? 0}
              pendingBookingsCount={data?.stats.pending_bookings_count ?? 0}
            />
          )}
        </div>

        {/* Secondary column */}
        <div className="space-y-6">
          <AccountPreferences
            preferences={prefs}
            onLanguageChange={handleLanguageChange}
            onThemeChange={handleThemeChange}
            onNotificationToggle={handleNotificationToggle}
          />
          <SecurityPrivacySection
            isTutor={isTutor}
            isPublic={currentIsPublic}
            onVisibilityToggle={handleVisibilityToggle}
            onLogout={logout}
          />
        </div>
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

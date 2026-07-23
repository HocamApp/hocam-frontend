"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  applyInterfaceLanguage,
  getStoredInterfaceLanguage,
  hasStoredInterfaceLanguage,
  isInterfaceLanguage,
} from "@/lib/interfaceLanguage";
import type { ProfileMeResponse, ProfileStudent, ProfileTutor } from "@/types";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionCardTitle } from "@/components/profile/SectionCardTitle";
import { Separator } from "@/components/ui/separator";
import { ProfileToggleRow } from "@/components/profile/ProfileMenuRow";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { StudentLearningProfile } from "@/components/profile/StudentLearningProfile";
import { TutorVideoSection } from "@/components/profile/TutorVideoSection";

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
  const { user } = useAuth();
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

  const currentAutoApprove =
    autoApproveOverride ?? tutor?.auto_approve_bookings ?? false;

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

  if (isLoading || (isTutor && tutorMeLoading)) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const identitySummary = (
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
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-clip px-4 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profilim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isTutor
            ? "Hesap bilgilerini ve hoca ayarlarını buradan yönet."
            : "Öğrenme geçmişini ve hesap bilgilerini bir arada gör."}
        </p>
      </div>

      {isTutor ? (
        <div className="space-y-6 lg:space-y-8">
          {identitySummary}
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
              <Separator />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Canlı Ders Eğitimi</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Ders ekranı rehberini istediğin zaman tekrar izle — aktivasyonunu etkilemez.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href="/tutor/tutorial?replay=1">Tekrar izle</Link>
                </Button>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/tutor/edit">Eğitmen profilini düzenle</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-8">
          {identitySummary}
          <StudentLearningProfile />
        </div>
      )}
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

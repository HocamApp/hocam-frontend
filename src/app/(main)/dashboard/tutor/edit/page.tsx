"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Save } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyTutorProfile,
  fetchSubjects,
  fetchTutorPriceInsight,
  updateMyTutorProfile,
  uploadTutorProfilePicture,
} from "@/lib/tutorsApi";
import { validateProfilePhotoFile } from "@/lib/profilePhoto";
import { filterSelectedSubjectIds } from "@/lib/subjects";
import type { TutorProfile } from "@/types";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BIO_MAX_LENGTH,
  BIO_RECOMMENDED_LENGTH,
  EducationSection,
  getYouTubeEmbedUrl,
  IntroVideoSection,
  PricingSection,
  ProfileBasicsSection,
  SubjectsSection,
  type TutorProfileEditValues,
} from "@/components/tutors/profile-editor/TutorProfileFormSections";
import {
  TutorProfileEditSidebar,
  type ProfileActionItem,
} from "@/components/tutors/profile-editor/TutorProfileEditSidebar";

const editSchema = z.object({
  university: z.string().min(1, "Üniversite zorunludur"),
  department: z.string().min(1, "Bölüm zorunludur"),
  yks_rank: z
    .string()
    .min(1, "YKS sıralaması zorunludur")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 4_000_000,
      { message: "Sıralama 1-4.000.000 arasında olmalıdır" }
    ),
  hourly_price: z
    .string()
    .min(1, "Ders ücreti zorunludur")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "Ücret pozitif olmalıdır",
    }),
  intro_video_url: z
    .string()
    .optional()
    .refine((value) => !value || getYouTubeEmbedUrl(value) !== null, {
      message: "Geçerli bir YouTube video bağlantısı gir.",
    }),
  bio: z.string().max(BIO_MAX_LENGTH, "Hakkımda en fazla 1000 karakter olabilir").optional(),
});

type EditFormValues = z.infer<typeof editSchema> & TutorProfileEditValues;
type SaveState = "idle" | "success" | "error";

function getFormValues(profile: TutorProfile): EditFormValues {
  const pending = profile.pending_profile_change;
  return {
    university: profile.university ?? "",
    department: profile.department ?? "",
    yks_rank: profile.yks_rank != null ? String(profile.yks_rank) : "",
    hourly_price: profile.hourly_price != null ? String(profile.hourly_price) : "",
    intro_video_url: pending?.intro_video_url ?? profile.intro_video_url ?? "",
    bio: (profile.bio ?? "").slice(0, BIO_MAX_LENGTH),
  };
}

function sameIds(left: string[], right: string[]) {
  return [...left].sort().join("|") === [...right].sort().join("|");
}

function ProfileEditorSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
        <div className="space-y-5">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    </div>
  );
}

function TutorProfileEditContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const initializedProfileId = useRef<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [initialSubjectIds, setInitialSubjectIds] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [videoPreviewFailed, setVideoPreviewFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated,
  });
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    enabled: isAuthenticated,
  });
  const {
    data: priceInsight,
    isLoading: priceInsightLoading,
    isError: priceInsightError,
  } = useQuery({
    queryKey: ["tutor-price-insight", [...selectedSubjectIds].sort()],
    queryFn: () => fetchTutorPriceInsight(selectedSubjectIds),
    enabled: isAuthenticated && Boolean(profile) && selectedSubjectIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<EditFormValues>({
    defaultValues: {
      university: "",
      department: "",
      yks_rank: "",
      hourly_price: "",
      intro_video_url: "",
      bio: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!profile || initializedProfileId.current === profile.id) return;
    form.reset(getFormValues(profile));
    const profileSubjectIds = profile.subjects.map((subject) => subject.id);
    setSelectedSubjectIds(profileSubjectIds);
    setInitialSubjectIds(profileSubjectIds);
    initializedProfileId.current = profile.id;
  }, [form, profile]);

  useEffect(() => {
    if (subjects.length === 0) return;
    setSelectedSubjectIds((current) => filterSelectedSubjectIds(subjects, current));
    setInitialSubjectIds((current) => filterSelectedSubjectIds(subjects, current));
  }, [subjects]);

  const watchedValues = form.watch();
  const bioValue = watchedValues.bio ?? "";
  const introVideoValue = watchedValues.intro_video_url ?? "";
  const introEmbedUrl = getYouTubeEmbedUrl(introVideoValue);
  const selectedSubjects = useMemo(
    () => subjects.filter((subject) => selectedSubjectIds.includes(subject.id)),
    [selectedSubjectIds, subjects]
  );
  const subjectsAreDirty = !sameIds(selectedSubjectIds, initialSubjectIds);
  const isDirty = form.formState.isDirty || subjectsAreDirty;
  const canSave =
    isDirty && editSchema.safeParse(watchedValues).success && selectedSubjectIds.length > 0;

  useEffect(() => {
    if (isDirty && saveState === "success") setSaveState("idle");
  }, [isDirty, saveState]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => setVideoPreviewFailed(false), [introEmbedUrl]);

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((current) =>
      current.includes(id) ? current.filter((subjectId) => subjectId !== id) : [...current, id]
    );
    setSubjectError(null);
    setSaveState("idle");
  };

  const setSchemaErrors = (result: z.SafeParseError<EditFormValues>) => {
    const fieldErrors = result.error.flatten().fieldErrors;
    for (const fieldName of Object.keys(fieldErrors) as Array<keyof EditFormValues>) {
      const message = fieldErrors[fieldName]?.[0];
      if (message) form.setError(fieldName, { message });
    }
  };

  const onSubmit = async (data: EditFormValues) => {
    const parsed = editSchema.safeParse(data);
    if (!parsed.success) {
      setSchemaErrors(parsed);
      return;
    }
    const supportedIds = filterSelectedSubjectIds(subjects, selectedSubjectIds);
    if (supportedIds.length === 0) {
      setSubjectError("Profilini kaydetmek için en az bir ders seç.");
      document.getElementById("subjects")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setGeneralError(null);
    setSaveState("idle");
    try {
      const updatedProfile = await updateMyTutorProfile({
        hourly_price: parsed.data.hourly_price,
        intro_video_url: parsed.data.intro_video_url ?? "",
        bio: parsed.data.bio ?? "",
        subject_ids: supportedIds,
      });
      queryClient.setQueryData(["tutor-me"], updatedProfile);
      form.reset(getFormValues(updatedProfile));
      const savedIds = updatedProfile.subjects.map((subject) => subject.id);
      setSelectedSubjectIds(savedIds);
      setInitialSubjectIds(savedIds);
      setSaveState("success");
      toast.success(
        updatedProfile.is_verified
          ? "Profil kaydedildi. Doğrulanmış bilgi değişiklikleri incelemeye gönderildi."
          : "Profil kaydedildi. Tanıtım videosu yayınlanmadan önce incelenecek."
      );
    } catch (error: unknown) {
      setSaveState("error");
      const responseData = (error as { response?: { data?: unknown } }).response?.data;
      if (responseData && typeof responseData === "object") {
        const dataRecord = responseData as Record<string, unknown>;
        const fieldMap: Record<string, keyof EditFormValues> = {
          hourly_price: "hourly_price",
          intro_video_url: "intro_video_url",
          bio: "bio",
        };
        let hasFieldError = false;
        for (const [apiKey, formKey] of Object.entries(fieldMap)) {
          if (Array.isArray(dataRecord[apiKey])) {
            form.setError(formKey, { message: String(dataRecord[apiKey][0]) });
            hasFieldError = true;
          }
        }
        if (!hasFieldError) {
          setGeneralError(
            typeof dataRecord.detail === "string"
              ? dataRecord.detail
              : "Profil kaydedilemedi. Alanları kontrol edip tekrar dene."
          );
        }
      } else {
        setGeneralError("Profil kaydedilemedi. Bağlantını kontrol edip tekrar dene.");
      }
    }
  };

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setPhotoError(null);
    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }
    setPhotoUploading(true);
    try {
      const updatedProfile = await uploadTutorProfilePicture(file);
      queryClient.setQueryData(["tutor-me"], updatedProfile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile-me"] }),
        queryClient.invalidateQueries({ queryKey: ["tutor", updatedProfile.id] }),
        queryClient.invalidateQueries({ queryKey: ["tutors"] }),
      ]);
      toast.success("Profil fotoğrafı güncellendi.");
    } catch {
      setPhotoError("Fotoğraf yüklenemedi. Dosyayı kontrol edip tekrar dene.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDiscard = () => {
    if (isDirty) setDiscardDialogOpen(true);
    else router.push("/dashboard/tutor");
  };

  const applyRecommendedPrice = (recommendedPrice: number) => {
    form.setValue("hourly_price", String(recommendedPrice), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setSaveState("idle");
    toast.success("Önerilen fiyat forma eklendi.");
  };

  const applyAIBio = (value: string) => {
    form.setValue("bio", value.slice(0, BIO_MAX_LENGTH), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setSaveState("idle");
    document
      .getElementById("profile-basics")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.success("AI taslağı Hakkımda alanına eklendi. Kaydetmeden önce gözden geçir.");
  };

  if (profileLoading) return <ProfileEditorSkeleton />;
  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ErrorMessage message="Profil yüklenemedi. Bağlantını kontrol edip tekrar dene." />
        <Button type="button" variant="outline" className="mt-4" onClick={() => refetchProfile()}>
          Tekrar dene
        </Button>
      </div>
    );
  }

  const price = Number(watchedValues.hourly_price);
  const sixtyMinutePrice = Number.isFinite(price) && price > 0 ? price * 1.5 : null;
  const mandatoryChecks: ProfileActionItem[] = [
    { label: "Üniversiteni ekle", target: "#education" },
    { label: "Bölümünü ekle", target: "#education" },
    { label: "Geçerli YKS sıralamanı ekle", target: "#education" },
    { label: "40 dakikalık ders ücretini ekle", target: "#pricing" },
    { label: "En az bir ders seç", target: "#subjects" },
  ];
  const missingRequirements = mandatoryChecks.filter((_, index) => {
    if (index === 0) return !watchedValues.university.trim();
    if (index === 1) return !watchedValues.department.trim();
    if (index === 2) return !(Number(watchedValues.yks_rank) > 0);
    if (index === 3) return !(Number(watchedValues.hourly_price) > 0);
    return selectedSubjectIds.length === 0;
  });
  const suggestions: ProfileActionItem[] = [
    ...(!profile.profile_picture
      ? [{ label: "Profil fotoğrafı ekle", target: "#profile-basics" }]
      : []),
    ...(bioValue.length < BIO_RECOMMENDED_LENGTH
      ? [{ label: `Hakkımda yazını en az ${BIO_RECOMMENDED_LENGTH} karaktere tamamla`, target: "#profile-basics" }]
      : []),
    ...(!introVideoValue
      ? [{ label: "Tanıtım videosu ekle", target: "#intro-video" }]
      : []),
  ];
  const sidebarProps = {
    profile,
    university: watchedValues.university,
    department: watchedValues.department,
    yksRank: watchedValues.yks_rank,
    hourlyPrice: watchedValues.hourly_price,
    bio: bioValue,
    selectedSubjects,
    missingRequirements,
    suggestions,
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-28 lg:pb-12">
      <div className="relative z-40 border-b bg-background lg:sticky lg:top-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profili Düzenle</h1>
              <Badge variant={profile.is_public ? "secondary" : "outline"}>
                {profile.is_public ? "Profil yayında" : "Profil yayında değil"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Öğrencilerin göreceği bilgileri düzenle ve profilini güncel tut.
            </p>
            <div className="mt-1 min-h-5 text-sm" aria-live="polite">
              {isDirty ? (
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  Kaydedilmemiş değişiklikler
                </span>
              ) : saveState === "success" ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Değişiklikler kaydedildi
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {profile.is_public && profile.is_verified && (
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href={`/tutors/${profile.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" aria-hidden /> Profili Görüntüle
                </Link>
              </Button>
            )}
            <Button
              type="submit"
              form="tutor-profile-form"
              disabled={!canSave || form.formState.isSubmitting}
              className="hidden lg:inline-flex"
            >
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {form.formState.isSubmitting ? "Kaydediliyor" : "Kaydet"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Form {...form}>
          <form id="tutor-profile-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <main className="min-w-0 space-y-6">
                {generalError && <ErrorMessage message={generalError} />}
                <ProfileBasicsSection
                  form={form}
                  profile={profile}
                  bioValue={bioValue}
                  photoInputRef={photoInputRef}
                  photoUploading={photoUploading}
                  photoError={photoError}
                  onPhotoUpload={handlePhotoUpload}
                />
                <div className="lg:hidden">
                  <TutorProfileEditSidebar {...sidebarProps} />
                </div>
                <EducationSection form={form} profile={profile} />
                <SubjectsSection
                  subjects={subjects}
                  selectedIds={selectedSubjectIds}
                  loading={subjectsLoading}
                  error={subjectError}
                  onToggle={toggleSubject}
                />
                <PricingSection
                  form={form}
                  sixtyMinutePrice={sixtyMinutePrice}
                  priceInsight={priceInsight}
                  priceInsightLoading={priceInsightLoading}
                  priceInsightError={priceInsightError}
                  onApplyRecommendedPrice={applyRecommendedPrice}
                />
                <IntroVideoSection
                  form={form}
                  profile={profile}
                  introVideoValue={introVideoValue}
                  introEmbedUrl={introEmbedUrl}
                  previewFailed={videoPreviewFailed}
                  onPreviewError={() => setVideoPreviewFailed(true)}
                />
                <div className="flex flex-col-reverse gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="button" variant="outline" onClick={handleDiscard}>
                    Değişiklikleri iptal et
                  </Button>
                  <Button type="submit" disabled={!canSave || form.formState.isSubmitting}>
                    <Save className="mr-2 h-4 w-4" aria-hidden />
                    {form.formState.isSubmitting ? "Kaydediliyor" : "Değişiklikleri Kaydet"}
                  </Button>
                </div>
              </main>
              <div className="hidden lg:block">
                <TutorProfileEditSidebar {...sidebarProps} />
              </div>
            </div>
          </form>
        </Form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-lg lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={handleDiscard}>
            Değişiklikleri iptal et
          </Button>
          <Button
            type="submit"
            form="tutor-profile-form"
            className="flex-1"
            disabled={!canSave || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Kaydediliyor" : "Kaydet"}
          </Button>
        </div>
      </div>

      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kaydedilmemiş değişiklikleri iptal et</DialogTitle>
            <DialogDescription>
              Bu sayfada yaptığın ve henüz kaydetmediğin değişiklikler silinecek. Devam etmek istiyor musun?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDiscardDialogOpen(false)}>
              Düzenlemeye devam et
            </Button>
            <Button type="button" variant="destructive" onClick={() => router.push("/dashboard/tutor")}>
              Değişiklikleri İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AISupportChatWidget
        title="Hocam AI Profil Yardımcısı"
        welcomeMessage="Merhaba! Profilini güçlendirmek, fiyatını değerlendirmek ve sana uygun bir Hakkımda yazısı hazırlamak için buradayım."
        starterPrompts={[
          "Profilimi değerlendir.",
          "Hakkımda yazımı hazırla.",
          "Fiyatımı nasıl belirlemeliyim?",
          "Bu fiyatla elime ne kadar geçer?",
        ]}
        getRequestContext={() => ({
          surface: "tutor_profile_edit",
          draft_profile: {
            bio: bioValue,
            hourly_price:
              Number(watchedValues.hourly_price) > 0
                ? Number(watchedValues.hourly_price)
                : profile.hourly_price,
            subject_ids: selectedSubjectIds,
          },
        })}
        onApplyProfileBio={applyAIBio}
        attentionMessage="Yardımcı olmamı ister misin?"
        attentionStorageKey="hocam:tutor-profile-ai-nudge-shown"
        positionClassName="bottom-24 sm:bottom-24 lg:bottom-6"
        panelClassName="h-[min(640px,calc(100vh-176px))] lg:h-[min(680px,calc(100vh-112px))]"
      />
    </div>
  );
}

export default function TutorProfileEditPage() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <TutorProfileEditContent />
    </RouteGuard>
  );
}

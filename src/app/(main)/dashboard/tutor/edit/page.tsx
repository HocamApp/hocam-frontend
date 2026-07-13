"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyTutorProfile,
  fetchSubjects,
  updateMyTutorProfile,
} from "@/lib/tutorsApi";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { filterSelectedSubjectIds, groupSubjectsByExam } from "@/lib/subjects";

const BIO_MAX_LENGTH = 1000;

const editSchema = z.object({
  university: z.string().min(1, "Üniversite zorunludur"),
  department: z.string().min(1, "Bölüm zorunludur"),
  yks_rank: z
    .string()
    .min(1, "YKS sıralaması zorunludur")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 4_000_000,
      { message: "Sıralama 1-4.000.000 arasında olmalıdır" }
    ),
  hourly_price: z
    .string()
    .min(1, "Ders ücreti zorunludur")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Ücret pozitif olmalıdır",
    }),
  intro_video_url: z.string().optional(),
  bio: z.string().max(BIO_MAX_LENGTH, "Hakkımda en fazla 1000 karakter olabilir").optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0] || "")) {
          videoId = parts[1] || "";
        }
      }
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function TutorProfileEditContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated,
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    enabled: isAuthenticated,
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
    mode: "onSubmit",
  });

  useEffect(() => {
    if (profile && !profileLoaded) {
      const pendingChange = profile.pending_profile_change;
      form.reset({
        university: pendingChange?.university ?? profile.university ?? "",
        department: pendingChange?.department ?? profile.department ?? "",
        yks_rank:
          pendingChange?.yks_rank != null
            ? String(pendingChange.yks_rank)
            : profile.yks_rank != null
              ? String(profile.yks_rank)
              : "",
        hourly_price: profile.hourly_price != null ? String(profile.hourly_price) : "",
        intro_video_url: pendingChange?.intro_video_url ?? profile.intro_video_url ?? "",
        bio: (profile.bio ?? "").slice(0, BIO_MAX_LENGTH),
      });
      setSelectedSubjectIds(profile.subjects.map((s) => s.id));
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded, form]);

  useEffect(() => {
    if (subjects.length === 0) return;
    setSelectedSubjectIds((prev) => filterSelectedSubjectIds(subjects, prev));
  }, [subjects]);

  const bioValue = form.watch("bio") ?? "";
  const introVideoValue = form.watch("intro_video_url") ?? "";
  const introEmbedUrl = getYouTubeEmbedUrl(introVideoValue);

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSubjectError(null);
  };

  const onSubmit = async (data: EditFormValues) => {
    const parsed = editSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.university)
        form.setError("university", { message: err.fieldErrors.university[0] });
      if (err.fieldErrors.department)
        form.setError("department", { message: err.fieldErrors.department[0] });
      if (err.fieldErrors.yks_rank)
        form.setError("yks_rank", { message: err.fieldErrors.yks_rank[0] });
      if (err.fieldErrors.hourly_price)
        form.setError("hourly_price", { message: err.fieldErrors.hourly_price[0] });
      return;
    }
    const supportedSelectedSubjectIds = filterSelectedSubjectIds(subjects, selectedSubjectIds);
    if (supportedSelectedSubjectIds.length === 0) {
      setSubjectError("En az bir ders seçin");
      return;
    }

    setGeneralError(null);
    try {
      const updatedProfile = await updateMyTutorProfile({
        university: parsed.data.university,
        department: parsed.data.department,
        yks_rank: Number(parsed.data.yks_rank),
        hourly_price: parsed.data.hourly_price,
        intro_video_url: parsed.data.intro_video_url ?? "",
        bio: parsed.data.bio ?? "",
        subject_ids: supportedSelectedSubjectIds,
      });

      queryClient.setQueryData(["tutor-me"], updatedProfile);
      setProfileLoaded(false);
      toast.success(
        updatedProfile.is_verified
          ? "Profil güncellendi. Doğrulanmış bilgiler incelemeye gönderildi."
          : "Profil güncellendi. Tanıtım videosu yayınlanmadan önce incelenecek."
      );
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: unknown } };
      const respData = axErr.response?.data;
      if (respData && typeof respData === "object") {
        const d = respData as Record<string, unknown>;
        const fieldMap: Record<string, keyof EditFormValues> = {
          university: "university",
          department: "department",
          yks_rank: "yks_rank",
          hourly_price: "hourly_price",
          intro_video_url: "intro_video_url",
          bio: "bio",
        };
        let hasFieldError = false;
        for (const [apiKey, formKey] of Object.entries(fieldMap)) {
          if (Array.isArray(d[apiKey])) {
            form.setError(formKey, {
              message: String((d[apiKey] as string[])[0]),
            });
            hasFieldError = true;
          }
        }
        if (!hasFieldError) {
          const detail =
            typeof d.detail === "string"
              ? d.detail
              : "Profil güncellenemedi. Lütfen bilgileri kontrol et.";
          setGeneralError(detail);
        }
      } else {
        setGeneralError("Profil güncellenemedi. Lütfen bilgileri kontrol et.");
      }
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ErrorMessage message="Profil yüklenemedi. Lütfen tekrar dene." />
      </div>
    );
  }

  const subjectGroups = groupSubjectsByExam(subjects);
  const pendingChange = profile.pending_profile_change;
  const profileStrengthItems = [
    { label: "Kimlik ve eğitim doğrulaması", complete: profile.is_verified },
    { label: "Profil fotoğrafı", complete: Boolean(profile.profile_picture) },
    { label: "En az 80 karakterlik tanıtım", complete: (profile.bio ?? "").length >= 80 },
    { label: "En az bir ders", complete: profile.subjects.length > 0 },
    {
      label: "Onaylı tanıtım videosu",
      complete: profile.intro_video_status === "approved",
    },
  ];
  const completedProfileItems = profileStrengthItems.filter((item) => item.complete).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profili Düzenle</CardTitle>
          <CardDescription>
            {profile.name} {profile.surname} — bilgilerini güncelleyebilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Profil görünürlüğü: {completedProfileItems}/5 tamamlandı</p>
            <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
              {profileStrengthItems.map((item) => (
                <li key={item.label} className={item.complete ? "text-foreground" : undefined}>
                  {item.complete ? "✓" : "○"} {item.label}
                </li>
              ))}
            </ul>
          </div>

          {pendingChange && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="font-medium">Doğrulanmış bilgi değişikliği incelemede</p>
              <p className="mt-1">
                Üniversite, bölüm, YKS sıralaması ve tanıtım videosundaki değişiklikler
                onaylanana kadar öğrenciler mevcut doğrulanmış bilgilerini görür.
              </p>
            </div>
          )}

          {profile.intro_video_status === "pending" && !pendingChange && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              Tanıtım videon inceleniyor. Onaylanana kadar öğrencilere gösterilmez.
            </div>
          )}

          {profile.intro_video_status === "rejected" && (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <p className="font-medium">Tanıtım videosu yayınlanmadı</p>
              {profile.intro_video_rejection_reason && (
                <p className="mt-1 text-muted-foreground">
                  {profile.intro_video_rejection_reason}
                </p>
              )}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {generalError && <ErrorMessage message={generalError} />}

              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Üniversite {profile.is_verified ? "(doğrulanmış)" : ""}</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: İstanbul Teknik Üniversitesi" {...field} />
                    </FormControl>
                    <FormMessage />
                    {profile.is_verified && (
                      <p className="text-xs text-muted-foreground">
                        Bu bilgideki değişiklik, kanıtınla birlikte incelenir.
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bölüm {profile.is_verified ? "(doğrulanmış)" : ""}</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Bilgisayar Mühendisliği" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yks_rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YKS Sıralaması</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={4_000_000}
                          placeholder="Örn: 5000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {profile.is_verified && (
                        <p className="text-xs text-muted-foreground">
                          Sıralama değişikliği, doğrulama ekibinin onayından sonra yayınlanır.
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hourly_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>40 dk ders ücreti (₺)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Örn: 400"
                          {...field}
                        />
                      </FormControl>
                      <p className="mt-1 text-xs text-muted-foreground">
                        40 dakikalık ders ücreti. Daha uzun dersler bu ücretten
                        orantılı hesaplanır.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hakkımda</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        maxLength={BIO_MAX_LENGTH}
                        placeholder="Kendinden, eğitim tarzından ve öğrencilerine neler kazandırabileceğinden bahset..."
                        {...field}
                        onChange={(event) => {
                          field.onChange(event.target.value.slice(0, BIO_MAX_LENGTH));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className={cn(
                      "mt-1 text-xs",
                      bioValue.length < 80 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {bioValue.length} / {BIO_MAX_LENGTH} karakter (en az 80 önerilir)
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="intro_video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Tanıtım Videosu</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Yalnızca YouTube bağlantıları kabul edilir. Video yayınlanmadan önce incelenir.
                    </p>
                    {introEmbedUrl && (
                      <div className="mt-2 aspect-video overflow-hidden rounded-md border bg-muted">
                        <iframe
                          className="h-full w-full"
                          src={introEmbedUrl}
                          title="YouTube video önizlemesi"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <div>
                <p className="mb-2 text-sm font-medium">Verdiğin Dersler</p>
                {subjectsLoading ? (
                  <p className="text-sm text-muted-foreground">Dersler yükleniyor...</p>
                ) : (
                  <div className="space-y-3">
                    {subjectGroups.map((group) => (
                      <div key={group.exam}>
                        <p className="mb-1 text-xs text-muted-foreground">{group.exam}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSubject(s.id)}
                              aria-pressed={selectedSubjectIds.includes(s.id)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-sm transition-colors",
                                selectedSubjectIds.includes(s.id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:bg-muted"
                              )}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {selectedSubjectIds.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedSubjectIds.length} ders seçildi
                      </p>
                    )}
                  </div>
                )}
                {subjectError && (
                  <p className="mt-1 text-sm text-destructive">{subjectError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/tutor")}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                        aria-hidden
                      />
                      Kaydediliyor
                    </span>
                  ) : (
                    "Kaydet"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
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

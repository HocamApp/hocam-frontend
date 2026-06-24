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

const editSchema = z.object({
  university: z.string().min(1, "Üniversite zorunludur"),
  department: z.string().min(1, "Bölüm zorunludur"),
  yks_rank: z
    .string()
    .min(1, "YKS sıralaması zorunludur")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 15000,
      { message: "Sıralama 1-15000 arasında olmalıdır" }
    ),
  hourly_price: z
    .string()
    .min(1, "Saatlik ücret zorunludur")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Ücret pozitif olmalıdır",
    }),
  intro_video_url: z.string().optional(),
  bio: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

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
      form.reset({
        university: profile.university ?? "",
        department: profile.department ?? "",
        yks_rank: profile.yks_rank != null ? String(profile.yks_rank) : "",
        hourly_price: profile.hourly_price != null ? String(profile.hourly_price) : "",
        intro_video_url: profile.intro_video_url ?? "",
        bio: profile.bio ?? "",
      });
      setSelectedSubjectIds(profile.subjects.map((s) => s.id));
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded, form]);

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
    if (selectedSubjectIds.length === 0) {
      setSubjectError("En az bir ders seçin");
      return;
    }

    setGeneralError(null);
    try {
      await updateMyTutorProfile({
        university: parsed.data.university,
        department: parsed.data.department,
        yks_rank: Number(parsed.data.yks_rank),
        hourly_price: parsed.data.hourly_price,
        intro_video_url: parsed.data.intro_video_url ?? "",
        bio: parsed.data.bio ?? "",
        subject_ids: selectedSubjectIds,
      });

      await queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      toast.success("Profil güncellendi.");
      router.push("/dashboard/tutor");
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
      toast.error("Profil güncellenemedi.");
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

  const tytSubjects = subjects.filter((s) => s.exam_type === "TYT");
  const aytSubjects = subjects.filter((s) => s.exam_type === "AYT");

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {generalError && <ErrorMessage message={generalError} />}

              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Üniversite</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: İstanbul Teknik Üniversitesi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bölüm</FormLabel>
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
                          max={15000}
                          placeholder="Örn: 5000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hourly_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saatlik Ücret (₺)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Örn: 300"
                          {...field}
                        />
                      </FormControl>
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
                        placeholder="Kendinden, eğitim tarzından ve öğrencilerine neler kazandırabileceğinden bahset..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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
                  </FormItem>
                )}
              />

              <div>
                <p className="mb-2 text-sm font-medium">Verdiğin Dersler</p>
                {subjectsLoading ? (
                  <p className="text-sm text-muted-foreground">Dersler yükleniyor...</p>
                ) : (
                  <div className="space-y-3">
                    {tytSubjects.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">TYT</p>
                        <div className="flex flex-wrap gap-2">
                          {tytSubjects.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSubject(s.id)}
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
                    )}
                    {aytSubjects.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">AYT</p>
                        <div className="flex flex-wrap gap-2">
                          {aytSubjects.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSubject(s.id)}
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
                    )}
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

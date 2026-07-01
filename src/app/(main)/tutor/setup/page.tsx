"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchMe } from "@/lib/authApi";
import { fetchSubjects, createTutorProfile } from "@/lib/tutorsApi";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const setupSchema = z.object({
  name: z.string().min(1, "Ad zorunludur"),
  surname: z.string().min(1, "Soyad zorunludur"),
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
    .min(1, "Ders ücreti zorunludur")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Ücret pozitif olmalıdır",
    }),
  bio: z.string().optional(),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function TutorSetupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isTutor, user, setAuth, token } =
    useAuth();
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isTutor) {
      router.replace("/tutors");
      return;
    }
    if (user?.tutor_profile_id) {
      router.replace("/dashboard/tutor");
    }
  }, [isLoading, isAuthenticated, isTutor, user, router]);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    enabled: isAuthenticated && isTutor,
  });

  const form = useForm<SetupFormValues>({
    defaultValues: {
      name: "",
      surname: "",
      university: "",
      department: "",
      yks_rank: "",
      hourly_price: "",
      bio: "",
    },
    mode: "onSubmit",
  });

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSubjectError(null);
  };

  const onSubmit = async (data: SetupFormValues) => {
    const parsed = setupSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.name) form.setError("name", { message: err.fieldErrors.name[0] });
      if (err.fieldErrors.surname) form.setError("surname", { message: err.fieldErrors.surname[0] });
      if (err.fieldErrors.university) form.setError("university", { message: err.fieldErrors.university[0] });
      if (err.fieldErrors.department) form.setError("department", { message: err.fieldErrors.department[0] });
      if (err.fieldErrors.yks_rank) form.setError("yks_rank", { message: err.fieldErrors.yks_rank[0] });
      if (err.fieldErrors.hourly_price) form.setError("hourly_price", { message: err.fieldErrors.hourly_price[0] });
      return;
    }
    if (selectedSubjectIds.length === 0) {
      setSubjectError("En az bir ders seçin");
      return;
    }

    setGeneralError(null);
    try {
      await createTutorProfile({
        name: parsed.data.name,
        surname: parsed.data.surname,
        university: parsed.data.university,
        department: parsed.data.department,
        yks_rank: Number(parsed.data.yks_rank),
        hourly_price: parsed.data.hourly_price,
        bio: parsed.data.bio ?? "",
        subject_ids: selectedSubjectIds,
      });

      const updatedUser = await fetchMe();
      setAuth(updatedUser, token!);
      toast.success("Profilin oluşturuldu.");
      router.replace("/dashboard/tutor");
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: unknown } };
      const data = axErr.response?.data;
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        const fieldMap: Record<string, keyof SetupFormValues> = {
          name: "name",
          surname: "surname",
          university: "university",
          department: "department",
          yks_rank: "yks_rank",
          hourly_price: "hourly_price",
          bio: "bio",
        };
        let hasFieldError = false;
        for (const [apiKey, formKey] of Object.entries(fieldMap)) {
          if (Array.isArray(d[apiKey])) {
            form.setError(formKey, { message: String((d[apiKey] as string[])[0]) });
            hasFieldError = true;
          }
        }
        if (!hasFieldError) {
          const detail =
            typeof d.detail === "string"
              ? d.detail
              : "Profil oluşturulamadı. Lütfen bilgileri kontrol et.";
          setGeneralError(detail);
        }
      } else {
        setGeneralError("Profil oluşturulamadı. Lütfen bilgileri kontrol et.");
      }
      toast.error("Profil oluşturulamadı. Lütfen bilgileri kontrol et.");
    }
  };

  if (isLoading || !isAuthenticated || !isTutor || user?.tutor_profile_id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const tytSubjects = subjects.filter((s) => s.exam_type === "TYT");
  const aytSubjects = subjects.filter((s) => s.exam_type === "AYT");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Hoca Profilini Oluştur</CardTitle>
          <CardDescription>
            Profilini tamamlayarak öğrencilere ulaşmaya başla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {generalError && <ErrorMessage message={generalError} />}

              {/* Name + Surname */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad</FormLabel>
                      <FormControl>
                        <Input placeholder="Adın" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soyad</FormLabel>
                      <FormControl>
                        <Input placeholder="Soyadın" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* University + Department */}
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

              {/* YKS Rank + Hourly Price */}
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

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hakkımda (isteğe bağlı)</FormLabel>
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

              {/* Subject multi-select */}
              <div>
                <p className="text-sm font-medium mb-2">Verdiğin Dersler</p>
                {subjectsLoading ? (
                  <p className="text-sm text-muted-foreground">Dersler yükleniyor...</p>
                ) : (
                  <div className="space-y-3">
                    {tytSubjects.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">TYT</p>
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
                        <p className="text-xs text-muted-foreground mb-1">AYT</p>
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

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                      aria-hidden
                    />
                    Profil Oluşturuluyor
                  </span>
                ) : (
                  "Profili Oluştur"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

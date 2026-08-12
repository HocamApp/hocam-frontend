"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchMe } from "@/lib/authApi";
import {
  fetchSubjects,
  createTutorProfile,
  fetchTutorEducationOptions,
} from "@/lib/tutorsApi";
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
import { TeachingAttributeSelector } from "@/components/tutors/TeachingAttributeSelector";
import { SearchableEducationSelect } from "@/components/tutors/SearchableEducationSelect";
import { TutorJourneyAside } from "@/components/tutors/TutorJourneyAside";
import { syncCreatedTutorProfile } from "@/lib/tutorSetup";

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
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, isTutor, user, updateUser } =
    useAuth();
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [selectedTeachingAttributes, setSelectedTeachingAttributes] = useState<string[]>([]);
  const [teachingAttributeError, setTeachingAttributeError] = useState<string | null>(null);
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
      router.replace("/tutor/onboarding");
    }
  }, [isLoading, isAuthenticated, isTutor, user, router]);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    enabled: isAuthenticated && isTutor,
  });
  const {
    data: educationOptions = [],
    isLoading: educationOptionsLoading,
    isError: educationOptionsError,
  } = useQuery({
    queryKey: ["tutor-education-options"],
    queryFn: fetchTutorEducationOptions,
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
    const supportedSelectedSubjectIds = filterSelectedSubjectIds(subjects, selectedSubjectIds);
    if (supportedSelectedSubjectIds.length === 0) {
      setSubjectError("En az bir ders seçin");
      return;
    }
    if (selectedTeachingAttributes.length < 3 || selectedTeachingAttributes.length > 5) {
      setTeachingAttributeError("3 ila 5 ders anlatım özelliği seçin");
      return;
    }

    setGeneralError(null);
    try {
      const createdProfile = await createTutorProfile({
        name: parsed.data.name,
        surname: parsed.data.surname,
        university: parsed.data.university,
        department: parsed.data.department,
        yks_rank: Number(parsed.data.yks_rank),
        hourly_price: parsed.data.hourly_price,
        bio: parsed.data.bio ?? "",
        subject_ids: supportedSelectedSubjectIds,
        teaching_attribute_codes: selectedTeachingAttributes,
      });

      const updatedUser = await fetchMe();
      syncCreatedTutorProfile(queryClient, createdProfile, updatedUser, updateUser);
      toast.success("Profil bilgilerin kaydedildi.");
      router.replace("/tutor/onboarding");
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
        const teachingAttributeMessages = d.teaching_attribute_codes;
        const hasTeachingAttributeError = Array.isArray(teachingAttributeMessages);
        if (Array.isArray(teachingAttributeMessages)) {
          setTeachingAttributeError(String(teachingAttributeMessages[0]));
        }
        let hasFieldError = hasTeachingAttributeError;
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
    }
  };

  if (isLoading || !isAuthenticated || !isTutor || user?.tutor_profile_id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const subjectGroups = groupSubjectsByExam(subjects);
  const selectedUniversity = form.watch("university");
  const watchedValues = form.watch();
  const availableDepartments =
    educationOptions.find((option) => option.university === selectedUniversity)
      ?.departments ?? [];
  const universities = educationOptions.map((option) => option.university);
  const profileChecks = [
    Boolean(watchedValues.name.trim() && watchedValues.surname.trim()),
    Boolean(watchedValues.university && watchedValues.department),
    Boolean(watchedValues.yks_rank && watchedValues.hourly_price),
    selectedSubjectIds.length > 0,
    selectedTeachingAttributes.length >= 3,
  ];
  const profileCompletedCount = profileChecks.filter(Boolean).length;
  const profileProgress = Math.round((profileCompletedCount / profileChecks.length) * 100);
  const priceFact = watchedValues.hourly_price
    ? `40 dakikalık ders ücretin profilinde ₺${watchedValues.hourly_price} olarak görünecek. Ücretini daha sonra değiştirebilirsin.`
    : "Ders ücretini sen belirlersin. Öğrenciler talep göndermeden önce ücreti profilinde açıkça görür.";

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)] lg:items-start lg:py-10">
      <Card className="overflow-hidden rounded-3xl border-brand-100 shadow-sm dark:border-brand-900">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
            Profil bilgileri
          </p>
          <CardTitle className="text-2xl sm:text-3xl">Öğrenciler seni tanısın</CardTitle>
          <CardDescription>
            Temel bilgilerini bir kez ekle; verdiğin dersleri, ücretini ve profil detaylarını daha sonra panelinden güncelleyebilirsin.
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
                      <SearchableEducationSelect
                        disabled={educationOptionsLoading}
                        value={field.value}
                        options={universities}
                        placeholder={educationOptionsLoading ? "Üniversiteler yükleniyor..." : "Üniversiteni ara"}
                        searchPlaceholder="Üniversite adı yaz"
                        customLabel="“{value}” üniversitesini kullan"
                        onChange={(value) => {
                        field.onChange(value);
                        form.setValue("department", "", { shouldValidate: true });
                        }}
                      />
                    </FormControl>
                    {educationOptionsError && (
                      <p className="text-xs text-muted-foreground">
                        Liste şu anda alınamadı. Üniversitenin adını yazarak devam edebilirsin.
                      </p>
                    )}
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
                      <SearchableEducationSelect
                        disabled={!selectedUniversity || educationOptionsLoading}
                        value={field.value}
                        options={availableDepartments}
                        placeholder={selectedUniversity ? "Bölümünü ara" : "Önce üniversiteni seç"}
                        searchPlaceholder="Bölüm adı yaz"
                        customLabel="“{value}” bölümünü kullan"
                        onChange={field.onChange}
                      />
                    </FormControl>
                    {selectedUniversity && !educationOptionsLoading && (
                      <p className="text-xs text-muted-foreground">
                        Bölümünü bulamazsan adını yazıp kendi seçeneğini ekleyebilirsin.
                      </p>
                    )}
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
                        orantılı hesaplanır. Ücretini profil ayarlarından daha sonra
                        değiştirebilirsin.
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
                    {subjectGroups.map((group) => (
                      <div key={group.exam}>
                        <p className="text-xs text-muted-foreground mb-1">{group.exam}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((s) => (
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

              <TeachingAttributeSelector
                value={selectedTeachingAttributes}
                error={teachingAttributeError}
                onChange={(next) => {
                  setSelectedTeachingAttributes(next);
                  setTeachingAttributeError(null);
                }}
              />

              <Button
                type="submit"
                className="h-12 w-full bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
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
                  "Kaydet ve fotoğraf adımına geç"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <TutorJourneyAside
        eyebrow="Hocam’a hoş geldin"
        title={profileProgress === 100 ? "Profilin hazır görünüyor!" : "Profilin adım adım şekilleniyor."}
        description="Kısa ve net bir profil, öğrencilerin seni daha hızlı anlamasına yardımcı olur. Her tamamlanan alan ilerlemeni anında artırır."
        progress={profileProgress}
        progressLabel={`${profileCompletedCount}/5 profil bölümü hazır`}
        fact={priceFact}
      />
    </div>
  );
}

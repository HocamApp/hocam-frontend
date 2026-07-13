"use client";

import type { ChangeEvent, ReactNode, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Info, LockKeyhole, ShieldCheck, Sparkles, TrendingUp, WalletCards } from "lucide-react";

import type { Subject, TutorProfile } from "@/types";
import type { TutorPriceInsight } from "@/lib/tutorsApi";
import { AvatarEditor } from "@/components/profile/AvatarEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubjectSelector } from "@/components/tutors/profile-editor/SubjectSelector";

export const BIO_MAX_LENGTH = 1000;
export const BIO_RECOMMENDED_LENGTH = 80;

export interface TutorProfileEditValues {
  university: string;
  department: string;
  yks_rank: string;
  hourly_price: string;
  intro_video_url?: string;
  bio?: string;
}

export function getYouTubeEmbedUrl(url?: string): string | null {
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

function getInitials(name: string, surname: string) {
  return `${name.trim()[0] ?? ""}${surname.trim()[0] ?? ""}`.toUpperCase() || "?";
}

function EditorSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-28 shadow-none">
      <CardHeader className="space-y-2 border-b p-5 sm:p-6">
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

interface SharedSectionProps {
  form: UseFormReturn<TutorProfileEditValues>;
  profile: TutorProfile;
}

interface ProfileBasicsSectionProps extends SharedSectionProps {
  bioValue: string;
  photoInputRef: RefObject<HTMLInputElement>;
  photoUploading: boolean;
  photoError: string | null;
  onPhotoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileBasicsSection({
  form,
  profile,
  bioValue,
  photoInputRef,
  photoUploading,
  photoError,
  onPhotoUpload,
}: ProfileBasicsSectionProps) {
  const fullName = `${profile.name} ${profile.surname}`.trim();
  const initials = getInitials(profile.name, profile.surname);

  return (
    <EditorSection
      id="profile-basics"
      title="Profil Bilgileri"
      description="Fotoğrafın ve tanıtım yazın, öğrencilerin profilinde ilk fark ettiği alanlardır."
    >
      <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <Avatar className="h-24 w-24 border">
          {profile.profile_picture && (
            <AvatarImage src={profile.profile_picture} alt={fullName} className="object-cover" />
          )}
          <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{fullName}</p>
          <p className="mt-1 text-sm text-muted-foreground">JPG, PNG veya WebP · En fazla 5 MB</p>
          <div className="mt-2 max-w-sm">
            <AvatarEditor
              avatarImage={profile.profile_picture}
              initials={initials}
              fullName={fullName}
              isStudent={false}
              isTutor
              photoUploading={photoUploading}
              photoError={photoError}
              fileInputRef={photoInputRef}
              onPickFile={() => photoInputRef.current?.click()}
              onFileChange={onPhotoUpload}
              avatarChoicePendingKey={null}
              onChooseStudentAvatar={() => undefined}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t pt-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-end justify-between gap-3">
                <FormLabel>Hakkımda</FormLabel>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {bioValue.length}/{BIO_MAX_LENGTH}
                </span>
              </div>
              <FormControl>
                <Textarea
                  rows={6}
                  maxLength={BIO_MAX_LENGTH}
                  placeholder="Eğitim tarzından, uzmanlık alanlarından ve öğrencilerine nasıl destek olduğundan bahset..."
                  {...field}
                  onChange={(event) => {
                    field.onChange(event.target.value.slice(0, BIO_MAX_LENGTH));
                    form.clearErrors("bio");
                  }}
                />
              </FormControl>
              <FormDescription>
                En az {BIO_RECOMMENDED_LENGTH} karakter önerilir; bu bir kayıt zorunluluğu değildir.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </EditorSection>
  );
}

export function EducationSection({ profile }: SharedSectionProps) {
  const educationValues = [
    { label: "Üniversite", value: profile.university },
    { label: "Bölüm", value: profile.department },
    { label: "YKS sıralaması", value: profile.yks_rank.toLocaleString("tr-TR") },
  ];

  return (
    <EditorSection
      id="education"
      title="Eğitim ve Doğrulama"
      description="Kayıt sırasında verdiğin eğitim bilgileri profil güvenliğini korumak için daha sonra değiştirilemez."
    >
      <div className="mb-6 rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            <p className="font-semibold">Doğrulama durumu</p>
          </div>
          <Badge
            variant="outline"
            className={
              profile.is_verified
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100"
                : undefined
            }
          >
            {profile.is_verified ? "Doğrulandı" : "Doğrulanmadı"}
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          {educationValues.map((item) => (
            <div key={item.label}>
              <p className="text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-medium">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {profile.is_verified
            ? "Bu bilgiler doğrulanmıştır ve tutor hesabından değiştirilemez."
            : "Bu bilgiler kayıt sırasında kaydedilmiştir ve tutor hesabından değiştirilemez."}
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/20 p-4 text-sm">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">Eğitim bilgileri kilitli</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            Bilgilerinden biri hatalıysa güvenli bir düzeltme için destek ekibiyle iletişime geç.
          </p>
        </div>
      </div>
    </EditorSection>
  );
}

interface SubjectsSectionProps {
  subjects: Subject[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  onToggle: (id: string) => void;
}

export function SubjectsSection(props: SubjectsSectionProps) {
  return (
    <EditorSection
      id="subjects"
      title="Verdiğin Dersler"
      description="Öğrencilerin seni doğru sınav ve ders filtrelerinde bulabilmesi için verdiğin tüm dersleri seç."
    >
      <SubjectSelector
        subjects={props.subjects}
        selectedIds={props.selectedIds}
        loading={props.loading}
        error={props.error}
        onToggle={props.onToggle}
      />
    </EditorSection>
  );
}

interface PricingSectionProps {
  form: UseFormReturn<TutorProfileEditValues>;
  sixtyMinutePrice: number | null;
  priceInsight?: TutorPriceInsight;
  priceInsightLoading: boolean;
  priceInsightError: boolean;
  onApplyRecommendedPrice: (price: number) => void;
}

const priceInsightLabels: Record<TutorPriceInsight["basis"], string> = {
  same_subjects_similar_rank: "Aynı dersler ve yakın YKS sıralaması",
  same_subjects: "Aynı dersleri veren tutorlar",
  same_exam_nearest_rank: "Aynı sınav türü ve en yakın YKS sıralamaları",
  insufficient_data: "Yetersiz karşılaştırma verisi",
};

export function PricingSection({
  form,
  sixtyMinutePrice,
  priceInsight,
  priceInsightLoading,
  priceInsightError,
  onApplyRecommendedPrice,
}: PricingSectionProps) {
  const numericPrice = Number(form.watch("hourly_price"));
  const commissionRate = (priceInsight?.commission_rate_bps ?? 0) / 10_000;
  const estimatedCommission =
    Number.isFinite(numericPrice) && numericPrice > 0 && commissionRate > 0
      ? numericPrice * commissionRate
      : null;
  const estimatedNet =
    estimatedCommission != null ? numericPrice - estimatedCommission : null;

  return (
    <EditorSection
      id="pricing"
      title="Ücretlendirme"
      description="Ders ücreti 40 dakikalık standart ders süresi için kaydedilir."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:items-start">
        <FormField
          control={form.control}
          name="hourly_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>40 dakikalık ders ücreti</FormLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">₺</span>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="400"
                    className="pl-8"
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);
                      form.clearErrors("hourly_price");
                    }}
                  />
                </FormControl>
              </div>
              <FormDescription>
                Daha uzun dersler bu ücretten orantılı hesaplanır.
                {sixtyMinutePrice != null && (
                  <span className="mt-2 block rounded-md bg-muted px-3 py-2 font-medium text-foreground">
                    60 dakikalık ders örneği: {sixtyMinutePrice.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-xl border bg-muted/20 p-4" aria-live="polite">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold">Veriye dayalı fiyat rehberi</p>
          </div>
          {priceInsightLoading ? (
            <div className="mt-4 space-y-2" aria-label="Fiyat önerisi yükleniyor">
              <div className="h-7 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          ) : priceInsightError ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Fiyat önerisi şu anda alınamıyor. Seçtiğin fiyatı yine kaydedebilirsin.
            </p>
          ) : priceInsight?.recommended_price != null ? (
            <div className="mt-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Önerilen fiyat</p>
                  <p className="text-2xl font-semibold">
                    {priceInsight.recommended_price.toLocaleString("tr-TR")} ₺
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyRecommendedPrice(priceInsight.recommended_price!)}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Öneriyi kullan
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Piyasa aralığı: {priceInsight.market_range.low?.toLocaleString("tr-TR")}–{priceInsight.market_range.high?.toLocaleString("tr-TR")} ₺
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {priceInsightLabels[priceInsight.basis]} · {priceInsight.sample_size} tutor karşılaştırıldı
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Güvenilir bir öneri için henüz en az 3 benzer tutor verisi bulunmuyor.
            </p>
          )}
        </div>
      </div>

      {estimatedNet != null && estimatedCommission != null && (
        <div className="mt-5 rounded-xl border bg-background p-4">
          <div className="flex items-center gap-2">
            <WalletCards className="h-4 w-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold">Tahmini ders gelirin</p>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Ders fiyatı</dt>
              <dd className="mt-1 font-semibold">{numericPrice.toLocaleString("tr-TR")} ₺</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hocam komisyonu (%15)</dt>
              <dd className="mt-1 font-semibold text-rose-700 dark:text-rose-300">
                −{estimatedCommission.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
              </dd>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
              <dt className="text-emerald-800 dark:text-emerald-200">Sana kalan tahmini tutar</dt>
              <dd className="mt-1 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                {estimatedNet.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
              </dd>
            </div>
          </dl>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Bu yalnızca 40 dakikalık standart fiyat üzerinden tahmindir. Paket indirimi, vergi, ödeme sağlayıcı masrafı ve kesin hak ediş dahil değildir.
          </p>
        </div>
      )}
    </EditorSection>
  );
}

interface IntroVideoSectionProps extends SharedSectionProps {
  introVideoValue: string;
  introEmbedUrl: string | null;
  previewFailed: boolean;
  onPreviewError: () => void;
}

export function IntroVideoSection({
  form,
  profile,
  introVideoValue,
  introEmbedUrl,
  previewFailed,
  onPreviewError,
}: IntroVideoSectionProps) {
  return (
    <EditorSection
      id="intro-video"
      title="Tanıtım Videosu"
      description="Kısa bir YouTube videosuyla ders anlatım tarzını ve yaklaşımını tanıtabilirsin."
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-start">
        <FormField
          control={form.control}
          name="intro_video_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>YouTube video bağlantısı</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...field}
                  onChange={(event) => {
                    field.onChange(event);
                    form.clearErrors("intro_video_url");
                  }}
                />
              </FormControl>
              <FormDescription>
                Yalnızca YouTube bağlantıları kabul edilir. Video yayınlanmadan önce incelenir.
              </FormDescription>
              {introVideoValue && !introEmbedUrl && (
                <p className="text-sm font-medium text-destructive" role="alert">
                  Önizleme için geçerli bir YouTube bağlantısı gir.
                </p>
              )}
              {profile.intro_video_status === "pending" && !profile.pending_profile_change && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  Mevcut videon inceleniyor ve onaylanana kadar öğrencilere gösterilmiyor.
                </p>
              )}
              {profile.intro_video_status === "rejected" && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Video yayınlanmadı{profile.intro_video_rejection_reason ? `: ${profile.intro_video_rejection_reason}` : "."}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <p className="mb-2 text-sm font-medium">Video önizlemesi</p>
          {introEmbedUrl && !previewFailed ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <iframe
                className="h-full w-full"
                src={introEmbedUrl}
                title="YouTube tanıtım videosu önizlemesi"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={onPreviewError}
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted/30 px-6 text-center text-sm text-muted-foreground">
              {previewFailed
                ? "Video önizlemesi yüklenemedi. Bağlantıyı kontrol edip tekrar dene."
                : "Geçerli bir bağlantı girdiğinde video burada görünür."}
            </div>
          )}
        </div>
      </div>
    </EditorSection>
  );
}

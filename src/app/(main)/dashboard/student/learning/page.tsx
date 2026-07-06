"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLearningDashboard,
  fetchLearningGoalTemplates,
} from "@/lib/learningApi";
import { buildCatalogSections } from "@/lib/learningCatalog";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { StatCard } from "@/components/shared/StatCard";
import { ActiveGoalCard } from "@/components/learning/ActiveGoalCard";
import {
  CategoryNavPills,
  CategoryNavSidebar,
} from "@/components/learning/CategoryNav";
import { GoalPackageCard } from "@/components/learning/GoalPackageCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { LearningActivityStatus } from "@/types";

function formatActivityStatus(status: LearningActivityStatus) {
  const labels: Record<LearningActivityStatus, string> = {
    planned: "Planlandı",
    pending_confirmation: "Onay bekliyor",
    confirmed: "Onaylandı",
    cancelled: "İptal edildi",
  };

  return labels[status] ?? status;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Tarih bekleniyor";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarih bekleniyor";

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyLearningCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed bg-card/50 p-4 text-sm">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function LearningSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StudentLearningContent() {
  const { isAuthenticated } = useAuth();

  const {
    data: learningDashboard,
    isLoading: learningLoading,
    isError: learningError,
  } = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: isAuthenticated,
    retry: false,
  });

  // The dashboard payload caps templates at 6; the dedicated endpoint
  // returns the full catalog. Fall back to the dashboard's list if it fails.
  const { data: allTemplates } = useQuery({
    queryKey: ["learning-goal-templates"],
    queryFn: fetchLearningGoalTemplates,
    enabled: isAuthenticated,
    retry: false,
  });

  const templates = useMemo(
    () => allTemplates ?? learningDashboard?.templates ?? [],
    [allTemplates, learningDashboard]
  );
  const goals = learningDashboard?.goals ?? [];
  const pendingConfirmations = learningDashboard?.pending_confirmations ?? [];
  const notes = learningDashboard?.notes ?? [];
  const recentProgress = learningDashboard?.recent_progress ?? [];
  const stats = learningDashboard?.stats;

  const catalogSections = useMemo(
    () => buildCatalogSections(templates),
    [templates]
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const activeCategoryId =
    selectedCategoryId ?? catalogSections[0]?.category.id ?? null;

  // Progressive enhancement: keep the nav in sync while scrolling. Clicking
  // a category works without it.
  useEffect(() => {
    if (catalogSections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setSelectedCategoryId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -60% 0px" }
    );

    catalogSections.forEach(({ category }) => {
      const element = document.getElementById(category.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [catalogSections]);

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = catalogSections.map(({ category, templates: items }) => ({
    id: category.id,
    title: category.title,
    icon: category.icon,
    count: items.length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b pb-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Learning Hub
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Öğrenme
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Hazır hedef paketlerini keşfet, aktif hedeflerini takip et ve derslerinden ilerleme kazan.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label="Aktif hedefler"
            value={stats?.active_goals_count ?? "-"}
            detail="Şu anda takip ettiğin hedefler"
            isLoading={learningLoading}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
            label="Ortalama ilerleme"
            value={stats ? `%${Math.round(stats.average_progress)}` : "-"}
            detail="Aktif planların genel ritmi"
            isLoading={learningLoading}
          />
          <StatCard
            icon={<ListChecks className="h-4 w-4" aria-hidden="true" />}
            label="Açık milestone"
            value={stats?.open_milestones_count ?? "-"}
            detail="Devam eden konu adımları"
            isLoading={learningLoading}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
            label="Tutor onayı bekleyen"
            value={stats?.pending_confirmations_count ?? "-"}
            detail="Ders sonrası ilerleme onayları"
            isLoading={learningLoading}
          />
        </section>

        {learningLoading && (
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-48 rounded-2xl" />
            ))}
          </div>
        )}

        {learningError && (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertDescription>
              Öğrenme paneli şu anda hazırlanıyor. Ders talepleri ve rezervasyonlarınızı Panom üzerinden kullanmaya devam edebilirsiniz.
            </AlertDescription>
          </Alert>
        )}

        {!learningLoading && !learningError && (
          <div className="space-y-10">
            <LearningSection title="Aktif Hedeflerim">
              {goals.length === 0 ? (
                <EmptyLearningCard
                  icon={<Target className="h-4 w-4" aria-hidden="true" />}
                  title="Henüz aktif hedefin yok"
                  description="Aşağıdaki hazır paketlerden birini seçerek öğrenme planını başlatabilirsin."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.map((goal) => (
                    <ActiveGoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              )}
            </LearningSection>

            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Hazır Hedef Paketleri
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sınavına ve seviyene uygun paketi seç, milestone yolunda ilerle.
                </p>
              </div>

              {templates.length === 0 ? (
                <EmptyLearningCard
                  icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
                  title="Hazır paketler yakında burada"
                  description="Backend hazır olduğunda YKS hedef paketlerini buradan seçebileceksin."
                />
              ) : (
                <>
                  <div className="sticky top-16 z-20 -mx-4 bg-background/95 px-4 pt-2 backdrop-blur lg:hidden">
                    <CategoryNavPills
                      items={navItems}
                      activeId={activeCategoryId}
                      onSelect={handleSelectCategory}
                    />
                  </div>

                  <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
                    <div className="hidden lg:block">
                      <div className="sticky top-24">
                        <CategoryNavSidebar
                          items={navItems}
                          activeId={activeCategoryId}
                          onSelect={handleSelectCategory}
                        />
                      </div>
                    </div>

                    <div className="space-y-12">
                      {catalogSections.map(({ category, templates: items }) => (
                        <section
                          key={category.id}
                          id={category.id}
                          className="scroll-mt-36 space-y-4 lg:scroll-mt-24"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <category.icon
                                className="h-5 w-5 text-primary"
                                aria-hidden="true"
                              />
                              <h3 className="text-lg font-semibold tracking-tight">
                                {category.title}
                              </h3>
                              <span className="text-sm text-muted-foreground">
                                {items.length} paket
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {items.map((template) => (
                              <GoalPackageCard
                                key={`${category.id}-${template.id}`}
                                template={template}
                                isAdded={goals.some(
                                  (goal) => goal.template === template.id
                                )}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>

            <div className="grid gap-6 md:grid-cols-3">
              <LearningSection title="Tutor Onayı Bekleyenler">
                <div className="rounded-xl border bg-card p-4">
                  {pendingConfirmations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Onay bekleyen ilerleme yok.</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingConfirmations.map((item) => (
                        <article key={item.id} className="rounded-lg border bg-background p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {item.milestone?.title ?? "Milestone"}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {item.booking?.tutor
                                  ? `${item.booking.tutor.name} ${item.booking.tutor.surname}`
                                  : "Tutor bilgisi bekleniyor"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDateTime(item.booking?.start_time)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300"
                            >
                              {formatActivityStatus(item.status)}
                            </Badge>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </LearningSection>

              <LearningSection title="Notlarım">
                <div className="rounded-xl border bg-card p-4">
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Henüz not eklemedin.</p>
                  ) : (
                    <div className="space-y-3">
                      {notes.slice(0, 4).map((note) => (
                        <article key={note.id} className="rounded-lg border bg-background p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{note.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {note.body}
                              </p>
                            </div>
                            {note.is_pinned && (
                              <Badge className="shrink-0 bg-primary/10 text-primary hover:bg-primary/10">
                                Sabit
                              </Badge>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </LearningSection>

              <LearningSection title="Son İlerleme">
                <div className="rounded-xl border bg-card p-4">
                  {recentProgress.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Henüz ilerleme kaydı yok.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentProgress.slice(0, 5).map((event) => (
                        <article key={event.id} className="rounded-lg border bg-background p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">+{event.progress_delta}%</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDateTime(event.created_at)}
                              </p>
                              {event.tutor_note && (
                                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                  {event.tutor_note}
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </LearningSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentLearningPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <StudentLearningContent />
    </RouteGuard>
  );
}

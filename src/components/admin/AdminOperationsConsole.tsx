"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRightLeft,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock3,
  CreditCard,
  GraduationCap,
  PackagePlus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  activateAdminPackage,
  approveAdminTestBooking,
  cancelAdminPackage,
  createAdminBooking,
  createAdminPackage,
  fetchAdminMonitor,
  grantAdminTestCredits,
  markAllAccountsAsTest,
  startAdminImpersonation,
  updateAdminTutorTestSettings,
} from "@/lib/adminControlApi";
import { cn, formatPrice } from "@/lib/utils";
import type { AdminTestAccount } from "@/types";

type AdminTab = "overview" | "accounts" | "bookings" | "packages" | "audit";
type AccountRoleFilter = "all" | "student" | "tutor";
type AccountScopeFilter = "all" | "test" | "real" | "active" | "inactive";

const PAGE_SIZE = 10;

const bookingStatusLabels: Record<string, string> = {
  pending: "Onay bekliyor",
  confirmed: "Onaylandı",
  in_progress: "Devam ediyor",
  awaiting_confirmation: "Ders sonu onayı",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  disputed: "İtirazlı",
};

const packageStatusLabels: Record<string, string> = {
  pending: "Ödeme bekliyor",
  paid: "Aktif",
  cancelled: "İptal",
  refunded: "İade kaydı",
};

const actionLabels: Record<string, string> = {
  impersonation_started: "Hesap görünümüne geçildi",
  impersonation_ended: "Admin görünümüne dönüldü",
  booking_approved: "Rezervasyon onaylandı",
  booking_created: "Özel ders oluşturuldu",
  package_created: "Paket talebi oluşturuldu",
  package_activated: "Paket aktive edildi",
  package_cancelled: "Paket talebi reddedildi",
  test_credit_granted: "Test kredisi verildi",
  test_accounts_marked: "Hesaplar TEST olarak işaretlendi",
  qa_video_session_created: "Anında test konferansı açıldı",
  tutor_test_settings_updated: "Hoca test ayarı değiştirildi",
};

function displayName(account: AdminTestAccount) {
  return `${account.profile?.name ?? ""} ${account.profile?.surname ?? ""}`.trim() || account.email;
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").trim();
}

function minimumLocalLessonTime() {
  const date = new Date(Date.now() + 5 * 60_000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function apiError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

function statusBadgeClass(status: string) {
  if (status === "confirmed" || status === "paid" || status === "in_progress") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "pending" || status === "awaiting_confirmation") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "cancelled" || status === "refunded" || status === "disputed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "";
}

function AccountPicker({
  accounts,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  accounts: AdminTestAccount[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = accounts.find((account) => account.id === value);
  const filtered = accounts
    .filter((account) => normalize(`${displayName(account)} ${account.email}`).includes(normalize(query)))
    .slice(0, 12);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between overflow-hidden font-normal"
        >
          <span className="truncate">{selected ? `${displayName(selected)} · ${selected.email}` : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(380px,calc(100vw-2rem))] p-2">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ad veya e-posta ara"
            className="pl-8"
          />
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">Eşleşen hesap yok.</p>}
          {filtered.map((account) => (
            <button
              type="button"
              key={account.id}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onChange(account.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <Check className={cn("h-4 w-4 shrink-0", value === account.id ? "opacity-100" : "opacity-0")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{displayName(account)}</span>
                <span className="block truncate text-xs text-muted-foreground">{account.email}</span>
              </span>
              {account.is_test_account && <Badge className="text-[10px]">TEST</Badge>}
            </button>
          ))}
        </div>
        {accounts.length > 12 && !query && (
          <p className="border-t px-2 pt-2 text-xs text-muted-foreground">Arama yaparak {accounts.length} hesap içinde ilerleyin.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PaginationControls({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  if (total <= PAGE_SIZE) return null;
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-xs text-muted-foreground">
        {total} sonuç · Sayfa {safePage}/{totalPages}
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={safePage === 1} onClick={() => onChange(safePage - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />Önceki
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={safePage === totalPages} onClick={() => onChange(safePage + 1)}>
          Sonraki<ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}

export function AdminOperationsConsole() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const [viewStudentId, setViewStudentId] = useState("");
  const [viewTutorId, setViewTutorId] = useState("");
  const [packageStudentId, setPackageStudentId] = useState("");
  const [packageTutorId, setPackageTutorId] = useState("");
  const [planId, setPlanId] = useState("");
  const [bookingStudentId, setBookingStudentId] = useState("");
  const [bookingTutorId, setBookingTutorId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [creditStudentId, setCreditStudentId] = useState("");
  const [creditTutorId, setCreditTutorId] = useState("");
  const [credits, setCredits] = useState(10);

  const [accountQuery, setAccountQuery] = useState("");
  const [accountRole, setAccountRole] = useState<AccountRoleFilter>("all");
  const [accountScope, setAccountScope] = useState<AccountScopeFilter>("all");
  const [accountPage, setAccountPage] = useState(1);
  const [bookingQuery, setBookingQuery] = useState("");
  const [bookingStatus, setBookingStatus] = useState("all");
  const [bookingPage, setBookingPage] = useState(1);
  const [packageQuery, setPackageQuery] = useState("");
  const [packageStatus, setPackageStatus] = useState("all");
  const [packagePage, setPackagePage] = useState(1);

  const monitor = useQuery({
    queryKey: ["admin-control-monitor"],
    queryFn: fetchAdminMonitor,
    refetchInterval: activeTab === "overview" ? 15_000 : 30_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-control-monitor"] });
  const accounts = useMemo(() => monitor.data?.accounts ?? [], [monitor.data?.accounts]);
  const students = useMemo(() => accounts.filter((account) => account.role === "student"), [accounts]);
  const tutors = useMemo(() => accounts.filter((account) => account.role === "tutor" && account.profile), [accounts]);
  const testStudents = useMemo(() => students.filter((account) => account.is_test_account), [students]);
  const testTutors = useMemo(() => tutors.filter((account) => account.is_test_account), [tutors]);
  const selectedBookingTutor = tutors.find((account) => account.id === bookingTutorId);

  const impersonate = useMutation({
    mutationFn: ({ accountId, nextPath }: { accountId: string; nextPath?: string }) =>
      startAdminImpersonation(accountId).then((user) => ({ user, nextPath })),
    onSuccess: ({ user, nextPath }) => {
      queryClient.clear();
      updateUser(user);
      router.push(nextPath ?? (user.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student"));
    },
    onError: (error) => toast.error(apiError(error, "Hesap görünümüne geçilemedi.")),
  });
  const approve = useMutation({
    mutationFn: approveAdminTestBooking,
    onSuccess: () => { toast.success("Rezervasyon onaylandı ve ders odası hazırlandı."); refresh(); },
    onError: (error) => toast.error(apiError(error, "Rezervasyon onaylanamadı.")),
  });
  const addPackage = useMutation({
    mutationFn: createAdminPackage,
    onSuccess: () => {
      toast.success("Paket talebi oluşturuldu; ödeme bekliyor.");
      setPackageStudentId(""); setPackageTutorId(""); setPlanId("");
      setActiveTab("packages"); refresh();
    },
    onError: (error) => toast.error(apiError(error, "Paket oluşturulamadı.")),
  });
  const activatePackage = useMutation({
    mutationFn: activateAdminPackage,
    onSuccess: () => { toast.success("Paket aktive edildi."); refresh(); },
    onError: (error) => toast.error(apiError(error, "Paket aktivasyonu başarısız.")),
  });
  const cancelPackage = useMutation({
    mutationFn: cancelAdminPackage,
    onSuccess: () => { toast.success("Paket talebi reddedildi; ödeme veya kredi oluşturulmadı."); refresh(); },
    onError: (error) => toast.error(apiError(error, "Paket talebi reddedilemedi.")),
  });
  const markAllTestAccounts = useMutation({
    mutationFn: markAllAccountsAsTest,
    onSuccess: ({ marked_count }) => {
      toast.success(`${marked_count} hesap TEST olarak işaretlendi.`);
      refresh();
    },
    onError: (error) => toast.error(apiError(error, "Hesaplar TEST olarak işaretlenemedi.")),
  });
  const addBooking = useMutation({
    mutationFn: createAdminBooking,
    onSuccess: () => {
      toast.success("Özel ders oluşturuldu ve onaylandı.");
      setBookingStudentId(""); setBookingTutorId(""); setSubjectId(""); setStartTime("");
      setActiveTab("bookings"); refresh();
    },
    onError: (error) => toast.error(apiError(error, "Aktif paket/test kredisi ve boş saat gerekli.")),
  });
  const grantCredits = useMutation({
    mutationFn: grantAdminTestCredits,
    onSuccess: () => {
      toast.success("Test kredileri eklendi.");
      setCreditStudentId(""); setCreditTutorId(""); setCredits(10); refresh();
    },
    onError: (error) => toast.error(apiError(error, "Test kredisi verilemedi.")),
  });
  const toggleAutoApprove = useMutation({
    mutationFn: ({ tutorProfileId, next }: { tutorProfileId: string; next: boolean }) =>
      updateAdminTutorTestSettings(tutorProfileId, next),
    onSuccess: () => { toast.success("Otomatik onay ayarı güncellendi."); refresh(); },
    onError: (error) => toast.error(apiError(error, "Otomatik onay ayarı değiştirilemedi.")),
  });

  const goToAccount = (account: AdminTestAccount, nextPath?: string) => {
    if (!account.is_test_account && !window.confirm(`${account.email} gerçek bir hesaptır. Bu hesabın görünümüne geçmek istiyor musunuz?`)) return;
    impersonate.mutate({ accountId: account.id, nextPath });
  };

  if (monitor.isLoading) {
    return <div className="mx-auto max-w-7xl p-8 text-sm text-muted-foreground">Admin merkezi yükleniyor…</div>;
  }
  if (monitor.isError || !monitor.data) {
    return <div className="mx-auto max-w-7xl p-8 text-sm text-destructive">Admin merkezi yüklenemedi.</div>;
  }

  const filteredAccounts = accounts.filter((account) => {
    const matchesQuery = normalize(`${displayName(account)} ${account.email}`).includes(normalize(accountQuery));
    const matchesRole = accountRole === "all" || account.role === accountRole;
    const matchesScope =
      accountScope === "all" ||
      (accountScope === "test" && account.is_test_account) ||
      (accountScope === "real" && !account.is_test_account) ||
      (accountScope === "active" && account.is_active) ||
      (accountScope === "inactive" && !account.is_active);
    return matchesQuery && matchesRole && matchesScope;
  });
  const safeAccountPage = Math.min(accountPage, Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE)));
  const pagedAccounts = filteredAccounts.slice((safeAccountPage - 1) * PAGE_SIZE, safeAccountPage * PAGE_SIZE);

  const filteredBookings = monitor.data.bookings.filter((booking) => {
    const haystack = `${displayName(booking.student)} ${booking.student.email} ${displayName(booking.tutor)} ${booking.tutor.email} ${booking.subject.name}`;
    return normalize(haystack).includes(normalize(bookingQuery)) && (bookingStatus === "all" || booking.status === bookingStatus);
  });
  const safeBookingPage = Math.min(bookingPage, Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE)));
  const pagedBookings = filteredBookings.slice((safeBookingPage - 1) * PAGE_SIZE, safeBookingPage * PAGE_SIZE);

  const filteredPackages = monitor.data.package_purchases.filter((purchase) => {
    const haystack = `${displayName(purchase.student)} ${purchase.student.email} ${displayName(purchase.tutor)} ${purchase.tutor.email} ${purchase.plan.name}`;
    return normalize(haystack).includes(normalize(packageQuery)) && (packageStatus === "all" || purchase.status === packageStatus);
  });
  const safePackagePage = Math.min(packagePage, Math.max(1, Math.ceil(filteredPackages.length / PAGE_SIZE)));
  const pagedPackages = filteredPackages.slice((safePackagePage - 1) * PAGE_SIZE, safePackagePage * PAGE_SIZE);
  const pendingBookings = monitor.data.bookings.filter((booking) => booking.status === "pending").length;
  const pendingPackages = monitor.data.package_purchases.filter((purchase) => purchase.status === "pending").length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" />Admin varsayılan çalışma alanı</div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Operasyon Merkezi</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hızlı işlemler, hesap kontrolü ve ders operasyonları tek konsolda.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">Son güncelleme {new Date(monitor.data.server_time).toLocaleTimeString("tr-TR")}</span>
          <Button variant="outline" onClick={() => monitor.refetch()} disabled={monitor.isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", monitor.isFetching && "animate-spin")} />Yenile
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AdminTab)}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-5">
          <TabsTrigger value="overview"><Activity className="mr-2 h-4 w-4" />Genel</TabsTrigger>
          <TabsTrigger value="accounts"><Users className="mr-2 h-4 w-4" />Hesaplar</TabsTrigger>
          <TabsTrigger value="bookings" className="relative"><Clock3 className="mr-2 h-4 w-4" />Rezervasyonlar{pendingBookings > 0 && <span className="ml-2 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pendingBookings}</span>}</TabsTrigger>
          <TabsTrigger value="packages" className="relative"><CreditCard className="mr-2 h-4 w-4" />Paketler{pendingPackages > 0 && <span className="ml-2 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pendingPackages}</span>}</TabsTrigger>
          <TabsTrigger value="audit"><ShieldAlert className="mr-2 h-4 w-4" />İşlem kaydı</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <Alert className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <AlertTitle>QA / test modu</AlertTitle>
              <AlertDescription>Tüm aktif katılımcı hesaplarını TEST olarak işaretleyin. Ardından anında ders açma işlemi tek kullanımlık, ödeme alınmayan QA kredisiyle konferansı doğrudan başlatır.</AlertDescription>
            </div>
            <Button
              variant="outline"
              disabled={markAllTestAccounts.isPending}
              onClick={() => {
                if (window.confirm("Tüm aktif öğrenci ve hoca hesapları TEST olarak işaretlensin mi? Bu işlem yalnız QA ortamı içindir.")) {
                  markAllTestAccounts.mutate();
                }
              }}
            >
              {markAllTestAccounts.isPending ? "İşaretleniyor…" : "Tümünü TEST yap"}
            </Button>
          </Alert>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Users} label="Tüm hesaplar" value={accounts.length} hint="Ara ve hesap görünümüne geç" onClick={() => setActiveTab("accounts")} />
            <MetricCard icon={GraduationCap} label="Hocalar" value={tutors.length} hint="Profil ve test ayarlarını yönet" onClick={() => { setAccountRole("tutor"); setActiveTab("accounts"); }} />
            <MetricCard icon={Clock3} label="Aktif rezervasyon" value={monitor.data.bookings.length} hint={`${pendingBookings} rezervasyon onay bekliyor`} onClick={() => setActiveTab("bookings")} />
            <MetricCard icon={CreditCard} label="Paket kayıtları" value={monitor.data.package_purchases.length} hint={`${pendingPackages} paket ödeme bekliyor`} onClick={() => setActiveTab("packages")} />
          </div>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-lg"><ArrowRightLeft className="h-5 w-5" />Hesap görünümü değiştir</CardTitle><CardDescription>Admin yetkiniz korunur. Seçtiğiniz hesabı denetimli olarak açarsınız.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
              <AccountPicker accounts={students} value={viewStudentId} onChange={setViewStudentId} placeholder="Öğrenci ara ve seç" />
              <Button variant="outline" disabled={!viewStudentId || impersonate.isPending} onClick={() => { const account = students.find((item) => item.id === viewStudentId); if (account) goToAccount(account); }}>Öğrenci görünümü</Button>
              <AccountPicker accounts={tutors} value={viewTutorId} onChange={setViewTutorId} placeholder="Hoca ara ve seç" />
              <Button variant="outline" disabled={!viewTutorId || impersonate.isPending} onClick={() => { const account = tutors.find((item) => item.id === viewTutorId); if (account) goToAccount(account); }}>Hoca görünümü</Button>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PackagePlus className="h-5 w-5" />Paket talebi oluştur</CardTitle><CardDescription>Fiyat sunucuda hesaplanır; kayıt ödeme bekler.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <AccountPicker accounts={students} value={packageStudentId} onChange={setPackageStudentId} placeholder="Öğrenci ara" />
                <AccountPicker accounts={tutors} value={packageTutorId} onChange={setPackageTutorId} placeholder="Hoca ara" />
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={planId} onChange={(event) => setPlanId(event.target.value)}>
                  <option value="">Paket planı seç</option>
                  {monitor.data.package_plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.lesson_count} ders</option>)}
                </select>
                <Button className="w-full" disabled={!packageStudentId || !packageTutorId || !planId || addPackage.isPending} onClick={() => { const tutor = tutors.find((item) => item.id === packageTutorId); if (tutor?.profile) addPackage.mutate({ student_id: packageStudentId, tutor_id: tutor.profile.id, plan_id: planId }); }}>
                  {addPackage.isPending ? "Oluşturuluyor…" : "Paket talebi oluştur"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CalendarPlus className="h-5 w-5" />Anında konferans aç</CardTitle><CardDescription>TEST hesaplarında ödeme alınmadan tek kullanımlık QA kredisiyle ders onaylanır ve video odası hazırlanır.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <AccountPicker accounts={students} value={bookingStudentId} onChange={setBookingStudentId} placeholder="Öğrenci ara" />
                <AccountPicker accounts={tutors} value={bookingTutorId} onChange={(value) => { setBookingTutorId(value); setSubjectId(""); }} placeholder="Hoca ara" />
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={subjectId} disabled={!selectedBookingTutor} onChange={(event) => setSubjectId(event.target.value)}>
                  <option value="">{selectedBookingTutor ? "Ders seç" : "Önce hoca seç"}</option>
                  {selectedBookingTutor?.profile?.subjects?.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
                <Input type="datetime-local" value={startTime} min={minimumLocalLessonTime()} onChange={(event) => setStartTime(event.target.value)} />
                <Button className="w-full" disabled={!bookingStudentId || !selectedBookingTutor?.profile || !subjectId || !startTime || addBooking.isPending} onClick={() => selectedBookingTutor?.profile && addBooking.mutate({ student_id: bookingStudentId, tutor_id: selectedBookingTutor.profile.id, subject_id: subjectId, start_time: new Date(startTime).toISOString() })}>
                  {addBooking.isPending ? "Konferans açılıyor…" : "Konferansı oluştur ve aç"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" />Test kredisi ver</CardTitle><CardDescription>Yalnızca TEST hesaplarında; gerçek ödeme oluşturmaz.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <AccountPicker accounts={testStudents} value={creditStudentId} onChange={setCreditStudentId} placeholder="Test öğrenci ara" />
                <AccountPicker accounts={testTutors} value={creditTutorId} onChange={setCreditTutorId} placeholder="Test hoca ara" />
                <div className="flex items-center gap-3"><Input aria-label="Test kredi adedi" type="number" min={1} max={50} value={credits} onChange={(event) => setCredits(Number(event.target.value))} /><span className="whitespace-nowrap text-sm text-muted-foreground">ders kredisi</span></div>
                <Button className="w-full" disabled={!creditStudentId || !creditTutorId || grantCredits.isPending} onClick={() => { const tutor = testTutors.find((item) => item.id === creditTutorId); if (tutor?.profile) grantCredits.mutate({ student_id: creditStudentId, tutor_id: tutor.profile.id, credits, expires_in_days: 30 }); }}>
                  {grantCredits.isPending ? "Ekleniyor…" : "Test kredisi ver"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Hesap yönetimi</CardTitle><CardDescription>Production kullanıcılarında ara, filtrele ve denetimli görünüm aç.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={accountQuery} onChange={(event) => { setAccountQuery(event.target.value); setAccountPage(1); }} placeholder="Ad veya e-posta ara" className="pl-9" /></div>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={accountRole} onChange={(event) => { setAccountRole(event.target.value as AccountRoleFilter); setAccountPage(1); }}><option value="all">Tüm roller</option><option value="student">Öğrenciler</option><option value="tutor">Hocalar</option></select>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={accountScope} onChange={(event) => { setAccountScope(event.target.value as AccountScopeFilter); setAccountPage(1); }}><option value="all">Tüm hesaplar</option><option value="real">Gerçek hesaplar</option><option value="test">Test hesapları</option><option value="active">Aktif hesaplar</option><option value="inactive">Pasif hesaplar</option></select>
              </div>
              <p className="text-sm text-muted-foreground">{filteredAccounts.length} hesap bulundu.</p>
              <div className="divide-y rounded-lg border">
                {pagedAccounts.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Filtrelerle eşleşen hesap yok.</p>}
                {pagedAccounts.map((account) => (
                  <div key={account.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="truncate font-medium">{displayName(account)}</span><Badge variant="secondary">{account.role === "tutor" ? "Hoca" : "Öğrenci"}</Badge>{account.is_test_account && <Badge>TEST</Badge>}{!account.is_active && <Badge variant="destructive">Pasif</Badge>}{account.profile?.is_verified && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Doğrulandı</Badge>}</div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{account.email}</p>
                      {account.role === "tutor" && account.profile?.subjects && <p className="mt-1 text-xs text-muted-foreground">{account.profile.subjects.slice(0, 4).map((subject) => subject.name).join(" · ") || "Ders alanı eklenmemiş"}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {account.role === "tutor" && account.is_test_account && account.profile && <Button size="sm" variant="outline" disabled={toggleAutoApprove.isPending} onClick={() => toggleAutoApprove.mutate({ tutorProfileId: account.profile!.id, next: !account.profile!.auto_approve_bookings })}>Oto onay: {account.profile.auto_approve_bookings ? "Açık" : "Kapalı"}</Button>}
                      <Button size="sm" onClick={() => goToAccount(account)} disabled={!account.is_active || impersonate.isPending}><UserRoundCog className="mr-2 h-4 w-4" />Görünümü aç</Button>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls page={safeAccountPage} total={filteredAccounts.length} onChange={setAccountPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Rezervasyon operasyonları</CardTitle><CardDescription>Aktif dersleri ara, durumuna göre filtrele ve gerekli aksiyonu al.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={bookingQuery} onChange={(event) => { setBookingQuery(event.target.value); setBookingPage(1); }} placeholder="Öğrenci, hoca, e-posta veya ders ara" className="pl-9" /></div>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={bookingStatus} onChange={(event) => { setBookingStatus(event.target.value); setBookingPage(1); }}><option value="all">Tüm aktif durumlar</option><option value="pending">Onay bekleyen</option><option value="confirmed">Onaylanan</option><option value="in_progress">Devam eden</option><option value="awaiting_confirmation">Ders sonu onayı</option></select>
              </div>
              <p className="text-sm text-muted-foreground">{filteredBookings.length} rezervasyon bulundu.</p>
              <div className="divide-y rounded-lg border">
                {pagedBookings.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Filtrelerle eşleşen rezervasyon yok.</p>}
                {pagedBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{displayName(booking.student)} → {displayName(booking.tutor)}</span><Badge variant="outline" className={statusBadgeClass(booking.status)}>{bookingStatusLabels[booking.status] ?? booking.status}</Badge>{booking.uses_test_credit && <Badge variant="secondary">TEST CREDIT</Badge>}{booking.package_purchase_id && <Badge variant="secondary">PAKET</Badge>}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{booking.subject.name} · {new Date(booking.start_time).toLocaleString("tr-TR")} · {booking.duration_minutes} dk</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {booking.status === "pending" && <Button size="sm" onClick={() => approve.mutate(booking.id)} disabled={approve.isPending}><CheckCircle2 className="mr-2 h-4 w-4" />Onayla</Button>}
                      {booking.room_url && <><Button size="sm" variant="outline" onClick={() => goToAccount(booking.student, `/session/${booking.id}`)}>Öğrenci olarak aç</Button><Button size="sm" variant="outline" onClick={() => goToAccount(booking.tutor, `/session/${booking.id}`)}>Hoca olarak aç</Button></>}
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls page={safeBookingPage} total={filteredBookings.length} onChange={setBookingPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4 pt-4">
          {!monitor.data.manual_package_activation_enabled && (
            <Alert><ShieldAlert className="h-4 w-4" /><AlertTitle>Production ödeme aktivasyonu kapalı</AlertTitle><AlertDescription>Paket talebi oluşturabilirsiniz; ancak ödeme sağlayıcısı doğrulanmadan “Aktive et” işlemi kullanılamaz.</AlertDescription></Alert>
          )}
          <Card>
            <CardHeader><CardTitle>Paket operasyonları</CardTitle><CardDescription>Bekleyen ve aktif paketleri öğrenci, hoca veya plan adıyla bulun.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={packageQuery} onChange={(event) => { setPackageQuery(event.target.value); setPackagePage(1); }} placeholder="Öğrenci, hoca veya paket ara" className="pl-9" /></div>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={packageStatus} onChange={(event) => { setPackageStatus(event.target.value); setPackagePage(1); }}><option value="all">Tüm paketler</option><option value="pending">Ödeme bekleyen</option><option value="paid">Aktif</option><option value="cancelled">İptal</option><option value="refunded">İade kaydı</option></select>
              </div>
              <p className="text-sm text-muted-foreground">{filteredPackages.length} paket bulundu.</p>
              <div className="divide-y rounded-lg border">
                {pagedPackages.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Filtrelerle eşleşen paket yok.</p>}
                {pagedPackages.map((purchase) => (
                  <div key={purchase.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{displayName(purchase.student)} → {displayName(purchase.tutor)}</span><Badge variant="outline" className={statusBadgeClass(purchase.status)}>{packageStatusLabels[purchase.status] ?? purchase.status}</Badge></div>
                      <p className="mt-1 text-sm text-muted-foreground">{purchase.plan.name} · {purchase.remaining_credits}/{purchase.total_credits} kredi · {formatPrice(purchase.total_price)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Oluşturulma: {new Date(purchase.created_at).toLocaleString("tr-TR")}</p>
                    </div>
                    {purchase.status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" disabled={!monitor.data.manual_package_activation_enabled || activatePackage.isPending} onClick={() => activatePackage.mutate(purchase.id)}>Ödemeyi doğrula ve aktive et</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={cancelPackage.isPending}
                          onClick={() => {
                            if (window.confirm("Bu bekleyen paket talebi reddedilsin mi? Ödeme veya kredi oluşturulmaz.")) {
                              cancelPackage.mutate(purchase.id);
                            }
                          }}
                        >
                          Talebi reddet
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <PaginationControls page={safePackagePage} total={filteredPackages.length} onChange={setPackagePage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          <Card>
            <CardHeader><CardTitle>Admin işlem kaydı</CardTitle><CardDescription>Son 50 yönetici aksiyonu; hedef hesap ve zaman bilgisiyle.</CardDescription></CardHeader>
            <CardContent>
              <div className="divide-y rounded-lg border">
                {monitor.data.actions.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Henüz admin işlemi yok.</p>}
                {monitor.data.actions.map((action) => (
                  <div key={action.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="font-medium">{actionLabels[action.action] ?? action.action}</p><p className="text-sm text-muted-foreground">{action.target_email ? `Hedef: ${action.target_email}` : "Sistem işlemi"}{action.booking_id ? ` · Rezervasyon: ${action.booking_id.slice(0, 8)}` : ""}</p></div>
                    <div className="text-left text-xs text-muted-foreground sm:text-right"><p>{action.actor_email}</p><p>{new Date(action.created_at).toLocaleString("tr-TR")}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

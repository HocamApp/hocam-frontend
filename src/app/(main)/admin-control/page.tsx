"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, CreditCard, GraduationCap, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  activateAdminPackage,
  approveAdminTestBooking,
  createAdminBooking,
  createAdminPackage,
  fetchAdminMonitor,
  grantAdminTestCredits,
  startAdminImpersonation,
  updateAdminTutorTestSettings,
} from "@/lib/adminControlApi";
import type { AdminTestAccount } from "@/types";

function displayName(account: AdminTestAccount) {
  return `${account.profile?.name ?? ""} ${account.profile?.surname ?? ""}`.trim() || account.email;
}

function AdminControlContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [planId, setPlanId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [credits, setCredits] = useState(10);

  const monitor = useQuery({
    queryKey: ["admin-control-monitor"],
    queryFn: fetchAdminMonitor,
    refetchInterval: 10_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-control-monitor"] });
  const accounts = useMemo(() => monitor.data?.accounts ?? [], [monitor.data?.accounts]);
  const students = useMemo(() => accounts.filter((account) => account.role === "student"), [accounts]);
  const tutors = useMemo(() => accounts.filter((account) => account.role === "tutor" && account.profile), [accounts]);
  const selectedTutor = tutors.find((account) => account.profile?.id === tutorId);
  const filteredAccounts = accounts.filter((account) =>
    `${displayName(account)} ${account.email}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))
  );

  const impersonate = useMutation({
    mutationFn: ({ accountId, nextPath }: { accountId: string; nextPath?: string }) =>
      startAdminImpersonation(accountId).then((user) => ({ user, nextPath })),
    onSuccess: ({ user, nextPath }) => {
      queryClient.clear();
      updateUser(user);
      router.push(nextPath ?? (user.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student"));
    },
    onError: () => toast.error("Hesap görünümüne geçilemedi."),
  });
  const approve = useMutation({
    mutationFn: approveAdminTestBooking,
    onSuccess: () => { toast.success("Rezervasyon onaylandı, ders odası hazırlandı."); refresh(); },
    onError: () => toast.error("Rezervasyon onaylanamadı."),
  });
  const addPackage = useMutation({
    mutationFn: createAdminPackage,
    onSuccess: () => { toast.success("Paket talebi eklendi; ödeme onayı bekliyor."); refresh(); },
    onError: () => toast.error("Paket oluşturulamadı."),
  });
  const activatePackage = useMutation({
    mutationFn: activateAdminPackage,
    onSuccess: () => { toast.success("Paket aktive edildi."); refresh(); },
    onError: () => toast.error("Paket aktivasyonu kapalı veya işlem başarısız."),
  });
  const addBooking = useMutation({
    mutationFn: createAdminBooking,
    onSuccess: () => { toast.success("Özel ders oluşturuldu ve onaylandı."); refresh(); },
    onError: () => toast.error("Aktif paket/test kredisi ve boş saat gerekli."),
  });
  const grantCredits = useMutation({
    mutationFn: grantAdminTestCredits,
    onSuccess: () => { toast.success("Test kredileri eklendi."); refresh(); },
    onError: () => toast.error("Yalnızca test öğrenci ve test hoca için kredi verilebilir."),
  });
  const toggleAutoApprove = useMutation({
    mutationFn: ({ tutorProfileId, next }: { tutorProfileId: string; next: boolean }) =>
      updateAdminTutorTestSettings(tutorProfileId, next),
    onSuccess: refresh,
    onError: () => toast.error("Otomatik onay ayarı değiştirilemedi."),
  });

  if (monitor.isLoading) return <div className="mx-auto max-w-7xl p-8 text-sm text-muted-foreground">Admin merkezi yükleniyor…</div>;
  if (monitor.isError || !monitor.data) return <div className="mx-auto max-w-7xl p-8 text-sm text-destructive">Admin merkezi yüklenemedi.</div>;

  const testStudents = students.filter((account) => account.is_test_account);
  const testTutors = tutors.filter((account) => account.is_test_account);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" />Admin varsayılan çalışma alanı</div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Operasyon Merkezi</h1>
          <p className="mt-2 text-muted-foreground">Hesaplar, rezervasyonlar, paketler ve hızlı test akışı tek ekranda.</p>
        </div>
        <Button variant="outline" onClick={() => monitor.refetch()} disabled={monitor.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${monitor.isFetching ? "animate-spin" : ""}`} />Yenile</Button>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader><CardTitle>Görünüm değiştir</CardTitle><CardDescription>Admin rolü değişmez; seçilen hesabın öğrenci veya hoca ekranını denetimli ve kayıtlı biçimde açarsınız.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[auto_1fr_auto_1fr_auto] md:items-center">
          <Button><ShieldCheck className="mr-2 h-4 w-4" />Admin</Button>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Öğrenci seç</option>{students.map((a) => <option key={a.id} value={a.id}>{displayName(a)} · {a.email}</option>)}</select>
          <Button variant="outline" disabled={!studentId || impersonate.isPending} onClick={() => impersonate.mutate({ accountId: studentId })}>Öğrenciye geç</Button>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={tutorId} onChange={(e) => { setTutorId(e.target.value); setSubjectId(""); }}><option value="">Hoca seç</option>{tutors.map((a) => <option key={a.id} value={a.profile!.id}>{displayName(a)} · {a.email}</option>)}</select>
          <Button variant="outline" disabled={!selectedTutor || impersonate.isPending} onClick={() => selectedTutor && impersonate.mutate({ accountId: selectedTutor.id })}>Hocaya geç</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Tüm hesaplar</CardDescription><CardTitle className="flex gap-2"><Users className="h-5 w-5" />{accounts.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Hocalar</CardDescription><CardTitle className="flex gap-2"><GraduationCap className="h-5 w-5" />{tutors.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Aktif dersler</CardDescription><CardTitle className="flex gap-2"><Clock3 className="h-5 w-5" />{monitor.data.bookings.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Paket kayıtları</CardDescription><CardTitle className="flex gap-2"><CreditCard className="h-5 w-5" />{monitor.data.package_purchases.length}</CardTitle></CardHeader></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Öğrenciye paket ekle</CardTitle><CardDescription>Sunucu fiyatı hesaplar ve ödeme bekleyen paket oluşturur.</CardDescription></CardHeader><CardContent className="space-y-3">
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Öğrenci seç</option>{students.map((a) => <option key={a.id} value={a.id}>{displayName(a)}</option>)}</select>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={tutorId} onChange={(e) => { setTutorId(e.target.value); setSubjectId(""); }}><option value="">Hoca seç</option>{tutors.map((a) => <option key={a.id} value={a.profile!.id}>{displayName(a)}</option>)}</select>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={planId} onChange={(e) => setPlanId(e.target.value)}><option value="">Paket seç</option>{monitor.data.package_plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.lesson_count} ders</option>)}</select>
          <Button className="w-full" disabled={!studentId || !tutorId || !planId || addPackage.isPending} onClick={() => addPackage.mutate({ student_id: studentId, tutor_id: tutorId, plan_id: planId })}>Paket talebi oluştur</Button>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Anında özel ders aç</CardTitle><CardDescription>40 dakikalık dersi aktif paket veya test kredisinden düşer ve hemen onaylar.</CardDescription></CardHeader><CardContent className="space-y-3">
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}><option value="">Ders seç</option>{selectedTutor?.profile?.subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Button className="w-full" disabled={!studentId || !tutorId || !subjectId || !startTime || addBooking.isPending} onClick={() => addBooking.mutate({ student_id: studentId, tutor_id: tutorId, subject_id: subjectId, start_time: new Date(startTime).toISOString() })}>Dersi oluştur ve onayla</Button>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Test hızlandırma kredisi</CardTitle><CardDescription>Gerçek ödeme veya hoca kazancı oluşturmaz; yalnızca test işaretli hesaplarda çalışır.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
        <select className="h-10 rounded-md border bg-background px-3 text-sm" onChange={(e) => setStudentId(e.target.value)}><option value="">Test öğrenci seç</option>{testStudents.map((a) => <option key={a.id} value={a.id}>{displayName(a)}</option>)}</select>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" onChange={(e) => setTutorId(e.target.value)}><option value="">Test hoca seç</option>{testTutors.map((a) => <option key={a.id} value={a.profile!.id}>{displayName(a)}</option>)}</select>
        <Input type="number" min={1} max={50} value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
        <Button disabled={!studentId || !tutorId || grantCredits.isPending} onClick={() => grantCredits.mutate({ student_id: studentId, tutor_id: tutorId, credits, expires_in_days: 30 })}>Test kredisi ver</Button>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Hesap monitörü</CardTitle><CardDescription>Production veritabanındaki aktif/pasif öğrenci ve hoca hesapları.</CardDescription></CardHeader><CardContent className="space-y-3">
        <Input placeholder="Ad veya e-posta ara" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-[520px] space-y-2 overflow-y-auto">{filteredAccounts.map((account) => <div key={account.id} className="flex flex-col justify-between gap-3 rounded-lg border p-3 md:flex-row md:items-center"><div><span className="font-medium">{displayName(account)}</span> <Badge variant="secondary">{account.role === "tutor" ? "Hoca" : "Öğrenci"}</Badge> {account.is_test_account && <Badge>TEST</Badge>}<p className="text-sm text-muted-foreground">{account.email}</p></div><div className="flex gap-2">{account.role === "tutor" && account.is_test_account && account.profile && <Button variant="outline" size="sm" onClick={() => toggleAutoApprove.mutate({ tutorProfileId: account.profile!.id, next: !account.profile!.auto_approve_bookings })}>Oto onay: {account.profile.auto_approve_bookings ? "Açık" : "Kapalı"}</Button>}<Button size="sm" onClick={() => impersonate.mutate({ accountId: account.id })}>Hesaba geç</Button></div></div>)}</div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Rezervasyon monitörü</CardTitle><CardDescription>Tüm aktif rezervasyonlar.</CardDescription></CardHeader><CardContent className="space-y-3">{monitor.data.bookings.length === 0 && <p className="text-sm text-muted-foreground">Aktif rezervasyon yok.</p>}{monitor.data.bookings.map((b) => <div key={b.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 lg:flex-row lg:items-center"><div><span className="font-medium">{displayName(b.student)} → {displayName(b.tutor)}</span> <Badge>{b.status}</Badge>{b.uses_test_credit && <Badge variant="secondary">TEST CREDIT</Badge>}<p className="text-sm text-muted-foreground">{b.subject.name} · {new Date(b.start_time).toLocaleString("tr-TR")} · {b.duration_minutes} dk</p></div><div className="flex flex-wrap gap-2">{b.status === "pending" && <Button size="sm" onClick={() => approve.mutate(b.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Onayla</Button>}{b.room_url && <><Button size="sm" variant="outline" onClick={() => impersonate.mutate({ accountId: b.student.id, nextPath: `/session/${b.id}` })}>Öğrenci olarak aç</Button><Button size="sm" variant="outline" onClick={() => impersonate.mutate({ accountId: b.tutor.id, nextPath: `/session/${b.id}` })}>Hoca olarak aç</Button></>}</div></div>)}</CardContent></Card>

      <Card><CardHeader><CardTitle>Paket monitörü</CardTitle><CardDescription>Bekleyen ve aktif tüm paketler. Ödeme aktivasyonu: {monitor.data.manual_package_activation_enabled ? "açık" : "kapalı"}.</CardDescription></CardHeader><CardContent className="space-y-3">{monitor.data.package_purchases.map((p) => <div key={p.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 md:flex-row md:items-center"><div><span className="font-medium">{displayName(p.student)} → {displayName(p.tutor)}</span> <Badge>{p.status}</Badge><p className="text-sm text-muted-foreground">{p.plan.name} · {p.remaining_credits}/{p.total_credits} kredi · ₺{p.total_price}</p></div>{p.status === "pending" && <Button size="sm" disabled={!monitor.data.manual_package_activation_enabled || activatePackage.isPending} onClick={() => activatePackage.mutate(p.id)}>Ödemeyi onayla</Button>}</div>)}</CardContent></Card>

      <Card><CardHeader><CardTitle>Son admin işlemleri</CardTitle></CardHeader><CardContent className="space-y-2">{monitor.data.actions.slice(0, 20).map((a) => <div key={a.id} className="flex justify-between gap-2 border-b py-2 text-sm"><span><strong>{a.action}</strong>{a.target_email ? ` · ${a.target_email}` : ""}</span><span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("tr-TR")}</span></div>)}</CardContent></Card>
    </div>
  );
}

export default function AdminControlPage() {
  return <RouteGuard requireAdmin><AdminControlContent /></RouteGuard>;
}
